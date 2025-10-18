# News Disagreement Lens

**Claim-level comparison of how multiple outlets report the same story**

Live Link: https://perplexity-news-3aba4.web.app/

Built for Perplexity Hackathon 2025 - A news analysis tool that goes beyond simple aggregation to expose editorial choices, framing differences, and factual discrepancies across outlets.

## Problem

Readers often see one article and miss how other outlets frame the same event. Editors and researchers need fast, source-backed contrasts, not generic summaries.

## Solution

Paste a headline or URL. The app finds multi-outlet coverage, extracts key claims and quotes, aligns them across sources, and highlights consensus, disputes, and omissions with citations. **Every line links to evidence** - making analysis falsifiable and transparent.

## Why LLM-First?

Using the **Perplexity API** enables:
- Real-time retrieval with trusted citations
- Multi-step planning for query expansion and deduplication
- Targeted follow-ups to fill missing context
- Claim-level analysis (not just outlet-level like Ground News)
- Framing language detection and numerical discrepancy spotting

## Tech Stack

- **Frontend**: React + JavaScript + Tailwind CSS
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: Firestore (caching & audit logs)
- **API**: Perplexity AI (retrieval, extraction, stance tagging)
- **Hosting**: Firebase Hosting

## Features

### Core Analysis Pipeline

1. **Seed Extraction**: URL or headline → entities + time
2. **Diverse Retrieval**: 6-10 outlets (different regions, ideologies)
3. **Claim Extraction**: Atomic, checkable statements with numbers/dates
4. **Clustering**: Group near-duplicate claims
5. **Stance Tagging**: supports | refutes | neutral | not_mentioned
6. **Framing Analysis**: Hedges, modality, loaded terms
7. **Conflict Mapping**: Matrix view of outlet × claim stances

### UI/UX

#### Hybrid Layout
- **Primary**: Structured news page with three tabs (Consensus | Disputed | Missing)
- **Secondary**: Command bar (⌘K) for ad-hoc questions

#### Components
- **SearchBar**: Headline or URL input with re-roll sources
- **ClaimCard**: Expandable quotes with citation links
- **OutletMatrix**: Visual conflict map showing stance patterns
- **DiversityMeter**: Source coverage by region and political leaning
- **CommandBar**: Natural language actions:
  - "Why do outlets disagree on X?"
  - "Show only numeric discrepancies"
  - "Compare BBC vs WSJ"
  - "Export CSV/PNG"

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Perplexity API key

### Installation

```bash
# Clone repo
git clone <repo-url>
cd Perplexity-Hackathon-2025

# Install frontend dependencies
cd frontend
npm install

# Install function dependencies
cd ../functions
npm install
```

### Run Locally

```bash
# Frontend (with mock data)
cd frontend
npm start
# → http://localhost:3000

# Functions (requires Perplexity API key)
cd functions
export PERPLEXITY_API_KEY=your_key_here
firebase emulators:start
```

### Deploy

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Firebase
cd ..
firebase deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.js    # Input with headline/URL toggle
│   │   │   ├── ClaimCard.js    # Expandable claim with quotes
│   │   │   ├── OutletMatrix.js # Conflict visualization
│   │   │   ├── DiversityMeter.js # Source diversity metrics
│   │   │   └── CommandBar.js   # ⌘K natural language commands
│   │   ├── mockData.js         # Test data for development
│   │   ├── firebase.js         # Firebase configuration
│   │   └── App.js              # Main application
│   └── package.json
│
├── functions/                   # Cloud Functions
│   ├── index.js                # Main API logic
│   │   ├── analyzeNews()      # Primary endpoint
│   │   ├── extractSeed()      # Headline/URL parsing
│   │   ├── retrieveArticles() # Perplexity retrieval
│   │   ├── extractClaims()    # Claim extraction
│   │   ├── clusterClaims()    # Similarity grouping
│   │   ├── analyzeStances()   # Per-outlet stance tagging
│   │   └── categorizeClaims() # Consensus/Disputed/Missing
│   └── package.json
│
├── firebase.json               # Firebase configuration
├── firestore.rules            # Database security rules
├── firestore.indexes.json     # Database indexes
└── DEPLOYMENT.md              # Deployment guide
```

## Data Contracts

### Claim Object
```javascript
{
  "id": "c3",
  "canonical_text": "X said ceasefire talks will resume on DATE",
  "entities": ["X", "ceasefire"],
  "numbers": [{"value": 0, "unit": null}],
  "category": "consensus" | "disputed" | "missing",
  "stances": [
    {
      "outlet": "nytimes.com",
      "stance": "supports",
      "quote": "...",
      "url": "...",
      "confidence": 0.82
    }
  ],
  "framing": {
    "hedges": ["reportedly"],
    "modality": ["may"],
    "loaded_terms": []
  }
}
```

### Story Object
```javascript
{
  "id": "story-1",
  "headline": "...",
  "entities": ["...", "..."],
  "timestamp": "2025-01-17T...",
  "sources": [
    {
      "domain": "bbc.com",
      "region": "UK",
      "leaning": "center"
    }
  ],
  "claims": [...]
}
```

## API Endpoints

### `analyzeNews`
**POST** `/analyzeNews`

Request:
```json
{
  "input": "headline or URL",
  "type": "headline" | "url"
}
```

Response:
```json
{
  "analysisId": "...",
  "headline": "...",
  "entities": [...],
  "consensus": [...],
  "disputed": [...],
  "missing": [...],
  "meta": {
    "latency": 8500,
    "articleCount": 6,
    "timestamp": "..."
  }
}
```

## Quality Controls

- **Source diversity**: Max 1 per corporate group, include public broadcasters
- **Wire copy deduplication**: Similarity check on paragraphs and bylines
- **Citation fidelity**: Every UI sentence maps to ≥1 URL
- **Hallucination guard**: Never display claim without ≥1 quote + URL

## Metrics

- Coverage diversity (unique domains, regions)
- Claim support ratio & conflict count
- Latency p50/p95
- Breakage rate (claims without justifying quotes)

## MVP Scope (1-2 Days)

✅ URL/headline input
✅ Retrieve 6 diverse outlets
✅ Extract and cluster ≤10 claims
✅ Stance tagging with quotes
✅ Three-panel UI (Consensus | Disputed | Missing)
✅ Basic conflict matrix
✅ Diversity meter
✅ Command bar UI (⌘K)
✅ Firestore caching
✅ Mock data for testing

## Stretch Goals

- [ ] Command bar action implementation
- [ ] CSV/PNG export
- [ ] Timeline of claim evolution
- [ ] Bias sliders (region/ideology filters)
- [ ] Email/RSS alerts for high-disagreement stories
- [ ] Multilingual support

## Impact

- **Readers**: See where narratives diverge
- **Journalists**: Spot gaps and weak sourcing
- **Researchers**: Labeled data for media studies
- **Society**: Make disagreement explicit, fast, and verifiable

## Demo Flow

1. Open app → paste fresh headline
2. View consensus claims (all outlets agree)
3. Switch to disputed tab → see conflicting quotes
4. Open claim card → reveal per-outlet stances
5. Check conflict matrix → spot patterns
6. Press ⌘K → try natural language command
7. Export results (CSV/PNG)

## License

See [LICENSE](./LICENSE)

## Contributing

This is a hackathon project. For production use, consider:
- Rate limiting
- Enhanced caching
- Multi-language support
- Advanced framing analysis
- User authentication

## Acknowledgments

Built with Perplexity API for claim-level news analysis.
Inspired by Ground News but focused on claim granularity.
