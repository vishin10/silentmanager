import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { generateDeviceKey } from "../utils/auth.js";
import { AuthRequest } from "../middleware/requireAuth.js";

const router = Router({ mergeParams: true });

router.post("/", async (req: AuthRequest, res) => {
  const schema = z.object({ name: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.userId) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const store = await prisma.store.findFirst({
    where: { id: req.params.storeId, ownerId: req.userId }
  });
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }
  const { apiKey, apiKeyHash, apiKeyLast4 } = generateDeviceKey();
  const device = await prisma.device.create({
    data: {
      storeId: store.id,
      name: parsed.data.name,
      apiKeyHash,
      apiKeyLast4
    }
  });
  return res.json({ device, apiKey });
});

router.get("/", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const store = await prisma.store.findFirst({
    where: { id: req.params.storeId, ownerId: req.userId }
  });
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }
  const devices = await prisma.device.findMany({ where: { storeId: store.id } });
  const masked = devices.map((device) => ({
    ...device,
    apiKeyHash: "hidden",
    apiKeyLast4: device.apiKeyLast4
  }));
  return res.json(masked);
});

export default router;
