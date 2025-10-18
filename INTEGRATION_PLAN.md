# Education Super-App Integration Plan

## Project Overview

**Name:** EduHub - Perplexity-Powered Learning Platform

**Vision:** Bloomberg-style news feed + interactive quizzes with streaks, leaderboards, and balanced, cited content.

---

## Architecture

### Tech Stack
- **Frontend:** React 19 + Tailwind CSS + Firebase Hosting
- **Backend:** Firebase Cloud Functions (Node 18+)
- **Database:** Firestore with TTL
- **Auth:** Firebase Auth (Google)
- **Scheduling:** Firebase Scheduled Functions (12h refresh)
- **AI:** Perplexity API (sonar, sonar-pro, sonar-deep-research)

---

## Core Features

### 1. News Feed (Bloomberg-style)
- **Categories:** World, Business, Tech, Climate, Science, Health, Politics, Culture, Education, Sports
- **Article Generation:** Perplexity creates balanced 400-600 word briefs with:
  - Title + summary (markdown)
  - Source citations with URLs
  - Coverage meter (Left/Center/Right %)
  - Related quiz link
- **Refresh:** Every 12 hours via scheduled function
- **TTL:** Articles expire after 48 hours
- **Watchlist:** Users can add custom topics (refresh on schedule)

### 2. Quizzes
**Two Types:**

**A) Knowledge Gap Quizzes (from politicalsuggestion)**
- 5 quantifiable questions with numerical answers
- SmartSlider input with format detection
- 5-second timer per question
- PKI Score: `100% - (Avg Relative Deviation × 100%)`
- Sources cited per question

**B) Multiple Choice Quizzes (from quiz folder)**
- 4-option MCQ format
- Generated from article content
- Explanation with sources after each answer
- Score out of 5

**Common Features:**
- Link to source articles
- Post-quiz analysis (Perplexity)
- Streak tracking
- Leaderboard integration

### 3. User Engagement
- **Authentication:** Google Sign-In
- **Profile:** Display name, photo, points, streak
- **Watchlist:** Custom topics with 48h TTL
- **History:** Past quiz runs
- **Leaderboard:** Daily, weekly rankings

---

## Firestore Schema

```
/articles/{articleId}
  title: string
  summaryMd: string
  categories: string[]
  sources: [{title, url}]
  coverage: {left: %, center: %, right: %}
  canonicalUrl: string
  topicId: string (reference)
  createdAt: timestamp
  expireAt: timestamp (TTL: 48h)
  quizId?: string (reference)

/topics/{topicId}
  name: string
  slug: string
  category: string
  isDefault: boolean (pre-seeded topics)
  createdAt: timestamp
  lastRefreshedAt: timestamp

/quizzes/{quizId}
  title: string
  type: "knowledge_gap" | "mcq"
  articleId?: string (reference)
  questions: [{
    // For knowledge_gap:
    question: string,
    category: string,
    actualValue: number,
    unit: string,
    displayFormat: string,
    sliderConfig: {...},
    sources: [{name, url}]

    // For mcq:
    question: string,
    options: [string, string, string, string],
    correctIndex: number,
    explanation: string
  }]
  sources: [{title, url}]
  createdAt: timestamp
  expireAt: timestamp (TTL: 48h)

/users/{uid}
  displayName: string
  photoURL: string
  streak: number
  points: number
  lastQuizDate: timestamp
  createdAt: timestamp

/users/{uid}/watchlist/{topicId}
  topicRef: reference
  addedAt: timestamp

/users/{uid}/quizRuns/{runId}
  quizRef: reference
  quizType: "knowledge_gap" | "mcq"
  score: number (PKI for knowledge_gap, 0-5 for mcq)
  answers: [{
    questionIndex: number,
    userAnswer: any,
    isCorrect?: boolean,
    relativeDeviation?: number,
    timeToAnswer: number
  }]
  startedAt: timestamp
  finishedAt: timestamp

/leaderboards/{period}  // "daily-2025-10-18", "weekly-2025-W42"
  topUsers: [{
    uid: string,
    displayName: string,
    photoURL: string,
    score: number,
    streak: number,
    quizzesCompleted: number
  }]
  generatedAt: timestamp
```

---

## Cloud Functions

### 1. Scheduled Functions

**`refreshDefaultTopics`** (runs every 12 hours)
```javascript
onSchedule("every 12 hours", async () => {
  const defaultTopics = await db.collection("topics")
    .where("isDefault", "==", true).get();

  for (const topic of defaultTopics) {
    const lastRefresh = topic.data().lastRefreshedAt?.toMillis() || 0;
    if (Date.now() - lastRefresh > 12 * 60 * 60 * 1000) {
      await generateBalancedArticle(topic.id);
      await topic.ref.update({ lastRefreshedAt: Timestamp.now() });
    }
  }
});
```

**`refreshUserWatchlist`** (runs every 12 hours)
```javascript
onSchedule("every 12 hours", async () => {
  const users = await db.collection("users").get();

  for (const user of users) {
    const watchlist = await db.collection(`users/${user.id}/watchlist`).get();
    for (const topic of watchlist) {
      await generateBalancedArticle(topic.data().topicRef.id);
    }
  }
});
```

