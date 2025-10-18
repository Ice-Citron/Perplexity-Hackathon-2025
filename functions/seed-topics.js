require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const DEFAULT_TOPICS = [
  { name: "World News", slug: "world", category: "World", icon: "🌍" },
  { name: "Business & Economy", slug: "business", category: "Business", icon: "💼" },
  { name: "Technology", slug: "tech", category: "Tech", icon: "💻" },
  { name: "Climate & Environment", slug: "climate", category: "Climate", icon: "🌱" },
  { name: "Science & Research", slug: "science", category: "Science", icon: "🔬" },
  { name: "Health & Medicine", slug: "health", category: "Health", icon: "🏥" },
  { name: "Politics & Government", slug: "politics", category: "Politics", icon: "🏛️" },
  { name: "Culture & Society", slug: "culture", category: "Culture", icon: "🎭" },
  { name: "Education", slug: "education", category: "Education", icon: "📚" },
  { name: "Sports", slug: "sports", category: "Sports", icon: "⚽" }
];

async function seedTopics() {
  console.log('🌱 Seeding default topics...\n');

  try {
    for (const topic of DEFAULT_TOPICS) {
      const topicRef = db.collection('topics').doc(topic.slug);

      await topicRef.set({
        name: topic.name,
        slug: topic.slug,
        category: topic.category,
        icon: topic.icon,
        isDefault: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastRefreshedAt: null
      });

      console.log(`✅ Created topic: ${topic.icon} ${topic.name}`);
    }

    console.log('\n🎉 Successfully seeded all topics!');
    console.log('\n📊 Next steps:');
    console.log('1. Run the article generator to create initial articles');
    console.log('2. Set up scheduled functions for 12h refresh');

  } catch (error) {
    console.error('❌ Error seeding topics:', error);
  } finally {
    process.exit(0);
  }
}

seedTopics();
