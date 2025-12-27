import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import storeRoutes from "./routes/stores.js";
import deviceRoutes from "./routes/devices.js";
import ingestRoutes from "./routes/ingest.js";
import alertRoutes from "./routes/alerts.js";
import shiftRoutes from "./routes/shifts.js";
import chatRoutes from "./routes/chat.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { requireAuthOrStoreAccess } from "./middleware/requireStoreAccess.js";
import storeAccessRoutes from "./routes/storeAccess.js";
import storeAccessTokenRoutes from "./routes/storeAccessToken.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/store-access", storeAccessRoutes);
app.use("/api/stores/:storeId/access-token", storeAccessTokenRoutes);
app.use("/api/stores", requireAuth, storeRoutes);
app.use("/api/stores/:storeId/devices", requireAuth, deviceRoutes);
app.use("/api/stores/:storeId/alerts", requireAuthOrStoreAccess, alertRoutes);
app.use("/api/stores/:storeId/shifts", requireAuthOrStoreAccess, shiftRoutes);
app.use("/api/stores/:storeId/chat", requireAuthOrStoreAccess, chatRoutes);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Silent Manager API running on http://localhost:${port}`);
});
