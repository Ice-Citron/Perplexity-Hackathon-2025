require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { generateBalancedArticle, generateQuickSummary } = require('./services/articleGenerator');

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

// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    articles: articles.size
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EduHub Local Server running on http://localhost:${PORT}`);
  console.log(`✅ Perplexity API configured`);
  console.log(`\n📝 Available endpoints:`);
  console.log(`   POST /api/articles/generate - Generate balanced article`);
  console.log(`   GET  /api/articles - List all articles`);
  console.log(`   GET  /api/articles/:id - Get specific article`);
  console.log(`   GET  /health - Health check\n`);
});
