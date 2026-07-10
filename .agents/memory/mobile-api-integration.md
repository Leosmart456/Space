---
name: Mobile API integration
description: How the mobile app connects to the real API server with JWT auth
---

The mobile app connects to the Express/MongoDB API server via `artifacts/mobile/lib/api.ts`.

**Base URL**: `https://${EXPO_PUBLIC_DOMAIN}/api` (env var set in workflow: `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN`).

**Token semantics in `apiFetch`:**
- `token: undefined` (default) — attach stored JWT from AsyncStorage if available
- `token: null` — send NO Authorization header (for public endpoints like `/auth/login`, `/auth/create-account`, OTP routes)
- `token: "string"` — use that token directly

**Why:** Original rewrite had a bug where `token: null` still attached the stored token, tainting unauthenticated auth requests.

**AuthContext** stores JWT in AsyncStorage under `@spacex_jwt`. Cached user profile stored under `@spacex_cached_user` for offline display.

**How to apply:** Any new API call to a public (unauthenticated) endpoint must pass `token: null` to avoid attaching stale JWT.
