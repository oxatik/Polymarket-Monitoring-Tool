require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const cron       = require("node-cron");
const promClient = require("prom-client");

// All imports are flat — same folder
const { fetchMarkets }  = require("./polymarket");
const { checkAlerts, getAlertsFired } = require("./alerts");
const cache             = require("./cache");
const marketsRouter     = require("./markets");
const { apiLimiter }    = require("./rateLimit");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Prometheus ───────────────────────────────────────────────────────────────
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const marketsGauge = new promClient.Gauge({
  name: "polymarket_markets_cached",
  help: "Number of markets in cache",
  registers: [register],
});
const fetchErrors = new promClient.Counter({
  name: "polymarket_fetch_errors_total",
  help: "Total Polymarket API fetch errors",
  registers: [register],
});
const lastFetch = new promClient.Gauge({
  name: "polymarket_last_fetch_timestamp",
  help: "Unix timestamp of last successful fetch",
  registers: [register],
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:  process.env.FRONTEND_URL || "*",
  methods: ["GET"],
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  const stale = cache.isStale();
  res.status(stale ? 503 : 200).json({
    status: stale ? "degraded" : "ok",
    stale,
    ...cache.getStats(),
  });
});

app.get("/metrics", async (req, res) => {
  marketsGauge.set(cache.getMarkets().length);
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/markets", apiLimiter, marketsRouter);

// ─── Poll Loop ────────────────────────────────────────────────────────────────
async function poll() {
  const ts = new Date().toISOString();
  console.log(`[${ts}] Polling Polymarket...`);

  try {
    const markets = await fetchMarkets({ limit: 100 });
    cache.setMarkets(markets);
    lastFetch.set(Date.now() / 1000);
    marketsGauge.set(markets.length);
    console.log(`[${ts}] Cached ${markets.length} markets`);
    await checkAlerts(markets);
  } catch (err) {
    cache.incrementErrors();
    fetchErrors.inc();
    console.error(`[${ts}] Poll error: ${err.message}`);
  }
}

// Fetch immediately on startup, then on cron schedule
poll();
cron.schedule(process.env.POLL_INTERVAL_CRON || "* * * * *", poll);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", () => { console.log("SIGTERM — shutting down"); process.exit(0); });
process.on("SIGINT",  () => { console.log("SIGINT  — shutting down"); process.exit(0); });

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Backend running on port ${PORT}`);
  console.log(`    /health   — service status`);
  console.log(`    /markets  — market data`);
  console.log(`    /metrics  — Prometheus metrics`);
});
