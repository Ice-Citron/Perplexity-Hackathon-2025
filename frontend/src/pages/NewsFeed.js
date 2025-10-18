import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryNav from '../components/CategoryNav';
import NewsCard from '../components/NewsCard';
import MarketTicker from '../components/MarketTicker';
import AuthModal from '../components/AuthModal';
import UserProfileWidget from '../components/UserProfileWidget';
import { getArticles, generateArticle } from '../services/newsApi';
import { subscribeToAuthChanges } from '../services/authService';

function NewsFeed() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [topicInput, setTopicInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const loadArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const category = activeCategory === 'all' ? null : activeCategory;
      const data = await getArticles(category);
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArticle = async (e) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const article = await generateArticle(
        topicInput,
        activeCategory === 'all' ? 'General' : activeCategory
      );

      // Add to articles list
      setArticles([article, ...articles]);
      setTopicInput('');

      // Show success message
      alert('Research brief created successfully!');
    } catch (err) {
      setError('Failed to generate article: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleArticleClick = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              EduHub News
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Home
              </button>
              <UserProfileWidget
                user={currentUser}
                onSignInClick={() => setIsAuthModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode="signin"
      />

      {/* Category Navigation */}
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Market Ticker */}
      <MarketTicker />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Research Topic Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Research a Topic
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Get a balanced, source-backed brief on any current event or topic
          </p>
          <form onSubmit={handleGenerateArticle} className="flex gap-3">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="What would you like to research? (e.g., 'Latest AI developments')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={generating}
            />
            <button
              type="submit"
              disabled={generating || !topicInput.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Researching...
                </span>
              ) : (
                'Research'
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Powered by Perplexity AI • ~15 seconds • Multiple sources with political balance analysis
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading articles...</p>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No research briefs yet.</p>
            <p className="text-sm text-gray-400">
              Start researching a topic using the search bar above!
            </p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={handleArticleClick}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default NewsFeed;
