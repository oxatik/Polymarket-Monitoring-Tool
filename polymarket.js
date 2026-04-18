const axios = require("axios");

const GAMMA_BASE = "https://gamma-api.polymarket.com";

// Normalize a raw event+market from Gamma API into our clean shape
function normalizeMarket(event, market) {
  let yesPrice = null;
  let noPrice = null;

  try {
    const prices = JSON.parse(market.outcomePrices || "[]");
    yesPrice = prices[0] != null ? parseFloat(prices[0]) : null;
    noPrice = prices[1] != null ? parseFloat(prices[1]) : null;
  } catch {
    // outcomePrices may be missing on some markets
  }

  return {
    id: market.id,
    conditionId: market.conditionId || null,
    question: market.question,
    slug: event.slug || null,
    eventTitle: event.title || null,
    yesPrice,
    noPrice,
    volume: market.volume ? parseFloat(market.volume) : 0,
    volume24hr: event.volume24hr ? parseFloat(event.volume24hr) : 0,
    liquidity: market.liquidity ? parseFloat(market.liquidity) : 0,
    active: market.active,
    closed: market.closed,
    endDate: market.endDate || null,
    startDate: market.startDate || null,
    url: event.slug
      ? `https://polymarket.com/event/${event.slug}`
      : "https://polymarket.com",
    image: event.image || null,
    tags: (event.tags || []).map((t) => t.label || t.id),
  };
}

/**
 * Fetch top active markets ordered by 24h volume.
 * Uses the Gamma events endpoint (events contain their child markets).
 * Handles pagination via offset.
 */
async function fetchMarkets({ limit = 100, offset = 0 } = {}) {
  const url = `${GAMMA_BASE}/events`;
  const params = {
    active: true,
    closed: false,
    order: "volume_24hr",
    ascending: false,
    limit,
    offset,
  };

  const res = await axios.get(url, { params, timeout: 10_000 });

  // Gamma events endpoint returns a plain array (not paginated wrapper)
  const events = Array.isArray(res.data) ? res.data : [];

  const markets = [];
  for (const event of events) {
    const childMarkets = Array.isArray(event.markets) ? event.markets : [];
    for (const market of childMarkets) {
      if (market.active && !market.closed) {
        markets.push(normalizeMarket(event, market));
      }
    }
  }

  return markets;
}

/**
 * Fetch a single event+markets by slug.
 */
async function fetchMarketBySlug(slug) {
  const res = await axios.get(`${GAMMA_BASE}/events`, {
    params: { slug },
    timeout: 10_000,
  });
  const events = Array.isArray(res.data) ? res.data : [];
  if (!events.length) return null;

  const event = events[0];
  const childMarkets = Array.isArray(event.markets) ? event.markets : [];
  return childMarkets.map((m) => normalizeMarket(event, m));
}

module.exports = { fetchMarkets, fetchMarketBySlug };
