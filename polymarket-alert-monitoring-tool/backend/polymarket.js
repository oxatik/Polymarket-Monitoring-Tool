const axios = require("axios");

// Correct base: Gamma API (not CLOB API) for market discovery
const GAMMA_BASE = "https://gamma-api.polymarket.com";

// Normalize raw Gamma event+market into our clean shape
function normalize(event, market) {
  let yesPrice = null;
  let noPrice = null;

  try {
    // outcomePrices is a JSON string like "[\"0.72\",\"0.28\"]"
    const prices = JSON.parse(market.outcomePrices || "[]");
    yesPrice = prices[0] != null ? parseFloat(prices[0]) : null;
    noPrice  = prices[1] != null ? parseFloat(prices[1]) : null;
  } catch {
    // Some markets have no price data yet — safe to skip
  }

  return {
    id:          market.id,
    conditionId: market.conditionId || null,
    question:    market.question,
    slug:        event.slug || null,
    eventTitle:  event.title || null,
    yesPrice,
    noPrice,
    volume:      market.volume    ? parseFloat(market.volume)    : 0,
    volume24hr:  event.volume24hr ? parseFloat(event.volume24hr) : 0,
    liquidity:   market.liquidity ? parseFloat(market.liquidity) : 0,
    active:      market.active,
    closed:      market.closed,
    endDate:     market.endDate   || null,
    startDate:   market.startDate || null,
    url:         event.slug
                   ? `https://polymarket.com/event/${event.slug}`
                   : "https://polymarket.com",
    image:       event.image || null,
    tags:        (event.tags || []).map((t) => t.label || t.id),
  };
}

/**
 * Fetch top active markets ordered by 24h volume.
 * Uses events endpoint — events contain their child markets,
 * reducing total API calls needed.
 */
async function fetchMarkets({ limit = 100, offset = 0 } = {}) {
  const res = await axios.get(`${GAMMA_BASE}/events`, {
    params: {
      active:    true,
      closed:    false,
      order:     "volume_24hr",
      ascending: false,
      limit,
      offset,
    },
    timeout: 10_000,
  });

  // Gamma events endpoint returns a plain array
  const events = Array.isArray(res.data) ? res.data : [];

  const markets = [];
  for (const event of events) {
    for (const market of event.markets || []) {
      if (market.active && !market.closed) {
        markets.push(normalize(event, market));
      }
    }
  }

  return markets;
}

module.exports = { fetchMarkets };
