const { getPerplexityClient } = require('./perplexityClient');
const { NEWS_SOURCES } = require('../constants/newsSources');

/**
 * Analyze a topic across different political bias sources to identify claims and disagreements
 */
async function analyzeClaimsAcrossSources(topicName) {
  try {
    console.log(`📊 Analyzing claims for: ${topicName}`);

    const client = getPerplexityClient();

    // Get samples from each bias category
    const leftSources = NEWS_SOURCES.LEFT.slice(0, 2).map(s => s.url).join(', ');
    const centerSources = NEWS_SOURCES.CENTER.slice(0, 2).map(s => s.url).join(', ');
    const rightSources = NEWS_SOURCES.RIGHT.slice(0, 2).map(s => s.url).join(', ');

    const prompt = `Analyze how different news outlets with different political leanings cover this topic: "${topicName}"

Please examine coverage from:
- Left-leaning sources (${leftSources})
- Center sources (${centerSources})
- Right-leaning sources (${rightSources})

Return a JSON object with this structure:
{
  "claims": [
    {
      "claim": "Statement or fact being reported",
      "leftPerspective": "How left-leaning sources frame this",
      "centerPerspective": "How center sources frame this",
      "rightPerspective": "How right-leaning sources frame this",
      "disagreementLevel": "low|medium|high",
      "context": "Additional context explaining the disagreement"
    }
  ],
  "overallDisagreement": "low|medium|high",
  "summary": "Brief summary of the main differences in coverage"
}

Focus on 3-5 key claims where there are notable differences in framing or emphasis.`;

    const completion = await client.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a neutral media analyst expert at identifying how different news sources with different political biases frame the same stories. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
      return_citations: true
    });

    const content = completion.choices[0].message.content;
    const claimsData = JSON.parse(content);

    console.log(`✅ Claims analysis complete: ${claimsData.claims?.length || 0} claims identified`);

    return claimsData;
  } catch (error) {
    console.error('❌ Error analyzing claims:', error);
    // Return empty structure on error
    return {
      claims: [],
      overallDisagreement: 'low',
      summary: 'Unable to analyze claims at this time.'
    };
  }
}

module.exports = {
  analyzeClaimsAcrossSources
};
