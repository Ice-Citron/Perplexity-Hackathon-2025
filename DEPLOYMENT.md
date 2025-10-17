# News Disagreement Lens - Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase CLI: `npm install -g firebase-tools`
- Perplexity API key

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Functions
cd ../functions
npm install
```

### 2. Configure Environment

Create `.env` file in `functions/` directory:

```
PERPLEXITY_API_KEY=your_api_key_here
```

### 3. Test Frontend Locally

```bash
cd frontend
npm start
# Opens on http://localhost:3000
```

The app will load with mock data to test the UI.

### 4. Test Functions Locally

```bash
cd functions
# Set environment variable
export PERPLEXITY_API_KEY=your_key_here

# Start Firebase emulator
firebase emulators:start
```

### 5. Deploy to Firebase

```bash
# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init

# Select:
# - Hosting
# - Functions
# - Firestore

# Build frontend
cd frontend
npm run build

# Deploy everything
cd ..
firebase deploy
```

### 6. Update Frontend API Endpoint

After deployment, update `frontend/src/App.js`:

```javascript
const functionUrl = 'https://us-central1-perplexity-news-3aba4.cloudfunctions.net/analyzeNews';
```

Then rebuild and redeploy:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## Project Structure

```
├── frontend/              # React app
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── mockData.js   # Test data
│   │   ├── firebase.js   # Firebase config
│   │   └── App.js        # Main app
│   └── package.json
│
├── functions/            # Cloud Functions
│   ├── index.js         # Main function logic
│   └── package.json
│
├── firebase.json        # Firebase config
├── firestore.rules      # Security rules
└── firestore.indexes.json
```

## Features Implemented

✅ Hybrid UI: Structured news page + command bar (⌘K)
✅ Three-column view: Consensus | Disputed | Missing
✅ ClaimCard with expandable quotes and citations
✅ OutletMatrix showing stance across outlets
✅ DiversityMeter showing source coverage
✅ CommandBar for natural language actions
✅ Perplexity API integration for:
  - Article retrieval
  - Claim extraction
  - Stance tagging
  - Entity recognition
✅ Firestore caching
✅ Mock data for rapid testing

## Next Steps

1. **Add Perplexity API Key** to Cloud Functions environment
2. **Test with Real Story**: Use a current headline
3. **Implement Command Bar Actions**:
   - "Why do outlets disagree on X?"
   - "Show only numeric discrepancies"
   - "Compare {outlet A} vs {outlet B}"
   - "Export CSV/PNG"

4. **Add Export Functionality**:
   - CSV download
   - PNG evidence card generation

5. **Performance Optimization**:
   - Add caching layer
   - Implement rate limiting
   - Add loading states

## Troubleshooting

### react-scripts not found
If you get `sh: react-scripts: command not found`, try:
```bash
rm -rf node_modules package-lock.json
npm install
npx react-scripts start
```

### Firebase deployment fails
Make sure you're logged in and have selected the correct project:
```bash
firebase login
firebase use perplexity-news-3aba4
```

### CORS errors
Update `functions/index.js` to allow your domain:
```javascript
const cors = require('cors')({
  origin: ['https://your-domain.web.app', 'http://localhost:3000']
});
```

## Environment Variables

### Cloud Functions
Set via Firebase CLI:
```bash
firebase functions:config:set perplexity.api_key="your_key_here"
```

### Frontend (Optional)
Create `.env` in `frontend/`:
```
REACT_APP_FUNCTION_URL=https://your-function-url
```

## Demo Script

1. Open the app
2. Enter a headline: "Tech Giant Announces Major AI Breakthrough"
3. Click "Analyze"
4. View consensus claims (all outlets agree)
5. Switch to "Disputed" tab (conflicting reports)
6. Click "Show quotes" on a claim
7. Open command bar (⌘K)
8. Try: "Compare BBC vs WSJ"
9. Export results

## Performance Targets

- First contentful paint: < 1.5s
- Perplexity API response: < 5s
- Total analysis time: < 10s
- Outlet diversity: 6+ sources
- Claim accuracy: Citations for 100% of claims

## Security Notes

- Firestore rules allow public read for analyses
- Rate limiting recommended for production
- Never expose Perplexity API key in frontend
- All API calls go through Cloud Functions

## Budget Estimates

- Firebase Hosting: Free tier sufficient
- Cloud Functions: ~$0.01-0.05 per analysis
- Firestore: Free tier (50K reads/day)
- Perplexity API: Check current pricing

## Support

For issues or questions:
- Check Firebase logs: `firebase functions:log`
- Review browser console for frontend errors
- Test API endpoints directly with curl/Postman
