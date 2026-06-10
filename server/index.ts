import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { connectDB } from "./db";

const app = express();

// Trust proxy for production (required for Render, Heroku, etc.)
// This allows Express to correctly identify secure connections behind reverse proxies
if (process.env.NODE_ENV === "production") {
  app.set('trust proxy', 1);

  // Force HTTPS in production — redirect any plain HTTP requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    isAdmin?: boolean;
    role?: 'admin' | 'user';
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Session configuration
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET environment variable must be set in production");
}

// Use a stable dev fallback so sessions survive server restarts during development.
// In production SESSION_SECRET must be set via environment variable.
const DEV_SESSION_SECRET = "lumirra-dev-session-secret-stable-2024";

const sessionParser = session({
  secret: process.env.SESSION_SECRET || DEV_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax', // Allow cookie to be sent on page refresh
  }
});

app.use(sessionParser);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Connect to MongoDB
  await connectDB();
  
  // Initialize database storage before handling any requests
  await storage.init();
  
  // Start background jobs for price alerts and market news
  const { startBackgroundJobs } = await import("./services/background-jobs");
  startBackgroundJobs();
  
  const server = await registerRoutes(app, sessionParser);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In development, prevent the browser from HTTP-caching Vite pre-bundled dep
  // files. Vite serves them with max-age=31536000,immutable which causes stale
  // React chunk conflicts when Vite re-optimizes deps mid-session. Intercepting
  // the setHeader call forces Cache-Control: no-store for every dep response.
  if (app.get("env") === "development") {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const p = req.path;
      if (
        p.includes("/node_modules/.vite/deps/") ||
        p.startsWith("/@fs/") ||
        p.startsWith("/@vite/") ||
        p.startsWith("/@react-refresh")
      ) {
        const orig = res.setHeader.bind(res) as typeof res.setHeader;
        (res as any).setHeader = function (name: string, value: any) {
          if (typeof name === "string" && name.toLowerCase() === "cache-control") {
            return orig(name, "no-store");
          }
          return orig(name, value);
        };
      }
      next();
    });
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
