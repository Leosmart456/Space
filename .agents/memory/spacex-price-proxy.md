---
name: SpaceX price proxy strategy
description: How share price/chart data is generated for a platform selling shares in a company that isn't publicly traded
---

SpaceX has no public ticker, so the API server can't fetch a real SpaceX quote. Instead, `artifacts/api-server/src/routes/price.ts` fetches real market data for a real, correlated space-sector stock (`RKLB` — Rocket Lab) and rescales every point so the latest close always equals the platform's admin-configured `share_price` setting. This gives the chart realistic day-to-day volatility/shape while keeping the actual displayed price under admin control.

**Why:** There's no legitimate data source for a private company's share price; using a real proxy ticker's price *movement* (scaled, not absolute) is the only way to show a plausible live-looking chart without fabricating numbers from nothing.

**How to apply:** If asked to swap the data provider (e.g. Yahoo Finance to EODHD, done 2026-07-06), keep the same pattern: fetch real OHLC/quote data for `PROXY_TICKER`, then apply `scalePoints()`/scale-by-ratio logic against `share_price` before returning to the client. Don't return raw proxy-ticker prices directly. Provider-specific ticker formats differ (e.g. EODHD needs `RKLB.US` suffix, Yahoo just `RKLB`).
