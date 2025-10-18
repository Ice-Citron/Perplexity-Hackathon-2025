import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import AppHeader from '../components/AppHeader';
import AuthModal from '../components/AuthModal';
import { subscribeToAuthChanges } from '../services/authService';
import { getArticles } from '../services/newsApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function QuizResults() {
  const { resultId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Try to get result from navigation state first, otherwise fetch from API
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!result && resultId) {
      // Fetch result from API if not in state
      fetchResult();
    }
  }, [resultId, result]);

  useEffect(() => {
    if (result?.topic) {
      // Fetch related articles based on quiz topic
      fetchRelatedArticles();
    }
  }, [result?.topic]);

  const fetchResult = async () => {
    try {
      // Note: This endpoint would need to be added to the backend
      const response = await fetch(`${API_BASE_URL}/api/quizzes/results/${resultId}`);
      if (!response.ok) {
        throw new Error('Failed to load results');
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async () => {
    try {
      const data = await getArticles();
      // Filter articles related to quiz topic by matching keywords
      const topicKeywords = result.topic.toLowerCase().split(' ');
      const related = data.articles.filter(article => {
        const articleText = `${article.title} ${article.summaryMd}`.toLowerCase();
        return topicKeywords.some(keyword => keyword.length > 3 && articleText.includes(keyword));
      }).slice(0, 3);
      setRelatedArticles(related);
    } catch (err) {
      console.error('Failed to fetch related articles:', err);
    }
  };

  const getScoreEmoji = (percentage) => {
    if (percentage === 100) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '💪';
    return '📚';
  };

  const getScoreMessage = (percentage) => {
    if (percentage === 100) return 'Perfect Score!';
    if (percentage >= 80) return 'Excellent!';
    if (percentage >= 60) return 'Good Job!';
    if (percentage >= 40) return 'Keep Learning!';
    return 'Nice Try!';
  };

  const handleShare = async (platform) => {
    const shareText = `I scored ${result.score}/${result.total} (${result.percentage}%) on the ${result.topic} quiz! Can you beat my score?`;
    const shareUrl = window.location.href;

    if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fff2dc'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fff2dc'}}>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Results not found'}</p>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scoreEmoji = getScoreEmoji(result.percentage);
  const scoreMessage = getScoreMessage(result.percentage);

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
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">{scoreEmoji}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{scoreMessage}</h2>
            <p className="text-gray-600">{result.topic}</p>
          </div>

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-amber-700 mb-2">
                {result.score}/{result.total}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-700 mb-2">
                {result.percentage}%
              </div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-4 mb-8">
            <div
              className="bg-amber-700 h-4 rounded-full transition-all duration-1000"
              style={{ width: `${result.percentage}%` }}
            ></div>
          </div>

          {/* Share Buttons */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Share Your Score
            </h3>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Share on Twitter
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {copySuccess ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Review Your Answers</h3>
          <div className="space-y-6">
            {result.results.map((item, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border-2 ${
                  item.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    item.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.isCorrect ? '✓' : '✗'}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Question {index + 1}
                    </h4>
                    {item.userAnswer !== null && (
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Your answer:</span>{' '}
                        {item.userAnswer !== null ? `Option ${String.fromCharCode(65 + item.userAnswer)}` : 'No answer'}
                      </p>
                    )}
                    {!item.isCorrect && (
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Correct answer:</span>{' '}
                        Option {String.fromCharCode(65 + item.correctAnswer)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 italic">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Section */}
        {result.summary && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Learn More</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="mb-3" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  a: ({node, ...props}) => <a className="text-amber-700 hover:text-amber-800 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
                }}
              >
                {result.summary}
              </ReactMarkdown>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Additional Resources</h4>
                <ul className="space-y-2">
                  {result.sources.map((source, idx) => (
                    <li key={idx}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-700 hover:text-amber-800 hover:underline text-sm"
                      >
                        {idx + 1}. {source.title || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📚 Learn More About This Topic
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Want to dive deeper? Check out these related news articles to expand your knowledge:
            </p>
            <div className="space-y-4">
              {relatedArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/article/${article.id}`)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {article.imageUrl && (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-grow">
                      <h4 className="font-semibold text-gray-900 group-hover:text-amber-700 mb-1">
                        {article.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {article.summaryMd?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{article.sources?.length || 0} sources</span>
                        {article.categories && article.categories.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{article.categories[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/quizzes')}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Another Quiz
          </button>
          <button
            onClick={() => navigate('/news')}
            className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse News
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-8 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Leaderboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default QuizResults;
