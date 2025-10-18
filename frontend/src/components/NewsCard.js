import React from 'react';
import CoverageMeter from './CoverageMeter';

function NewsCard({ article, onClick }) {
  const preview = article.summaryMd?.substring(0, 200) + '...';
  const timeAgo = getTimeAgo(article.createdAt);

  return (
    <div
      onClick={() => onClick(article.id)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Image */}
      {article.imageUrl && (
        <div className="w-full h-48 bg-gray-100 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-5">
        {/* Categories */}
        {article.categories && article.categories.length > 0 && (
          <div className="flex gap-2 mb-3">
            {article.categories.slice(0, 2).map((cat, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
          {article.title}
        </h3>

        {/* Preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {preview}
        </p>

        {/* Coverage Meter */}
        <div className="mb-4">
          <CoverageMeter coverage={article.coverage} size="small" />
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            {article.sources?.length || 0} sources
          </span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default NewsCard;
