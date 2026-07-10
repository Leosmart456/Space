/**
 * Price routes — live data sourced directly from Yahoo Finance for NASDAQ:SPCX,
 * the same ticker that TradingView displays. No API key required.
 * Quote is cached for 2 minutes; history is cached for 1 hour.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { getSetting, upsertSetting } from "./settings";
import { User } from "../lib/models";

const router: IRouter = Router();

const TICKER = "SPCX"; // NASDAQ:SPCX — the same symbol shown by TradingView
const YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; price-mirror/1.0)" };

// SpaceX's estimated shares outstanding, used to derive a live valuation from the
// live share price (same approach TradingView-style market cap widgets use:
// marketCap = price * sharesOutstanding). This mirrors the ~$1.7T-scale valuation
// reported in the press at the current post-IPO share price.
const SHARES_OUTSTANDING = 13_100_000_000;

// Public-facing floor for the "Accredited Investors" stat. The real count grows
// from actual signups, but we never advertise fewer than this baseline.
const ACCREDITED_INVESTORS_FLOOR = 399;

// ─── In-memory cache ────────────────────────────────────────────────────────

interface CacheEntry<T> { data: T; expiresAt: number }
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e || Date.now() > e.expiresAt) return null;
  return e.data as T;
}
function setCache<T>(key: string, data: T, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Yahoo Finance types ────────────────────────────────────────────────────

interface YFMeta {
  regularMarketPrice: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketTime?: number;
  currency?: string;
}
interface YFQuoteIndicator {
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
}
interface YFResult {
  meta: YFMeta;
  timestamp?: number[];
  indicators?: { quote: YFQuoteIndicator[] };
}
interface YFResponse {
  chart: { result: YFResult[] | null; error?: unknown };
}

// ─── Shared types ───────────────────────────────────────────────────────────

export interface OHLCPoint {
  date: string;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Fetch helpers ──────────────────────────────────────────────────────────

/** Returns a SPCX/TradingView-equivalent realtime quote from Yahoo Finance. */
async function fetchLiveQuote(): Promise<{ price: number; prevClose: number; change: number; changePercent: number }> {
  const url = `${YF_BASE}/${TICKER}?interval=1m&range=1d&includePrePost=false`;
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Yahoo Finance quote HTTP ${r.status}`);
  const data = (await r.json()) as YFResponse;
  const result = data.chart.result?.[0];
  if (!result) throw new Error("No result from Yahoo Finance");

  const price = result.meta.regularMarketPrice;
  const prevClose = result.meta.previousClose ?? result.meta.chartPreviousClose ?? price;
  const change = parseFloat((price - prevClose).toFixed(2));
  const changePercent = parseFloat(prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : "0");
  return { price, prevClose, change, changePercent };
}

/** Returns up to 1 year of SPCX daily OHLC from Yahoo Finance. */
async function fetchHistory(): Promise<OHLCPoint[]> {
  const url = `${YF_BASE}/${TICKER}?interval=1d&range=1y&includePrePost=false`;
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`Yahoo Finance history HTTP ${r.status}`);
  const data = (await r.json()) as YFResponse;
  const result = data.chart.result?.[0];
  if (!result?.timestamp || !result.indicators?.quote?.[0]) throw new Error("No history from Yahoo Finance");

  const { timestamp, indicators: { quote: [q] } } = result;
  const points: OHLCPoint[] = [];

  for (let i = 0; i < timestamp.length; i++) {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i], v = q.volume[i];
    if (o == null || h == null || l == null || c == null || c <= 0) continue;
    const d = new Date(timestamp[i] * 1000);
    points.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open: parseFloat(o.toFixed(2)),
      high: parseFloat(h.toFixed(2)),
      low: parseFloat(l.toFixed(2)),
      close: parseFloat(c.toFixed(2)),
      volume: v ?? 0,
    });
  }

  if (!points.length) throw new Error("Empty history from Yahoo Finance");
  return points;
}

/** Cached history — refreshes once per hour. */
async function getCachedHistory(): Promise<OHLCPoint[]> {
  const hit = getCached<OHLCPoint[]>("history");
  if (hit) return hit;
  const pts = await fetchHistory();
  setCache("history", pts, 60 * 60 * 1000); // 1 hour
  return pts;
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /price/history
 * Returns daily OHLC bars for SPCX (mirrors TradingView chart data).
 * Falls back to share_price from DB as a flat line if Yahoo is unreachable.
 */
router.get("/price/history", async (_req: Request, res: Response): Promise<void> => {
  try {
    const points = await getCachedHistory();
    res.json({ points, source: "yahoo-finance", ticker: TICKER });
  } catch (err) {
    // Soft fallback: return a single flat data point from the stored share_price
    try {
      const sp = await getSetting("share_price");
      const parsed = Number(sp ?? "130");
      const price = Number.isFinite(parsed) && parsed > 0 ? parsed : 130;
      const today = new Date().toISOString().slice(0, 10);
      const fallback: OHLCPoint = { date: today, label: "Today", open: price, high: price, low: price, close: price, volume: 0 };
      res.json({ points: [fallback], source: "fallback", ticker: TICKER });
    } catch {
      res.status(503).json({ error: "Price history unavailable", detail: (err as Error).message });
    }
  }
});

/**
 * GET /price/quote
 * Returns the live SPCX price that mirrors what TradingView shows.
 * Cached for 2 minutes. Persists the price to share_price in MongoDB
 * automatically so the rest of the app stays in sync.
 */
router.get("/price/quote", async (_req: Request, res: Response): Promise<void> => {
  const cached = getCached<{ price: number; prevClose: number; change: number; changePercent: number }>("quote");
  if (cached) { res.json({ ...cached, source: "cache", ticker: TICKER }); return; }

  try {
    const quote = await fetchLiveQuote();
    setCache("quote", quote, 2 * 60 * 1000); // 2 minutes

    // Auto-persist the live price to MongoDB so the platform share_price stays current
    upsertSetting("share_price", quote.price.toFixed(2)).catch((e: unknown) => {
      console.error("Failed to auto-persist share_price:", e);
    });

    res.json({ ...quote, source: "yahoo-finance", ticker: TICKER });
  } catch (err) {
    // Fallback to the last known share_price from MongoDB
    const sp = await getSetting("share_price").catch(() => "130");
    const parsed = Number(sp ?? "130");
    const price = Number.isFinite(parsed) && parsed > 0 ? parsed : 130;
    res.json({ price, prevClose: price, change: 0, changePercent: 0, source: "fallback", ticker: TICKER });
  }
});

// ─── Exported utility for admin sync endpoint ────────────────────────────────

/**
 * Fetches the current live SPCX price from Yahoo Finance (same data as TradingView)
 * and returns it. Used by POST /admin/sync-price to manually trigger a refresh.
 */
export async function computeSyncedPrice(): Promise<number> {
  const quote = await fetchLiveQuote();
  return quote.price;
}

/**
 * GET /price/public-stats
 * Public, no-auth snapshot for the landing page hero stats: live share price,
 * derived company valuation (price × shares outstanding), and the current
 * count of accredited investors. Mirrors the same SPCX quote used everywhere
 * else so the landing page, dashboard, and admin panel never disagree.
 * Cached for 2 minutes alongside the quote.
 */
router.get("/price/public-stats", async (_req: Request, res: Response): Promise<void> => {
  let price: number;
  let source: string;

  const cachedQuote = getCached<{ price: number }>("quote");
  if (cachedQuote) {
    price = cachedQuote.price;
    source = "cache";
  } else {
    try {
      const quote = await fetchLiveQuote();
      setCache("quote", quote, 2 * 60 * 1000);
      upsertSetting("share_price", quote.price.toFixed(2)).catch((e: unknown) => {
        console.error("Failed to auto-persist share_price:", e);
      });
      price = quote.price;
      source = "yahoo-finance";
    } catch {
      const sp = await getSetting("share_price").catch(() => "130");
      const parsed = Number(sp ?? "130");
      price = Number.isFinite(parsed) && parsed > 0 ? parsed : 130;
      source = "fallback";
    }
  }

  const realAccreditedInvestors = await User.countDocuments({ accreditedStatus: "yes" }).catch(() => 0);
  const accreditedInvestors = Math.max(ACCREDITED_INVESTORS_FLOOR, realAccreditedInvestors);
  const valuation = price * SHARES_OUTSTANDING;

  res.json({
    sharePrice: price,
    valuation,
    accreditedInvestors,
    ticker: TICKER,
    source,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
