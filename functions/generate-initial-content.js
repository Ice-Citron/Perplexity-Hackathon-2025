#!/usr/bin/env node

/**
 * Quick script to generate initial content for the Really? platform
 * Run with: node generate-initial-content.js
 */

require('dotenv').config();
const { getTrendingTopics } = require('./services/quizService');

const API_URL = 'http://localhost:5001';

async function generateInitialArticles(count = 10) {
  console.log(`\n📰 Generating ${count} initial articles...\n`);

  const topics = getTrendingTopics();
  const selectedTopics = topics.slice(0, count);
  const articles = [];

  for (let i = 0; i < selectedTopics.length; i++) {
    const topic = selectedTopics[i];
    try {
      console.log(`[${i + 1}/${count}] Generating: ${topic.name}`);

      // Call the API endpoint that ACTUALLY works
      const response = await fetch(`${API_URL}/api/articles/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicName: topic.name,
          category: topic.category
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API call failed');
      }

      const article = await response.json();
      articles.push(article);

      console.log(`✅ Saved: ${article.id} - ${article.title}`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error for ${topic.name}:`, error.message);
    }
  }

  console.log(`\n✅ Generated ${articles.length} articles!\n`);
  return articles;
}

async function generateInitialQuizzes() {
  console.log('\n📝 Generating daily quizzes...\n');

  try {
    const quizzes = await generateDailyQuizzes();

    if (quizzes.length > 0) {
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
      console.log(`✅ Generated ${quizzes.length} daily quizzes!\n`);
    } else {
      console.log('⚠️  No quizzes generated\n');
    }

    return quizzes;
  } catch (error) {
    console.error('❌ Quiz generation error:', error.message);
    return [];
  }
}

async function checkBreakingNews() {
  console.log('\n🚨 Checking for breaking news...\n');

  try {
    const breakingNewsData = await detectBreakingNews();

    await db.collection('breakingNews').doc('latest').set({
      ...breakingNewsData,
      checkedAt: new Date().toISOString()
    });

    if (breakingNewsData.hasBreakingNews && breakingNewsData.events.length > 0) {
      console.log(`🚨 BREAKING: ${breakingNewsData.events.length} events detected`);

      const articles = await generateBreakingNewsArticles(breakingNewsData.events);

      for (const article of articles) {
        await db.collection('articles').doc(article.id).set(article);
        console.log(`✅ Breaking news article saved: ${article.id}`);
      }

      console.log(`\n✅ Generated ${articles.length} breaking news articles!\n`);
    } else {
      console.log('✅ No breaking news at this time\n');
    }

    return breakingNewsData;
  } catch (error) {
    console.error('❌ Breaking news detection error:', error.message);
    return { hasBreakingNews: false, events: [] };
  }
}

async function main() {
  console.log('\n🚀 Really? - Initial Content Generator\n');
  console.log('This will populate your app with articles.\n');

  try {
    // Generate 10 articles (you can change this number)
    const articles = await generateInitialArticles(10);

    console.log('\n✨ All done! Your app should now have content.\n');
    console.log(`✅ Generated ${articles.length} articles successfully!\n`);
    console.log('Visit http://localhost:3000/news to see them!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
