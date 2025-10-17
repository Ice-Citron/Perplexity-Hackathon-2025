import React from 'react';

function OutletMatrix({ claims, sources }) {
  // Create matrix: rows = claims (top 5), cols = outlets
  const topClaims = claims.slice(0, 5);

  const getStanceSymbol = (stance) => {
    switch (stance) {
      case 'supports': return '✓';
      case 'refutes': return '✗';
      case 'neutral': return '○';
      case 'not_mentioned': return '—';
      default: return '?';
    }
  };

  const getStanceColor = (stance) => {
    switch (stance) {
      case 'supports': return 'text-green-600';
      case 'refutes': return 'text-red-600';
      case 'neutral': return 'text-gray-500';
      case 'not_mentioned': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Conflict Map</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-2 font-medium text-gray-700 w-32">
                Claim
              </th>
              {sources.map((source, idx) => (
                <th key={idx} className="text-center py-2 px-1 font-medium text-gray-700">
                  <div className="transform -rotate-45 origin-left text-xs whitespace-nowrap">
                    {source.domain.replace('.com', '')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topClaims.map((claim, claimIdx) => (
              <tr key={claim.id} className="border-b border-gray-100">
                <td className="py-2 pr-2 text-gray-600">
                  <div className="truncate" title={claim.text}>
                    Claim {claimIdx + 1}
                  </div>
                </td>
                {sources.map((source, sourceIdx) => {
                  const stance = claim.stances.find(s => s.outlet === source.domain);
                  return (
                    <td key={sourceIdx} className="text-center py-2 px-1">
                      <span className={`font-bold ${stance ? getStanceColor(stance.stance) : 'text-gray-300'}`}>
                        {stance ? getStanceSymbol(stance.stance) : '?'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <div className="flex gap-3">
          <span><span className="text-green-600 font-bold">✓</span> Supports</span>
          <span><span className="text-red-600 font-bold">✗</span> Refutes</span>
          <span><span className="text-gray-500 font-bold">○</span> Neutral</span>
          <span><span className="text-yellow-600 font-bold">—</span> Missing</span>
        </div>
      </div>
    </div>
  );
}

export default OutletMatrix;
