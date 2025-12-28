import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/requireAuth.js";

const router = Router();

router.post("/", async (req: AuthRequest, res) => {
  const schema = z.object({ name: z.string().min(2), timezone: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  
  // Get userId from token, or find the first user (for initial setup)
  let userId = req.userId;
  
  if (!userId) {
    // No token provided, try to get the first user (for initial setup)
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return res.status(400).json({ error: "No user found. Please register first." });
    }
    userId = firstUser.id;
  }
  
  const store = await prisma.store.create({
    data: {
      ownerId: userId,
      name: parsed.data.name,
      timezone: parsed.data.timezone || "America/New_York"
    }
  });
  return res.json(store);
});

router.get("/", async (req: AuthRequest, res) => {
  // Get userId from token, or find the first user
  let userId = req.userId;
  
  if (!userId) {
    // No token provided, try to get the first user
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      // No users exist yet, return empty array
      return res.json([]);
    }
    userId = firstUser.id;
  }
  
  const stores = await prisma.store.findMany({ where: { ownerId: userId } });
  return res.json(stores);
});

export default router;