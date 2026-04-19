const express = require("express");
const router  = express.Router();
const cache   = require("./cache");    // flat — same folder

// GET /markets — all cached markets with optional filters
router.get("/", (req, res) => {
  const { limit = 50, offset = 0, minPrice, maxPrice } = req.query;
  let markets = cache.getMarkets();

  if (minPrice != null) markets = markets.filter((m) => m.yesPrice >= parseFloat(minPrice));
  if (maxPrice != null) markets = markets.filter((m) => m.yesPrice <= parseFloat(maxPrice));

  const page = markets.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    updatedAt: cache.getUpdatedAt(),
    total:     markets.length,
    count:     page.length,
    markets:   page,
  });
});

// GET /markets/stats — aggregate summary
router.get("/stats", (req, res) => {
  const markets = cache.getMarkets();

  res.json({
    ...cache.getStats(),
    totalVolume24hr:  markets.reduce((s, m) => s + (m.volume24hr || 0), 0),
    totalLiquidity:   markets.reduce((s, m) => s + (m.liquidity  || 0), 0),
    highProbMarkets:  markets.filter((m) => m.yesPrice != null && m.yesPrice >= 0.85).length,
  });
});

// GET /markets/:id — single market by ID
router.get("/:id", (req, res) => {
  const market = cache.getMarkets().find((m) => m.id === req.params.id);
  if (!market) return res.status(404).json({ error: "Market not found" });
  res.json(market);
});

module.exports = router;
