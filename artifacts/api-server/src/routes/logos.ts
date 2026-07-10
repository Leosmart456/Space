/**
 * Institution logo proxy — fetches broker/institution logos by domain,
 * trying Clearbit, then Brandfetch, then logo.dev in order, and caches the
 * resulting image on disk so repeat requests never hit any upstream API
 * again. Frontend falls back to a static placeholder icon if this route
 * 404s (i.e. all three providers failed).
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { promises as fs } from "fs";
import path from "path";

const router: IRouter = Router();

const CACHE_DIR = path.resolve(process.cwd(), "cache", "logos");
const FETCH_TIMEOUT_MS = 4000;
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

// This is a public, unauthenticated endpoint that triggers outbound fetches and
// writes to disk. To prevent it being used to spray arbitrary domains (cache/DoS
// growth via disk + memory + upstream request volume), only the institution
// domains actually rendered on the landing page's broker list may be requested.
// Keep in sync with the `domain` field on BROKERS in
// artifacts/spacex-platform/src/pages/landing.tsx.
const ALLOWED_DOMAINS = new Set([
  // United States
  "fidelity.com", "schwab.com", "interactivebrokers.com", "tdameritrade.com",
  "robinhood.com", "webull.com", "vanguard.com", "merrilledge.com", "moomoo.com",
  "etrade.com", "morganstanley.com", "sofi.com", "public.com", "tradestation.com",
  "tastytrade.com", "ally.com", "alpaca.markets", "pershing.com", "raymondjames.com",
  "edwardjones.com", "stifel.com", "lpl.com", "wealthfront.com", "betterment.com",
  "m1.com", "acorns.com", "stash.com", "firstrade.com",
  // United Kingdom
  "hl.co.uk", "freetrade.io", "ajbell.co.uk", "ii.co.uk", "nutmeg.com",
  "moneyboxapp.com", "cmcmarkets.com", "ig.com",
  // Europe
  "degiro.com", "etoro.com", "home.saxo", "xtb.com", "plus500.com",
  "trading212.com", "traderepublic.com", "scalable.capital", "flatex.de",
  "bux.com", "revolut.com", "swissquote.com", "libertex.com", "exness.com",
  "admiralmarkets.com", "dukascopy.com",
  // Asia-Pacific
  "tigersecurities.com", "futu.com", "rakuten-sec.co.jp", "sbisec.co.jp",
  "miraeasset.com", "commsec.com.au", "stake.com", "superhero.com.au",
  "zerodha.com", "groww.in", "upstox.com", "angelbroking.com",
  "kotaksecurities.com", "icicidirect.com", "poems.com.sg", "maybank.com", "cimb.com",
  // Middle East & Africa
  "sarwa.co", "getbaraka.com", "stashaway.com", "mubasher.net",
  // Canada
  "questrade.com", "td.com", "qtrade.ca", "wealthsimple.com", "nbc.ca",
  // Latin America
  "xp.com.br", "btgpactual.com", "nuinvest.com.br",
]);

// In-memory negative cache so repeated requests for a domain that has no
// logo anywhere don't keep re-hitting Clearbit/Brandfetch on every landing
// page load. Positive results are cached on disk (see below) instead.
const failureCache = new Map<string, number>();
const FAILURE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FAILURE_CACHE_MAX_ENTRIES = 200;

function pruneFailureCache() {
  if (failureCache.size <= FAILURE_CACHE_MAX_ENTRIES) return;
  const now = Date.now();
  for (const [domain, failedAt] of failureCache) {
    if (now - failedAt >= FAILURE_TTL_MS) failureCache.delete(domain);
  }
  // Still over the cap after pruning expired entries — drop the oldest ones.
  if (failureCache.size > FAILURE_CACHE_MAX_ENTRIES) {
    const excess = failureCache.size - FAILURE_CACHE_MAX_ENTRIES;
    const keys = Array.from(failureCache.keys()).slice(0, excess);
    for (const k of keys) failureCache.delete(k);
  }
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function cachePathFor(domain: string, ext: string) {
  return path.join(CACHE_DIR, `${domain}.${ext}`);
}

const CACHE_EXTS = ["png", "jpg", "jpeg", "webp", "svg"];

async function findCachedFile(domain: string): Promise<string | null> {
  for (const ext of CACHE_EXTS) {
    const p = cachePathFor(domain, ext);
    try {
      await fs.access(p);
      return p;
    } catch {
      // try next extension
    }
  }
  return null;
}

function contentTypeFromExt(ext: string): string {
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    default: return "image/png";
  }
}

function extFromContentType(ct: string | null): string | null {
  if (!ct) return null;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("png")) return "png";
  return null;
}

async function fetchWithTimeout(url: string): Promise<globalThis.Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; logo-proxy/1.0)" } });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const BRANDFETCH_CLIENT_ID = process.env["BRANDFETCH_CLIENT_API"];
const LOGODEV_TOKEN = process.env["LOGODEV_TOKEN"];

/**
 * Shared guard: only accept a response as a real logo if it actually redirected
 * to/returned image bytes. Both Clearbit and Brandfetch can respond 200 with an
 * HTML docs/error page (e.g. when unauthenticated or the domain has no logo) —
 * without this check that HTML would get cached and served as a "logo".
 */
