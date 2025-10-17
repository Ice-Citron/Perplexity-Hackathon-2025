import React, { useState } from 'react';

function InputForm({ onAnalyze, loading }) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState('headline');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onAnalyze(input.trim(), inputType);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="headline"
                checked={inputType === 'headline'}
                onChange={(e) => setInputType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Headline</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="url"
                checked={inputType === 'url'}
                onChange={(e) => setInputType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Article URL</span>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
            {inputType === 'headline' ? 'Enter headline' : 'Enter article URL'}
          </label>
          <input
            type="text"
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              inputType === 'headline'
                ? 'e.g., "Tech company announces major breakthrough"'
                : 'e.g., https://example.com/article'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Coverage'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>This tool will:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Find coverage from 6+ diverse news outlets</li>
          <li>Extract and compare key claims</li>
          <li>Show consensus, disputes, and omissions with citations</li>
        </ul>
      </div>
    </div>
  );
}

export default InputForm;
