import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // Ensure this is a regular user session, not admin
  if (req.session.role === 'admin') {
    return res.status(403).json({ error: "This endpoint is for wallet users only" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // Check for admin role
  if (req.session.role !== 'admin' && !req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
