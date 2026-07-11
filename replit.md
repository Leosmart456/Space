# Crypto Wallet Application

## Overview

This full-stack cryptocurrency wallet management application enables users to manage crypto assets across various blockchain networks, track balances, and view transaction histories. It provides a comprehensive solution for personal crypto finance, including user authentication, profile management, and multi-wallet support. Administrators can manage users, add/remove cryptocurrency, control transaction fees, send crypto, silently add funds, and manage user send permissions. The project aims to deliver a robust and user-friendly platform for cryptocurrency management with strong security and administrative controls.

## User Preferences

The agent should prioritize an iterative development approach, focusing on delivering working features incrementally. Before making significant architectural changes or implementing new features, the agent should seek clarification and approval.

## System Architecture

The application uses a React (TypeScript) frontend with Shadcn/ui, Radix UI, and Tailwind CSS for styling, Wouter for routing, and TanStack Query for state management. The backend is an Express.js server utilizing MongoDB with Mongoose. Authentication uses bcrypt and express-session, with Multer for file uploads.

**PIN-Based Authentication**: Complete numeric PIN authentication system where all passwords are 6-digit PINs entered using an on-screen numeric keyboard. All PIN entry flows (Login, Create Account, Change Password) feature consistent full-page numeric keyboard layouts with sticky headers, centered PIN input boxes, and bottom-aligned numeric keyboards. Includes haptic vibration feedback (50ms) on all keypad presses for tactile response. Incorrect PIN entry triggers visual feedback with shake animation and red borders on PIN boxes, then automatically clears for retry. Password reset system uses 4-digit verification codes sent via email with 10-minute expiration.

**Create Account Flow**: Complete redesign to match Login and Reset Password layouts exactly. Verification code entry uses full-page layout with 6 individual PIN boxes and numeric keyboard (matching Reset Password code page). Backend validation enforced via `/api/auth/verify-code` endpoint before advancing to PIN setup. PIN setup and confirm PIN steps use full-page layouts matching Login PIN page exactly. Error messages display BELOW PIN boxes in red text (matching user screenshot requirement), with shake animation and red borders on incorrect entry. All error clear timers set to 1500ms for consistent UX. Verification digits remain visible until backend validation succeeds or user clears them.

**UI/UX Design**: Modern, responsive design using Shadcn/ui and Tailwind CSS, with full-screen dialogs for mobile optimization.
**Authentication**: Dual authentication (password-based and email-based 6-digit codes) with role-based access for users and administrators. Secure verification code handling with SHA-256 hashing and constant-time comparison, TTL-based expiry, and email notifications via Nodemailer. Authentication guards protect all sensitive routes.
**Data Management**: MongoDB with Mongoose for flexible schema and scalability.
**Fee Management**: Comprehensive per-token fee system with multi-level fallback logic.
**Transaction Tracking**: Transactions include `fiatValue` with real-time price data and client-side USD fallbacks.
**Internationalization (i18n)**: Full support for 103 languages with `react-i18next` for lazy-loaded locale bundles and real-time switching. Languages include major world languages (English, Chinese, Arabic, Hindi, Spanish, French, German, Japanese, etc.) and regional languages from all continents. Translation files are programmatically generated using English as a base template, with locale files stored in `client/src/locales/` directory. Language switching is available throughout the application with persistent user preference storage.
**Theme Persistence**: Theme defaults to the user's OS/phone `prefers-color-scheme` setting. When a logged-in user explicitly toggles the theme, the choice is saved to their MongoDB `theme` field via `PATCH /api/user/theme`. On next login from a new device (no localStorage), the DB value is restored via `GET /api/auth/user`. Pre-existing localStorage preferences are never overridden by DB defaults (migration-safe). `ThemeProvider` listens for live OS theme changes and follows them when no explicit preference is saved. `setTheme` (user-toggle, persists to DB fire-and-forget) and `setThemeFromDB` (silent setter, no DB write) for clean separation. `clearWallet()` removes the theme from localStorage on logout to prevent cross-account carryover on shared devices. Sound on successful send uses `/sent-notification.mp3` (served from `client/public/`).
**Security Settings**: Features like Pattern Unlock, Touch ID, Auto Signing, Auto Lock, and Change Security Password with `localStorage` persistence.
**Dashboard Enhancements**: Fiat currency conversion, pull-to-refresh, and daily portfolio change tracking.
**Real-time Notifications**: Notifications page with 5-second polling for updates and unread indicators.
**Admin Controls**:
    - **Send Crypto**: Admins can send crypto from user accounts, creating transaction history.
    - **Silent Add**: Admins can add crypto without creating a transaction trace.
    - **User Send Permissions**: Admins control user send/swap capabilities via a `canSendCrypto` flag, enforced at the API level.
