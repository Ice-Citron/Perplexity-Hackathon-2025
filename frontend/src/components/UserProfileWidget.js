import React, { useState, useEffect, useRef } from 'react';
import { logOut } from '../services/authService';

function UserProfileWidget({ user, onSignInClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // If no user is signed in, show sign-in button
  if (!user) {
    return (
      <button
        onClick={onSignInClick}
        className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
      >
        Sign In
      </button>
    );
  }

  // User is signed in
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User avatar button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-9 h-9 rounded-full border-2 border-gray-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-amber-700 flex items-center justify-center text-white font-medium text-sm border-2 border-gray-200">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {user.displayName || user.email?.split('@')[0]}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.displayName || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {user.points !== undefined && (
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{user.points || 0} pts</span>
                </span>
                {user.streak !== undefined && user.streak > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-orange-500">🔥</span>
                    <span className="font-medium">{user.streak} day streak</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsDropdownOpen(false)}
            >
              My Profile
            </a>
            <a
              href="/quiz-history"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsDropdownOpen(false)}
            >
              Quiz History
            </a>
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileWidget;
