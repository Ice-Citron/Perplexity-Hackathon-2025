import React, { useState, useEffect } from 'react';

const ClaimsLens = ({ articleId }) => {
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (articleId && expanded) {
      fetchClaims();
    }
  }, [articleId, expanded]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/articles/${articleId}/claims`);

      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }

      const data = await response.json();
      setClaims(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disagreementColors = {
    low: 'bg-green-50 border-green-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-red-50 border-red-200'
  };

  const disagreementBadge = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="mt-8 border-t-2 border-gray-200 pt-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Political Bias Lens</h3>
            <p className="text-sm text-gray-600">See how different outlets cover this story</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-purple-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error loading claims analysis: {error}</p>
            </div>
          )}

          {claims && !loading && (
            <>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-gray-700">Overall Disagreement:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${disagreementBadge[claims.overallDisagreement] || disagreementBadge.medium}`}>
                    {claims.overallDisagreement}
                  </span>
                </div>
                <p className="text-gray-700">{claims.summary}</p>
              </div>

              {claims.claims && claims.claims.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900">Key Claims & Perspectives</h4>
                  {claims.claims.map((claim, idx) => (
                    <div
                      key={idx}
                      className={`border-2 rounded-lg p-6 ${disagreementColors[claim.disagreementLevel] || disagreementColors.medium}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h5 className="font-bold text-gray-900 flex-1">{claim.claim}</h5>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ml-4 ${disagreementBadge[claim.disagreementLevel] || disagreementBadge.medium}`}>
                          {claim.disagreementLevel}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="font-semibold text-sm text-blue-900">Left-Leaning Sources</span>
                          </div>
                          <p className="text-gray-700 text-sm">{claim.leftPerspective}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border-l-4 border-gray-500">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            <span className="font-semibold text-sm text-gray-900">Center Sources</span>
                          </div>
                          <p className="text-gray-700 text-sm">{claim.centerPerspective}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="font-semibold text-sm text-red-900">Right-Leaning Sources</span>
                          </div>
                          <p className="text-gray-700 text-sm">{claim.rightPerspective}</p>
                        </div>
                      </div>

                      {claim.context && (
                        <div className="mt-4 p-3 bg-white rounded-lg">
                          <p className="text-xs text-gray-600 italic">{claim.context}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimsLens;
