require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { generateBalancedArticle, generateQuickSummary } = require('./services/articleGenerator');
const {
  getTrendingTopics,
  generateQuizQuestions,
  generateQuizSummary,
  calculateScore
} = require('./services/quizService');
const { analyzeClaimsAcrossSources } = require('./services/claimsAnalyzer');
const { generateDailyQuizzes } = require('./services/dailyQuizGenerator');
const { detectBreakingNews } = require('./services/breakingNewsDetector');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'perplexity-news-3aba4'
  });
}

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

// In-memory storage for local development (fallback)
const articles = new Map();
const topics = new Map();

// Initialize Perplexity client
function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }
  return new Perplexity({ apiKey });
}

// Helper functions (copied from index.js)
async function extractEntities(headline) {
  try {
    const client = getPerplexityClient();
    const completion = await client.chat.completions.create({
      model: 'sonar',
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
    });

    const content = completion.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch {
      return content.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
    }
  } catch (error) {
    console.error('Entity extraction error:', error.message);
    return headline.split(' ').filter(w => w.length > 3).slice(0, 5);
  }
}

async function retrieveArticles(headline, entities) {
  const client = getPerplexityClient();
  const query = `${headline} ${entities.slice(0, 3).join(' ')} news coverage multiple outlets`;

  const completion = await client.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: 'Find diverse news coverage of this story from multiple mainstream outlets. List 6-10 different news sources with their coverage. Provide citations.'
      },
      {
        role: 'user',
        content: query
      }
    ],
    max_tokens: 2000,
    return_citations: true
  });

  const citations = completion.citations || [];
  const content = completion.choices[0].message.content;

  const articles = citations.slice(0, 10).map((url, idx) => {
    try {
      return {
        url,
        domain: new URL(url).hostname.replace('www.', ''),
        title: `Article from ${new URL(url).hostname}`,
        snippet: content.substring(idx * 150, (idx + 1) * 150),
        fetchedAt: new Date().toISOString()
      };
    } catch (e) {
      return null;
    }
  }).filter(a => a !== null);

  return articles.slice(0, 6);
}

