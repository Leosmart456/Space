#!/usr/bin/env node
/**
 * Syncs broker logos from the nvstly/icons GitHub repo (ticker_icons folder)
 * into public/brokers/. Only brokers with a known public stock ticker can be
 * synced this way; the rest keep their bundled static logo.
 *
 * Usage: node scripts/sync-broker-logos.mjs
 *
 * Intended to be run periodically (see README note below on scheduling).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BROKERS_DIR = path.resolve(__dirname, "..", "public", "brokers");

// Maps our broker slug (matches public/brokers/<slug>.<ext> and BROKERS[].logoUrl
// in src/pages/landing.tsx) to its public stock ticker in the nvstly/icons repo.
// Only publicly traded brokers have an entry here — private companies (Fidelity,
// Vanguard, eToro pre-IPO, Trading 212, DEGIRO, etc.) have no ticker and must
// keep their bundled logo.
const TICKER_MAP = {
  schwab: "SCHW",
  ibkr: "IBKR",
  robinhood: "HOOD",
  moomoo: "FUTU",
  cmc: "CMC",
};

const RAW_BASE = "https://raw.githubusercontent.com/nvstly/icons/main/ticker_icons";

async function syncOne(slug, ticker) {
  const url = `${RAW_BASE}/${ticker}.png`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[skip] ${slug} (${ticker}): upstream returned ${res.status}`);
    return false;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 100) {
    console.warn(`[skip] ${slug} (${ticker}): response too small, likely not a real logo`);
    return false;
  }
  // PNG signature check — guards against HTML error/docs pages served with a
  // misleading content-type ever being written over a working logo.
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    console.warn(`[skip] ${slug} (${ticker}): response is not a valid PNG`);
    return false;
  }
  const dest = path.join(BROKERS_DIR, `${slug}.png`);
  const tmpDest = `${dest}.tmp`;
  // Write to a temp file then rename, so a crash/interrupt mid-write can never
  // leave a truncated/corrupt logo in place of a working one.
  await fs.writeFile(tmpDest, buffer);
  await fs.rename(tmpDest, dest);
  console.log(`[ok] ${slug} (${ticker}) -> ${path.relative(process.cwd(), dest)}`);
  return true;
}

async function main() {
  await fs.mkdir(BROKERS_DIR, { recursive: true });
  const results = await Promise.allSettled(
    Object.entries(TICKER_MAP).map(([slug, ticker]) => syncOne(slug, ticker))
  );
  const updated = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const failed = results.length - updated;
  console.log(`\nSynced ${updated}/${results.length} broker logos from nvstly/icons.`);
  if (failed > 0) {
    console.log(`${failed} logo(s) could not be updated (see [skip] lines above) — bundled fallback remains in place.`);
  }
}

main().catch((err) => {
  console.error("Logo sync failed:", err);
  process.exitCode = 1;
});
