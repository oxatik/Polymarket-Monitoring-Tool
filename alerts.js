const axios = require("axios");

// marketId → last alert timestamp (ms)
const cooldownMap = new Map();

const THRESHOLD = parseFloat(process.env.ALERT_PRICE_THRESHOLD || "0.85");
const COOLDOWN_MS = parseInt(process.env.ALERT_COOLDOWN_MS || "3600000", 10); // 1 hour default
let alertsFired = 0;

/**
 * Check all markets and fire Discord alerts for high-probability markets.
 * Each market has an individual cooldown to prevent spam.
 */
async function checkAlerts(markets) {
  if (!process.env.DISCORD_WEBHOOK) return;

  const now = Date.now();

  for (const market of markets) {
    const { id, question, yesPrice, url, volume24hr } = market;

    // Skip if price data unavailable or below threshold
    if (yesPrice == null || yesPrice < THRESHOLD) continue;

    // Skip if within cooldown window
    const lastAlert = cooldownMap.get(id) || 0;
    if (now - lastAlert < COOLDOWN_MS) continue;

    // Fire alert
    cooldownMap.set(id, now);
    alertsFired += 1;

    const probability = (yesPrice * 100).toFixed(1);
    const vol = volume24hr > 0 ? `$${(volume24hr / 1000).toFixed(1)}k` : "N/A";

    const message = [
      `🚨 **High Probability Alert** (${probability}% YES)`,
      `**${question}**`,
      `24h Volume: ${vol}`,
      `🔗 ${url}`,
    ].join("\n");

    await sendDiscordMessage(message);
  }
}

async function sendDiscordMessage(content) {
  try {
    await axios.post(
      process.env.DISCORD_WEBHOOK,
      { content },
      { timeout: 5_000 }
    );
    console.log(`[alerts] Discord message sent`);
  } catch (err) {
    console.error(`[alerts] Discord error: ${err.message}`);
  }
}

function getAlertsFired() {
  return alertsFired;
}

function getCooldownSize() {
  return cooldownMap.size;
}

module.exports = { checkAlerts, getAlertsFired, getCooldownSize };
