import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { hashStoreAccessToken } from "../utils/auth.js";
import { verifyJwt } from "../utils/auth.js";

export interface StoreAccessRequest extends Request {
  userId?: string;
  store?: { id: string; name: string; timezone: string };
}

const getBearerToken = (req: Request) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "");
};

export const requireStoreAccess = async (req: StoreAccessRequest, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing store access token" });
  }
  const hashed = hashStoreAccessToken(token);
  const store = await prisma.store.findFirst({
    where: { storeAccessTokenHash: hashed }
  });
  if (!store) {
    return res.status(401).json({ error: "Invalid store access token" });
  }
  req.store = { id: store.id, name: store.name, timezone: store.timezone };
  return next();
};

export const requireAuthOrStoreAccess = async (
  req: StoreAccessRequest,
  res: Response,
  next: NextFunction
) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  try {
    const payload = verifyJwt(token);
    req.userId = payload.userId;
    return next();
  } catch {
    const hashed = hashStoreAccessToken(token);
    const store = await prisma.store.findFirst({
      where: { storeAccessTokenHash: hashed }
    });
    if (!store) {
      return res.status(401).json({ error: "Invalid auth token" });
    }
    req.store = { id: store.id, name: store.name, timezone: store.timezone };
    return next();
  }
};
