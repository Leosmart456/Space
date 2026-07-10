---
name: Email error propagation in API server
description: How sendEmail re-throws and which routes must handle it
---

**Rule:** `sendEmail()` in `email.ts` re-throws on failure. Callers must handle appropriately.

**Why:** Previously `sendEmail` caught errors silently. This meant OTP routes returned `{ ok: true }` even when the email never sent — the user got no code and no error message. Fixing required re-throwing so routes can surface proper errors.

**Two patterns to use:**

1. **OTP / verification emails** (user MUST receive email to proceed):
   ```ts
   try {
     await sendSignInCode(email, otp);
     res.json({ ok: true });
   } catch {
     res.status(500).json({ error: "Failed to send sign-in code. Please try again." });
   }
   ```

2. **Fire-and-forget notifications** (admin alerts, transfer notifications — request already saved):
   ```ts
   sendTransferRequestNotificationToAdmin({...}).catch((err: unknown) => {
     console.error("Failed to send notification email:", err);
   });
   ```

3. **Security-sensitive** (forgot-password — must not leak email existence):
   ```ts
   sendPasswordResetCode(key, otp).catch((err: unknown) => {
     console.error("Failed to send password reset code:", err);
   });
   res.json({ ok: true }); // always ok to avoid enumeration
   ```

**Routes patched:**
- `/auth/login/otp` — awaits + try/catch (surfaces error)
- `/auth/forgot-password` — fire-and-forget with `.catch()` (security: always returns ok)
- `dashboard.ts` transfer route — `.catch()` added
- `admin.ts` price alert loop — `.catch()` added
