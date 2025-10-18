import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import UserProfileWidget from '../components/UserProfileWidget';
import { subscribeToAuthChanges } from '../services/authService';

function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const features = [
    {
      title: 'Balanced News',
      description: 'Get comprehensive, AI-curated news articles covering multiple perspectives on trending topics',
      buttonText: 'Read News',
      buttonAction: () => navigate('/news'),
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Knowledge Quizzes',
      description: 'Test your knowledge with AI-generated quizzes, compete on leaderboards, and share your scores',
      buttonText: 'Take Quiz',
      buttonAction: () => navigate('/quizzes'),
      gradient: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EduHub</h1>
              <p className="text-xs text-gray-600">Learn, Quiz, Compete</p>
            </div>
          </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Leaderboard
              </button>
              <UserProfileWidget
                user={currentUser}
                onSignInClick={() => setIsAuthModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Powered by Perplexity AI
            </span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Your AI-Powered Learning Hub
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with balanced news coverage and sharpen your knowledge with interactive quizzes.
            Learn, compete, and grow with EduHub.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`h-2 bg-gradient-to-r ${feature.gradient}`}></div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <button
                  onClick={feature.buttonAction}
                  className={`w-full py-3 px-6 bg-gradient-to-r ${feature.gradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity`}
                >
                  {feature.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Why Choose EduHub?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">AI-Generated Content</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">10+</div>
              <div className="text-gray-600">Quiz Topics</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">24/7</div>
              <div className="text-gray-600">Always Updated</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-16">
          <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Choose Your Topic</h4>
              <p className="text-blue-100 text-sm">
                Browse trending topics in news or quizzes
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">Learn & Engage</h4>
              <p className="text-blue-100 text-sm">
                Read balanced articles or take timed quizzes
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Track Progress</h4>
              <p className="text-blue-100 text-sm">
                Earn points, climb leaderboards, share achievements
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Learning?
          </h3>
          <p className="text-gray-600 mb-8">
            {currentUser ? (
              <>Welcome back, {currentUser.displayName}! Continue your learning journey.</>
            ) : (
              <>Sign in to track your progress and compete on the leaderboard.</>
            )}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/news')}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore News
            </button>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Take a Quiz
            </button>
            {!currentUser && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-8 py-3 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p className="mb-2">
              Powered by <span className="font-semibold">Perplexity AI</span> • Built for learning and growth
            </p>
            <p className="text-xs text-gray-500">
              © 2025 EduHub. All content generated with AI assistance.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode="signin"
      />
    </div>
  );
}

export default Home;
