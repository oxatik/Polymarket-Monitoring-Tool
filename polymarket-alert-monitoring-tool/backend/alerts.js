const axios = require("axios");

// Per-market cooldown: marketId → last alert timestamp (ms)
const cooldownMap = new Map();
let alertsFired = 0;

const THRESHOLD   = parseFloat(process.env.ALERT_PRICE_THRESHOLD || "0.85");
const COOLDOWN_MS = parseInt(process.env.ALERT_COOLDOWN_MS || "3600000", 10);

/**
 * Check all markets, fire Discord alert for any whose YES price
 * exceeds threshold AND whose cooldown has expired.
 */
async function checkAlerts(markets) {
  if (!process.env.DISCORD_WEBHOOK) return;

  const now = Date.now();

  for (const market of markets) {
    const { id, question, yesPrice, volume24hr, url } = market;

    if (yesPrice == null || yesPrice < THRESHOLD) continue;

    const lastAlert = cooldownMap.get(id) || 0;
    if (now - lastAlert < COOLDOWN_MS) continue;

    cooldownMap.set(id, now);
    alertsFired += 1;

    const pct = (yesPrice * 100).toFixed(1);
    const vol = volume24hr > 0
      ? `$${(volume24hr / 1000).toFixed(1)}k`
      : "N/A";

    await sendMessage(
      `🚨 **High Probability Alert** — ${pct}% YES\n` +
      `**${question}**\n` +
      `24h Volume: ${vol}\n` +
      `🔗 ${url}`
    );
  }
}

async function sendMessage(content) {
  try {
    await axios.post(process.env.DISCORD_WEBHOOK, { content }, { timeout: 5_000 });
    console.log("[alerts] Discord message sent");
  } catch (err) {
    console.error(`[alerts] Discord error: ${err.message}`);
  }
}

function getAlertsFired() {
  return alertsFired;
}

module.exports = { checkAlerts, getAlertsFired };
