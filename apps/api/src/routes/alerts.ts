import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { StoreAccessRequest } from "../middleware/requireStoreAccess.js";

const router = Router({ mergeParams: true });

router.get("/", async (req: StoreAccessRequest, res) => {
  let store = null;
  if (req.userId) {
    store = await prisma.store.findFirst({
      where: { id: req.params.storeId, ownerId: req.userId }
    });
  } else if (req.store && req.store.id === req.params.storeId) {
    store = req.store;
  }
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

router.post("/:alertId/resolve", async (req: StoreAccessRequest, res) => {
  let store = null;
  if (req.userId) {
    store = await prisma.store.findFirst({
      where: { id: req.params.storeId, ownerId: req.userId }
    });
  } else if (req.store && req.store.id === req.params.storeId) {
    store = req.store;
  }
  if (!store) return res.status(404).json({ error: "Store not found" });

  const updated = await prisma.alert.update({
    where: { id: req.params.alertId },
    data: { resolvedAt: new Date() }
  });
  return res.json(updated);
});

export default router;
