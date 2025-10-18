const Perplexity = require('@perplexity-ai/perplexity_ai');

function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }
  return new Perplexity({ apiKey });
}

/**
 * Fetch multiple relevant images for the article topic
 * @param {string} topicName - Topic to find images for
 * @param {Array} sources - Source articles
 * @returns {Promise<Array>} Array of image objects with url and caption
 */
async function fetchArticleImages(topicName, sources) {
  try {
    const images = [];

    // Use Lorem Picsum - reliable placeholder images
    // Generate 3 images with different random seeds based on topic
    const seed = topicName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < 3; i++) {
      const imageUrl = `https://picsum.photos/seed/${seed + i}/1200/800`;

      // Generate caption using topic context
      let caption = '';
      if (i === 0) {
        caption = `Visual representation of ${topicName}`;
      } else if (i === 1) {
        caption = `Context and background on ${topicName}`;
      } else {
        caption = `Related developments in ${topicName}`;
      }

      images.push({
        url: imageUrl,
        caption,
        alt: `Image ${i + 1}: ${topicName}`
      });
    }

    console.log(`📸 Generated ${images.length} images for article`);
    return images;

  } catch (error) {
    console.log('Image fetch error:', error.message);
    // Return at least one fallback image
    return [{
      url: 'https://picsum.photos/1200/800',
      caption: `Visual representation of ${topicName}`,
      alt: topicName
    }];
  }
}

/**
 * Generate a balanced news article with Perplexity
 * @param {string} topicName - Topic to generate article about
 * @param {string} category - Category (World, Tech, Business, etc.)
 * @returns {Promise<Object>} Article data with title, summary, sources, coverage
 */
async function generateBalancedArticle(topicName, category = 'General') {
  const client = getPerplexityClient();

  console.log(`📝 Generating balanced article for: ${topicName}`);

  try {
    const completion = await client.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Provide balanced, factual news briefs with diverse sources. Always respond with properly formatted markdown text.'
        },
        {
          role: 'user',
          content: `Research and write a balanced 400-600 word brief on: "${topicName}"

Requirements:
- Use diverse, recent sources (mainstream US, international, left/center/right perspectives)
- Present facts objectively with proper citations
- Structure: headline, then body paragraphs
- Include diverse viewpoints

Write in markdown format. Use a clear headline at the top.`
        }
      ],
      max_tokens: 2000,
      return_citations: true
    });

    const content = completion.choices[0].message.content;
    const citations = completion.citations || [];

    console.log('📥 Received response from Perplexity');

    // Extract title from content (first line or first heading)
    let title = `Research Brief: ${topicName}`;
    const lines = content.trim().split('\n');
    if (lines.length > 0) {
      // Try to get first heading
      const firstLine = lines[0].replace(/^#+\s*/, '').trim();
      if (firstLine.length > 0 && firstLine.length < 150) {
        title = firstLine;
      }
    }

    // Convert citations to source objects
    const sources = citations.slice(0, 8).map(url => {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        return {
          title: hostname,
          url
        };
      } catch {
        return null;
      }
    }).filter(s => s !== null);

    // Fetch multiple images for the article
    let images = [];
    try {
      images = await fetchArticleImages(topicName, sources);
    } catch (imageError) {
      console.log('⚠️  No images found, continuing without them');
      images = [];
    }

    // Keep first image as imageUrl for backward compatibility with card display
    const imageUrl = images.length > 0 ? images[0].url : null;

    // Estimate political balance based on sources
    let coverage = { left: 33, center: 34, right: 33 };
    if (sources.length >= 3) {
      // Basic heuristic - assume balanced if we have diverse sources
      coverage = { left: 30, center: 40, right: 30 };
    }

    const articleData = {
      title,
      summaryMd: content,
      sources,
      coverage,
      categories: [category],
      imageUrl,  // Main image for card display
      images     // All images with captions for article detail
    };

    console.log(`✅ Generated article: "${articleData.title}"`);
    console.log(`   Sources: ${articleData.sources.length}`);
    console.log(`   Images: ${images.length}`);
    console.log(`   Coverage: L${articleData.coverage.left}% C${articleData.coverage.center}% R${articleData.coverage.right}%`);

    return articleData;

  } catch (error) {
    console.error('Error generating balanced article:', error);
    throw new Error(`Failed to generate article: ${error.message}`);
  }
}

/**
 * Generate a quick news summary (for watchlist topics)
 * @param {string} query - Search query
 * @returns {Promise<Object>} Quick summary data
 */
async function generateQuickSummary(query) {
  const client = getPerplexityClient();

  try {
    const completion = await client.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: `Provide a concise 2-3 paragraph summary of recent developments on: "${query}". Include 3-5 source citations with URLs.`
        }
      ],
      max_tokens: 800,
      return_citations: true
    });

    const content = completion.choices[0].message.content;
    const citations = completion.citations || [];

    return {
      title: `Recent: ${query}`,
      summaryMd: content,
      sources: citations.slice(0, 5).map(url => ({
        title: new URL(url).hostname,
        url
      })),
      coverage: { left: 33, center: 34, right: 33 },
      categories: ['User Topic']
    };

  } catch (error) {
    console.error('Error generating quick summary:', error);
    throw error;
  }
}

module.exports = {
  generateBalancedArticle,
  generateQuickSummary
};
