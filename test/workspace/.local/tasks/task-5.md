---
title: Virtual addresses per user per chain
---
# Virtual addresses per user per chain

## What & Why

Each user needs their own unique virtual address for every network chain
(Ethereum, BNB, Tron, Solana). These virtual addresses serve as personal
identifiers that look like real blockchain addresses but are not tied to any
actual wallet. They are used for display-only purposes so that two different
users can distinguish each other in transfer history.

Three surfaces must show virtual addresses consistently:

1. **Receive QR page** — shows the logged-in user's own virtual address for
   the selected chain below the QR code. Copy button still copies the real
   shared address (unchanged).
2. **Receive list page** — shows the user's own virtual address next to each
   token (replaces truncated real address).
3. **Transaction detail** — for email/ID internal transfers only, the sender
   sees the recipient's virtual address and the recipient sees the sender's
   virtual address. External sends (by chain address) continue to show the
   truncated real address.

## Done looks like

- Every user in the database has a `virtualAddresses` field with four
  distinct addresses: one for each of ethereum, bnb, tron, and solana.
- Existing users without virtual addresses get them generated and saved
  on the first server startup after this change (one-time migration).
- New users get virtual addresses generated automatically at account creation.
- On the receive QR page, the text under the QR code shows the user's own
  virtual address for that chain. It differs from the real shared address.
  Tapping Copy copies the real address as before.
- On the receive list page, the small address shown under each token is the
  user's virtual address for that chain.
- When User A sends to User B via email or ID, User A's transaction detail
  (type: send) shows "Recipient: <B's virtual address for that chain>".
  User B's transaction detail (type: receive) shows "Sender: <A's virtual
  address for that chain>".
- For non-internal sends the transaction detail continues to show the
  truncated real address (no change).

## Out of scope

- Changing what is copied when a user taps Copy on the receive page (always
  the real address, unchanged)
- Changing the QR code value itself (encodes the real address, unchanged)
- Admin-send or silent-add transactions (these do not use virtual addresses)
- Showing virtual addresses anywhere other than the three surfaces above

## Tasks

1. **User schema + virtual address generation** — Add a `virtualAddresses`
   sub-document to the User mongoose schema with optional string fields for
   ethereum, bnb, tron, and solana. Add a server-side helper function that
   uses the existing `generateAddressForChain` utility to generate one full
   virtual address per chain for a given user. Run a migration on server
   startup to backfill all existing users who have missing or null virtual
   addresses. Generate virtual addresses in all user-creation registration
   code paths (email signup, ID signup, email-based login-or-create, etc.).

2. **Transaction schema + internal-transfer virtual address storage** — Add
   optional `fromVirtual` and `toVirtual` string fields to the Transaction
   mongoose schema. In the internal-transfer route
   (`POST /api/wallet/:walletId/send-internal`), look up the sender's and
   recipient's virtual address for the transaction's `chainId` and write them
   into both the sender and recipient transaction records.

3. **Expose virtual addresses in the auth/user API** — In the
   `GET /api/auth/user` response, include the logged-in user's
   `virtualAddresses` object so the receive pages can read it without an
   extra API call.

4. **Update receive QR and receive list pages** — In `receive-qr.tsx`,
   read `virtualAddresses[chainId]` from the user context or a profile
   query and show it under the QR code. In `receive.tsx`, show the virtual
   address next to each token. Both pages keep the copy and QR value as the
   real shared address.

5. **Update transaction detail page** — In `transaction-detail.tsx`, when a
   transaction has `fromVirtual` or `toVirtual` set (indicating an internal
   email/ID transfer), display those virtual addresses instead of the
   truncated real `from`/`to` address. Fall back to the existing truncated
   real address when those fields are absent.

## Relevant files

- `server/models.ts`
- `server/utils/address-generator.ts`
- `server/routes.ts:1013-1026`
- `server/routes.ts:3417-3561`
- `client/src/pages/receive-qr.tsx`
- `client/src/pages/receive.tsx`
- `client/src/pages/transaction-detail.tsx`
- `client/src/contexts/wallet-context.tsx`
- `shared/wallet-addresses.ts`