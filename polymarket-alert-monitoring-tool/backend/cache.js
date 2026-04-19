// In-memory cache — survives failed fetches, serves stale data until next success

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

// Returns true if last successful fetch was more than maxAgeMs ago
function isStale(maxAgeMs = 5 * 60 * 1000) {
  if (!store.updatedAt) return true;
  return Date.now() - new Date(store.updatedAt).getTime() > maxAgeMs;
}

module.exports = { setMarkets, getMarkets, getUpdatedAt, getStats, incrementErrors, isStale };
