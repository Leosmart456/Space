---
title: Admin nickname UI & address format fix
---
# Admin Nickname UI & Address Format Fix

## What & Why
Two UX improvements:

1. **Admin nickname on users list**: The nickname/label feature already exists in the codebase but is hidden behind a barely-visible 12px pencil icon. The admin cannot easily find or use it. The UI needs to make the nickname visible and editable in a way that is immediately discoverable — a persistent "Add label" placeholder, or a visible input/badge always shown per user card.

2. **Consistent short address format**: The Receive QR page shows wallet addresses in a short `0x1a2b.....3c4d5e` format with 5 dots between the start and end. The Send confirmation dialog and Transaction Detail page show addresses with different truncation (different char counts, 3 dots). These must use the same visual format so the experience is consistent.

## Done looks like
- On the admin Users List, every user card clearly shows a nickname/label field. If no nickname is set, a visible placeholder like "Add label..." is shown. Clicking it (or a prominent edit icon) opens an inline edit. Saving updates the DB-backed `adminNickname`.
- In the Send confirmation dialog, the "From" address uses the format: first 6 chars + `.....` + last 6 chars.
- In the Transaction Detail page, the truncated recipient/sender address uses the same format: first 6 chars + `.....` + last 6 chars.

## Out of scope
- Changing the receive page's address generation logic
- Showing real wallet addresses on the receive page

## Tasks
1. **Admin nickname — improve discoverability** — Redesign the nickname row in the user card to always show the nickname (or an "Add label..." placeholder) as a styled badge or inline text, with a clearly visible edit affordance (not just a tiny hidden pencil icon).

2. **Standardize address truncation** — Update the `truncateAddress` helper in both `transaction-detail.tsx` and the "From/To" address display in `send.tsx` to use the format `addr.slice(0,6) + '.....' + addr.slice(-6)`, matching the receive QR page style.

## Relevant files
- `client/src/pages/admin-dashboard.tsx:1448-1493`
- `client/src/pages/transaction-detail.tsx:79-82,136-142`
- `client/src/pages/send.tsx:736-753`
- `client/src/pages/receive.tsx:18-33`