import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Fallback data in case API fails
const FALLBACK_DATA = [
  { symbol: 'S&P 500', value: '6,664.01', change: '+0.53%', positive: true },
  { symbol: 'Nasdaq', value: '22,679.97', change: '+0.52%', positive: true },
  { symbol: 'US 10 Yr', value: '4.01', change: '0.00%', positive: null },
  { symbol: 'Crude Oil', value: '57.54', change: '+0.14%', positive: true },
  { symbol: 'FTSE 100', value: '9,354.57', change: '+0.86%', positive: true },
  { symbol: 'Gold', value: '4,213.30', change: '+2.12%', positive: true },
  { symbol: 'Euro', value: '1.17', change: '+0.27%', positive: true },
  { symbol: 'GBP/USD', value: '1.34', change: '+0.05%', positive: true }
];

function MarketTicker() {
  const [marketData, setMarketData] = useState(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // Fetch market data from API
  const fetchMarketData = async () => {
    try {
      const url = `${API_BASE_URL}/api/market-data`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const result = await response.json();
      setMarketData(result.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setIsLoading(false);
      // Keep using fallback data
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchMarketData();

    // Update every minute while user is on the page
    const interval = setInterval(() => {
      fetchMarketData();
    }, 60000); // 60 seconds

    return () => {
      clearInterval(interval);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-black overflow-hidden py-2">
      <div className="max-w-7xl mx-auto relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide px-4 gap-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {marketData.map((item, idx) => (
            <div 
              key={idx} 
              className="flex-shrink-0 bg-gray-900 rounded-md px-4 py-2 flex items-center gap-2.5"
            >
              <span className="text-sm font-medium text-white whitespace-nowrap">
                {item.symbol}
              </span>
              <span className="text-sm text-white font-medium">
                {item.value}
              </span>
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  item.positive === true
                    ? 'text-green-400'
                    : item.positive === false
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {item.positive === true && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 3l4 5H2z" />
                  </svg>
                )}
                {item.positive === false && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 9L2 4h8z" />
                  </svg>
                )}
                {item.change}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="bg-gray-800 border border-gray-700 rounded p-1.5 hover:bg-gray-700 transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="bg-gray-800 border border-gray-700 rounded p-1.5 hover:bg-gray-700 transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MarketTicker;