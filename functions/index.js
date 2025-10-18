require('dotenv').config();

const {onRequest, onSchedule} = require('firebase-functions/v2/https');
const {onSchedule: scheduledFunction} = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { generateBalancedArticle, generateQuickSummary } = require('./services/articleGenerator');
const { getMarketData } = require('./services/marketDataService');
const {
  getTrendingTopics,
  generateQuizQuestions,
  generateQuizSummary,
  calculateScore
} = require('./services/quizService');

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

/**
 * Get market data (cached, updated per-minute when users are active)
 * GET /api/market-data
 */
app.get('/api/market-data', async (req, res) => {
  try {
    console.log('📊 Market data requested');

    // Get market data with 1-minute cache for active users
    const marketData = await getMarketData(false);

    res.json({
      data: marketData,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get trending quiz topics
 * GET /api/quizzes/trending
 */
app.get('/api/quizzes/trending', (req, res) => {
  try {
    console.log('[API] GET /api/quizzes/trending - Request received');
    const topics = getTrendingTopics();
    console.log('[API] Trending topics count:', topics.length);
    res.json({ topics });
  } catch (error) {
    console.error('[API] Error fetching trending topics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate quiz questions for a topic
 * POST /api/quizzes/generate
 * Body: { topic: string, numQuestions: number }
 */
app.post('/api/quizzes/generate', async (req, res) => {
  try {
    console.log('[API] POST /api/quizzes/generate - Request received');
    console.log('[API] Request body:', req.body);

    const { topic, numQuestions = 5 } = req.body;

    if (!topic) {
      console.error('[API] Missing topic in request');
      return res.status(400).json({ error: 'topic is required' });
    }

    console.log(`[API] 🎯 Generating quiz for: ${topic} (${numQuestions} questions)`);

    const questions = await generateQuizQuestions(topic, numQuestions);
    console.log('[API] Generated questions:', questions.length);

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
    console.log(`[API] ✅ Quiz session created: ${sessionRef.id}`);

    res.json({
      sessionId: sessionRef.id,
      topic,
      questions: quizSession.questions,
      timeLimit: 5
    });

  } catch (error) {
    console.error('[API] Error generating quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit quiz answers and get results
 * POST /api/quizzes/submit
 * Body: { sessionId: string, answers: number[], userId: string }
 */
app.post('/api/quizzes/submit', async (req, res) => {
  try {
    console.log('[API] POST /api/quizzes/submit - Request received');
    console.log('[API] Request body:', req.body);

    const { sessionId, answers, userId } = req.body;

    if (!sessionId || !answers) {
      console.error('[API] Missing sessionId or answers');
      return res.status(400).json({ error: 'sessionId and answers are required' });
    }

    console.log('[API] Fetching quiz session:', sessionId);
    const sessionDoc = await db.collection('quizSessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      console.error('[API] Quiz session not found:', sessionId);
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    const sessionData = sessionDoc.data();
    console.log('[API] Calculating score...');
    const scoreData = calculateScore(sessionData.questionsWithAnswers, answers);
    console.log('[API] Score:', scoreData.score, '/', scoreData.total);

    console.log('[API] Generating quiz summary...');
    const summary = await generateQuizSummary(
      sessionData.topic,
      scoreData.score,
      scoreData.total
    );
    console.log('[API] Summary generated');

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

    console.log('[API] Saving quiz result to Firestore...');
    const resultRef = await db.collection('quizResults').add(result);
    console.log('[API] Result saved:', resultRef.id);

    // Update leaderboard if userId is provided
    if (userId) {
      try {
        console.log('[API] Updating leaderboard for user:', userId);
        const userDoc = await admin.auth().getUser(userId);
        const points = scoreData.score * 10; // 10 points per correct answer
        console.log('[API] Points earned:', points);

        // Update all leaderboard periods
        const periods = ['daily', 'weekly', 'monthly', 'alltime'];

        for (const period of periods) {
          const leaderboardRef = db.collection('leaderboards').doc(period);
          const leaderboardDoc = await leaderboardRef.get();

          let top = leaderboardDoc.exists ? leaderboardDoc.data().top || [] : [];

          // Find or create user entry
          const userIndex = top.findIndex(entry => entry.uid === userId);

          if (userIndex >= 0) {
            top[userIndex].points += points;
            top[userIndex].lastScore = scoreData.score;
            top[userIndex].quizzesTaken = (top[userIndex].quizzesTaken || 0) + 1;
          } else {
            top.push({
              uid: userId,
              displayName: userDoc.displayName || 'Anonymous',
              photoURL: userDoc.photoURL || null,
              points: points,
              lastScore: scoreData.score,
              quizzesTaken: 1
            });
          }

          // Sort by points and keep top 100
          top.sort((a, b) => b.points - a.points);
          top = top.slice(0, 100);

          await leaderboardRef.set({
            top,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }

        console.log(`[API] ✅ Leaderboard updated for user ${userId}`);
      } catch (authError) {
        console.error('[API] ⚠️  Could not update leaderboard:', authError);
      }
    } else {
      console.log('[API] No userId provided, skipping leaderboard update');
    }

    console.log('[API] Sending response...');
    res.json({
      resultId: resultRef.id,
      ...result
    });

  } catch (error) {
    console.error('[API] Error submitting quiz:', error);
    console.error('[API] Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get leaderboard for a period
 * GET /api/leaderboard?period=daily|weekly|monthly|alltime
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('[API] GET /api/leaderboard - Request received');
    const { period = 'alltime' } = req.query;
    console.log('[API] Period:', period);

    const leaderboardDoc = await db.collection('leaderboards').doc(period).get();

    if (!leaderboardDoc.exists) {
      console.log('[API] Leaderboard not found for period:', period);
      return res.json({ period, top: [] });
    }

    const data = leaderboardDoc.data();
    console.log('[API] Leaderboard entries:', data.top?.length || 0);

    res.json({
      period,
      top: data.top || [],
      updatedAt: data.updatedAt
    });

  } catch (error) {
    console.error('[API] Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the Express app as a Cloud Function
exports.api = onRequest(app);

/**
 * Scheduled function to update market data hourly
 * Runs every hour on the hour
 */
exports.updateMarketData = scheduledFunction({
  schedule: 'every 1 hours',
  timeZone: 'America/New_York' // NYSE timezone
}, async (event) => {
  try {
    console.log('⏰ Scheduled market data update starting...');

    // Fetch and cache market data
    const marketData = await getMarketData(true);

    console.log(`✅ Market data updated: ${marketData.length} items`);

    return { success: true, itemCount: marketData.length };
  } catch (error) {
    console.error('❌ Scheduled market data update failed:', error);
    throw error;
  }
});

/**
 * Scheduled function to reset daily leaderboard
 * Runs every day at midnight UTC
 */
exports.resetDailyLeaderboard = scheduledFunction({
  schedule: 'every day 00:00',
  timeZone: 'UTC'
}, async (event) => {
  try {
    console.log('⏰ Resetting daily leaderboard...');

    await db.collection('leaderboards').doc('daily').set({
      top: [],
      updatedAt: new Date().toISOString(),
      resetAt: new Date().toISOString()
    });

    console.log('✅ Daily leaderboard reset');

    return { success: true };
  } catch (error) {
    console.error('❌ Daily leaderboard reset failed:', error);
    throw error;
  }
});

/**
 * Scheduled function to reset weekly leaderboard
 * Runs every Monday at midnight UTC
 */
exports.resetWeeklyLeaderboard = scheduledFunction({
  schedule: 'every monday 00:00',
  timeZone: 'UTC'
}, async (event) => {
  try {
    console.log('⏰ Resetting weekly leaderboard...');

    await db.collection('leaderboards').doc('weekly').set({
      top: [],
      updatedAt: new Date().toISOString(),
      resetAt: new Date().toISOString()
    });

    console.log('✅ Weekly leaderboard reset');

    return { success: true };
  } catch (error) {
    console.error('❌ Weekly leaderboard reset failed:', error);
    throw error;
  }
});

/**
 * Scheduled function to reset monthly leaderboard
 * Runs on the 1st of every month at midnight UTC
 */
exports.resetMonthlyLeaderboard = scheduledFunction({
  schedule: '0 0 1 * *',
  timeZone: 'UTC'
}, async (event) => {
  try {
    console.log('⏰ Resetting monthly leaderboard...');

    await db.collection('leaderboards').doc('monthly').set({
      top: [],
      updatedAt: new Date().toISOString(),
      resetAt: new Date().toISOString()
    });

    console.log('✅ Monthly leaderboard reset');

    return { success: true };
  } catch (error) {
    console.error('❌ Monthly leaderboard reset failed:', error);
    throw error;
  }
});
