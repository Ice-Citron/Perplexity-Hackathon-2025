require('dotenv').config();

// Mock Firebase Admin and Functions
const mockAdmin = {
  initializeApp: () => {},
  firestore: () => ({
    collection: () => ({
      add: async (data) => {
        console.log('\n📦 Would save to Firestore:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        return { id: 'test-doc-' + Date.now() };
      }
    })
  }),
  FieldValue: {
    serverTimestamp: () => new Date()
  }
};

const mockFunctions = {
  https: {
    onRequest: (handler) => handler
  },
  config: () => ({
    perplexity: {
      api_key: process.env.PERPLEXITY_API_KEY
    }
  })
};

// Inject mocks
global.admin = mockAdmin;
global.functions = mockFunctions;

// Load the functions file (skip the actual exports)
const axios = require('axios');
const cheerio = require('cheerio');
const Perplexity = require('@perplexity-ai/perplexity_ai');

// Copy the helper functions from index.js
function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }
  return new Perplexity({ apiKey });
}

async function extractEntities(headline) {
  try {
    const client = getPerplexityClient();

    const completion = await client.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Extract key named entities (people, organizations, locations, events) from the headline. Return as JSON array of strings.'
        },
        {
          role: 'user',
          content: headline
        }
      ],
      max_tokens: 200
    });

    const content = completion.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch {
      return content.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
    }
  } catch (error) {
    console.error('Entity extraction error:', error.message);
    return headline.split(' ').filter(w => w.length > 3).slice(0, 5);
  }
}

async function retrieveArticles(headline, entities) {
  const client = getPerplexityClient();
  const query = `${headline} ${entities.slice(0, 3).join(' ')} news coverage`;

  try {
    const completion = await client.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Find diverse news coverage of this story from multiple outlets (mainstream, international, regional). List the article titles and briefly describe what each outlet says. Provide citations.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 2000,
      return_citations: true
    });

    const citations = completion.citations || [];
    const content = completion.choices[0].message.content;

    console.log('\n📰 Retrieved Content Preview:\n', content.substring(0, 500) + '...\n');

    const articles = citations.slice(0, 10).map((url, idx) => {
      try {
        return {
          url,
          domain: new URL(url).hostname.replace('www.', ''),
          title: `Article ${idx + 1} from ${new URL(url).hostname}`,
          snippet: content.substring(idx * 100, (idx + 1) * 100),
          fetchedAt: new Date().toISOString()
        };
      } catch (e) {
        return null;
      }
    }).filter(a => a !== null);

    return articles.slice(0, 6);

  } catch (error) {
    console.error('Article retrieval error:', error.message);
    throw new Error('Failed to retrieve articles: ' + error.message);
  }
}

// Main test function
async function testAnalyzeNews() {
  console.log('🧪 Testing News Analysis Pipeline\n');
  console.log('=' .repeat(60));

  const testHeadline = 'OpenAI announces GPT-5 breakthrough in artificial intelligence';

  try {
    // Step 1: Extract entities
    console.log('\n📍 Step 1: Extracting entities...');
    const entities = await extractEntities(testHeadline);
    console.log('✅ Entities:', entities);

    // Step 2: Retrieve articles
    console.log('\n📰 Step 2: Retrieving diverse articles...');
    const articles = await retrieveArticles(testHeadline, entities);
    console.log(`✅ Retrieved ${articles.length} articles:`);
    articles.forEach((article, idx) => {
      console.log(`   ${idx + 1}. ${article.domain}`);
      console.log(`      ${article.url}`);
    });

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Pipeline Test Complete!\n');
    console.log('📊 Results:');
    console.log(`   - Headline: "${testHeadline}"`);
    console.log(`   - Entities: ${entities.length} found`);
    console.log(`   - Articles: ${articles.length} retrieved`);
    console.log(`   - Outlets: ${articles.map(a => a.domain).join(', ')}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testAnalyzeNews();
