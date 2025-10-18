const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

console.log('=== newsApi.js loaded ===');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

/**
 * Generate a balanced news article
 * @param {string} topicName - Topic to generate article about
 * @param {string} category - Category (Tech, Business, etc.)
 * @returns {Promise<Object>} Generated article
 */
export async function generateArticle(topicName, category = 'General') {
  const url = `${API_BASE_URL}/api/articles/generate`;
  console.log('generateArticle called');
  console.log('  topicName:', topicName);
  console.log('  category:', category);
  console.log('  Full URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topicName, category })
    });

    console.log('  Response status:', response.status);
    console.log('  Response ok:', response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error('  Error response:', error);
      throw new Error(error.error || 'Failed to generate article');
    }

    const data = await response.json();
    console.log('  Success! Article generated:', data.id);
    return data;
  } catch (error) {
    console.error('generateArticle Error:', error);
    throw error;
  }
}

/**
 * Get all articles, optionally filtered by category
 * @param {string} category - Category filter (optional)
 * @returns {Promise<Object>} Articles list
 */
export async function getArticles(category = null) {
  const url = category
    ? `${API_BASE_URL}/api/articles?category=${category}`
    : `${API_BASE_URL}/api/articles`;

  console.log('getArticles called');
  console.log('  category:', category);
  console.log('  Full URL:', url);

  try {
    const response = await fetch(url);

    console.log('  Response status:', response.status);
    console.log('  Response ok:', response.ok);
    console.log('  Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const text = await response.text();
      console.error('  Error response text:', text);
      throw new Error('Failed to fetch articles');
    }

    const data = await response.json();
    console.log('  Success! Articles count:', data.articles?.length || 0);
    return data;
  } catch (error) {
    console.error('getArticles Error:', error);
    throw error;
  }
}

/**
 * Get a specific article by ID
 * @param {string} id - Article ID
 * @returns {Promise<Object>} Article data
 */
export async function getArticle(id) {
  const url = `${API_BASE_URL}/api/articles/${id}`;
  console.log('getArticle called');
  console.log('  id:', id);
  console.log('  Full URL:', url);

  try {
    const response = await fetch(url);

    console.log('  Response status:', response.status);
    console.log('  Response ok:', response.ok);

    if (!response.ok) {
      const text = await response.text();
      console.error('  Error response text:', text);
      throw new Error('Article not found');
    }

    const data = await response.json();
    console.log('  Success! Article title:', data.title);
    return data;
  } catch (error) {
    console.error('getArticle Error:', error);
    throw error;
  }
}