// POST /analyzeNews
app.post('/analyzeNews', async (req, res) => {
  try {
    console.log('📥 Request received:', req.body);
    const { input, type } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input (URL or headline) required' });
    }

    const startTime = Date.now();

    // Step 1: Extract entities
    console.log('📍 Extracting entities...');
    const headline = input;
    const entities = await extractEntities(headline);
    console.log('✅ Entities:', entities);

    // Step 2: Retrieve articles
    console.log('📰 Retrieving articles...');
    const articles = await retrieveArticles(headline, entities);
    console.log(`✅ Retrieved ${articles.length} articles`);

    // Mock response matching your frontend structure
    const response = {
      analysisId: 'local-' + Date.now(),
      headline,
      entities,
      sources: articles.map(a => ({
        domain: a.domain,
        region: 'Unknown',
        leaning: 'center'
      })),
      consensus: [],
      disputed: [],
      missing: [],
      meta: {
        latency: Date.now() - startTime,
        articleCount: articles.length,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Analysis complete');
    res.json(response);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/articles/generate - Generate a balanced article
app.post('/api/articles/generate', async (req, res) => {
  try {
    const { topicName, category } = req.body;

    if (!topicName) {
      return res.status(400).json({ error: 'topicName required' });
    }

    console.log(`📰 Generating article for: ${topicName}`);

    const articleData = await generateBalancedArticle(topicName, category);

    // Create article object
    const articleId = `article-${Date.now()}`;
    const article = {
      id: articleId,
      ...articleData,
      topicName,
      createdAt: new Date().toISOString(),
      expireAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };

    // Save to Firestore
    try {
      await db.collection('articles').doc(articleId).set(article);
      console.log(`✅ Article saved to Firestore: ${articleId}`);
    } catch (firestoreError) {
      console.warn('⚠️  Firestore save failed, using in-memory storage:', firestoreError.message);
      articles.set(articleId, article);
    }

    res.json(article);

  } catch (error) {
    console.error('Error generating article:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/articles - Get all articles
app.get('/api/articles', async (req, res) => {
  try {
    const { category } = req.query;

    // Try Firestore first
    let result = [];
    try {
      let query = db.collection('articles').orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      result = snapshot.docs.map(doc => doc.data());

      // Filter by category if provided
      if (category && category !== 'all') {
        result = result.filter(a =>
          a.categories && a.categories.some(c =>
            c.toLowerCase().includes(category.toLowerCase())
          )
        );
      }

      console.log(`✅ Fetched ${result.length} articles from Firestore`);
    } catch (firestoreError) {
      console.warn('⚠️  Firestore fetch failed, using in-memory storage:', firestoreError.message);
      result = Array.from(articles.values());

      if (category && category !== 'all') {
        result = result.filter(a =>
          a.categories && a.categories.some(c =>
            c.toLowerCase().includes(category.toLowerCase())
          )
        );
      }

      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ articles: result, total: result.length });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/articles/:id - Get specific article
app.get('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;

    // Try Firestore first
    try {
      const doc = await db.collection('articles').doc(articleId).get();

      if (doc.exists) {
        console.log(`✅ Fetched article ${articleId} from Firestore`);
        return res.json(doc.data());
      }
    } catch (firestoreError) {
      console.warn('⚠️  Firestore fetch failed, using in-memory storage:', firestoreError.message);
    }

    // Fallback to in-memory
    const article = articles.get(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================
// QUIZ ENDPOINTS
// ====================

// GET /api/quizzes/trending
app.get('/api/quizzes/trending', (req, res) => {
  try {
    const topics = getTrendingTopics();
    res.json({ topics });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quizzes/generate
app.post('/api/quizzes/generate', async (req, res) => {
  try {
    const { topic, numQuestions = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    console.log(`🎯 Generating quiz for: ${topic}`);

    const questions = await generateQuizQuestions(topic, numQuestions);

    const quizSession = {
      topic,
      questions: questions.map(q => ({
        question_text: q.question_text,
        options: q.options,
        difficulty: q.difficulty || 'medium',
      })),
      questionsWithAnswers: questions,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    const sessionRef = await db.collection('quizSessions').add(quizSession);

    console.log(`✅ Quiz session created: ${sessionRef.id}`);

    res.json({
      sessionId: sessionRef.id,
      topic,
      questions: quizSession.questions,
      timeLimit: 5
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quizzes/submit
app.post('/api/quizzes/submit', async (req, res) => {
  try {
    const { sessionId, answers, userId } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ error: 'sessionId and answers are required' });
    }

    const sessionDoc = await db.collection('quizSessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    const sessionData = sessionDoc.data();
    const scoreData = calculateScore(sessionData.questionsWithAnswers, answers);

    const summary = await generateQuizSummary(
      sessionData.topic,
      scoreData.score,
      scoreData.total
    );

    const result = {
      sessionId,
      topic: sessionData.topic,
      userId: userId || null,
      score: scoreData.score,
      total: scoreData.total,
      percentage: scoreData.percentage,
      summary: summary.summary,
      sources: summary.sources,
      results: scoreData.results,
      completedAt: new Date().toISOString()
    };

    const resultRef = await db.collection('quizResults').add(result);

    res.json({
      resultId: resultRef.id,
      ...result
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { period = 'alltime' } = req.query;

    const leaderboardDoc = await db.collection('leaderboards').doc(period).get();

    if (!leaderboardDoc.exists) {
      return res.json({ period, top: [] });
    }

    const data = leaderboardDoc.data();

    res.json({
      period,
      top: data.top || [],
      updatedAt: data.updatedAt
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/articles/:id/claims - Get claims analysis
app.get('/api/articles/:id/claims', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Fetching claims for article: ${id}`);

    // Get article
    let article;
    try {
      const doc = await db.collection('articles').doc(id).get();
      if (doc.exists) {
        article = doc.data();
      }
    } catch (e) {
      article = articles.get(id);
    }

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if claims already exist
    if (article.claims) {
      console.log('✅ Returning cached claims');
      return res.json(article.claims);
    }

    // Generate claims analysis
    console.log('🔍 Generating claims analysis...');
    const claims = await analyzeClaimsAcrossSources(article.topicName || article.title);

    // Try to save claims to article
    try {
      await db.collection('articles').doc(id).update({
        claims,
        claimsGeneratedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not save claims to Firestore');
    }

    console.log('✅ Claims analysis complete');
    res.json(claims);

  } catch (error) {
    console.error('❌ Error fetching claims:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quizzes/daily - Get daily quizzes
app.get('/api/quizzes/daily', async (req, res) => {
  try {
    console.log('📝 Fetching daily quizzes...');

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      const snapshot = await db.collection('dailyQuizzes')
        .where('createdAt', '>', cutoff)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`✅ Found ${quizzes.length} daily quizzes`);
      return res.json({ quizzes });
    } catch (e) {
      console.warn('No daily quizzes in Firestore, returning empty');
      return res.json({ quizzes: [] });
    }

  } catch (error) {
    console.error('❌ Error fetching daily quizzes:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/breaking-news - Get breaking news
app.get('/api/breaking-news', async (req, res) => {
  try {
    console.log('🚨 Fetching breaking news...');

    try {
      const doc = await db.collection('breakingNews').doc('latest').get();

      if (!doc.exists) {
        return res.json({
          hasBreakingNews: false,
          events: [],
          lastChecked: new Date().toISOString()
        });
      }

      const data = doc.data();

      // Check if data is recent (within last 2 hours)
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const checkedAt = new Date(data.checkedAt || data.lastChecked).getTime();

      if (checkedAt < twoHoursAgo) {
        console.log('⚠️  Breaking news data is stale');
        return res.json({
          hasBreakingNews: false,
          events: [],
          lastChecked: data.checkedAt || data.lastChecked,
          stale: true
        });
      }

      console.log(`✅ Breaking news status: ${data.hasBreakingNews}`);
      res.json(data);

    } catch (e) {
      // No breaking news in database
      return res.json({
        hasBreakingNews: false,
        events: [],
        lastChecked: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error fetching breaking news:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    articles: articles.size
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Really? Local Server running on http://localhost:${PORT}`);
  console.log(`✅ Perplexity API configured`);
  console.log(`\n📝 Available endpoints:`);
  console.log(`   POST /api/articles/generate - Generate balanced article`);
  console.log(`   GET  /api/articles - List all articles`);
  console.log(`   GET  /api/articles/:id - Get specific article`);
  console.log(`   GET  /api/quizzes/trending - Get trending quiz topics`);
  console.log(`   POST /api/quizzes/generate - Generate quiz questions`);
  console.log(`   POST /api/quizzes/submit - Submit quiz answers`);
  console.log(`   GET  /api/leaderboard - Get leaderboard`);
  console.log(`   GET  /health - Health check\n`);
});
