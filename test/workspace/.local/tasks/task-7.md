---
title: Send page: remove fee card & redesign insufficient-fee dialog
---
# Send Page: Fee Card Removal & Insufficient Fee Dialog Redesign

  ## What & Why
  Two focused UI changes to the Send page:
  1. Remove the Transfer/Fee/Total fee summary card that shows below the amount inputs — it is redundant noise before the user confirms.
  2. Redesign the "Insufficient Gas" dialog to match a reference design: a clean "Details" modal that shows the token + amount being sent, From/To addresses, the Network Fee (amount in native token ≈ USD equivalent), and an orange warning line explaining the shortfall. Cancel and Confirm buttons at the bottom.

  ## Done looks like
  - The Transfer/Fee/Total card is gone from the Send page — the amount section goes straight to the Memo field and Next button.
  - Tapping "Next" when the user has insufficient balance for the network fee opens a "Details" dialog that shows:
    - Token icon + amount + symbol + chain/network name
    - "From" row with truncated sender address
    - "To" row with truncated recipient address
    - "Network Fee" row: fee in native token ≈ USD (e.g. "13.0285 TRX ≈ $4.11")
    - Orange/amber warning text: "Your [TOKEN] is not enough to pay gas fee, please add more [TOKEN] to your wallet or select other options."
    - Cancel button (dismisses) and Confirm button (disabled or grayed when insufficient)

  ## Out of scope
  - No changes to the fee calculation logic itself
  - No changes to the confirm dialog shown when the user CAN afford the fee
  - No backend changes

  ## Tasks
  1. **Remove fee summary card** — Delete the Transfer/Fee/Total block from the Send page (the section rendered by `showFeeCard`), keeping all the state and logic intact since it is still used by the confirm dialog.
  2. **Redesign insufficient-balance dialog** — Replace the current "Insufficient Balance" dialog with a "Details"-style modal matching the reference screenshot: token icon + amount + network, From/To address rows, Network Fee row with native amount ≈ USD, orange warning text, and Cancel/Confirm buttons.

  ## Relevant files
  - `client/src/pages/send.tsx`