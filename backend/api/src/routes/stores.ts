import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/requireAuth.js";

const router = Router();

router.post("/", async (req: AuthRequest, res) => {
  const schema = z.object({ name: z.string().min(2), timezone: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.userId) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const store = await prisma.store.create({
    data: {
      ownerId: req.userId,
      name: parsed.data.name,
      timezone: parsed.data.timezone || "America/New_York"
    }
  });
  return res.json(store);
});

router.get("/", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const stores = await prisma.store.findMany({ where: { ownerId: req.userId } });
  return res.json(stores);
});

export default router;
