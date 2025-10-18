import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BreakingNewsBanner = () => {
  const [breakingNews, setBreakingNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBreakingNews();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBreakingNews = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/breaking-news`);
      const data = await response.json();

      if (data.hasBreakingNews && data.events && data.events.length > 0) {
        setBreakingNews(data);
      } else {
        setBreakingNews(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      setLoading(false);
    }
  };

  if (loading || !breakingNews || !breakingNews.hasBreakingNews) {
    return null;
  }

  const event = breakingNews.events[0]; // Show first breaking event

  const severityColors = {
    critical: 'from-red-600 to-red-700',
    high: 'from-red-500 to-red-600',
    medium: 'from-orange-500 to-orange-600'
  };

  const severityBorder = {
    critical: 'border-red-600',
    high: 'border-red-500',
    medium: 'border-orange-500'
  };

  return (
    <div className={`bg-gradient-to-r ${severityColors[event.severity] || severityColors.high} border-l-4 ${severityBorder[event.severity] || severityBorder.high} shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-white font-bold text-sm uppercase tracking-wider">
                Breaking News
              </span>
            </div>

            <div className="h-4 w-px bg-white/30"></div>

            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm md:text-base">
                {event.title}
              </h3>
              <p className="text-white/90 text-xs md:text-sm mt-0.5">
                {event.summary} • {event.timeframe}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/news')}
            className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-sm whitespace-nowrap"
          >
            Read More
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsBanner;
