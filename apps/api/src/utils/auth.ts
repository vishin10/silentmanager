import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const jwtSecret = process.env.JWT_SECRET || "dev-secret";

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const signJwt = (payload: { userId: string }) =>
  jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

export const verifyJwt = (token: string) => jwt.verify(token, jwtSecret) as { userId: string };

export const generateDeviceKey = () => {
  const apiKey = crypto.randomBytes(32).toString("base64url");
  const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const apiKeyLast4 = apiKey.slice(-4);
  return { apiKey, apiKeyHash, apiKeyLast4 };
};

export const hashDeviceKey = (apiKey: string) =>
  crypto.createHash("sha256").update(apiKey).digest("hex");

export const generateStoreAccessToken = () => {
  const storeAccessToken = crypto.randomBytes(32).toString("base64url");
  const storeAccessTokenHash = crypto.createHash("sha256").update(storeAccessToken).digest("hex");
  const storeAccessTokenLast4 = storeAccessToken.slice(-4);
  return { storeAccessToken, storeAccessTokenHash, storeAccessTokenLast4 };
};

export const hashStoreAccessToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
