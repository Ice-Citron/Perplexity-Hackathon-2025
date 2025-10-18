import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import CoverageMeter from '../components/CoverageMeter';
import { getArticle } from '../services/newsApi';

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticle(id);
      setArticle(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Article not found'}</p>
          <button
            onClick={() => navigate('/news')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to News Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/news')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <span>←</span> Back to Feed
          </button>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Categories */}
        {article.categories && article.categories.length > 0 && (
          <div className="flex gap-2 mb-4">
            {article.categories.map((cat, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-6">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
          <span>{new Date(article.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
          <span>•</span>
          <span>{article.sources?.length || 0} sources</span>
        </div>

        {/* Coverage Meter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <CoverageMeter coverage={article.coverage} />
        </div>

        {/* Article Body with Images */}
        <article className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          {/* Additional Images Gallery */}
          {article.images && article.images.length > 0 && (
            <div className="mb-8 space-y-6">
              {article.images.map((image, idx) => (
                <figure key={idx} className="my-6">
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={image.url}
                      alt={image.alt || article.title}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        e.target.parentElement.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                  {image.caption && (
                    <figcaption className="mt-3 text-sm text-gray-600 italic text-center border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                      "{image.caption}"
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{article.summaryMd}</ReactMarkdown>
          </div>
        </article>

        {/* Sources */}
        {article.sources && article.sources.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Sources ({article.sources.length})
            </h2>
            <div className="space-y-3">
              {article.sources.map((source, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-gray-400 font-mono text-sm">
                    [{idx + 1}]
                  </span>
                  <div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {source.title}
                    </a>
                    <p className="text-xs text-gray-500 mt-1">
                      {new URL(source.url).hostname}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Take Quiz Button */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Test Your Knowledge
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Take a quiz based on this article to reinforce your learning
          </p>
          <button
            onClick={() => alert('Quiz feature coming soon!')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Start Quiz
          </button>
        </div>
      </main>
    </div>
  );
}

export default ArticleDetail;
