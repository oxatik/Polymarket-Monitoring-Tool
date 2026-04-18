/**
 * Simple in-memory cache with TTL.
 * Data survives cron failures — stale data is served until next successful fetch.
 */

let store = {
  markets: [],
  updatedAt: null,
  fetchCount: 0,
  errorCount: 0,
};

function setMarkets(markets) {
  store.markets = markets;
  store.updatedAt = new Date().toISOString();
  store.fetchCount += 1;
}

function getMarkets() {
  return store.markets;
}

function getUpdatedAt() {
  return store.updatedAt;
}

function getStats() {
  return {
    count: store.markets.length,
    updatedAt: store.updatedAt,
    fetchCount: store.fetchCount,
    errorCount: store.errorCount,
  };
}

function incrementErrors() {
  store.errorCount += 1;
}

function isStale(maxAgeMs = 5 * 60 * 1000) {
  if (!store.updatedAt) return true;
  return Date.now() - new Date(store.updatedAt).getTime() > maxAgeMs;
}

module.exports = {
  setMarkets,
  getMarkets,
  getUpdatedAt,
  getStats,
  incrementErrors,
  isStale,
};
