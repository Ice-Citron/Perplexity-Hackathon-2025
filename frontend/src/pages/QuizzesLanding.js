import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function QuizzesLanding() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrendingTopics();
  }, []);

  const loadTrendingTopics = async () => {
    try {
      setLoading(true);
      console.log('[QuizzesLanding] Loading trending topics...');
      console.log('[QuizzesLanding] API_BASE_URL:', API_BASE_URL);
      console.log('[QuizzesLanding] Fetching:', `${API_BASE_URL}/api/quizzes/trending`);

      const response = await fetch(`${API_BASE_URL}/api/quizzes/trending`);
      console.log('[QuizzesLanding] Response status:', response.status);
      console.log('[QuizzesLanding] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QuizzesLanding] Error response:', errorText);
        throw new Error('Failed to load topics');
      }

      const data = await response.json();
      console.log('[QuizzesLanding] Received data:', data);
      console.log('[QuizzesLanding] Topics count:', data.topics?.length || 0);
      setTopics(data.topics || []);
    } catch (err) {
      console.error('[QuizzesLanding] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic) => {
    navigate(`/quizzes/${topic.id}`, { state: { topicName: topic.name } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
              <p className="mt-2 text-gray-600">Test your knowledge on trending topics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Leaderboard
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            How It Works
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Choose a trending topic below</li>
            <li>• Answer 5 questions with a 5-second timer each</li>
            <li>• Earn points and climb the leaderboard</li>
            <li>• Share your score with friends</li>
          </ul>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading quizzes...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Topics Grid */}
        {!loading && !error && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Trending Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  className="group bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {topic.name}
                    </h3>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {topic.popularity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    5 questions • 5 seconds each
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                      {topic.category}
                    </span>
                    <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizzesLanding;
