---
name: API server env var restart
description: Newly set/updated secrets are not picked up by a running workflow until it restarts
---

When a secret or env var (e.g. `MONGODB`) is added or changed via the environment-secrets tool, the currently running workflow process still has the old (or missing) value in its process environment. The workflow must be explicitly restarted before the new value takes effect.

**Why:** Diagnosed a case where the API server was crash-looping because it couldn't connect to MongoDB, even though `MONGODB` was set correctly — the workflow just hadn't picked up the value yet. This surfaced to the user as "email failed to send," which was a misleading symptom of the server being down, not a bug in the email-sending code itself.

**How to apply:** When debugging a "downstream" failure (email, DB writes, third-party API calls) right after a secret was added/changed, first check if the relevant server/workflow needs a restart before digging into the feature's code.

## Debugging Resend "domain not verified" errors
If `sendEmail()` fails with "domain not verified" even though the user says the domain shows verified in the Resend dashboard, don't trust the dashboard state alone — call `POST https://api.resend.com/emails` directly with curl using the current `RESEND_API_KEY` and see the real error. Root causes seen in practice: (1) the API key itself was stale/regenerated after domain verification — a fresh key from Resend resolved it immediately with no other changes; (2) domain DNS not fully propagated despite dashboard showing "verified" state lagging. Always re-test after any key rotation via `requestEnvVar` (never reuse a key pasted in chat — request it through the secrets flow) and restart the workflow before concluding the domain itself is misconfigured.
