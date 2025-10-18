import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AuthModal from '../components/AuthModal';
import { subscribeToAuthChanges } from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Leaderboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('alltime');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('[Leaderboard] Loading leaderboard...');
      console.log('[Leaderboard] Period:', period);
      console.log('[Leaderboard] API_BASE_URL:', API_BASE_URL);
      console.log('[Leaderboard] Fetching:', `${API_BASE_URL}/api/leaderboard?period=${period}`);

      const response = await fetch(`${API_BASE_URL}/api/leaderboard?period=${period}`);
      console.log('[Leaderboard] Response status:', response.status);
      console.log('[Leaderboard] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Leaderboard] Error response:', errorText);
        throw new Error('Failed to load leaderboard');
      }

      const data = await response.json();
      console.log('[Leaderboard] Received data:', data);
      console.log('[Leaderboard] Top users count:', data.top?.length || 0);

      setLeaderboard(data.top || []);
    } catch (err) {
      console.error('[Leaderboard] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-500' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-400' };
    if (rank === 3) return { emoji: '🥉', color: 'text-orange-600' };
    return { emoji: `#${rank}`, color: 'text-gray-600' };
  };

  const getPeriodLabel = (periodKey) => {
    const labels = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      alltime: 'All Time'
    };
    return labels[periodKey] || periodKey;
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#fff2dc'}}>
      {/* Header */}
      <AppHeader user={currentUser} onSignInClick={() => setIsAuthModalOpen(true)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode="signin"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top quiz performers across all topics</p>
        </div>

        {/* Period Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-2 mb-8 inline-flex">
          {['daily', 'weekly', 'monthly', 'alltime'].map((periodKey) => (
            <button
              key={periodKey}
              onClick={() => setPeriod(periodKey)}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                period === periodKey
                  ? 'bg-amber-700 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getPeriodLabel(periodKey)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading leaderboard...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && (
          <>
            {leaderboard.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Rankings Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to appear on the leaderboard!
                </p>
                <button
                  onClick={() => navigate('/quizzes')}
                  className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
                >
                  Take a Quiz
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Top 3 Podium (Desktop only) */}
                {leaderboard.length >= 3 && (
                  <div className="hidden md:block bg-amber-50 p-8">
                    <div className="flex items-end justify-center gap-4 max-w-3xl mx-auto">
                      {/* 2nd Place */}
                      <div className="flex-1 text-center">
                        <div className="bg-white rounded-lg p-6 shadow-md">
                          <div className="text-4xl mb-2">🥈</div>
                          {leaderboard[1].photoURL ? (
                            <img
                              src={leaderboard[1].photoURL}
                              alt={leaderboard[1].displayName}
                              className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-gray-300"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-300 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 border-4 border-gray-300">
                              {leaderboard[1].displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 truncate">
                            {leaderboard[1].displayName}
                          </h3>
                          <p className="text-2xl font-bold text-gray-600 mt-2">
                            {leaderboard[1].points}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>

                      {/* 1st Place */}
                      <div className="flex-1 text-center -mt-8">
                        <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-yellow-400">
                          <div className="text-5xl mb-2">🥇</div>
                          {leaderboard[0].photoURL ? (
                            <img
                              src={leaderboard[0].photoURL}
                              alt={leaderboard[0].displayName}
                              className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-yellow-400"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-yellow-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 border-4 border-yellow-400">
                              {leaderboard[0].displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-bold text-gray-900 truncate">
                            {leaderboard[0].displayName}
                          </h3>
                          <p className="text-3xl font-bold text-yellow-600 mt-2">
                            {leaderboard[0].points}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="flex-1 text-center">
                        <div className="bg-white rounded-lg p-6 shadow-md">
                          <div className="text-4xl mb-2">🥉</div>
                          {leaderboard[2].photoURL ? (
                            <img
                              src={leaderboard[2].photoURL}
                              alt={leaderboard[2].displayName}
                              className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-orange-400"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 border-4 border-orange-400">
                              {leaderboard[2].displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 truncate">
                            {leaderboard[2].displayName}
                          </h3>
                          <p className="text-2xl font-bold text-orange-600 mt-2">
                            {leaderboard[2].points}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Leaderboard List */}
                <div className="divide-y divide-gray-200">
                  {leaderboard.map((user, index) => {
                    const rank = index + 1;
                    const badge = getRankBadge(rank);

                    return (
                      <div
                        key={user.uid}
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                          rank <= 3 ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Rank */}
                        <div className={`flex-shrink-0 w-12 text-center font-bold text-2xl ${badge.color}`}>
                          {badge.emoji}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-amber-700 text-white flex items-center justify-center text-lg font-bold">
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-grow">
                          <h3 className="font-semibold text-gray-900">
                            {user.displayName}
                          </h3>
                          {user.lastScore !== undefined && (
                            <p className="text-sm text-gray-500">
                              Last score: {user.lastScore}
                            </p>
                          )}
                        </div>

                        {/* Points */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-2xl font-bold text-amber-700">
                            {user.points}
                          </div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA Section */}
        {!loading && leaderboard.length > 0 && (
          <div className="mt-12 bg-amber-700 rounded-2xl p-8 text-center text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-2">
              Want to climb the leaderboard?
            </h2>
            <p className="text-amber-100 mb-6">
              Take more quizzes and earn points to reach the top!
            </p>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-8 py-3 bg-white text-amber-800 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
            >
              Start a Quiz
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Leaderboard;
