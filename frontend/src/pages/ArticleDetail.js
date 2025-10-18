import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import CoverageMeter from '../components/CoverageMeter';
import ClaimsLens from '../components/ClaimsLens';
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
          <div className="w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden mb-6">
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
          <div className="prose prose-lg max-w-none">
            {/* Split content into paragraphs and interleave with images */}
            {(() => {
              const paragraphs = article.summaryMd.split('\n\n');
              const images = article.images || [];
              const result = [];

              paragraphs.forEach((para, idx) => {
                // Add paragraph
                result.push(
                  <div key={`para-${idx}`}>
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 clear-both" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900 clear-both" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-5 mb-2 text-gray-900 clear-both" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-700" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-700 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 bg-blue-50 py-2" {...props} />,
                        code: ({node, inline, ...props}) => inline ?
                          <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} /> :
                          <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4" {...props} />,
                      }}
                    >
                      {para}
                    </ReactMarkdown>
                  </div>
                );

                // Insert image after every 2-3 paragraphs
                const imageIdx = Math.floor(idx / 2.5);
                if (images[imageIdx] && idx % 3 === 1) {
                  const image = images[imageIdx];
                  result.push(
                    <figure
                      key={`img-${imageIdx}`}
                      className={`my-6 ${
                        imageIdx % 2 === 0
                          ? 'md:w-[45%] md:float-left md:mr-6 md:mb-4'
                          : 'md:w-[45%] md:float-right md:ml-6 md:mb-4'
                      } w-full`}
                    >
                      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img
                          src={image.url}
                          alt={image.alt || article.title}
                          className="w-full h-auto object-cover"
                          onError={(e) => {
                            e.target.parentElement.parentElement.parentElement.style.display = 'none';
                          }}
                        />
                      </div>
                      {image.caption && (
                        <figcaption className="mt-2 text-xs text-gray-600 italic border-l-4 border-blue-500 pl-3 py-1 bg-blue-50">
                          "{image.caption}"
                        </figcaption>
                      )}
                    </figure>
                  );
                }
              });

              return result;
            })()}
          </div>

          <div className="clear-both"></div>
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

        {/* Claims Lens */}
        <ClaimsLens articleId={article.id} />

        {/* Take Quiz Button */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 text-center mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Test Your Knowledge
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Take a quiz based on this topic to reinforce your learning
          </p>
          <button
            onClick={() => navigate(`/quizzes`)}
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
