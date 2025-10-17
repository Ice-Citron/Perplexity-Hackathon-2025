import React, { useState } from 'react';

function ClaimCard({ claim }) {
  const [expanded, setExpanded] = useState(false);

  const stanceColors = {
    supports: 'bg-green-100 text-green-800 border-green-300',
    refutes: 'bg-red-100 text-red-800 border-red-300',
    neutral: 'bg-gray-100 text-gray-700 border-gray-300',
    not_mentioned: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  };

  const stanceLabels = {
    supports: '✓ Supports',
    refutes: '✗ Refutes',
    neutral: '○ Neutral',
    not_mentioned: '— Not Mentioned'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Claim Text */}
      <div className="mb-3">
        <p className="text-gray-900 font-medium">{claim.text}</p>
      </div>

      {/* Stance Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {claim.stances
          .filter(s => s.stance !== 'not_mentioned')
          .map((stance, idx) => (
            <div
              key={idx}
              className={`px-2 py-1 text-xs rounded border ${stanceColors[stance.stance]}`}
            >
              {stance.outlet.replace('.com', '')} {stanceLabels[stance.stance]}
            </div>
          ))}
      </div>

      {/* Show Quotes Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {expanded ? '▼ Hide quotes' : '▶ Show quotes'}
      </button>

      {/* Expanded Quotes */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
          {claim.stances
            .filter(s => s.quote)
            .map((stance, idx) => (
              <div key={idx} className="bg-gray-50 rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900">
                    {stance.outlet}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${stanceColors[stance.stance]}`}>
                    {stanceLabels[stance.stance]}
                  </span>
                </div>
                <p className="text-sm text-gray-700 italic mb-2">
                  "{stance.quote}"
                </p>
                <a
                  href={stance.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View source →
                </a>
              </div>
            ))}
        </div>
      )}

      {/* Framing Indicators */}
      {(claim.framing.hedges.length > 0 || claim.framing.loaded_terms.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Framing:</span>{' '}
            {claim.framing.hedges.length > 0 && (
              <span>Hedges: {claim.framing.hedges.join(', ')} • </span>
            )}
            {claim.framing.loaded_terms.length > 0 && (
              <span>Loaded: {claim.framing.loaded_terms.join(', ')}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default ClaimCard;
