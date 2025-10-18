import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfileWidget from './UserProfileWidget';

function AppHeader({ user, onSignInClick }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="Really?"
                className="h-8 w-8 object-contain"
              />
              <span className="text-2xl font-bold text-gray-900">Really?</span>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/news')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                News
              </button>
              <button
                onClick={() => navigate('/quizzes')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Quiz
              </button>
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Leaderboard
              </button>
            </nav>
          </div>

          {/* User Profile / Sign In */}
          <UserProfileWidget
            user={user}
            onSignInClick={onSignInClick}
          />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
