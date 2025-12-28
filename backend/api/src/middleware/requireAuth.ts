import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/auth.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  
  // Allow requests without token (will be handled in routes)
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }
  
  const token = header.replace("Bearer ", "");
  try {
    const payload = verifyJwt(token);
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid auth token" });
  }
};