# 📊 Polymarket Alert & Monitoring Tool

A production-grade full-stack tool for Polymarket traders — real-time market monitoring, Discord alerts, and a live dashboard.



---

## ✨ Features

| Feature | Description |
|---|---|
| 🔄 Live Market Feed | Polls Polymarket Gamma API every 60s |
| 🚨 Smart Alerts | Discord notifications with 1-hour cooldown per market |
| 📈 Dashboard | Next.js frontend showing top markets by volume |
| 🏥 Health Check | `/health` endpoint for uptime monitors |
| 📊 Metrics | Prometheus-compatible `/metrics` endpoint |
| 🛡️ Rate Limiting | 30 req/min per IP on all API routes |
| 🌐 CORS | Locked to your Vercel domain |

---

## 🗂️ Project Structure

```
polymarket-alert-monitoring-tool/
├── backend/                  # Node.js + Express API
│   ├── index.js              # Entry point
│   ├── routes/
│   │   └── markets.js        # /markets, /markets/:id, /stats
│   ├── services/
│   │   ├── polymarket.js     # Gamma API client (correct endpoints)
│   │   ├── alerts.js         # Discord alerts with cooldown
│   │   └── cache.js          # In-memory cache with TTL
│   ├── middleware/
│   │   └── rateLimit.js      # Express rate limiter
│   ├── .env.example
│   └── package.json
├── frontend/                 # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js           # Main dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── MarketCard.js
│   │   ├── StatsBar.js
│   │   └── AlertFeed.js
│   ├── lib/
│   │   └── api.js            # Backend API client
│   ├── .env.example
│   └── next.config.js
├── monitoring/
│   ├── grafana/
│   │   └── dashboard.json    # Import into Grafana Labs
│   └── prometheus.yml        # Scrape config
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/polymarket-alert-monitoring-tool
cd polymarket-alert-monitoring-tool
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your DISCORD_WEBHOOK and FRONTEND_URL in .env
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_BACKEND_URL in .env.local
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
PORT=3000
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR_WEBHOOK
FRONTEND_URL=https://your-app.vercel.app
ALERT_PRICE_THRESHOLD=0.85
ALERT_COOLDOWN_MS=3600000
POLL_INTERVAL_CRON=* * * * *
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend.up.railway.app
```

---

## 🌐 Deploy

### Backend → Railway

1. Push this repo to GitHub
2. [railway.app](https://railway.app) → New Project → GitHub repo → select `backend/` as root
3. Add environment variables in Railway dashboard
4. Deploy — you'll get a URL like `https://your-app.up.railway.app`

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → GitHub repo → set **Root Directory** to `frontend/`
2. Add `NEXT_PUBLIC_BACKEND_URL` environment variable
3. Deploy

### Monitoring → Grafana Cloud

1. Sign up at [grafana.com](https://grafana.com/auth/sign-up)
2. Create a free Grafana Cloud stack
3. Add Prometheus data source pointing to your backend `/metrics` endpoint
4. Import `monitoring/grafana/dashboard.json`

---

## 📡 API Reference

All endpoints are served from the backend.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/markets` | All cached markets (sorted by 24h volume) |
| GET | `/markets/:id` | Single market by ID |
| GET | `/stats` | Summary stats (total volume, active count) |

### Example response — `GET /markets`

```json
{
  "updatedAt": "2025-04-18T12:00:00.000Z",
  "count": 47,
  "markets": [
    {
      "id": "0x...",
      "question": "Will the Fed cut rates in May 2025?",
      "yesPrice": 0.72,
      "noPrice": 0.28,
      "volume24hr": 1240000,
      "liquidity": 450000,
      "endDate": "2025-05-07T00:00:00Z",
      "url": "https://polymarket.com/event/fed-decision-may-2025"
    }
  ]
}
```

---

## 🚨 Discord Alerts

Alerts fire when a market's YES price crosses the `ALERT_PRICE_THRESHOLD` (default `0.85`).

Each market has a **1-hour cooldown** — you won't get spammed for the same market.

To create a Discord webhook:
1. Server Settings → Integrations → Webhooks → New Webhook
2. Copy URL → paste into `DISCORD_WEBHOOK` env var

---

## 📊 Grafana Dashboard

The included dashboard tracks:
- API request rate & latency
- Markets polled per cycle
- Alert fire count
- Error rate

---

## 🛡️ Code of Conduct

This tool consumes Polymarket's public data APIs. Please review:
- [Polymarket Builder Code of Conduct](https://builders.polymarket.com/code-of-conduct)
- [Terms of Service](https://polymarket.com/tos)

Do not use this tool to manipulate markets or violate Polymarket's policies.

---

## 📄 License

MIT — see [LICENSE](LICENSE)
