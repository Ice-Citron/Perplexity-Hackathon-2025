import React from 'react';

const CATEGORIES = [
  { id: 'all', name: 'All News' },
  { id: 'world', name: 'World' },
  { id: 'business', name: 'Business' },
  { id: 'tech', name: 'Tech' },
  { id: 'climate', name: 'Climate' },
  { id: 'science', name: 'Science' },
  { id: 'health', name: 'Health' },
  { id: 'politics', name: 'Politics' },
  { id: 'culture', name: 'Culture' },
  { id: 'education', name: 'Education' },
  { id: 'sports', name: 'Sports' }
];

function CategoryNav({ activeCategory, onCategoryChange }) {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex justify-center overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`
              flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${
                activeCategory === category.id
                  ? 'border-amber-700 text-amber-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryNav;
