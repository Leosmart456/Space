import { type Request, type Response, type NextFunction } from "express";
import { isValidAdminSession } from "../lib/adminSessions";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.["admin_session"] as string | undefined;
  if (!isValidAdminSession(token)) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}
