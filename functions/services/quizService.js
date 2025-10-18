const fetch = require('node-fetch');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Trending topics for quizzes (can be expanded)
const TRENDING_TOPICS = [
  { id: 'ai-tech', name: 'AI & Technology', popularity: 95, category: 'Tech' },
  { id: 'climate-change', name: 'Climate Change', popularity: 88, category: 'Science' },
  { id: 'space-exploration', name: 'Space Exploration', popularity: 82, category: 'Science' },
  { id: 'global-politics', name: 'Global Politics', popularity: 79, category: 'Politics' },
  { id: 'renewable-energy', name: 'Renewable Energy', popularity: 76, category: 'Science' },
  { id: 'cryptocurrency', name: 'Cryptocurrency & Finance', popularity: 73, category: 'Business' },
  { id: 'healthcare', name: 'Healthcare Innovation', popularity: 71, category: 'Health' },
  { id: 'education-tech', name: 'Education Technology', popularity: 68, category: 'Education' },
  { id: 'sports-olympics', name: 'Sports & Olympics', popularity: 65, category: 'Sports' },
  { id: 'entertainment', name: 'Entertainment & Culture', popularity: 62, category: 'Culture' }
];

/**
 * Get trending quiz topics
 */
function getTrendingTopics() {
  return TRENDING_TOPICS.sort((a, b) => b.popularity - a.popularity);
}

/**
 * Generate quiz questions using Perplexity API
 * @param {string} topic - Topic for quiz
 * @param {number} numQuestions - Number of questions (default 5)
 */
async function generateQuizQuestions(topic, numQuestions = 5) {
  const quizSchema = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question_text: { type: 'string' },
            options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
            correct_option_index: { type: 'integer', minimum: 0, maximum: 3 },
            explanation: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
          },
          required: ['question_text', 'options', 'correct_option_index', 'explanation']
        },
        minItems: numQuestions,
        maxItems: numQuestions
      }
    },
    required: ['questions']
  };

  const prompt = `Create ${numQuestions} multiple-choice quiz questions about "${topic}".

Requirements:
- Questions should be educational and fact-based
- Mix of difficulty levels (easy, medium, hard)
- Each question has exactly 4 options
- Include a brief explanation for the correct answer
- Make questions engaging and relevant to current knowledge

Return a JSON object with a "questions" array.`;

  const body = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        schema: quizSchema
      }
    }
  };

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return content.questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw error;
  }
}

/**
 * Generate a summary with sources after quiz completion
 * @param {string} topic - Quiz topic
 * @param {number} score - User's score
 * @param {number} total - Total questions
 */
async function generateQuizSummary(topic, score, total) {
  const percentage = Math.round((score / total) * 100);

  const prompt = `The user just completed a quiz about "${topic}" and scored ${score}/${total} (${percentage}%).

Provide:
1. A brief encouraging analysis (2-3 sentences)
2. 2-3 key learning points about ${topic}
3. Suggest what they should study next

Keep it concise, friendly, and educational. Format as markdown.`;

  const body = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const summaryText = data.choices[0].message.content;
    const searchResults = data.search_results || [];

    // Format sources
    let sourcesMarkdown = '';
    if (searchResults.length > 0) {
      sourcesMarkdown = '\n\n---\n\n### Learn More\n\n';
      searchResults.slice(0, 5).forEach((result, idx) => {
        sourcesMarkdown += `${idx + 1}. [${result.title || 'Source'}](${result.url})\n`;
      });
    }

    return {
      summary: summaryText,
      sources: searchResults.slice(0, 5),
      fullMarkdown: summaryText + sourcesMarkdown
    };
  } catch (error) {
    console.error('Error generating quiz summary:', error);
    // Return fallback summary
    return {
      summary: `Great effort! You scored ${score} out of ${total} on ${topic}. Keep learning and improving!`,
      sources: [],
      fullMarkdown: `Great effort! You scored ${score} out of ${total} on ${topic}. Keep learning and improving!`
    };
  }
}

/**
 * Calculate quiz score and stats
 * @param {Array} questions - Quiz questions with correct answers
 * @param {Array} userAnswers - User's answers (array of selected indices)
 */
function calculateScore(questions, userAnswers) {
  let correct = 0;
  const results = [];

  questions.forEach((question, idx) => {
    const userAnswer = userAnswers[idx];
    const isCorrect = userAnswer !== null && userAnswer === question.correct_option_index;

    if (isCorrect) {
      correct++;
    }

    results.push({
      questionIndex: idx,
      userAnswer: userAnswer,
      correctAnswer: question.correct_option_index,
      isCorrect: isCorrect,
      explanation: question.explanation
    });
  });

  return {
    score: correct,
    total: questions.length,
    percentage: Math.round((correct / questions.length) * 100),
    results: results
  };
}

module.exports = {
  getTrendingTopics,
  generateQuizQuestions,
  generateQuizSummary,
  calculateScore
};
