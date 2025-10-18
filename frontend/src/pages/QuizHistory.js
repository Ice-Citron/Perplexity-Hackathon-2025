import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AuthModal from '../components/AuthModal';
import { subscribeToAuthChanges } from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function QuizHistory() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      if (user) {
        loadQuizHistory(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadQuizHistory = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/quiz-history`);
      if (response.ok) {
        const data = await response.json();
        setQuizHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load quiz history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-700';
    if (percentage >= 60) return 'text-amber-700';
    return 'text-red-600';
  };

  const getScoreEmoji = (percentage) => {
    if (percentage === 100) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '💪';
    return '📚';
  };

  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#fff2dc'}}>
        <AppHeader user={currentUser} onSignInClick={() => setIsAuthModalOpen(true)} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          mode="signin"
        />
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your quiz history</p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
            >
              Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#fff2dc'}}>
        <AppHeader user={currentUser} onSignInClick={() => setIsAuthModalOpen(true)} />
        <main className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quiz history...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#fff2dc'}}>
      <AppHeader user={currentUser} onSignInClick={() => setIsAuthModalOpen(true)} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode="signin"
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz History</h1>
          <p className="text-gray-600">Track your progress and review past quiz attempts</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{quizHistory.length}</div>
                <div className="text-sm text-gray-600">Total Quizzes</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {quizHistory.length > 0
                    ? Math.round(
                        quizHistory.reduce((acc, q) => acc + q.percentage, 0) /
                          quizHistory.length
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                🎯
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {quizHistory.filter(q => q.percentage >= 80).length}
                </div>
                <div className="text-sm text-gray-600">High Scores (80%+)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz History List */}
        {quizHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Quiz History Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start taking quizzes to build your history!
            </p>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
            >
              Take a Quiz
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quizHistory.map((quiz, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getScoreEmoji(quiz.percentage)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {quiz.topic || 'Quiz'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {quiz.score}/{quiz.total}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${getScoreColor(quiz.percentage)}`}>
                          {quiz.percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(quiz.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {quiz.resultId && (
                          <button
                            onClick={() => navigate(`/quiz-results/${quiz.resultId}`)}
                            className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                          >
                            View Details →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {quizHistory.length > 0 && (
          <div className="mt-8 bg-emerald-700 rounded-2xl p-8 text-center text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-2">
              Ready for another challenge?
            </h2>
            <p className="text-emerald-100 mb-6">
              Keep learning and improve your scores!
            </p>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-8 py-3 bg-white text-emerald-800 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Take Another Quiz
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizHistory;
