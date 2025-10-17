import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import ClaimCard from './components/ClaimCard';
import OutletMatrix from './components/OutletMatrix';
import DiversityMeter from './components/DiversityMeter';
import CommandBar from './components/CommandBar';
import { mockStory } from './mockData';

function App() {
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [activeView, setActiveView] = useState('consensus'); // consensus | disputed | missing
  const [showCommandBar, setShowCommandBar] = useState(false);

  // Keyboard shortcut for command bar (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandBar(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandBar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAnalyze = async (input, type) => {
    setLoading(true);

    // Mock delay to simulate API call
    setTimeout(() => {
      setStory(mockStory);
      setLoading(false);
    }, 1500);
  };

  const handleReroll = () => {
    setLoading(true);
    setTimeout(() => {
      setStory(mockStory);
      setLoading(false);
    }, 1000);
  };

  const handleCommand = (command) => {
    console.log('Command:', command);
    // TODO: Process command
    setShowCommandBar(false);
  };

  const filteredClaims = story ?
    story.claims.filter(c => c.category === activeView) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">
              News Disagreement Lens
            </h1>
            <button
              onClick={() => setShowCommandBar(true)}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded-md"
            >
              ⌘K Command
            </button>
          </div>
          <SearchBar onAnalyze={handleAnalyze} loading={loading} onReroll={handleReroll} hasStory={!!story} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Analyzing coverage...</p>
            </div>
          </div>
        )}

        {story && !loading && (
          <div className="flex">
            {/* Main Panel - Three Column View */}
            <div className="flex-1 px-6 py-6">
              {/* Story Header */}
              <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {story.headline}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {story.entities.map((entity, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {entity}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {story.sources.length} outlets • Analyzed {new Date(story.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Tab Navigation */}
              <div className="mb-4 border-b border-gray-200">
                <nav className="flex gap-8">
                  <button
                    onClick={() => setActiveView('consensus')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'consensus'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Consensus ({story.claims.filter(c => c.category === 'consensus').length})
                  </button>
                  <button
                    onClick={() => setActiveView('disputed')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'disputed'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Disputed ({story.claims.filter(c => c.category === 'disputed').length})
                  </button>
                  <button
                    onClick={() => setActiveView('missing')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'missing'
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Missing ({story.claims.filter(c => c.category === 'missing').length})
                  </button>
                </nav>
              </div>

              {/* Claims Grid */}
              <div className="space-y-4">
                {filteredClaims.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No {activeView} claims found
                  </div>
                ) : (
                  filteredClaims.map((claim) => (
                    <ClaimCard key={claim.id} claim={claim} />
                  ))
                )}
              </div>
            </div>

            {/* Right Rail - Matrix & Diversity */}
            <div className="w-96 border-l border-gray-200 bg-white p-6 sticky top-20 h-screen overflow-y-auto">
              <DiversityMeter sources={story.sources} />
              <div className="mt-6">
                <OutletMatrix claims={story.claims} sources={story.sources} />
              </div>
            </div>
          </div>
        )}

        {!story && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Compare news coverage across outlets
              </h2>
              <p className="text-gray-600 mb-6">
                Enter a headline or article URL to see claim-level disagreements,
                consensus, and omissions with full citations.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Retrieves 6+ diverse outlets</p>
                <p>• Extracts atomic claims with quotes</p>
                <p>• Highlights stance and framing differences</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Command Bar Modal */}
      {showCommandBar && (
        <CommandBar
          onClose={() => setShowCommandBar(false)}
          onCommand={handleCommand}
          story={story}
        />
      )}
    </div>
  );
}

export default App;
