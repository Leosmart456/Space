import { getApp } from "./app";
import type { Request, Response } from "express";

const appPromise = getApp().catch((err) => {
  console.error("[Vercel] Fatal: app initialization failed:", err);
  return null;
});

export default async function handler(req: Request, res: Response) {
  try {
    const app = await appPromise;
    if (!app) {
      res.status(500).json({ error: "Server initialization failed. Check MONGODB_URI and SESSION_SECRET environment variables in Vercel." });
      return;
    }
    app(req, res);
  } catch (err: any) {
    console.error("[Vercel] Handler error:", err);
    res.status(500).json({ error: "Internal server error", message: err?.message });
  }
}
