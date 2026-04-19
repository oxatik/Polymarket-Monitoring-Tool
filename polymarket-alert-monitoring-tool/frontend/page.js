"use client";

import { useEffect, useState, useCallback } from "react";
import { getMarkets, getStats, getHealth } from "./api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtUSD(n) {
  if (n == null || n === 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n) {
  if (n == null) return null;
  return `${(n * 100).toFixed(1)}%`;
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ stats, health }) {
  const isOk = health?.status === "ok";
  const cells = [
    { label: "API Status",       value: isOk ? "● LIVE" : "● STALE",       color: isOk ? "var(--green)" : "var(--amber)" },
    { label: "Active Markets",   value: stats?.count ?? "—",                color: "var(--blue)"  },
    { label: "24h Volume",       value: fmtUSD(stats?.totalVolume24hr),     color: "var(--text)"  },
    { label: "Total Liquidity",  value: fmtUSD(stats?.totalLiquidity),      color: "var(--text)"  },
    { label: "High Prob ≥85%",   value: stats?.highProbMarkets ?? "—",      color: stats?.highProbMarkets > 0 ? "var(--amber)" : "var(--text-dim)" },
    { label: "Last Update",      value: stats?.updatedAt ? new Date(stats.updatedAt).toLocaleTimeString() : "—", color: "var(--text-dim)" },
  ];

  return (
    <div className="statsbar">
      {cells.map(({ label, value, color }) => (
        <div key={label} className="stat-cell">
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Market Card ─────────────────────────────────────────────────────────────
function MarketCard({ market }) {
  const { question, yesPrice, noPrice, volume24hr, endDate, url, tags } = market;
  const isHighProb = yesPrice != null && yesPrice >= 0.85;
  const yesPct  = fmtPct(yesPrice);
  const noPct   = fmtPct(noPrice);
  const endStr  = endDate ? new Date(endDate).toLocaleDateString() : null;

  return (
    <div className={`card${isHighProb ? " high-prob" : ""}`}>
      {isHighProb && <div className="high-prob-badge">🔥 High Probability</div>}
      <div className="card-question">{question}</div>
      <div className="card-prices">
        {yesPct
          ? <>
              <div className="price-chip price-yes">YES {yesPct}</div>
              <div className="price-chip price-no">NO {noPct || "—"}</div>
            </>
          : <div className="price-chip price-na">No price data</div>
        }
      </div>
      <div className="card-meta">
        <span>Vol 24h: {fmtUSD(volume24hr)}</span>
        {endStr && <span>Ends {endStr}</span>}
        <a href={url} target="_blank" rel="noopener noreferrer">View →</a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [markets, setMarkets] = useState([]);
  const [stats,   setStats]   = useState(null);
  const [health,  setHealth]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("all"); // all | high | active

  const load = useCallback(async () => {
    try {
      const [mData, sData, hData] = await Promise.all([
        getMarkets({ limit: 100 }),
        getStats(),
        getHealth(),
      ]);
      setMarkets(mData.markets || []);
      setStats(sData);
      setHealth(hData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const displayed = markets.filter((m) => {
    if (filter === "high")   return m.yesPrice != null && m.yesPrice >= 0.85;
    if (filter === "active") return m.volume24hr > 0;
    return true;
  });

  return (
    <div className="shell">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          ▣ POLYMARKET MONITOR
          <span>/ alert &amp; tracking tool</span>
        </div>
        <nav className="header-links">
          <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">Polymarket</a>
          <a href="https://docs.polymarket.com" target="_blank" rel="noopener noreferrer">Docs</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </header>

      {/* Stats Bar */}
      <StatsBar stats={stats} health={health} />

      {/* Main */}
      <main className="main">
        {/* Filter Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 0, borderBottom: "none" }}>
            Markets — {displayed.length} shown
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["all", "high", "active"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: filter === f ? "var(--blue)" : "var(--border)",
                  background: filter === f ? "var(--blue-bg)" : "transparent",
                  color: filter === f ? "var(--blue)" : "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {f === "all" ? "All" : f === "high" ? "≥85% YES" : "Active"}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && <div className="state-msg">Fetching markets...</div>}
        {error   && <div className="state-msg" style={{ color: "var(--red)" }}>⚠ {error}</div>}

        {!loading && !error && displayed.length === 0 && (
          <div className="state-msg">No markets match this filter.</div>
        )}

        {/* Grid */}
        {!loading && !error && displayed.length > 0 && (
          <div className="grid">
            {displayed.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        Powered by{" "}
        <a href="https://docs.polymarket.com" target="_blank" rel="noopener noreferrer">
          Polymarket Gamma API
        </a>{" "}
        · Data refreshes every 60s ·{" "}
        <a href="https://builders.polymarket.com/code-of-conduct" target="_blank" rel="noopener noreferrer">
          Code of Conduct
        </a>
      </footer>
    </div>
  );
}
