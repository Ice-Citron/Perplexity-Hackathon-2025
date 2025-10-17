import React, { useState, useEffect, useRef } from 'react';

function CommandBar({ onClose, onCommand, story }) {
  const [input, setInput] = useState('');
  const [suggestions] = useState([
    'Why do outlets disagree on X?',
    'Show only numeric discrepancies',
    'Compare BBC vs WSJ',
    'Explain framing of "alleged"',
    'Export CSV',
    'Export PNG',
    'Summarize disputes'
  ]);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onCommand(suggestion);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-32 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xl">⌘</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command or question..."
              className="flex-1 text-lg outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ESC
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <div className="p-2 max-h-96 overflow-y-auto">
          {!story && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Analyze a story first to use commands
            </div>
          )}
          {story && suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded flex items-center gap-3"
            >
              <span className="text-gray-400">→</span>
              <span className="text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
          Natural language commands powered by Perplexity API
        </div>
      </div>
    </div>
  );
}

export default CommandBar;
