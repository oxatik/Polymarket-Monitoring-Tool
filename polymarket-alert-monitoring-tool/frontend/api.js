const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function getMarkets({ limit = 50, offset = 0 } = {}) {
  const res = await fetch(`${BASE}/markets?limit=${limit}&offset=${offset}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Markets fetch failed: ${res.status}`);
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE}/markets/stats`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
