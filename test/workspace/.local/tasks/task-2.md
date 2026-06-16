---
title: Wallet & admin bug fixes
---
# Wallet & Admin Bug Fixes Batch

## What & Why
Fix five issues reported by the user across the send/receive flow, admin search, and admin dashboard user list.

## Done looks like
- Internal transfer (email/ID mode) sender gets `{amount} {token} sent successfully` notification and recipient gets `{amount} {token} received successfully` — matching the external address-send format exactly
- Admin search finds users when the search query is their 11-digit numeric userId
- Receive QR code page shows a randomly-generated obfuscated address (e.g. `0xef1a.....rwrfds`) below the QR code, while the Copy and Share buttons still copy the real wallet address; the QR code itself is unchanged
- Admin dashboard "All Users" tab: each user card has a pin/unpin button that keeps pinned users at the top of the list (stored in localStorage under `admin_pinned_users`); the user's login PIN is always visible in the card
- Admin dashboard "All Users" tab: each user card has an inline editable label (custom alias) the admin can set; label is stored in localStorage under `admin_user_labels`, displayed instead of the real first/last name when set, and only visible to the admin — not saved to the database

## Out of scope
- Changing actual user names in the database
- Changing how the QR code is generated (QR still encodes the real address)
- Any changes to admin-users.tsx (these fixes are only in admin-dashboard.tsx)

## Tasks
1. **Fix internal transfer notification text** — In the send-internal route handler, update the sender and recipient notification title and description to use the same format as the external send: `{amount} {token} sent successfully` / `{amount} {token} received successfully`.

2. **Fix admin search for 11-digit userId** — In `searchUsers` in server/storage.ts, add a match condition `{ userId: query }` whenever the query string matches the 11-digit numeric pattern (`/^\d{11}$/`), so searching by the new userId works.

3. **Fix receive-qr.tsx fake address display** — Derive a session-stable random display address (same logic as receive.tsx: hex chars for EVM chains, base-58 chars for Tron/Solana) and display it in the address panel below the QR code. Keep `copyAddress` and the Share button using the real address from `getWalletAddress(chainId)`.

4. **Admin dashboard users list: pin feature + PIN visibility + user label edit** — In the All Users tab of admin-dashboard.tsx: (a) add a pin/unpin icon button per user card, with pinned users sorted to the top using localStorage; (b) ensure the `plainPassword` PIN row is always rendered and clearly visible — show `"Not set"` if empty; (c) add an inline editable label field per user card with a pencil icon, stored in localStorage under `admin_user_labels` keyed by user `_id`, displayed in the card header when set.

## Relevant files
- `server/routes.ts:3376-3460`
- `server/storage.ts:494-521`
- `client/src/pages/receive-qr.tsx`
- `client/src/pages/admin-dashboard.tsx:1360-1470`