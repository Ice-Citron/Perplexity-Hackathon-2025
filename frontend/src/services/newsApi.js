const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Generate a balanced news article
 * @param {string} topicName - Topic to generate article about
 * @param {string} category - Category (Tech, Business, etc.)
 * @returns {Promise<Object>} Generated article
 */
export async function generateArticle(topicName, category = 'General') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/articles/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topicName, category })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate article');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Get all articles, optionally filtered by category
 * @param {string} category - Category filter (optional)
 * @returns {Promise<Object>} Articles list
 */
export async function getArticles(category = null) {
  try {
    const url = category
      ? `${API_BASE_URL}/api/articles?category=${category}`
      : `${API_BASE_URL}/api/articles`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Get a specific article by ID
 * @param {string} id - Article ID
 * @returns {Promise<Object>} Article data
 */
export async function getArticle(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}`);

    if (!response.ok) {
      throw new Error('Article not found');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
