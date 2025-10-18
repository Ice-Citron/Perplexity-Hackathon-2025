const { getPerplexityClient } = require('./perplexityClient');

/**
 * Detect if there are any breaking news events happening right now
 */
async function detectBreakingNews() {
  try {
    console.log('🚨 Checking for breaking news...');

    const client = getPerplexityClient();

    const prompt = `Are there any major breaking news events happening RIGHT NOW in the past 1-2 hours?

Check for:
- Major international incidents
- Natural disasters
- Political/government emergencies
- Major corporate/tech announcements
- Significant geopolitical events
- Major conflicts/military actions

Return a JSON object with this structure:
{
  "hasBreakingNews": true/false,
  "events": [
    {
      "title": "Brief title",
      "summary": "1-2 sentence summary",
      "category": "Politics|International|Tech|Disaster|Economy|Other",
      "severity": "critical|high|medium",
      "timeframe": "When it started (e.g., '30 minutes ago', '2 hours ago')",
      "sources": ["List of major news sources reporting it"]
    }
  ],
  "lastChecked": "${new Date().toISOString()}"
}

Only include events that are:
1. Breaking (within last 2-3 hours)
2. Widely reported by major news outlets
3. Genuinely significant/newsworthy

If there are no breaking news events, return hasBreakingNews: false with empty events array.`;

    const completion = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a breaking news detection system. Only flag truly significant, breaking news events. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      return_citations: true,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    const breakingNews = JSON.parse(content);

    if (breakingNews.hasBreakingNews) {
      console.log(`🚨 BREAKING: ${breakingNews.events?.length || 0} breaking news events detected`);
    } else {
      console.log('✅ No breaking news at this time');
    }

    return breakingNews;
  } catch (error) {
    console.error('❌ Error detecting breaking news:', error);
    return {
      hasBreakingNews: false,
      events: [],
      lastChecked: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Generate articles for breaking news events
 */
async function generateBreakingNewsArticles(breakingEvents) {
  const articles = [];

  for (const event of breakingEvents) {
    try {
      // Import article generator
      const { generateBalancedArticle } = require('./articleGenerator');

      const article = await generateBalancedArticle(event.title, event.category);

      articles.push({
        ...article,
        isBreaking: true,
        breakingSeverity: event.severity,
        breakingTimeframe: event.timeframe,
        id: `breaking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // Delay between articles
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error generating article for breaking news: ${event.title}`, error);
    }
  }

  return articles;
}

module.exports = {
  detectBreakingNews,
  generateBreakingNewsArticles
};
