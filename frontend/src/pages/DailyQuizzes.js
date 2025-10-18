import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DailyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDailyQuizzes();
  }, []);

  const fetchDailyQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/quizzes/daily`);

      if (!response.ok) {
        throw new Error('Failed to fetch daily quizzes');
      }

      const data = await response.json();
      setQuizzes(data.quizzes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching daily quizzes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    'Technology & AI': 'from-blue-500 to-blue-600',
    'Robotics & Automation': 'from-purple-500 to-purple-600',
    'Climate & Green Tech': 'from-green-500 to-green-600',
    'International Conflicts & Wars': 'from-red-500 to-red-600',
    'Politics & Elections': 'from-indigo-500 to-indigo-600',
    'Economy & Markets': 'from-yellow-500 to-yellow-600',
    'Healthcare & Medicine': 'from-pink-500 to-pink-600',
    'Space & Science': 'from-cyan-500 to-cyan-600',
    'Cybersecurity': 'from-gray-700 to-gray-800',
    'Social Issues': 'from-orange-500 to-orange-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.jpg"
              alt="Really?"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Really?</h1>
              <p className="text-xs text-gray-600">Learn, Quiz, Compete</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Daily Viral Quizzes</h2>
          <p className="text-gray-600">Test your knowledge on today's trending news stories</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Error loading daily quizzes: {error}</p>
            <button
              onClick={fetchDailyQuizzes}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Daily Quizzes Yet</h3>
            <p className="text-gray-600">Check back soon for today's viral news quizzes!</p>
          </div>
        )}

        {!loading && !error && quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz, idx) => (
              <div
                key={quiz.id || idx}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => {
                  // Store quiz data and navigate to quiz runner
                  localStorage.setItem('currentDailyQuiz', JSON.stringify(quiz));
                  navigate(`/quizzes/daily/${quiz.id}`);
                }}
              >
                <div className={`h-2 bg-gradient-to-r ${categoryColors[quiz.category] || 'from-gray-500 to-gray-600'}`}></div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                      Viral Topic
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {quiz.topic}
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 bg-gradient-to-r ${categoryColors[quiz.category] || 'from-gray-500 to-gray-600'} text-white text-xs rounded-full font-semibold`}>
                      {quiz.category}
                    </span>
                  </div>

                  {quiz.context && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {quiz.context}
                    </p>
                  )}

                  {quiz.learningObjectives && quiz.learningObjectives.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">You'll learn:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {quiz.learningObjectives.slice(0, 2).map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span className="line-clamp-1">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      {quiz.questions?.length || 5} questions
                    </span>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                      Take Quiz
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DailyQuizzes;
