---
title: Send page UX: bottom-sheet dialogs, virtual wallet in From, success sound
---
# Send Page UX Polish: Dialogs, Wallet Address & Sound

## What & Why
Four focused UX improvements to the send flow:
1. Both the "Details" (insufficient fee) dialog and the email/ID send confirmation dialog should slide up as bottom-sheet panels taking roughly 55–60 % of the screen height — slightly taller than the current half-page style so content fits without scrolling.
2. The **From** field in both dialogs should display the sender's internal Lumirra virtual wallet address (the user's `userId` field from the user record, e.g. "LM-XXXX"), not the blockchain on-chain address.
3. A short success sound (a pleasant chime) should play at the exact moment the checkmark animation appears inside the processing overlay — i.e. when `showSuccess` becomes `true` (roughly 1 second before the overlay closes).

## Done looks like
- Tapping "Next" (insufficient gas) → Details panel slides up from the bottom, occupying ~55–60% of viewport height, with a drag handle at the top.
- Tapping "Next" (email/ID flow) → Confirm Send panel slides up from the bottom at the same height.
- The "From" label in both panels shows the user's internal Lumirra ID (e.g. `LM-3F2A…`) truncated for display, not a blockchain hex/base58 address.
- The moment the spinning loader switches to the green checkmark in the processing overlay, a short chime plays once (no looping, no autoplay policy issues — triggered by the confirmed user gesture earlier in the flow).

## Out of scope
- No changes to the send confirmation dialog used for address-mode external sends beyond making it a bottom sheet.
- No changes to how the fee or amount values are calculated.
- No changes to the theme system (separate task).

## Tasks
1. **Bottom-sheet dialogs** — Convert both the insufficient-fee "Details" dialog and the email/ID "Confirm Send" dialog to bottom-sheet panels by overriding the Shadcn DialogContent positioning to `fixed bottom-0 left-0 right-0` with `rounded-t-2xl`, a drag-handle indicator, and a height of roughly `55vh`. Add slide-in-from-bottom animation overrides.
2. **Virtual wallet address in From** — Replace the blockchain `walletAddress` (chain on-chain address) in the From row of both dialogs with `userData?.userId` (the Lumirra internal wallet ID), truncated for display (e.g. first 8 … last 6 chars).
3. **Success chime sound** — Add a short MP3/OGG chime asset to `client/src/assets/` and play it inside `ProcessingOverlay` via the Web Audio API (or a simple `new Audio()` call) the instant `showSuccess` becomes `true`.

## Relevant files
- `client/src/pages/send.tsx`
- `client/src/components/processing-overlay.tsx`