const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');

admin.initializeApp();
const db = admin.firestore();

// CORS middleware
const cors = require('cors')({origin: true});

/**
 * Analyze News - Main Cloud Function
 * Accepts headline or URL and returns claim-level disagreement analysis
 */
exports.analyzeNews = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { input, type } = req.body; // type: 'url' or 'headline'

      if (!input) {
        return res.status(400).json({ error: 'Input (URL or headline) required' });
      }

      const startTime = Date.now();

      // Step 1: Extract headline and entities
      const { headline, entities, timestamp } = await extractSeed(input, type);

      // Step 2: Retrieve diverse articles via Perplexity
      const articles = await retrieveArticles(headline, entities);

      // Step 3: Extract claims from all articles
      const claims = await extractClaims(articles);

      // Step 4: Cluster similar claims
      const clusteredClaims = await clusterClaims(claims);

      // Step 5: Stance tagging for each outlet
      const analyzedClaims = await analyzeStances(clusteredClaims, articles);

      // Step 6: Categorize into Consensus, Disputed, Missing
      const categorized = categorizeClaims(analyzedClaims);

      const latency = Date.now() - startTime;

      // Cache result in Firestore
      const analysisId = await cacheAnalysis({
        headline,
        entities,
        timestamp,
        ...categorized,
        latency,
        articleCount: articles.length
      });

      // Log metrics
      await logMetrics({
        analysisId,
        latency,
        articleCount: articles.length,
        claimCount: analyzedClaims.length,
        timestamp: new Date().toISOString()
      });

      res.json({
        analysisId,
        headline,
        entities,
        ...categorized,
        meta: {
          latency,
          articleCount: articles.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Extract seed information (headline, entities, timestamp)
 */
async function extractSeed(input, type) {
  if (type === 'url') {
    // Fetch article and extract headline
    try {
      const response = await axios.get(input, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Try multiple selectors for headline
      const headline = $('h1').first().text() ||
                       $('meta[property="og:title"]').attr('content') ||
                       $('title').text();

      // Extract publish time if available
      const timestamp = $('meta[property="article:published_time"]').attr('content') ||
                        $('time').attr('datetime') ||
                        new Date().toISOString();

      // Use Perplexity to extract entities
      const entities = await extractEntities(headline);

      return { headline: headline.trim(), entities, timestamp };
    } catch (error) {
      throw new Error('Failed to fetch URL: ' + error.message);
    }
  } else {
    // Headline provided directly
    const entities = await extractEntities(input);
    return {
      headline: input.trim(),
      entities,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Use Perplexity API to extract named entities
 */
async function extractEntities(headline) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    console.warn('PERPLEXITY_API_KEY not set, using basic extraction');
    // Fallback: simple word extraction
    return headline.split(' ').filter(w => w.length > 3).slice(0, 5);
  }

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Extract key named entities (people, organizations, locations, events) from the headline. Return as JSON array of strings.'
          },
          {
            role: 'user',
            content: headline
          }
        ],
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;

    // Try to parse as JSON
    try {
      return JSON.parse(content);
    } catch {
      // Fallback: extract words from response
      return content.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
    }
  } catch (error) {
    console.error('Entity extraction error:', error.message);
    return headline.split(' ').filter(w => w.length > 3).slice(0, 5);
  }
}

/**
 * Retrieve diverse articles using Perplexity API
 */
async function retrieveArticles(headline, entities) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY environment variable not set');
  }

  // Build search query
  const query = `${headline} ${entities.slice(0, 3).join(' ')} news coverage`;

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Find diverse news coverage of this story from multiple outlets (mainstream, international, regional). Return citations with article titles, URLs, and brief summaries. Avoid wire service duplicates.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 2000,
        return_citations: true
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const citations = response.data.citations || [];
    const content = response.data.choices[0].message.content;

    // Parse articles from citations
    const articles = citations.slice(0, 10).map((url, idx) => ({
      url,
      domain: new URL(url).hostname.replace('www.', ''),
      title: extractTitleFromContent(content, idx),
      snippet: extractSnippetFromContent(content, idx),
      fetchedAt: new Date().toISOString()
    }));

    // Ensure diversity: max 1 per domain group
    const diverse = diversifyArticles(articles);

    return diverse.slice(0, 6); // MVP: 6 outlets

  } catch (error) {
    console.error('Article retrieval error:', error.message);
    throw new Error('Failed to retrieve articles: ' + error.message);
  }
}

/**
 * Helper: Extract article title from Perplexity response
 */
function extractTitleFromContent(content, index) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines[index]) {
    return lines[index].replace(/^\d+\.\s*/, '').replace(/\[.*?\]/g, '').trim();
  }
  return 'Article ' + (index + 1);
}

/**
 * Helper: Extract snippet from Perplexity response
 */
function extractSnippetFromContent(content, index) {
  const lines = content.split('\n').filter(l => l.trim());
  return lines.slice(index, index + 2).join(' ').substring(0, 300);
}

/**
 * Ensure diverse outlet selection
 */
