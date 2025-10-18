const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkArticles() {
  try {
    const snapshot = await db.collection('articles').orderBy('createdAt', 'desc').get();
    console.log('Total articles in Firestore:', snapshot.size);
    console.log('\nAll articles with timestamps:\n');

    snapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      const createdAt = new Date(data.createdAt);
      const now = new Date();
      const ageMinutes = Math.floor((now - createdAt) / 1000 / 60);
      console.log(`  ${i+1}. [${doc.id}]`);
      console.log(`     Title: ${data.title}`);
      console.log(`     Created: ${data.createdAt} (${ageMinutes} minutes ago)`);
      console.log(`     Topic: ${data.topicName || 'N/A'}`);
      console.log();
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkArticles();
