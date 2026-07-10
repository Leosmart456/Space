---
name: Broker/institution logo sourcing
description: Where landing-page broker logos come from and why Clearbit/Brandfetch free tiers don't work server-side.
---

- Clearbit's free public Logo API (`logo.clearbit.com`) is permanently shut down (DNS no longer resolves). Do not rely on it; it's dead, not rate-limited.
- Brandfetch's CDN (`cdn.brandfetch.io`) requires an authenticated client ID. The ID shown in their public docs/dashboard "quickstart" examples (`c=1idkBwWWL0UPpWOn_UQ`) is a shared demo value — it returns an HTML docs page (HTTP 200, `text/html`) instead of an image for any real request, even against a user's own registered domain. Always validate response `content-type` before trusting a "successful" fetch from a logo CDN; a 200 status does not guarantee image bytes.
- **Why:** spent significant effort round-tripping with a user who kept resupplying this same demo ID from screenshots, believing it was their personal key; direct curl tests (bypassing app code) were the fastest way to prove the ID itself was invalid, not a code/URL-format bug.
- **How to apply:** when integrating any "free" logo/favicon API, curl the exact documented example URL directly (outside app code) before wiring it up, to confirm the demo credentials actually work for arbitrary inputs — many are scoped to their own docs/playground domain only.
- Working alternative used for this project: `nvstly/icons` GitHub repo (`ticker_icons/` folder, raw.githubusercontent.com) has PNG logos indexed by **public stock ticker only** — covers brokers that are themselves publicly traded (e.g. SCHW, IBKR, HOOD, FUTU, CMC) but not private companies (Fidelity, Vanguard, etc.). No stated license (GitHub reports NOASSERTION) — used anyway per explicit user instruction ("dont mind if its licenced or not").
</content>