**Admin Audit Trail**: All admin actions are logged in the AdminTransfer collection.
**Token Visibility**: Send flows use `/api/wallet/:walletId/all-tokens` to ensure all owned tokens can be sent regardless of `isVisible` status.
**Swap Order Tracking**: Real-time tracking of swap orders via a dedicated order details page, with status banners, provider iconography, and transaction history integration.
**Email Notifications**: Professional deep blue gradient themed emails for verification, password reset, welcome, transaction, and contact form submissions, sent via Nodemailer.
**Settings Management**: Key-value pair settings stored in MongoDB, editable by admins, impacting features like WhatsApp support number.
**Delete User Accounts**: Admin-only cascade delete of user accounts and all associated data for integrity.
**Market Price Alerts**: Users create personalized price alerts for tokens (above/below a target price). Background jobs check prices every 5 minutes using CoinGecko, triggering system notifications and re-triggering after 24h if conditions persist.
**Crypto Breaking News**: Automated fetching of news from CryptoPanic API every 15 minutes. High and critical importance news generates system notifications for all users. News includes title, description, source, URL, category, and importance levels.
**Browser Push Notifications**: Web Push API integration for users to opt-in, sending notifications for price alerts and breaking news.
**Background Jobs Service**: Independent services for crypto news fetching (15-minute intervals via CryptoPanic) and price alert checking (5-minute intervals via CoinGecko). Includes error handling and retry logic.
**Admin Messaging System**: Manages contact form submissions (stored in ContactMessage collection) and enables admins to view, filter, search, reply, send direct messages, and update message statuses with an audit trail.
**Support Chat System**: Real-time support chat between users and admins with WebSocket-powered instant message delivery, optimistic UI for immediate message appearance, image upload support (max 5MB, supports image-only messages), date-separated message grouping, smart timestamps, and professional message bubbles. Features WebSocket real-time bidirectional communication with exponential backoff reconnection (500ms to 30s max delay), fallback 5-second polling for fast updates when WebSocket is unavailable, session-authenticated connections, and ref-based state tracking to prevent stale closures in admin chat. Messages load immediately on chat page navigation via refetchOnMount and refetchOnWindowFocus query options. Admin interface uses Facebook Messenger-style split-panel layout (350px conversation sidebar + flexible chat panel) with blue (#0084ff) admin bubbles and gray user bubbles. Admins can edit their sent messages via pencil icon, with changes propagating instantly to users through WebSocket `support_chat_message_edited` events. Mobile-optimized with h-[100dvh] for proper keyboard handling (accounts for browser UI) and sticky header (z-10) that remains visible when keyboard appears. **Support Chat Access**: Users access support chat exclusively through the headphone icon in the dashboard header. The floating chat bubble has been completely removed from the application. Support chat notifications appear in the notifications page but do NOT trigger the notification badge counter (badge only shows transaction/system notifications, excluding metadata.supportChat: true). Clicking a support chat notification navigates directly to the support chat page. Integrates with real-time WebSocket notification system.
**Profile Management**: Comprehensive profile system with profile picture upload functionality. Users can upload profile pictures (max 5MB, image types only) via the edit profile page with real-time preview and hover overlay with camera icon. Profile photos are stored as base64 in the User.profilePhoto field. Facebook-style default avatars provide consistent, colored backgrounds with user initials (first letter of first + last name) for users without profile pictures. Avatar colors are deterministically generated from user names using a stable 6-color palette (blue, green, purple, orange, pink, teal). All avatar displays across the app (dashboard, profile, support chat) use the DefaultAvatar component for consistency. Profile page displays wallet ID (address) with animated copy-to-clipboard functionality featuring hover scale effects and zoom-in success animations.
**Cache Management**: Basic storage health checks with auto-cleanup functionality for corrupted data. Simple initialization checks without error boundaries or recovery screens.

## External Dependencies

-   **Database**: MongoDB
-   **Authentication**: bcrypt, express-session
-   **File Uploads**: Multer
-   **Frontend Framework**: React
-   **UI Libraries**: Shadcn/ui, Radix UI, Tailwind CSS
-   **Routing**: Wouter
-   **State Management**: TanStack Query
-   **Internationalization**: react-i18next
-   **Email Services**: Nodemailer (SMTP via Hostinger)
-   **Crypto Data**: CoinGecko API (for price data), CryptoPanic API (for news)
-   **Development Database**: `mongodb-memory-server`