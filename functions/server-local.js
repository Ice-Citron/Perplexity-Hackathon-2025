require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Perplexity = require('@perplexity-ai/perplexity_ai');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

// Initialize Perplexity client
function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }
  return new Perplexity({ apiKey });
}

// Helper functions (copied from index.js)
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
  const query = `${headline} ${entities.slice(0, 3).join(' ')} news coverage multiple outlets`;

  const completion = await client.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: 'Find diverse news coverage of this story from multiple mainstream outlets. List 6-10 different news sources with their coverage. Provide citations.'
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

  const articles = citations.slice(0, 10).map((url, idx) => {
    try {
      return {
        url,
        domain: new URL(url).hostname.replace('www.', ''),
        title: `Article from ${new URL(url).hostname}`,
        snippet: content.substring(idx * 150, (idx + 1) * 150),
        fetchedAt: new Date().toISOString()
      };
    } catch (e) {
      return null;
    }
  }).filter(a => a !== null);

  return articles.slice(0, 6);
}

// POST /analyzeNews
app.post('/analyzeNews', async (req, res) => {
  try {
    console.log('📥 Request received:', req.body);
    const { input, type } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input (URL or headline) required' });
    }

    const startTime = Date.now();

    // Step 1: Extract entities
    console.log('📍 Extracting entities...');
    const headline = input;
    const entities = await extractEntities(headline);
    console.log('✅ Entities:', entities);

    // Step 2: Retrieve articles
    console.log('📰 Retrieving articles...');
    const articles = await retrieveArticles(headline, entities);
    console.log(`✅ Retrieved ${articles.length} articles`);

    // Mock response matching your frontend structure
    const response = {
      analysisId: 'local-' + Date.now(),
      headline,
      entities,
      sources: articles.map(a => ({
        domain: a.domain,
        region: 'Unknown',
        leaning: 'center'
      })),
      consensus: [],
      disputed: [],
      missing: [],
      meta: {
        latency: Date.now() - startTime,
        articleCount: articles.length,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Analysis complete');
    res.json(response);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Local development server running on http://localhost:${PORT}`);
  console.log(`✅ Perplexity API configured`);
  console.log(`\n📝 Test with: curl -X POST http://localhost:${PORT}/analyzeNews -H "Content-Type: application/json" -d '{"input":"OpenAI launches GPT-5","type":"headline"}'\n`);
});
