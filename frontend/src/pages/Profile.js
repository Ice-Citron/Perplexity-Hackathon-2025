import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AuthModal from '../components/AuthModal';
import { subscribeToAuthChanges } from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      if (user) {
        loadUserStats(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserStats = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoading(false);
    }
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
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your profile</p>
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
            <p className="mt-4 text-gray-600">Loading profile...</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">View and manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-amber-600 to-amber-800"></div>

          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="flex items-end -mt-16 mb-6">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-amber-700 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg">
                  {currentUser.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentUser.displayName || 'User'}
              </h2>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-700 mb-1">
                  {userStats?.points || 0}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>

              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-emerald-700 mb-1">
                  {userStats?.quizzesTaken || 0}
                </div>
                <div className="text-sm text-gray-600">Quizzes Taken</div>
              </div>

              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-700 mb-1">
                  {userStats?.averageScore || 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>

              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-emerald-700 mb-1">
                  {userStats?.streak || 0}
                </div>
                <div className="text-sm text-gray-600">Day Streak 🔥</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/quiz-history')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quiz History</h3>
                <p className="text-sm text-gray-600">View your past quiz attempts and scores</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
                🏆
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Leaderboard</h3>
                <p className="text-sm text-gray-600">See how you rank against others</p>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}

export default Profile;
