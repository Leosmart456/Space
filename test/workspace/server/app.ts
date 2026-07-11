import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { connectDB } from "./db";
import { serveStatic, log } from "./vite";
import { registerRoutes } from "./routes";
import { MongoSessionStore } from "./utils/session-store";
import type { Express } from "express";

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

let appPromise: Promise<Express> | null = null;

export function getApp(): Promise<Express> {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const app = express();

    app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin || "*";
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    });

    if (process.env.NODE_ENV === "production") {
      app.set('trust proxy', 1);
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.headers['x-forwarded-proto'] === 'http') {
          return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
      });
    }

    app.use(express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    }));
    app.use(express.urlencoded({ extended: false }));

    if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable must be set in production");
    }

    const DEV_SESSION_SECRET = "lumirra-dev-session-secret-stable-2024";

    const isVercel = !!process.env.VERCEL;
    const sessionStore = (process.env.NODE_ENV === "production" || isVercel)
      ? new MongoSessionStore()
      : undefined;

    const sessionParser = session({
      secret: process.env.SESSION_SECRET || DEV_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: 'lax',
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

    await connectDB();
    await storage.init();

    if (!isVercel) {
      const { startBackgroundJobs } = await import("./services/background-jobs");
      startBackgroundJobs();
    }

    await registerRoutes(app, sessionParser);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    serveStatic(app);

    return app;
  })();

  return appPromise;
}
