---
title: Dynamic 5% transfer fee with admin fixed-fee toggle
---
# Dynamic Transfer Fee Calculator (with Admin Toggle)

## What & Why
When a user sends crypto via an external blockchain address, the app calculates a dynamic 5% fee on the USD value of the transfer, displayed in the native token of the selected network. Admins can override this on a per-user basis with the existing fixed fee system — toggled from the admin users list. The toggle is off by default (dynamic 5% is the default). Users see only a fee amount — they have no visibility into which method produced it.

## Done looks like
- In address send mode, a live fee summary card shows: fee in native token, fee in USD, and total cost in USD — updating in real time as the user types.
- Default behavior (no admin override): fee = 5% of transfer USD value, converted to the chain's native token.
- Admin override active: fee comes from the admin-configured fixed fee for that user/token/chain (existing `/api/fees` system).
- Admin users list has a new "Fixed Fee" toggle per user (off by default). When switched on, the user's sends use the admin-set fixed fee instead of the dynamic 5% method.
- The toggle state is saved to the database and reflected immediately without page refresh.
- The confirm dialog and insufficient gas/fee dialog both display the correct fee amount (whichever method is active for that user).
- Users see only the fee amount — no label, icon, or wording reveals the backend method.
- Email/ID internal transfers are completely unaffected (still zero fee).
- Price data is cached for 30 seconds on the client to avoid excessive API calls.

## Out of scope
- Changing the actual server-side deduction logic (display and pre-send validation only on the frontend).
- Changing the fee for email/ID internal transfers.
- Making the fee method visible to users in any way.

## Tasks

1. **Add `useFixedFee` field to User model** — Add a boolean `useFixedFee` (default `false`) to the User schema in `server/models.ts` and expose it in `storage.ts` (update user type and relevant storage methods so the field is readable and patchable).

2. **Add admin toggle API route** — Add a `PATCH /api/admin/users/:userId/fee-method` route in `server/routes.ts` that flips `useFixedFee` for a given user. Protect it with `requireAdmin`. Return the updated value.

3. **Expose `useFixedFee` in fee endpoint** — In `GET /api/fees/:tokenSymbol`, check the requesting user's `useFixedFee` flag. If `false` (default), return a sentinel response (e.g. `{ dynamic: true }`) so the frontend knows to use 5% calculation. If `true`, return the existing fixed fee as before.

4. **Add price caching and native token price lookup (frontend)** — Add `staleTime: 30000` to the existing `/api/prices` query in `send.tsx`, and derive the native token's USD price from `pricesData` using a chain→CoinGecko ID mapping (ETH→ethereum, BNB→binancecoin, TRX→tron, SOL→solana).

5. **Create fee calculator utility** — Add a pure `calculateTransferFee(transferUsd, nativeTokenPriceUsd)` function (inline in send.tsx or a small lib file) that returns `{ feeUsd, feeInNativeToken }` at 5% rate with up to 8 decimal precision.

6. **Live fee computation in send.tsx** — Derive `effectiveFeeToken` and `effectiveFeeUsd` from either the dynamic calculation or the fixed fee data depending on the `feeData.dynamic` flag from the API. Recompute whenever `usdAmount` or prices change.

7. **Replace fee display section** — Replace the static "Network Fee" card with a live summary showing Transfer Amount (USD), Fee (token + USD), and Total Cost (USD). Show a spinner while prices load and an error note if unavailable. Hidden for email/ID mode. Do not label or hint at the method used.

8. **Update confirm dialog and insufficient balance checks** — In the confirmation dialog, show `effectiveFeeToken` and `effectiveFeeUsd`. Replace the `gasBalance < gasRequired` gate with `gasBalance < effectiveFeeToken`. Update the insufficient gas dialog to display the actual fee amount the user is short.

9. **Add Fixed Fee toggle to admin users list** — In `admin-users.tsx`, add a "Fixed Fee" toggle per user card (matching the style of the existing "Send:" toggle). Wire it to the new `PATCH /api/admin/users/:userId/fee-method` route. Show current state from user data returned by `GET /api/admin/users`.

## Relevant files
- `server/models.ts`
- `server/storage.ts`
- `server/routes.ts`
- `client/src/pages/send.tsx:1-782`
- `client/src/pages/admin-users.tsx`