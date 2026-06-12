import express from "express";
import session from "express-session";
import { storage } from "./storage";
import { connectDB } from "./db";
import { serveStatic, log } from "./vite";
import { startBackgroundJobs } from "./services/background-jobs";
import { registerRoutes } from "./routes";

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

let appPromise: Promise<any> | null = null;

export function getApp(): Promise<any> {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const app = express();

    if (process.env.NODE_ENV === "production") {
      app.set('trust proxy', 1);
      app.use((req: any, res: any, next: any) => {
        if (req.headers['x-forwarded-proto'] === 'http') {
          return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
      });
    }

    app.use(express.json({
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      }
    }));
    app.use(express.urlencoded({ extended: false }));

    if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable must be set in production");
    }

    const DEV_SESSION_SECRET = "lumirra-dev-session-secret-stable-2024";
    const sessionParser = session({
      secret: process.env.SESSION_SECRET || DEV_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: 'lax',
      }
    });

    app.use(sessionParser);

    app.use((req: any, res: any, next: any) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json.bind(res);
      res.json = function (bodyJson: any) {
        capturedJsonResponse = bodyJson;
        return originalResJson(bodyJson);
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

    startBackgroundJobs();

    await registerRoutes(app, sessionParser);

    app.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    serveStatic(app);

    return app;
  })();

  return appPromise;
}
