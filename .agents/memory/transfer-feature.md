---
name: Transfer Feature Architecture
description: Transfer system design decisions — OTP, statuses, data model, and email flow
---

## Transfer Data Model (ITransfer)
- `mode`: "brokerage" | "internal" — distinguishes brokerage vs user-to-user
- `requestId`: "TRF-YYYYMMDD-XXXX" auto-generated on submission
- Status enum (full): `queued | transfer_requested | pending_review | under_review | awaiting_documents | approved | processing | completed | rejected`
  - Old statuses (queued, transfer_requested) kept for backward compat with existing MongoDB docs
  - New submissions default to `pending_review`

## OTP Flow for Transfer Verification
- In-memory Map `transferOtpStore` keyed by `userId` (same pattern as loginOtpStore in auth.ts)
- `POST /dashboard/transfers/send-otp` — sends 6-digit code to user's registered email, 10-min expiry
- OTP consumed (deleted) before transfer creation in `POST /dashboard/transfers`
- `requireAuth` (not `requireEnabledUser`) on send-otp; `requireEnabledUser` on submit
- Known limitation: no rate limiting (consistent with existing auth pattern)

## Email Functions Added
- `sendTransferVerificationCode(to, fullName, code)` — OTP email for identity verification
- `sendTransferConfirmationToUser(data)` — confirmation email after successful submission
- `sendTransferRequestNotificationToAdmin(data)` — updated to handle both modes with new fields; fire-and-forget (`.catch()`) in dashboard.ts

## Web Transfer Page (multi-step flow)
- Steps: choose → form-brokerage | form-internal → otp → review → success
- BROKERS array with logo paths `/brokers/<name>.<ext>` from public folder
- BrokerSelect: searchable dropdown with logo images and text fallback
- Syntax note: ternary arrays inside JSX `{}` cause Babel parse errors; extract to IIFE or const variable first

## Mobile Transfer Screen
- Replaced `portfolio` tab in `_layout.tsx` with `transfer` (same file pattern)
- `/(tabs)/portfolio` link in `index.tsx` updated to `/(tabs)/transfer`
- Broker selection uses native Modal + FlatList (no logo images on mobile)
- `router.push` invalid typed route cast with `as Parameters<typeof router.push>[0]`

## Admin Transfer Section
- Replaced fixed action buttons (Approve/Complete) with a `<select>` dropdown for all 7 statuses
- Table now shows: requestId, mode badge, destination/recipient details, asset/amount, status, dropdown
