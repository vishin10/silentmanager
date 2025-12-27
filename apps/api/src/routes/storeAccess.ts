import { Router } from "express";
import { requireStoreAccess } from "../middleware/requireStoreAccess.js";

const router = Router();

router.get("/me", requireStoreAccess, (req, res) => {
  if (!req.store) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({
    storeId: req.store.id,
    storeName: req.store.name,
    timezone: req.store.timezone
  });
});

export default router;
