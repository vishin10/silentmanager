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

  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const shifts = await prisma.shift.findMany({
    where: {
      storeId: store.id,
      startAt: {
        gte: from,
        lte: to
      }
    },
    orderBy: { startAt: "desc" }
  });
  return res.json(shifts);
});

router.get("/:shiftId", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const store = await prisma.store.findFirst({
    where: { id: req.params.storeId, ownerId: req.userId }
  });
  if (!store) return res.status(404).json({ error: "Store not found" });

  const shift = await prisma.shift.findFirst({
    where: { id: req.params.shiftId, storeId: store.id },
    include: { deptSales: true }
  });
  if (!shift) return res.status(404).json({ error: "Shift not found" });
  return res.json(shift);
});

export default router;
