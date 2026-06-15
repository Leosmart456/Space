import { createServer } from "http";
import { registerRoutes } from "./routes";
import { log } from "./logger";
import { storage } from "./storage";
import { connectDB } from "./db";
import { getApp } from "./app";
import session from "express-session";
import { type Request, Response, NextFunction } from "express";

(async () => {
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

  // In development use the full server with Vite + WebSockets
  if (process.env.NODE_ENV !== "production") {
    const express = (await import("express")).default;
    const app = express();

    app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
    app.use(express.urlencoded({ extended: false }));
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
          if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
          log(logLine);
        }
      });
      next();
    });

    await connectDB();
    await storage.init();

    const { startBackgroundJobs } = await import("./services/background-jobs");
    startBackgroundJobs();

    const server = await registerRoutes(app, sessionParser);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

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

    const { setupVite } = await import("./vite");
    await setupVite(app, server);

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`serving on port ${port}`);
    });
  } else {
    // In production (non-Vercel), use the shared app and listen
    const app = await getApp();
    const server = createServer(app);
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
