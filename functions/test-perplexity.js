require('dotenv').config();
const Perplexity = require('@perplexity-ai/perplexity_ai');

async function testPerplexity() {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API key loaded');
  console.log('🔄 Testing Perplexity API...\n');

  try {
    const client = new Perplexity({ apiKey });

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Tell me about the latest developments in AI in one sentence",
        }
      ],
      model: "sonar",
    });

    console.log('✅ Perplexity API call successful!\n');
    console.log('Response:', completion.choices[0].message.content);

    if (completion.citations) {
      console.log('\nCitations:', completion.citations);
    }

  } catch (error) {
    console.error('❌ Error calling Perplexity API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testPerplexity();