function diversifyArticles(articles) {
  const domainGroups = {
    'nytimes.com': 'nyt-group',
    'washingtonpost.com': 'wapo-group',
    'wsj.com': 'wsj-group',
    'bbc.com': 'bbc-group',
    'bbc.co.uk': 'bbc-group',
    'cnn.com': 'cnn-group',
    'foxnews.com': 'fox-group',
    'reuters.com': 'reuters-group',
    'ap.org': 'ap-group',
    'apnews.com': 'ap-group'
  };

  const seen = new Set();
  const diverse = [];

  for (const article of articles) {
    const group = domainGroups[article.domain] || article.domain;
    if (!seen.has(group)) {
      seen.add(group);
      diverse.push(article);
    }
  }

  return diverse;
}

/**
 * Extract claims from articles using Perplexity
 */
async function extractClaims(articles) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  const allClaims = [];

  for (const article of articles) {
    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Extract atomic, checkable claims from this article. Focus on facts, numbers, dates, and statements. Return as JSON array: [{"claim": "...", "entities": [...], "numbers": [...]}]'
            },
            {
              role: 'user',
              content: `Title: ${article.title}\nSnippet: ${article.snippet}`
            }
          ],
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      let claims = [];

      try {
        claims = JSON.parse(content);
      } catch {
        // Fallback: extract simple sentences
        claims = content.split(/[.!?]/).filter(s => s.trim().length > 20).map(c => ({
          claim: c.trim(),
          entities: [],
          numbers: []
        }));
      }

      claims.forEach(claim => {
        allClaims.push({
          ...claim,
          source: article
        });
      });

    } catch (error) {
      console.error(`Claim extraction failed for ${article.domain}:`, error.message);
    }
  }

  return allClaims.slice(0, 20); // Limit to 20 claims for MVP
}

/**
 * Cluster similar claims
 */
async function clusterClaims(claims) {
  // Simple text similarity clustering
  const clusters = [];
  const used = new Set();

  for (let i = 0; i < claims.length; i++) {
    if (used.has(i)) continue;

    const cluster = {
      canonical: claims[i].claim,
      claims: [claims[i]]
    };

    for (let j = i + 1; j < claims.length; j++) {
      if (used.has(j)) continue;

      // Simple similarity: shared words
      const similarity = textSimilarity(claims[i].claim, claims[j].claim);
      if (similarity > 0.5) {
        cluster.claims.push(claims[j]);
        used.add(j);
      }
    }

    clusters.push(cluster);
    used.add(i);
  }

  return clusters.slice(0, 10); // MVP: top 10 claim clusters
}

/**
 * Simple text similarity (Jaccard)
 */
function textSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

/**
 * Analyze stance for each claim across outlets
 */
async function analyzeStances(clusters, articles) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  const analyzed = [];

  for (const cluster of clusters) {
    const stances = [];

    for (const article of articles) {
      try {
        const response = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'Given this claim and article snippet, determine stance: supports, refutes, neutral, or not_mentioned. Also extract the best supporting quote. Return JSON: {"stance": "...", "quote": "...", "confidence": 0.0-1.0}'
              },
              {
                role: 'user',
                content: `Claim: ${cluster.canonical}\n\nArticle: ${article.title}\n${article.snippet}`
              }
            ],
            max_tokens: 200
          },
          {
            headers: {
              'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const content = response.data.choices[0].message.content;
        let stanceData = { stance: 'neutral', quote: '', confidence: 0.5 };

        try {
          stanceData = JSON.parse(content);
        } catch {
          // Fallback parsing
          if (content.includes('supports')) stanceData.stance = 'supports';
          else if (content.includes('refutes')) stanceData.stance = 'refutes';
          else if (content.includes('not mentioned')) stanceData.stance = 'not_mentioned';
        }

        stances.push({
          domain: article.domain,
          url: article.url,
          ...stanceData
        });

      } catch (error) {
        console.error(`Stance analysis failed for ${article.domain}:`, error.message);
      }
    }

    analyzed.push({
      claim_id: 'c' + analyzed.length,
      canonical_text: cluster.canonical,
      outlets: stances
    });
  }

  return analyzed;
}

/**
 * Categorize claims into Consensus, Disputed, Missing
 */
function categorizeClaims(analyzedClaims) {
  const consensus = [];
  const disputed = [];
  const missing = [];

  for (const claim of analyzedClaims) {
    const supports = claim.outlets.filter(o => o.stance === 'supports').length;
    const refutes = claim.outlets.filter(o => o.stance === 'refutes').length;
    const mentioned = supports + refutes + claim.outlets.filter(o => o.stance === 'neutral').length;
    const total = claim.outlets.length;

    if (supports >= total * 0.67) {
      // Consensus: ≥2/3 support
      consensus.push(claim);
    } else if (supports > 0 && refutes > 0) {
      // Disputed: mixed stances
      disputed.push(claim);
    } else if (mentioned <= 1) {
      // Missing: ≤1 outlet covers it
      missing.push(claim);
    } else {
      // Mixed coverage
      disputed.push(claim);
    }
  }

  return { consensus, disputed, missing };
}

/**
 * Cache analysis result in Firestore
 */
async function cacheAnalysis(data) {
  const docRef = await db.collection('analyses').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

/**
 * Log metrics to Firestore
 */
async function logMetrics(data) {
  await db.collection('logs').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Get cached analysis by ID
 */
exports.getAnalysis = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Analysis ID required' });
      }

      const doc = await db.collection('analyses').doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json({ id: doc.id, ...doc.data() });

    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Health check endpoint
 */
exports.health = functions.https.onRequest((req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