async function extractImage(res: globalThis.Response | null): Promise<{ buffer: Buffer; ext: string } | null> {
  if (!res || !res.ok) return null;
  const ct = res.headers.get("content-type");
  const ext = extFromContentType(ct);
  if (!ext) return null; // not an image content-type — e.g. redirected to an HTML page
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 100) return null; // guard against empty/near-empty responses
  return { buffer, ext };
}

async function fetchFromClearbit(domain: string): Promise<{ buffer: Buffer; ext: string } | null> {
  // Note: Clearbit's free/public Logo API (logo.clearbit.com) has been sunset in
  // favor of logo.dev (built by the same team) but we still try the documented
  // Clearbit host first per spec, then fall back below.
  const res = await fetchWithTimeout(`https://logo.clearbit.com/${domain}?size=128`);
  return extractImage(res);
}

async function fetchFromBrandfetch(domain: string): Promise<{ buffer: Buffer; ext: string } | null> {
  // Brandfetch's CDN requires a client ID for authenticated logo delivery —
  // without one it redirects to their docs page instead of serving an image.
  if (!BRANDFETCH_CLIENT_ID) return null;
  const res = await fetchWithTimeout(`https://cdn.brandfetch.io/domain/${domain}?c=${BRANDFETCH_CLIENT_ID}`);
  return extractImage(res);
}

async function fetchFromLogoDev(domain: string): Promise<{ buffer: Buffer; ext: string } | null> {
  // logo.dev — built by the former Clearbit Logo API team; reliably serves a
  // real image for arbitrary domains, unlike our Brandfetch demo credential.
  if (!LOGODEV_TOKEN) return null;
  const res = await fetchWithTimeout(`https://img.logo.dev/${domain}?token=${LOGODEV_TOKEN}`);
  return extractImage(res);
}

/**
 * GET /logos/:domain — returns the cached/fetched logo image for a domain,
 * or 404 if none could be retrieved from either provider. Domain must look
 * like a real hostname (letters, digits, dots, hyphens) to avoid SSRF via
 * arbitrary upstream fetches.
 */
router.get("/logos/:domain", async (req: Request, res: Response): Promise<void> => {
  const domain = String(req.params.domain || "").trim().toLowerCase();

  if (!DOMAIN_RE.test(domain)) {
    res.status(400).json({ error: "Invalid domain" });
    return;
  }

  if (!ALLOWED_DOMAINS.has(domain)) {
    res.status(404).json({ error: "Logo not found" });
    return;
  }

  await ensureCacheDir();
  pruneFailureCache();

  // 1. Disk cache — instant, no network call.
  const cachedPath = await findCachedFile(domain);
  if (cachedPath) {
    const ext = path.extname(cachedPath).slice(1);
    const buffer = await fs.readFile(cachedPath).catch(() => null);
    if (buffer) {
      res.set("Cache-Control", "public, max-age=604800, immutable"); // 7 days at the edge/browser
      res.type(contentTypeFromExt(ext));
      res.send(buffer);
      return;
    }
  }

  // 2. Known-recent failure — skip straight to 404 rather than re-hitting both APIs.
  const failedAt = failureCache.get(domain);
  if (failedAt && Date.now() - failedAt < FAILURE_TTL_MS) {
    res.status(404).json({ error: "Logo not found" });
    return;
  }

  // 3. Clearbit, then Brandfetch, then logo.dev as fallbacks.
  const result =
    (await fetchFromClearbit(domain)) ??
    (await fetchFromBrandfetch(domain)) ??
    (await fetchFromLogoDev(domain));

  if (!result) {
    failureCache.set(domain, Date.now());
    res.status(404).json({ error: "Logo not found" });
    return;
  }

  await fs.writeFile(cachePathFor(domain, result.ext), result.buffer).catch(() => {
    // Non-fatal — worst case we re-fetch next time.
  });

  res.set("Cache-Control", "public, max-age=604800, immutable");
  res.type(contentTypeFromExt(result.ext));
  res.send(result.buffer);
});

export default router;
