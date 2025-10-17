const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Analyze news story from headline or URL
 */
export async function analyzeNews(input, type = 'headline') {
  try {
    const response = await fetch(`${API_BASE_URL}/analyzeNews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, type })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const data = await response.json();
    return transformAnalysisResponse(data);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Transform backend response to frontend format
 */
function transformAnalysisResponse(response) {
  const { consensus = [], disputed = [], missing = [], headline, entities, sources, meta } = response;

  // Flatten all claims with category
  const allClaims = [
    ...consensus.map(c => ({ ...transformClaim(c), category: 'consensus' })),
    ...disputed.map(c => ({ ...transformClaim(c), category: 'disputed' })),
    ...missing.map(c => ({ ...transformClaim(c), category: 'missing' }))
  ];

  return {
    id: response.analysisId || `story-${Date.now()}`,
    headline: headline || 'Analysis Result',
    entities: entities || [],
    timestamp: meta?.timestamp || new Date().toISOString(),
    sources: sources || [],
    claims: allClaims,
    meta
  };
}

/**
 * Transform individual claim from backend format
 */
function transformClaim(claim) {
  return {
    id: claim.claim_id || `claim-${Date.now()}`,
    text: claim.canonical_text || claim.text || '',
    entities: claim.entities || [],
    numbers: claim.numbers || [],
    framing: claim.framing || { hedges: [], modality: [], loaded_terms: [] },
    stances: (claim.outlets || claim.stances || []).map(outlet => ({
      outlet: outlet.domain || outlet.outlet || '',
      stance: outlet.stance || 'neutral',
      quote: outlet.quote || '',
      url: outlet.url || '',
      confidence: outlet.confidence || 0
    }))
  };
}

/**
 * Export claims to CSV
 */
export function exportToCSV(story) {
  const headers = ['Claim', 'Category', ...story.sources.map(s => s.domain)];
  const rows = [headers];

  for (const claim of story.claims) {
    const row = [
      `"${claim.text.replace(/"/g, '""')}"`,
      claim.category
    ];

    for (const source of story.sources) {
      const stance = claim.stances.find(s => s.outlet === source.domain);
      row.push(stance ? stance.stance : 'not_mentioned');
    }

    rows.push(row);
  }

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(story) {
  const csv = exportToCSV(story);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `news-analysis-${story.id || Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
