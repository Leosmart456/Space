---
name: Missing backend routes causing 405 errors
description: Known frontend→backend route mismatches that were fixed
---

# Fixed 405 Route Mismatches

## Fixes Applied

1. **websocket.tsx `/api/user` → `/api/auth/user`**  
   The WebSocket manager's auth-check fetch used `/api/user` but the real endpoint is `/api/auth/user`.

2. **`PUT /api/admin/support-chats/:chatId/mark-read`** (added to routes.ts)  
   Called from `admin-dashboard.tsx` and `admin-support-chat.tsx` when a chat is selected. Resets `unreadAdminCount` to 0 on the SupportChat document by `_id`.

3. **`GET /api/admin/users/by-wallet/:walletId`** (added to routes.ts)  
   Called from `admin-search.tsx` when searching by wallet ID. Looks up user by wallet `_id`, returns user + their wallets with tokens. Must be registered BEFORE the `/:userId` catch-all route.

**Why:** These routes were called in the frontend but never defined on the backend, causing 405 Method Not Allowed responses.
