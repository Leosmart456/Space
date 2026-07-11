---
title: Per-token market movement notifications
---
# Per-Token Market Movement Notifications

## What & Why
Replace the current bulk "Crypto Market Update" notification (one summary every 6 hours for all coins) with individual per-token notifications that fire whenever a specific coin's price moves significantly up or down. Users tap the notification and land directly on that token's detail page.

## Done looks like
- When BTC rises ≥1.5% since the last check, a notification titled **"BTC is up 3.2%"** appears — separate from any ETH or SOL notification
- When ETH drops ≥1.5%, a notification titled **"ETH dropped 2.1%"** appears — with the full name in the body ("Ethereum fell to $3,200 — down 2.1% in the last 30 min")
- Each coin (BTC, ETH, BNB, SOL, TRX, DOGE, ADA, XRP) produces its own notification independently
- Tapping any of these notifications opens the exact token detail page for that coin (e.g., `/token/BTC`)
- Price checks run every 30 minutes (down from every 6 hours)
- A cooldown of 2 hours per coin prevents the same coin from spamming notifications on every check

## Out of scope
- Changing user-defined price alerts (those already work separately)
- Adding new coins to the watch list beyond the current 8 top coins
- Push (browser) notification changes — in-app notifications only for this task

## Tasks
1. **Replace bulk notification with per-token movement detection** — Rewrite `sendTopRatesNotification` to compare each coin's current price against the last stored price, fire individual notifications per coin only when the movement exceeds ±1.5%, and include `metadata.tokenSymbol`, `metadata.direction` ("up"/"down"), and `metadata.changePercent`. Store per-coin last-notified timestamps to enforce a 2-hour cooldown per coin so the same token can't spam. Update the scheduler to run this every 30 minutes instead of 6 hours.

2. **Format notification title and description correctly** — Title format: `"BTC is up 3.2%"` or `"ETH dropped 2.1%"`. Description: full coin name + current price + change context (e.g., "Bitcoin reached $95,240 — up 3.2% in the last 30 min"). Use the coin's full name (Bitcoin, Ethereum, etc.) in the description, symbol in the title.

3. **Wire up tap-to-navigate in the notification page** — Update `handleNotificationClick` to check `notification.metadata?.tokenSymbol` and navigate to `/token/${tokenSymbol}` when present, before the existing fallback checks.

## Relevant files
- `server/services/background-jobs.ts:19-32,233-283,394-401`
- `client/src/pages/notifications.tsx:132-154`
- `client/src/App.tsx:118-119`