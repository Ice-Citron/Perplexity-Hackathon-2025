/**
 * Get configured Perplexity client
 */
function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  // Return a simple wrapper for the Perplexity API
  return {
    chat: {
      completions: {
        create: async (options) => {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
          });

          if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
          }

          return await response.json();
        }
      }
    }
  };
}

module.exports = {
  getPerplexityClient
};
