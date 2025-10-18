// Only load dotenv in local development
if (process.env.NODE_ENV !== 'production' && !process.env.FUNCTION_TARGET) {
  require('dotenv').config();
}

const {onRequest} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const {defineSecret} = require('firebase-functions/params');
const { generateBalancedArticle, generateQuickSummary } = require('./services/articleGenerator');

// Define secret
const perplexityApiKey = defineSecret('PERPLEXITY_API_KEY');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Create Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EduHub News API'
  });
});

/**
 * Generate a balanced news article
 * POST /api/articles/generate
 * Body: { topicName: string, category: string }
 */
app.post('/api/articles/generate', async (req, res) => {
  try {
    const { topicName, category = 'General' } = req.body;

    if (!topicName) {
      return res.status(400).json({ error: 'topicName is required' });
    }

    console.log(`📰 Generating article for: ${topicName}`);

    // Generate article using Perplexity
    const articleData = await generateBalancedArticle(topicName, category);

    // Create article with timestamp
    const article = {
      ...articleData,
      id: `article-${Date.now()}`,
      topicName,
      createdAt: new Date().toISOString(),
      expireAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48-hour TTL
    };

    // Save to Firestore
    try {
      await db.collection('articles').doc(article.id).set(article);
      console.log(`✅ Article saved to Firestore: ${article.id}`);
    } catch (firestoreError) {
      console.warn('⚠️  Firestore save failed:', firestoreError.message);
      // Continue anyway - article can still be returned
    }

    res.json(article);

  } catch (error) {
    console.error('Error generating article:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all articles, optionally filtered by category
 * GET /api/articles?category=Tech
 */
app.get('/api/articles', async (req, res) => {
  try {
    const { category } = req.query;

    let query = db.collection('articles')
      .where('expireAt', '>', new Date().toISOString())
      .orderBy('expireAt', 'desc')
      .orderBy('createdAt', 'desc');

    if (category) {
      query = query.where('categories', 'array-contains', category);
    }

    const snapshot = await query.limit(50).get();

    const articles = [];
    snapshot.forEach(doc => {
      articles.push({ id: doc.id, ...doc.data() });
    });

    res.json({ articles });

  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific article by ID
 * GET /api/articles/:id
 */
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('articles').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = { id: doc.id, ...doc.data() };

    // Check if expired
    if (new Date(article.expireAt) < new Date()) {
      return res.status(410).json({ error: 'Article expired' });
    }

    res.json(article);

  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate a quick summary (for watchlist topics)
 * POST /api/summaries/generate
 * Body: { query: string }
 */
app.post('/api/summaries/generate', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const summary = await generateQuickSummary(query);

    // Save to Firestore
    const summaryDoc = {
      ...summary,
      id: `summary-${Date.now()}`,
      query,
      createdAt: new Date().toISOString()
    };

    await db.collection('summaries').doc(summaryDoc.id).set(summaryDoc);

    res.json(summaryDoc);

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the Express app as a Cloud Function with secret
exports.api = onRequest(
  {secrets: [perplexityApiKey]},
  app
);
