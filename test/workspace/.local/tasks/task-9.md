---
title: Dark theme as default + save theme preference to database
---
# Dark Theme Default & DB Persistence

## What & Why
Two related theme improvements:
1. Dark mode should be the **default** experience for all new and returning users who have never set a preference.
2. When a logged-in user changes their theme, the preference should be saved to their database record and restored on next login — so the choice follows them across devices and browsers.

## Done looks like
- First-time visitors (no stored preference) see dark mode immediately on load.
- Toggling the theme while logged in persists the choice to the database; logging in from a different browser shows the same theme.
- Logging out and back in restores the user's saved theme.
- Users who have an existing `localStorage` preference continue to use it until they explicitly change it.

## Out of scope
- No changes to which themes are available (dark / light only).
- No theme picker UI — the existing toggle is kept as-is.
- No changes for non-logged-in users beyond defaulting to dark.

## Tasks
1. **Change default theme** — Update `ThemeProvider` in `App.tsx` to pass `defaultTheme="dark"` so first-time visitors start in dark mode.
2. **Backend: add theme field** — Add a `theme` field (`"light" | "dark"`, default `"dark"`) to the User Mongoose model and expose a `PATCH /api/user/theme` endpoint that requires auth and accepts `{ theme }`, saving it to the user record. Also return `theme` in the existing `GET /api/user` response.
3. **Frontend: sync theme with DB** — In `ThemeProvider` (or a thin hook used by it), after a successful auth check (`GET /api/auth/user`), overwrite the local theme with the user's DB value if present. When the user toggles the theme, call `PATCH /api/user/theme` in the background (fire-and-forget, no blocking UI).

## Relevant files
- `client/src/App.tsx:179`
- `client/src/components/theme-provider.tsx`
- `server/models.ts`
- `server/routes.ts`
- `server/storage.ts`
- `shared/schema.ts`