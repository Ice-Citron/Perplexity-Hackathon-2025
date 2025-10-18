const { getPerplexityClient } = require('./perplexityClient');
const { QUIZ_CATEGORIES } = require('../constants/newsSources');

/**
 * Get top viral/trending news topics for quiz generation
 */
async function getViralTopics() {
  try {
    console.log('🔥 Fetching viral topics...');

    const client = getPerplexityClient();

    const prompt = `What are the top 10 most viral, trending, or significant news events happening right now across these categories: ${QUIZ_CATEGORIES.join(', ')}?

Return a JSON object with this structure:
{
  "topics": [
    {
      "title": "Brief title of the news event",
      "category": "One of the categories from the list",
      "significance": "Why this is important/viral",
      "recency": "How recent (e.g., 'today', 'this week')"
    }
  ]
}

Focus on events from the past 24-48 hours that are generating significant attention.`;

    const completion = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a news curator expert at identifying trending and viral news stories. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      return_citations: true,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    const topicsData = JSON.parse(content);

    console.log(`✅ Found ${topicsData.topics?.length || 0} viral topics`);

    return topicsData.topics || [];
  } catch (error) {
    console.error('❌ Error fetching viral topics:', error);
    return [];
  }
}

/**
 * Generate educational quiz questions about a specific viral topic
 */
async function generateViralTopicQuiz(topic, category) {
  try {
    console.log(`📝 Generating quiz for viral topic: ${topic}`);

    const client = getPerplexityClient();

    const prompt = `Create an educational quiz about this current news event: "${topic}" (Category: ${category})

The quiz should help users learn about and understand this news story, its context, and implications.

Return a JSON object with this structure:
{
  "topic": "${topic}",
  "category": "${category}",
  "questions": [
    {
      "question_text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Why this is correct and what it teaches",
      "difficulty": "easy|medium|hard"
    }
  ],
  "context": "Brief background about why this news is important",
  "learningObjectives": ["What users should learn from this quiz"]
}

Create 5 questions that progressively teach about the topic:
1. Basic facts (easy)
2. Context/background (easy-medium)
3. Key players/entities involved (medium)
4. Implications/significance (medium-hard)
5. Broader context/connections (hard)`;

    const completion = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are an educational quiz designer expert at creating informative quizzes about current events. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      return_citations: true,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    const quizData = JSON.parse(content);

    console.log(`✅ Quiz generated: ${quizData.questions?.length || 0} questions`);

    return quizData;
  } catch (error) {
    console.error('❌ Error generating viral quiz:', error);
    return null;
  }
}

/**
 * Generate a full set of daily quizzes from viral topics
 */
async function generateDailyQuizzes() {
  try {
    console.log('🎯 Generating daily quizzes from viral topics...');

    // Get viral topics
    const viralTopics = await getViralTopics();

    if (viralTopics.length === 0) {
      console.warn('⚠️  No viral topics found');
      return [];
    }

    // Generate quizzes for top 5 topics (to avoid rate limits)
    const topTopics = viralTopics.slice(0, 5);
    const quizzes = [];

    for (const topic of topTopics) {
      const quiz = await generateViralTopicQuiz(topic.title, topic.category);

      if (quiz && quiz.questions && quiz.questions.length > 0) {
        quizzes.push({
          ...quiz,
          viralTopic: topic,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          type: 'daily'
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Generated ${quizzes.length} daily quizzes`);

    return quizzes;
  } catch (error) {
    console.error('❌ Error generating daily quizzes:', error);
    return [];
  }
}

module.exports = {
  getViralTopics,
  generateViralTopicQuiz,
  generateDailyQuizzes
};
