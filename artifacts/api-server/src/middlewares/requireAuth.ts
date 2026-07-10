import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { User } from "../lib/models";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { userId: string }).userId = payload.userId;
  next();
}

export async function requireEnabledUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { userId: string }).userId = payload.userId;

  const user = await User.findById(payload.userId, { isEnabled: 1 });
  if (!user || !user.isEnabled) {
    res.status(403).json({ error: "Account pending approval", code: "ACCOUNT_PENDING" });
    return;
  }
  next();
}
