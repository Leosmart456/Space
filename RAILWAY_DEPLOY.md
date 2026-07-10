# Deploying to Railway

This repo now deploys to Railway as a **single service**: the API server
builds the frontend into its own `dist/` folder and serves it directly, so
there's one Docker image, one Railway service, one URL, and no CORS setup
needed. (The mobile app and the design canvas are Replit-only dev tools and
are not part of the Railway deployment.)

## One-time setup on Railway

1. Create a new Railway project from this GitHub repo.
2. Railway will detect `railway.json` and build with the included `Dockerfile`
   automatically — no manual build/start command needed.
3. Add a **MongoDB** database (Railway's "New" → "Database" → "Add MongoDB",
   or use MongoDB Atlas) and copy its connection string.
4. Set the environment variables below on the Railway service (Settings →
   Variables). These map to the Replit secrets this project currently uses —
   copy the real values from wherever they're stored today, they are not in
   the code:

   | Variable | Purpose | Required |
   |---|---|---|
   | `MONGODB` | MongoDB connection string | Yes |
   | `JWT_SECRET` | Signs auth tokens | Yes |
   | `ADMIN_USERNAME` | Admin login username | Yes |
   | `ADMIN_PASSWORD` | Admin login password | Yes |
   | `SMTP_HOST` | Outgoing email host | Yes (for emails/OTP) |
   | `SMTP_PORT` | Outgoing email port | Yes |
   | `SMTP_USER` | Outgoing email username | Yes |
   | `SMTP_PASS` | Outgoing email password | Yes |
   | `EMAIL_DOMAIN` | Domain used in outgoing email addresses | Yes |
   | `EMAIL_FROM` | "From" address for outgoing email | Recommended |
   | `ADMIN_NOTIFICATION_EMAIL` | Where admin alerts are sent | Recommended |
   | `PLATFORM_URL` | Public URL of the deployed app (e.g. `https://your-app.up.railway.app`) — used in email links | Yes |
   | `SHARE_PRICE_SEED` | Initial share price if none set yet | Optional (defaults to 130.00) |
   | `LOG_LEVEL` | Log verbosity (`info`, `debug`, etc.) | Optional |
   | `LOGODEV_TOKEN` / `BRANDFETCH_CLIENT_API` | Broker logo fetching | Optional |
   | `RESEND_API_KEY` | Only if using Resend instead of SMTP | Optional |

   Do **not** set `PORT` — Railway assigns it automatically and the server
   already reads `process.env.PORT`.

5. Deploy. Railway will build the Docker image and start the container.
6. Health check: Railway polls `/api/healthz`, matching what's configured in
   `railway.json`.

## How it works

- `Dockerfile` builds the React frontend (`artifacts/spacex-platform`) and the
  Express API (`artifacts/api-server`) in one image, then runs only the API
  server in production.
- The API server (`artifacts/api-server/src/app.ts`) serves the built frontend
  as static files and falls back to `index.html` for client-side routes, so
  the whole app — UI and API — is one process on one port.
- The frontend calls the API via a same-origin relative path (`/api/...`), so
  no API base URL configuration or CORS setup is needed on Railway.

## Redeploying after code changes

Push to the branch Railway is watching (or trigger a manual deploy from the
Railway dashboard) — it rebuilds the Docker image from scratch each time.
