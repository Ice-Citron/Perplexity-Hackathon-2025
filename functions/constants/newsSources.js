/**
 * News sources categorized by political bias for claims/disagreement lens
 * These will be used as benchmarks when analyzing different perspectives
 */

const NEWS_SOURCES = {
  LEFT: [
    { name: 'MSNBC', url: 'msnbc.com', bias: 'left' },
    { name: 'The Guardian', url: 'theguardian.com', bias: 'left' },
    { name: 'Huffington Post', url: 'huffpost.com', bias: 'left' },
    { name: 'Vox', url: 'vox.com', bias: 'left' },
    { name: 'Slate', url: 'slate.com', bias: 'left' }
  ],
  CENTER: [
    { name: 'Reuters', url: 'reuters.com', bias: 'center' },
    { name: 'Associated Press', url: 'apnews.com', bias: 'center' },
    { name: 'BBC', url: 'bbc.com', bias: 'center' },
    { name: 'NPR', url: 'npr.org', bias: 'center' },
    { name: 'The Hill', url: 'thehill.com', bias: 'center' }
  ],
  RIGHT: [
    { name: 'Fox News', url: 'foxnews.com', bias: 'right' },
    { name: 'The Wall Street Journal', url: 'wsj.com', bias: 'right' },
    { name: 'National Review', url: 'nationalreview.com', bias: 'right' },
    { name: 'The Daily Wire', url: 'dailywire.com', bias: 'right' },
    { name: 'Breitbart', url: 'breitbart.com', bias: 'right' }
  ]
};

const ALL_SOURCES = [
  ...NEWS_SOURCES.LEFT,
  ...NEWS_SOURCES.CENTER,
  ...NEWS_SOURCES.RIGHT
];

/**
 * Quiz topic categories for daily quiz generation
 */
const QUIZ_CATEGORIES = [
  'Technology & AI',
  'Robotics & Automation',
  'Climate & Green Tech',
  'International Conflicts & Wars',
  'Politics & Elections',
  'Economy & Markets',
  'Healthcare & Medicine',
  'Space & Science',
  'Cybersecurity',
  'Social Issues'
];

module.exports = {
  NEWS_SOURCES,
  ALL_SOURCES,
  QUIZ_CATEGORIES
};
