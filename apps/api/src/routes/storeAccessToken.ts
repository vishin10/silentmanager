import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { generateStoreAccessToken } from "../utils/auth.js";

const router = Router({ mergeParams: true });

router.post("/", async (req, res) => {
  const adminSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (adminSecret) {
    const provided = req.headers["x-admin-secret"];
    if (provided !== adminSecret) {
      return res.status(401).json({ error: "Missing admin secret" });
    }
  }

  const store = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }

  const { storeAccessToken, storeAccessTokenHash, storeAccessTokenLast4 } =
    generateStoreAccessToken();

  await prisma.store.update({
    where: { id: store.id },
    data: {
      storeAccessTokenHash,
      storeAccessTokenLast4,
      storeAccessTokenCreatedAt: new Date()
    }
  });

  return res.json({ storeAccessToken });
});

export default router;
