import React, { useState } from 'react';

function SearchBar({ onAnalyze, loading, onReroll, hasStory }) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState('headline');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onAnalyze(input.trim(), inputType);
    }
  };

  return (
    <div className="flex gap-3 items-end">
      {/* Input Type Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setInputType('headline')}
          className={`px-3 py-2 text-xs font-medium rounded ${
            inputType === 'headline'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Headline
        </button>
        <button
          type="button"
          onClick={() => setInputType('url')}
          className={`px-3 py-2 text-xs font-medium rounded ${
            inputType === 'url'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          URL
        </button>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            inputType === 'headline'
              ? 'Enter a news headline...'
              : 'Enter an article URL...'
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {/* Re-roll Button */}
      {hasStory && (
        <button
          onClick={onReroll}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
        >
          Re-roll Sources
        </button>
      )}
    </div>
  );
}

export default SearchBar;
