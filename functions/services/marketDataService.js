const admin = require('firebase-admin');

// Financial Modeling Prep API configuration
const FMP_API_KEY = process.env.FMP_API_KEY || 'tJ4eSNpug1h96xdAPVKNDO5xy75MMJAS';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Cache configuration
const CACHE_TTL_ACTIVE = 60 * 1000; // 1 minute for active users
const CACHE_TTL_SCHEDULED = 60 * 60 * 1000; // 1 hour for scheduled updates

// Market symbols to track
const MARKET_SYMBOLS = {
  indices: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^IXIC', name: 'Nasdaq' },
    { symbol: '^FTSE', name: 'FTSE 100' }
  ],
  commodities: [
    { symbol: 'GCUSD', name: 'Gold' },
    { symbol: 'CLUSD', name: 'Crude Oil' }
  ],
  forex: [
    { symbol: 'EURUSD', name: 'Euro' },
    { symbol: 'GBPUSD', name: 'GBP/USD' }
  ],
  bonds: [
    { symbol: '^TNX', name: 'US 10 Yr' }
  ]
};

/**
 * Fetch market data from Financial Modeling Prep API
 */
async function fetchMarketDataFromAPI() {
  try {
    console.log('Fetching market data from FMP API...');

    // Collect all symbols
    const allSymbols = [
      ...MARKET_SYMBOLS.indices,
      ...MARKET_SYMBOLS.commodities,
      ...MARKET_SYMBOLS.forex,
      ...MARKET_SYMBOLS.bonds
    ];

    const symbolList = allSymbols.map(s => s.symbol).join(',');

    // Fetch quote data for all symbols
    const url = `${FMP_BASE_URL}/quote/${symbolList}?apikey=${FMP_API_KEY}`;
    console.log('Fetching from:', url.replace(FMP_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }

    const quotes = await response.json();
    console.log(`Received ${quotes.length} market quotes`);

    // Transform to our format
    const marketData = quotes.map(quote => {
      const symbolInfo = allSymbols.find(s => s.symbol === quote.symbol);
      const change = quote.changesPercentage || 0;

      return {
        symbol: symbolInfo?.name || quote.symbol,
        value: formatValue(quote.price, quote.symbol),
        change: formatChange(change),
        positive: change > 0.01 ? true : (change < -0.01 ? false : null),
        rawPrice: quote.price,
        rawChange: change,
        timestamp: Date.now()
      };
    });

    return marketData;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}

/**
 * Format price value based on symbol type
 */
function formatValue(price, symbol) {
  if (!price && price !== 0) return 'N/A';

  // Forex typically shows more decimal places
  if (symbol.includes('USD') && !symbol.startsWith('^')) {
    return price.toFixed(4);
  }

  // Indices and others
  if (price > 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return price.toFixed(2);
}

/**
 * Format change percentage
 */
function formatChange(change) {
  if (!change && change !== 0) return '0.00%';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Get cached market data from Firestore
 */
async function getCachedMarketData() {
  try {
    const db = admin.firestore();
    const cacheDoc = await db.collection('marketData').doc('latest').get();

    if (!cacheDoc.exists) {
      console.log('No cached market data found');
      return null;
    }

    const data = cacheDoc.data();
    const age = Date.now() - data.timestamp;

    console.log(`Cached data age: ${Math.round(age / 1000)}s`);

    return {
      data: data.data,
      timestamp: data.timestamp,
      age
    };
  } catch (error) {
    console.error('Error getting cached market data:', error);
    return null;
  }
}

/**
 * Save market data to Firestore cache
 */
async function saveCachedMarketData(marketData) {
  try {
    const db = admin.firestore();
    await db.collection('marketData').doc('latest').set({
      data: marketData,
      timestamp: Date.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Market data cached successfully');
  } catch (error) {
    console.error('Error saving cached market data:', error);
  }
}

/**
 * Get market data with intelligent caching
 * @param {boolean} isScheduled - Whether this is a scheduled update (vs user-triggered)
 */
async function getMarketData(isScheduled = false) {
  try {
    // Check cache first
    const cached = await getCachedMarketData();

    // Determine if cache is fresh enough
    const cacheTTL = isScheduled ? CACHE_TTL_SCHEDULED : CACHE_TTL_ACTIVE;

    if (cached && cached.age < cacheTTL) {
      console.log(`Using cached data (age: ${Math.round(cached.age / 1000)}s, TTL: ${cacheTTL / 1000}s)`);
      return cached.data;
    }

    // Cache miss or stale - fetch fresh data
    console.log('Cache miss or stale, fetching fresh data...');
    const freshData = await fetchMarketDataFromAPI();

    // Save to cache
    await saveCachedMarketData(freshData);

    return freshData;
  } catch (error) {
    console.error('Error getting market data:', error);

    // If API fails but we have cached data, return it even if stale
    const cached = await getCachedMarketData();
    if (cached) {
      console.log('API failed, returning stale cached data');
      return cached.data;
    }

    throw error;
  }
}

module.exports = {
  getMarketData,
  fetchMarketDataFromAPI,
  getCachedMarketData,
  saveCachedMarketData
};
