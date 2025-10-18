# Really? - AI-Powered News & Quiz Platform

**Balanced news coverage, interactive learning, and critical thinking - powered by AI**

🔗 **Live Application:** https://perplexity-news-3aba4.web.app/

Built for **Perplexity Hackathon 2025 (London)** - A comprehensive platform that combines AI-powered news analysis, interactive knowledge quizzes, and gamified learning to help users understand current events from multiple perspectives.

---

## Table of Contents

- [Overview](#overview)
- [Problem & Solution](#problem--solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Data Contracts](#data-contracts)
- [Development](#development)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

**"Really?"** is an AI-first platform that tackles media bias and information literacy through three core pillars:

1. **Balanced News Analysis** - AI-generated articles with multi-source citations and political bias tracking
2. **Claims Disagreement Lens** - Claim-level comparison showing how different outlets report the same story
3. **Interactive Quizzes** - Gamified learning with leaderboards to test and improve news comprehension

The platform leverages **Perplexity AI** to provide real-time, citation-backed content that makes media bias transparent and verifiable.

---

## Problem & Solution

### The Problem

- **Media Silos**: Readers often see one article and miss how other outlets frame the same event
- **Hidden Bias**: Editorial choices, framing differences, and selective omissions go unnoticed
- **Passive Consumption**: News reading is passive; comprehension and retention are low
- **Trust Crisis**: Readers struggle to identify reliable sources and verify claims

### Our Solution

**Really?** provides:

✅ **AI-Generated Balanced Articles** - Research any topic and get a 400-600 word article citing 6-10 diverse sources across the political spectrum

✅ **Claims Analysis** - Paste a headline or URL to see how different outlets agree, disagree, or omit key facts - with direct citations

✅ **Interactive Quizzes** - Test your knowledge on trending topics with timed multiple-choice questions

✅ **Competitive Leaderboards** - Track your progress and compete with others (daily/weekly/monthly/all-time)

✅ **Breaking News Detection** - Automated hourly checks for significant breaking events

✅ **Market Integration** - Real-time financial data ticker for context-aware news

**Every claim links to evidence** - making analysis falsifiable, transparent, and verifiable.

---

## Key Features

### 1. AI-Powered News Articles

- **Smart Research**: Enter any topic via search bar, receive AI-generated balanced articles in ~15 seconds
- **Multi-Source Citations**: 6-10 diverse sources per article (left/center/right political spectrum)
- **Political Bias Visualization**: Coverage meter showing source distribution (e.g., L33% C34% R33%)
- **Category Navigation**: World, Politics, Tech, Business, Science, Health, Sports, Culture
- **Visual Enhancement**: 3 relevant images per article via Unsplash API
- **48-Hour TTL**: Fresh articles with automatic expiration

### 2. News Disagreement Lens

**Claim-level comparison** that goes beyond simple aggregation to expose editorial choices:

#### Core Analysis Pipeline

1. **Seed Extraction**: URL or headline → entities + time
2. **Diverse Retrieval**: 6-10 outlets from different regions and ideologies
3. **Claim Extraction**: Atomic, verifiable statements with numbers/dates
4. **Clustering**: Group near-duplicate claims across sources
5. **Stance Tagging**: Supports | Refutes | Neutral | Not Mentioned
6. **Framing Analysis**: Identify hedges, modality, loaded terms
7. **Conflict Mapping**: Matrix view of outlet × claim stances

#### UI Components

- **Three-Panel Layout**: Consensus | Disputed | Missing Claims
- **ClaimCard**: Expandable cards with direct quotes and source links
- **OutletMatrix**: Visual conflict map showing stance patterns
- **DiversityMeter**: Source coverage by region and political leaning
- **CommandBar (⌘K)**: Natural language actions:
  - "Why do outlets disagree on X?"
  - "Show only numeric discrepancies"
  - "Compare BBC vs WSJ"
  - "Export CSV/PNG" (planned)

### 3. Interactive Knowledge Quizzes

- **Topic Selection**: 10+ trending topics (AI & Tech, Climate Change, Space, Politics, etc.)
- **AI-Generated Questions**: 5 multiple-choice questions per quiz via Perplexity API
- **Timed Challenges**: 10 seconds per question with real-time countdown
- **Detailed Results**: Immediate feedback with explanations for each answer
- **Learning Resources**: Curated links and AI-generated summaries
- **Daily Quizzes**: Automatically generated at midnight UTC based on trending topics
- **Share Functionality**: Social media sharing for results

### 4. Gamification & Leaderboards

- **Points System**: 10 points per correct answer
- **Four Leaderboards**: Daily, Weekly, Monthly, All-Time
- **Top 100 Rankings**: Display names, photos, scores, and quiz counts
- **User Profiles**: Google Sign-In authentication with quiz history
- **Automated Resets**: Daily (midnight UTC), Weekly (Monday), Monthly (1st)

### 5. Breaking News Detection

- **Automated Monitoring**: Hourly scheduled checks via Cloud Functions
- **AI Filtering**: Identifies genuinely newsworthy events (not just viral stories)
- **Severity Levels**: Critical | High | Medium
- **2-Hour Freshness**: Only shows very recent breaking news
- **Auto-Article Generation**: Creates balanced articles for breaking events
- **Prominent Display**: Red banner on homepage with direct links

### 6. Market Data Integration

- **Real-Time Ticker**: Stock indices (S&P 500, Dow Jones, NASDAQ)
- **Cryptocurrency Prices**: Live crypto market data
- **Commodity Tracking**: Oil, gold, and other commodities
- **Hourly Updates**: Scheduled Cloud Function updates
- **1-Minute Cache**: For active users
- **Scrolling Display**: Integrated into homepage

---

## Tech Stack

### Frontend
- **React 19.2.0** - UI framework with hooks
- **React Router DOM 7.9.4** - Client-side routing (10 routes)
- **Tailwind CSS 3.4.18** - Utility-first styling
- **React Markdown** - Article rendering
- **Firebase SDK 12.4.0** - Authentication and client-side integration
- **Web Vitals** - Performance monitoring

### Backend
- **Node.js 18+** - Runtime environment
- **Firebase Cloud Functions v2** - Serverless compute
- **Express.js 4.21.2** - REST API framework
- **Perplexity AI SDK (@perplexity-ai/perplexity_ai 0.12.0)** - AI engine
- **Axios** - HTTP client
- **Cheerio** - HTML parsing
- **CORS** - Cross-origin support

### Database & Storage
- **Firestore** - NoSQL document database
  - Collections: `articles`, `quizSessions`, `quizResults`, `leaderboards`, `dailyQuizzes`, `breakingNews`, `marketData`, `summaries`, `users`

### External APIs
- **Perplexity AI API** - News research, quiz generation, claims analysis, breaking news detection
- **Unsplash API** - High-quality article images
- **Financial Market APIs** - Real-time market data

### DevOps & Tools
- **Firebase CLI** - Deployment and emulation
- **Git** - Version control
- **ESLint** - Code linting
- **Jest & React Testing Library** - Testing

---

## Quick Start

### Prerequisites

- **Node.js 18+**
- **npm** or **yarn**
- **Firebase CLI**: `npm install -g firebase-tools`
- **Perplexity API Key** - [Get one here](https://www.perplexity.ai/api)
- **Unsplash API Key** - [Get one here](https://unsplash.com/developers)

### Installation

```bash
# Clone repository
git clone https://github.com/Ice-Citron/Perplexity-Hackathon-2025.git
cd Perplexity-Hackathon-2025

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../functions
npm install
```

### Environment Setup

Create a `.env` file in the `functions/` directory:

```env
PERPLEXITY_API_KEY=your_perplexity_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

### Run Locally

#### Frontend (with mock data)
```bash
cd frontend
npm start
# → http://localhost:3000
```

#### Backend (Firebase Emulators)
```bash
cd functions
firebase emulators:start
# → Functions: http://localhost:5001
# → Firestore: http://localhost:8080
```

#### Full Stack (connected)
Update `frontend/src/firebase.js` to point to emulator endpoints, then run both commands above in separate terminals.

### Deploy to Production

```bash
# Build frontend
cd frontend
npm run build

# Deploy everything to Firebase
cd ..
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting
```

---

## Project Structure

```
Perplexity-Hackathon-2025/
├── frontend/                           # React SPA
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── AppHeader.js          # Navigation with auth
│   │   │   ├── SearchBar.js          # News search interface
│   │   │   ├── ClaimCard.js          # Expandable claim with quotes
│   │   │   ├── OutletMatrix.js       # Conflict visualization
│   │   │   ├── DiversityMeter.js     # Source diversity metrics
│   │   │   ├── CommandBar.js         # ⌘K natural language UI
│   │   │   ├── NewsCard.js           # Article card display
│   │   │   ├── CategoryNav.js        # Category filters
│   │   │   ├── MarketTicker.js       # Market data scrolling ticker
│   │   │   ├── BreakingNewsBanner.js # Breaking news alert
│   │   │   ├── AuthModal.js          # Sign-in modal
│   │   │   ├── ClaimsLens.js         # Claims comparison interface
│   │   │   ├── CoverageMeter.js      # Political bias visualization
│   │   │   └── UserProfileWidget.js  # User info display
│   │   ├── pages/                    # Route-based pages
│   │   │   ├── Home.js               # Landing page
│   │   │   ├── News.js               # News feed
│   │   │   ├── ArticleDetail.js      # Individual article with claims
│   │   │   ├── Quizzes.js            # Quiz topics landing
│   │   │   ├── DailyQuizzes.js       # Daily quiz page
│   │   │   ├── QuizRunner.js         # Quiz question interface
│   │   │   ├── QuizResults.js        # Results with explanations
│   │   │   ├── Leaderboard.js        # Rankings display
│   │   │   ├── Profile.js            # User profile
│   │   │   └── QuizHistory.js        # Personal quiz history
│   │   ├── services/                 # API client services
│   │   │   └── api.js                # Axios HTTP client
│   │   ├── firebase.js               # Firebase config
│   │   ├── mockData.js               # Development test data
│   │   └── App.js                    # Main routing & app shell
│   ├── public/                       # Static assets
│   ├── build/                        # Production build output
│   └── package.json
│
├── functions/                         # Firebase Cloud Functions
│   ├── services/                     # Business logic services
│   │   ├── articleGenerator.js       # Perplexity article generation
│   │   ├── claimsAnalyzer.js         # Cross-source claims analysis
│   │   ├── quizService.js            # Quiz generation & scoring
│   │   ├── breakingNewsDetector.js   # Real-time breaking news
│   │   ├── marketDataService.js      # Market data aggregation
│   │   ├── dailyQuizGenerator.js     # Automated daily quiz creation
│   │   └── perplexityClient.js       # Perplexity API wrapper
│   ├── constants/
│   │   └── newsSources.js            # Categorized news sources (L/C/R)
│   ├── index.js                      # Main API endpoints & schedulers
│   ├── package.json
│   └── .env                          # Environment variables (not committed)
│
├── firebase.json                      # Firebase configuration
├── firestore.rules                    # Database security rules
├── firestore.indexes.json             # Database indexing config
├── .gitignore
└── README.md
```

---

## API Reference

### Base URL
- **Production**: `https://us-central1-perplexity-news-3aba4.cloudfunctions.net`
- **Local**: `http://localhost:5001/perplexity-news-3aba4/us-central1`

### Endpoints

#### **Articles**

##### Generate Article
```http
POST /api/articles/generate
Content-Type: application/json

{
  "topic": "climate change policy",
  "category": "Science"
}
```

Response:
```json
{
  "id": "article-123",
  "topic": "climate change policy",
  "content": "...",
  "sources": [
    {
      "name": "BBC News",
      "url": "https://...",
      "political_leaning": "center",
      "credibility_score": 0.92
    }
  ],
  "coverage": {
    "left_percentage": 33,
    "center_percentage": 34,
    "right_percentage": 33
  },
  "images": [...],
  "created_at": "2025-01-18T12:00:00Z"
}
```

##### List Articles
```http
GET /api/articles?category=Tech&limit=20
```

##### Get Article
```http
GET /api/articles/:id
```

##### Get Claims Analysis
```http
GET /api/articles/:id/claims
```

Response:
```json
{
  "headline": "...",
  "entities": ["entity1", "entity2"],
  "consensus": [
    {
      "id": "c1",
      "canonical_text": "Claim text",
      "stances": [
        {
          "outlet": "nytimes.com",
          "stance": "supports",
          "quote": "Direct quote",
          "url": "https://...",
          "confidence": 0.92
        }
      ],
      "category": "consensus"
    }
  ],
  "disputed": [...],
  "missing": [...],
  "meta": {
    "article_count": 6,
    "diversity_score": 0.85
  }
}
```

#### **Quizzes**

##### Get Trending Topics
```http
GET /api/quizzes/trending
```

##### Generate Quiz
```http
POST /api/quizzes/generate
Content-Type: application/json

{
  "topic": "Artificial Intelligence",
  "difficulty": "medium"
}
```

##### Submit Quiz
```http
POST /api/quizzes/submit
Content-Type: application/json

{
  "sessionId": "session-123",
  "answers": [0, 2, 1, 3, 0],
  "userId": "user-123"
}
```

##### Get Daily Quizzes
```http
GET /api/quizzes/daily
```

#### **Leaderboards**

```http
GET /api/leaderboard?period=weekly&limit=100
```

Response:
```json
{
  "period": "weekly",
  "rankings": [
    {
      "rank": 1,
      "userId": "user-123",
      "displayName": "John Doe",
      "totalScore": 450,
      "quizzesTaken": 45,
      "photoURL": "https://..."
    }
  ],
  "updated_at": "2025-01-18T12:00:00Z"
}
```

#### **Breaking News**

```http
GET /api/breaking-news
```

#### **Market Data**

```http
GET /api/market-data
```

#### **Summaries**

```http
POST /api/summaries/generate
Content-Type: application/json

{
  "topic": "quantum computing",
  "max_length": 200
}
```

#### **Health Check**

```http
GET /health
```

---

## Data Contracts

### Claim Object

```javascript
{
  "id": "c3",
  "canonical_text": "X said ceasefire talks will resume on DATE",
  "entities": ["X", "ceasefire"],
  "numbers": [
    {
      "value": 0,
      "unit": null
    }
  ],
  "category": "consensus" | "disputed" | "missing",
  "stances": [
    {
      "outlet": "nytimes.com",
      "stance": "supports" | "refutes" | "neutral" | "not_mentioned",
      "quote": "Direct quote from article",
      "url": "https://nytimes.com/article",
      "confidence": 0.82
    }
  ],
  "framing": {
    "hedges": ["reportedly", "allegedly"],
    "modality": ["may", "could"],
    "loaded_terms": ["crisis", "threat"]
  }
}
```

### Article Object

```javascript
{
  "id": "article-123",
  "topic": "Climate change policy",
  "category": "Science",
  "content": "Markdown-formatted article content...",
  "sources": [
    {
      "name": "BBC News",
      "url": "https://bbc.com/article",
      "domain": "bbc.com",
      "political_leaning": "center" | "left" | "right",
      "region": "UK",
      "credibility_score": 0.92
    }
  ],
  "coverage": {
    "left_percentage": 33,
    "center_percentage": 34,
    "right_percentage": 33,
    "total_sources": 9
  },
  "images": [
    {
      "url": "https://images.unsplash.com/...",
      "alt": "Image description",
      "credit": "Photo by X on Unsplash"
    }
  ],
  "created_at": "2025-01-18T12:00:00Z",
  "expires_at": "2025-01-20T12:00:00Z"
}
```

### Quiz Object

```javascript
{
  "id": "quiz-123",
  "topic": "Artificial Intelligence",
  "difficulty": "medium",
  "questions": [
    {
      "id": "q1",
      "question": "What is machine learning?",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": 1,
      "explanation": "Detailed explanation...",
      "difficulty": "easy" | "medium" | "hard",
      "time_limit": 10
    }
  ],
  "created_at": "2025-01-18T12:00:00Z"
}
```

### Quiz Result Object

```javascript
{
  "id": "result-123",
  "userId": "user-123",
  "sessionId": "session-123",
  "topic": "Artificial Intelligence",
  "answers": [0, 2, 1, 3, 0],
  "correct_answers": [0, 1, 1, 3, 2],
  "score": 60,
  "total_points": 30,
  "time_taken": 45,
  "summary": "AI-generated performance summary",
  "learning_resources": [
    {
      "title": "Resource title",
      "url": "https://...",
      "type": "article" | "video" | "course"
    }
  ],
  "completed_at": "2025-01-18T12:00:00Z"
}
```

---

## Development

### Quality Controls

- **Source Diversity**: Max 1 source per corporate group, include public broadcasters
- **Wire Copy Deduplication**: Similarity checks on paragraphs and bylines
- **Citation Fidelity**: Every UI sentence maps to ≥1 URL
- **Hallucination Guard**: Never display claims without ≥1 quote + URL
- **Response Time**: Target <15 seconds for article generation
- **Cache Strategy**: 1-minute cache for market data, 48-hour TTL for articles

### Monitoring Metrics

- **Coverage Diversity**: Unique domains, regions, political leanings
- **Claim Support Ratio**: Claims with supporting quotes
- **Conflict Count**: Disputed claims per article
- **Latency**: p50/p95 response times
- **Breakage Rate**: Claims without justifying quotes
- **Quiz Completion Rate**: Started vs. completed quizzes
- **User Engagement**: Daily active users, quiz frequency

### Testing

```bash
# Frontend tests
cd frontend
npm test

# Run with coverage
npm test -- --coverage

# Backend tests
cd functions
npm test
```

### Scheduled Functions

The backend includes several Cloud Function schedulers:

1. **Market Data Updates** - `schedule.every(60).minutes()`
2. **Breaking News Detection** - `schedule.every(60).minutes()`
3. **Article Generation** - `schedule.every(12).hours()` (30 articles)
4. **Daily Quiz Generation** - `schedule.every().day().atHour(0)` (midnight UTC)
5. **Leaderboard Resets**:
   - Daily: `schedule.every().day().atHour(0)`
   - Weekly: `schedule.every().monday().atHour(0)`
   - Monthly: `schedule.every().month(1).atHour(0)`

### Database Security

See `firestore.rules` for complete security rules. Key policies:

- **Articles**: Public read, authenticated write
- **Quiz Results**: User can read/write own results only
- **Leaderboards**: Public read, system write only
- **Users**: User can read/write own profile only

---

## Deployment

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Google Sign-In)
3. Enable Firestore Database
4. Enable Cloud Functions
5. Enable Hosting

### Configure Firebase

```bash
firebase login
firebase use --add
# Select your project
```

### Set Environment Variables

```bash
firebase functions:config:set \
  perplexity.api_key="your_key" \
  unsplash.access_key="your_key"
```

### Deploy

```bash
# Full deployment
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Continuous Deployment

Consider setting up GitHub Actions for automatic deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
```

---

## Roadmap

### MVP ✅ (Completed)

- [x] URL/headline input for claims analysis
- [x] Multi-outlet retrieval (6+ sources)
- [x] Claim extraction & clustering
- [x] Stance tagging with quotes
- [x] Three-panel UI (Consensus/Disputed/Missing)
- [x] Conflict matrix visualization
- [x] Diversity meter
- [x] Command bar UI (⌘K)
- [x] Firestore caching
- [x] Mock data for testing
- [x] Quiz generation & leaderboards
- [x] Breaking news detection
- [x] Market ticker integration
- [x] User authentication
- [x] Daily quiz automation

### Stretch Goals 🎯 (In Progress)

- [ ] **Command Bar Actions** - Implement natural language commands
- [ ] **Export Functionality** - CSV/PNG export for claims analysis
- [ ] **Timeline View** - Track how claims evolve over time
- [ ] **Bias Sliders** - Filter by region/ideology preferences
- [ ] **Email/RSS Alerts** - Notifications for high-disagreement stories
- [ ] **Multilingual Support** - Non-English news analysis
- [ ] **Mobile Apps** - React Native iOS/Android apps
- [ ] **Browser Extension** - In-context claims analysis

### Future Enhancements 🚀

- [ ] **Video News Analysis** - Transcript extraction and claims comparison
- [ ] **Podcast Integration** - Audio news source analysis
- [ ] **Custom Quizzes** - User-generated quiz creation
- [ ] **Study Groups** - Collaborative quiz taking
- [ ] **Achievements & Badges** - Enhanced gamification
- [ ] **Advanced Analytics** - Personalized news comprehension insights
- [ ] **API Access** - Public API for third-party integrations
- [ ] **Fact-Check Integration** - Link to fact-checking databases

---

## Why LLM-First?

Using the **Perplexity API** as our AI engine enables:

✅ **Real-time retrieval** with trusted, verifiable citations
✅ **Multi-step planning** for query expansion and deduplication
✅ **Targeted follow-ups** to fill missing context
✅ **Claim-level analysis** (not just outlet-level like Ground News)
✅ **Framing language detection** and numerical discrepancy spotting
✅ **Dynamic quiz generation** based on current events
✅ **Breaking news identification** without manual curation

This approach makes the platform:
- **Self-sustaining**: Automated content generation via scheduled functions
- **Always current**: Real-time news analysis and quiz topics
- **Verifiable**: Every claim links back to source material
- **Scalable**: No manual content creation required

---

## Impact

### For Readers
- **See where narratives diverge** across political spectrum
- **Verify claims** with direct source citations
- **Learn actively** through gamified quizzes
- **Track progress** with personalized stats

### For Journalists
- **Spot coverage gaps** and weak sourcing
- **Compare editorial choices** across outlets
- **Identify framing differences** quickly
- **Access diverse perspectives** in one place

### For Researchers
- **Labeled data** for media studies
- **Systematic bias tracking** across sources
- **Claims evolution** over time (planned)
- **API access** for analysis (planned)

### For Society
- **Make disagreement explicit** and verifiable
- **Combat filter bubbles** with balanced coverage
- **Improve media literacy** through active learning
- **Promote critical thinking** about news sources

---

## Demo Flow

### News Analysis Flow
1. Open app → Enter topic or paste headline
2. View AI-generated balanced article with sources
3. Check political bias meter and coverage distribution
4. Click "Analyze Claims" to see disagreement lens
5. Browse consensus claims (all outlets agree)
6. Switch to disputed tab → see conflicting quotes
7. Open claim card → reveal per-outlet stances
8. Check conflict matrix → spot patterns
9. Press ⌘K → try natural language commands (planned)

### Quiz Flow
1. Browse trending quiz topics
2. Select topic or start daily quiz
3. Answer 5 timed multiple-choice questions
4. Review results with detailed explanations
5. Read AI-generated performance summary
6. Check learning resources
7. View leaderboard ranking
8. Share results on social media

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Contributing

This is a hackathon project currently in active development. Contributions are welcome!

### For Production Use, Consider:
- Rate limiting and API quotas
- Enhanced caching strategies
- Advanced framing analysis
- User data privacy compliance (GDPR, CCPA)
- Content moderation for user-generated quizzes
- A/B testing framework
- Performance monitoring (Sentry, LogRocket)
- SEO optimization

### How to Contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Acknowledgments

- Built with **Perplexity API** for claim-level news analysis and AI-powered content generation
- Inspired by **Ground News** but focused on claim granularity
- Images provided by **Unsplash API**
- Hosted on **Firebase/Google Cloud Platform**
- Developed for **Perplexity Hackathon 2025 (London)**

---

## Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Ice-Citron/Perplexity-Hackathon-2025/issues)
- **Live Demo**: https://perplexity-news-3aba4.web.app/

---

**Built with ❤️ for the Perplexity Hackathon 2025**

*Making news transparent, verifiable, and engaging - one claim at a time.*
