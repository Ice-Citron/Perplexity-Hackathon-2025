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
const { generateDailyQuizzes } = require('./services/dailyQuizGenerator');
const { detectBreakingNews, generateBreakingNewsArticles } = require('./services/breakingNewsDetector');
const { analyzeClaimsAcrossSources } = require('./services/claimsAnalyzer');

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
    service: 'Really? API'
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

/**
 * Get claims analysis for an article topic
 * GET /api/articles/:id/claims
 */
app.get('/api/articles/:id/claims', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📊 Fetching claims for article: ${id}`);

    // Get article
    const doc = await db.collection('articles').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = doc.data();

    // Check if claims already exist
    if (article.claims) {
      console.log('✅ Returning cached claims');
      return res.json(article.claims);
    }

    // Generate claims analysis
    console.log('🔍 Generating claims analysis...');
    const claims = await analyzeClaimsAcrossSources(article.topicName || article.title);

    // Save claims to article
    await db.collection('articles').doc(id).update({
      claims,
      claimsGeneratedAt: new Date().toISOString()
    });

    console.log('✅ Claims analysis complete');
    res.json(claims);

  } catch (error) {
    console.error('❌ Error fetching claims:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get daily quizzes
 * GET /api/quizzes/daily
 */
app.get('/api/quizzes/daily', async (req, res) => {
  try {
    console.log('📝 Fetching daily quizzes...');

    // Get today's quizzes (created within last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const snapshot = await db.collection('dailyQuizzes')
      .where('createdAt', '>', cutoff)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const quizzes = [];
    snapshot.forEach(doc => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Found ${quizzes.length} daily quizzes`);

    res.json({ quizzes });

  } catch (error) {
    console.error('❌ Error fetching daily quizzes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get breaking news
 * GET /api/breaking-news
 */
app.get('/api/breaking-news', async (req, res) => {
  try {
    console.log('🚨 Fetching breaking news...');

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

  } catch (error) {
    console.error('❌ Error fetching breaking news:', error);
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

/**
 * Scheduled function to generate daily quizzes from viral topics
 * Runs every day at midnight UTC
 */
exports.generateDailyQuizzesScheduled = scheduledFunction({
  schedule: 'every day 00:00',
  timeZone: 'UTC'
}, async (event) => {
  try {
    console.log('⏰ Generating daily quizzes from viral topics...');

    const quizzes = await generateDailyQuizzes();

    if (quizzes.length > 0) {
      // Save quizzes to Firestore
      const batch = db.batch();

      for (const quiz of quizzes) {
        const quizId = `daily-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const quizRef = db.collection('dailyQuizzes').doc(quizId);
        batch.set(quizRef, {
          ...quiz,
          id: quizId
        });
      }

      await batch.commit();
      console.log(`✅ Generated and saved ${quizzes.length} daily quizzes`);
    } else {
      console.log('⚠️  No quizzes generated');
    }

    return { success: true, quizzesGenerated: quizzes.length };
  } catch (error) {
    console.error('❌ Daily quiz generation failed:', error);
    throw error;
  }
});

/**
 * Scheduled function to generate 30 articles every 12 hours
 * Runs at 00:00 and 12:00 UTC
 */
exports.generateScheduledArticles = scheduledFunction({
  schedule: 'every 12 hours',
  timeZone: 'UTC'
}, async (event) => {
  try {
    console.log('⏰ Generating scheduled articles...');

    const topics = getTrendingTopics();
    const selectedTopics = topics.slice(0, 30); // Get 30 topics
    const articles = [];

    for (const topic of selectedTopics) {
      try {
        console.log(`📰 Generating article for: ${topic.name}`);

        const articleData = await generateBalancedArticle(topic.name, topic.category);

        const article = {
          ...articleData,
          id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topicName: topic.name,
          createdAt: new Date().toISOString(),
          expireAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        };

        // Save to Firestore
        await db.collection('articles').doc(article.id).set(article);
        articles.push(article);

        console.log(`✅ Article saved: ${article.id}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error generating article for ${topic.name}:`, error);
      }
    }

    console.log(`✅ Generated ${articles.length} scheduled articles`);

    return { success: true, articlesGenerated: articles.length };
  } catch (error) {
    console.error('❌ Scheduled article generation failed:', error);
    throw error;
  }
});

/**
 * Scheduled function to detect and process breaking news
 * Runs every hour
 */
exports.detectAndProcessBreakingNews = scheduledFunction({
  schedule: 'every 1 hours',
  timeZone: 'UTC'
}, async (event) => {
  try {
    console.log('⏰ Checking for breaking news...');

    const breakingNewsData = await detectBreakingNews();

    // Save detection result
    await db.collection('breakingNews').doc('latest').set({
      ...breakingNewsData,
      checkedAt: new Date().toISOString()
    });

    if (breakingNewsData.hasBreakingNews && breakingNewsData.events.length > 0) {
      console.log(`🚨 BREAKING: ${breakingNewsData.events.length} events detected`);

      // Generate articles for breaking news
      const articles = await generateBreakingNewsArticles(breakingNewsData.events);

      // Save articles to Firestore
      for (const article of articles) {
        await db.collection('articles').doc(article.id).set(article);
        console.log(`✅ Breaking news article saved: ${article.id}`);
      }

      console.log(`✅ Generated ${articles.length} breaking news articles`);

      return {
        success: true,
        hasBreakingNews: true,
        eventsDetected: breakingNewsData.events.length,
        articlesGenerated: articles.length
      };
    } else {
      console.log('✅ No breaking news at this time');
      return { success: true, hasBreakingNews: false };
    }
  } catch (error) {
    console.error('❌ Breaking news detection failed:', error);
    throw error;
  }
});
