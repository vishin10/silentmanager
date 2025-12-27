import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/requireAuth.js";

const router = Router({ mergeParams: true });

router.get("/", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const store = await prisma.store.findFirst({
    where: { id: req.params.storeId, ownerId: req.userId }
  });
  if (!store) return res.status(404).json({ error: "Store not found" });

  const unresolvedOnly = req.query.unresolvedOnly === "true";
  const alerts = await prisma.alert.findMany({
    where: {
      storeId: store.id,
      resolvedAt: unresolvedOnly ? null : undefined
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json(alerts);
});

router.post("/:alertId/resolve", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const store = await prisma.store.findFirst({
    where: { id: req.params.storeId, ownerId: req.userId }
  });
  if (!store) return res.status(404).json({ error: "Store not found" });

  const updated = await prisma.alert.update({
    where: { id: req.params.alertId },
    data: { resolvedAt: new Date() }
  });
  return res.json(updated);
});

export default router;
