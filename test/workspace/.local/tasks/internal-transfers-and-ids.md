# Internal Transfers, 11-digit IDs & Admin Audit

  ## What & Why
  Extend the wallet's send flow to support user-to-user internal transfers (by email or 11-digit user ID), introduce unique 11-digit numeric IDs for all users (existing and new), enforce zero-fee for internal transfers, create double-sided transaction history, and verify all admin features are functional.

  ## Done looks like
  - Every user (existing and new) has a unique 11-digit numeric ID stored on their profile and visible in the app.
  - On the Send screen, a user can type another user's email address or 11-digit ID and the app recognises it as an internal transfer.
  - Internal transfers (user-to-user) skip the fee check entirely — no fee is shown or deducted.
  - When an internal transfer completes, the sender gets a "send" transaction record and the recipient gets a "receive" transaction record, both with correct counterparty labels.
  - Both sender and recipient receive in-app notifications for the transfer.
  - All existing admin pages (add crypto, remove crypto, send crypto, silent add, user fees, messages, support chat, transactions, user management) load and function correctly with no console errors.

  ## Out of scope
  - Cross-chain internal transfers (sender and recipient must hold the same token on the same chain).
  - Admin-facing UI for internal transfer history (admins can already see all transactions).
  - Email notifications for internal transfers (system notifications only).

  ## Tasks
  1. **Add 11-digit numeric userId field** — Add a `userId` field (String, unique, 11-digit) to the User Mongoose model. On server startup, generate and backfill this field for any user that lacks it. Ensure new user signup also generates this ID. Expose `userId` in all user-facing auth endpoints (`/api/auth/user`, `/api/auth/signup`) and in admin user list/detail endpoints so the admin dashboard can display it.

  2. **Resolve internal transfer recipient** — Add a backend endpoint `POST /api/users/resolve` (authenticated) that accepts an `{ query }` string and returns the matched user's name, userId, walletId, and wallet address if the query matches a registered user's email or 11-digit userId. Returns 404 if no match or if the query matches the caller themselves.

  3. **Internal transfer route (no fee, double-sided history)** — Add `POST /api/wallet/:walletId/send-internal` that validates the sender's balance, skips all fee checks, deducts from the sender's token balance, adds to the recipient's same token (creating the token if absent), creates a confirmed "send" transaction for the sender and a confirmed "receive" transaction for the recipient, and emits WebSocket notifications for both parties.

  4. **Update Send UI for internal transfers** — On the send page, after the user types a recipient address, debounce-call `/api/users/resolve`. If the query resolves to an internal user, show a green "Internal transfer — no fee" banner and hide the fee section entirely. Submitting uses `/api/wallet/:walletId/send-internal` instead of the normal send route. If the query does not resolve, the existing external-send flow is used unchanged.

  5. **Display 11-digit ID in user profile and admin dashboard** — Show the 11-digit `userId` on the user profile page next to the wallet address (with the same copy-to-clipboard animation). In the admin user list, display the 11-digit ID as a copyable field for each user so admins can look users up by it.

  6. **Admin feature audit and fixes** — Test all admin routes and pages. Fix any broken endpoints or UI issues found: add-crypto, remove-crypto, send-crypto, silent-add, user-fees, messages, support-chat, transactions, user management (toggle send permission, delete user).

  ## Relevant files
  - `server/models.ts`
  - `server/routes.ts`
  - `server/storage.ts`
  - `client/src/pages/send.tsx`
  - `client/src/pages/send-list.tsx`
  - `client/src/pages/profile.tsx`
  - `client/src/pages/admin-users.tsx`
  - `client/src/pages/admin-dashboard.tsx`
  - `shared/schema.ts`
  