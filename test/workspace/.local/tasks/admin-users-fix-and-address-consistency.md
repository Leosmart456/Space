# Admin users UI fix & address consistency

## What & Why

Two issues need fixing:

**1. Admin users page pin & nickname not working**
The admin panel routes to `admin-users.tsx` (a standalone page with its own layout), but all previous work was applied to `admin-dashboard.tsx` (a different file the admin never sees). The actual page the admin visits has:
- Pin stored only in `localStorage` — resets on every browser session, never reaches the database
- No nickname/label section at all — the Tag icon and "Add label..." input do not exist yet

**2. Receive address vs transaction detail mismatch**
When a user sends or receives crypto (via email or 11-digit ID), the transfer details page shows the sender's or recipient's wallet address truncated to `slice(0,6).....slice(-6)`. However, both the Receive list page and the Receive QR page show a randomly generated fake address that changes every page reload. These two surfaces are supposed to show the same value — the format is identical but the values differ.

## Done looks like

- On the admin users page, clicking the thumbtack icon calls the database toggle API and persists the pinned state across browser sessions; a toast shows "User pinned" or "User unpinned — Saved to database."
- A label/nickname row (Tag icon + "Add label..." placeholder) appears on every user card; typing and pressing Enter or clicking away saves to the database; a toast confirms "Label saved."
- The address shown below the QR code on the receive QR page exactly matches the address shown in that user's transaction detail page for the same token and chain.
- The short address shown next to each token on the Receive list page also matches the transaction detail address.

## Out of scope

- Changes to `admin-dashboard.tsx` (the tabbed view the admin never reaches)
- Any change to the QR code itself (only the text address below it changes)
- Admin send crypto or silent add flows

## Tasks

1. **Fix admin users pin to use DB** — In `admin-users.tsx`, remove the `localStorage` pin state and replace `togglePin` with a mutation that calls `PATCH /api/admin/users/:userId/toggle-pin`. Derive pin state from `user.adminPinned` returned by the existing `/api/admin/users` query. Sort pinned users to the top based on that field. Show "User pinned" / "User unpinned" success toasts with "Saved to database." description, and a destructive toast on error.

2. **Add nickname/label row to admin users page** — In `admin-users.tsx`, add an inline editable label row below each user's email using a Tag icon and "Add label..." placeholder. Pre-fill with `user.adminNickname` when it exists. On blur or Enter, call `PATCH /api/admin/users/:userId/nickname` with the trimmed value (empty string clears the label). Show "Label saved" / "Label removed" success toast and a destructive toast on error.

3. **Fix receive page address display** — In `receive-qr.tsx`, replace the randomly generated `SESSION_QR_DISPLAY_ADDRESSES` display value with the truncated real wallet address using the same `slice(0,6).....slice(-6)` formula already used in `transaction-detail.tsx`. Apply the same fix in `receive.tsx` so the short address shown next to each token in the receive list is also consistent.

## Relevant files

- `client/src/pages/admin-users.tsx`
- `client/src/pages/receive-qr.tsx`
- `client/src/pages/receive.tsx`
- `client/src/pages/transaction-detail.tsx:79-82`
- `shared/wallet-addresses.ts`
- `server/routes.ts:3530-3561`