**`updateLeaderboards`** (runs daily at midnight)
```javascript
onSchedule("every day 00:00", async () => {
  // Calculate daily leaderboard
  // Calculate weekly leaderboard (if Monday)
  // Store in /leaderboards/
});
```

### 2. Callable Functions

**`addWatchTopic`**
```javascript
onCall(async (request) => {
  const { uid } = request.auth;
  const { topicName } = request.data;

  // Create topic if doesn't exist
  // Add to user's watchlist
  // Generate article immediately
  // Return articleId
});
```

**`generateBalancedArticle`**
```javascript
async function generateBalancedArticle(topicId) {
  const topic = await db.doc(`topics/${topicId}`).get();

  // Call Perplexity with balanced brief prompt
  const result = await perplexity.chat.completions.create({
    model: "sonar-deep-research",
    messages: [{
      role: "user",
      content: `Write a balanced 400-600 word brief on: ${topic.name}.
      Use diverse sources (left, center, right; US and non-US).
      Return JSON: {
        "title": "...",
        "summaryMd": "...(markdown)...",
        "sources":[{"title":"...", "url":"..."}],
        "coverage":{"left":%, "center":%, "right":%},
        "categories":["Business","Tech",...]
      }`
    }]
  });

  // Parse and store article
  // Generate associated quiz
  // Return articleId
}
```

**`generateQuizFromArticle`**
```javascript
onCall(async (request) => {
  const { articleId, quizType } = request.data;

  if (quizType === "knowledge_gap") {
    // Use politicalsuggestion pattern
    // Generate 5 quantifiable questions
  } else {
    // Use quiz folder pattern
    // Generate 5 MCQ questions
  }

  // Store quiz with expireAt
  // Link to article
  // Return quizId
});
```

**`submitQuizResults`**
```javascript
onCall(async (request) => {
  const { uid } = request.auth;
  const { quizId, answers, timeData } = request.data;

  // Calculate score (PKI or MCQ score)
  // Update user streak
  // Update user points
  // Store quiz run
  // Generate post-quiz analysis
  // Return { score, analysis, streakUpdated }
});
```

---

## Frontend Routes

```
/ - Home (news feed with category filters)
/article/:articleId - Article detail page
/quiz/:quizId - Quiz taking page
/result/:runId - Quiz results with analysis
/leaderboard - Rankings
/profile - User profile + watchlist
/watchlist - Manage custom topics
```

---

## Integration Steps (Priority Order)

### Phase 1: Core News Feed (Days 1-2)
1. ✅ Set up Firebase Functions with Perplexity SDK
2. Create Firestore schema
3. Seed default topics (10 categories)
4. Build balanced article generator function
5. Create scheduled refresh function
6. Build news feed UI (Bloomberg-style)
7. Build article detail page with coverage meter

### Phase 2: Quiz System (Days 2-3)
8. Port politicalsuggestion quiz generator
9. Port quiz folder MCQ generator
10. Build SmartSlider component
11. Build quiz taking UI with timer
12. Implement PKI score calculation
13. Build results page with analysis

### Phase 3: User Engagement (Days 3-4)
14. Add Firebase Auth (Google)
15. Build user profile
16. Implement streak tracking
17. Build leaderboard calculation
18. Add watchlist management
19. Link quizzes to articles

### Phase 4: Polish & Deploy (Day 4)
20. Add loading states and error handling
21. Optimize Perplexity API calls
22. Add share functionality
23. Deploy to Firebase Hosting
24. Test end-to-end flow

---

## Cost Management

- **Cache Strategy:**
  - Articles cached 48h (TTL)
  - Quizzes cached 48h (TTL)
  - Scheduled refresh only (no on-demand for default topics)

- **Rate Limiting:**
  - Max 3 custom watchlist topics per user
  - Max 1 custom topic per day per user

- **Perplexity Usage:**
  - ~10 default topics × 2 refreshes/day = 20 article generations
  - ~100 users × 0.2 custom topics × 2 = 40 custom generations
  - ~50 quizzes/day generated
  - Total: ~110 API calls/day = ~3,300/month

---

## Next Actions

1. **Stop current servers** (news disagreement app no longer needed)
2. **Create Firestore schema** in Firebase console
3. **Refactor Cloud Functions** to new architecture
4. **Build new frontend** with news feed + quiz pages
5. **Test integration** end-to-end

---

## Files to Create/Modify

### Backend
- `functions/src/scheduled/refreshTopics.js`
- `functions/src/scheduled/updateLeaderboards.js`
- `functions/src/callable/addWatchTopic.js`
- `functions/src/callable/generateQuiz.js`
- `functions/src/callable/submitResults.js`
- `functions/src/services/perplexity.js`
- `functions/src/utils/pki-calculator.js`

### Frontend
- `frontend/src/pages/Home.js`
- `frontend/src/pages/Article.js`
- `frontend/src/pages/Quiz.js`
- `frontend/src/pages/Result.js`
- `frontend/src/pages/Leaderboard.js`
- `frontend/src/components/NewsCard.js`
- `frontend/src/components/CategoryFilter.js`
- `frontend/src/components/CoverageMeter.js`
- `frontend/src/components/SmartSlider.js`
- `frontend/src/components/QuizTimer.js`
- `frontend/src/services/api.js` (refactor)

Ready to start implementation?
