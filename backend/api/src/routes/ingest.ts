import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { prisma } from "../utils/prisma.js";
import { hashDeviceKey } from "../utils/auth.js";
import { parseXmlGateway } from "../parsers/xmlParser.js";
import { evaluateAlertsForShift, createAlert } from "../services/alerts.js";

const maxSizeMb = Number(process.env.INGEST_MAX_SIZE_MB || 10);
const upload = multer({ limits: { fileSize: maxSizeMb * 1024 * 1024 } });
const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/xml", limiter, upload.single("file"), async (req, res) => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "") || "";
  if (!apiKey) {
    return res.status(401).json({ error: "Missing device API key" });
  }

  const { storeId, deviceId, filename, sha256 } = req.body as Record<string, string>;
  if (!storeId || !filename || !sha256 || !req.file) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const device = await prisma.device.findFirst({
    where: { id: deviceId || undefined, storeId }
  });
  if (!device) {
    return res.status(401).json({ error: "Invalid device" });
  }

  const hashed = hashDeviceKey(apiKey);
  if (hashed !== device.apiKeyHash) {
    return res.status(401).json({ error: "Invalid device key" });
  }

  const existing = await prisma.rawFile.findFirst({
    where: { storeId, sha256 }
  });
  if (existing) {
    await prisma.rawFile.update({
      where: { id: existing.id },
      data: { status: "DUPLICATE" }
    });
    return res.json({ ok: true, duplicate: true, rawFileId: existing.id });
  }

  const rawXml = req.file.buffer.toString("utf-8");
  const rawFile = await prisma.rawFile.create({
    data: {
      storeId,
      deviceId: device.id,
      filename,
      sha256,
      sizeBytes: req.file.size,
      status: "RECEIVED",
      rawXml
    }
  });

  const parsed = parseXmlGateway(rawXml);
  if (!parsed) {
    await prisma.rawFile.update({
      where: { id: rawFile.id },
      data: {
        status: "ERROR",
        parsedAt: new Date(),
        error: "Unable to parse shift data"
      }
    });
    return res.json({ ok: true, rawFileId: rawFile.id, parsed: false });
  }

  const shift = await prisma.shift.create({
    data: {
      storeId,
      registerId: parsed.registerId,
      operatorId: parsed.operatorId,
      startAt: parsed.startAt,
      endAt: parsed.endAt,
      totalSales: parsed.totalSales,
      fuelSales: parsed.fuelSales,
      nonFuelSales: parsed.nonFuelSales,
      refunds: parsed.refunds,
      voidCount: parsed.voidCount,
      discountTotal: parsed.discountTotal,
      taxTotal: parsed.taxTotal,
      customerCount: parsed.customerCount,
      sourceRawFileId: rawFile.id
    }
  });

  if (parsed.departmentSales.length > 0) {
    await prisma.deptSale.createMany({
      data: parsed.departmentSales.map((dept) => ({
        shiftId: shift.id,
        departmentName: dept.name,
        amount: dept.amount
      }))
    });
  }

  if (parsed.cashShort && parsed.cashShort > 0) {
    await createAlert({
      storeId,
      shiftId: shift.id,
      severity: "warn",
      type: "CashShort",
      title: "Cash short detected",
      message: `Cash short amount is $${parsed.cashShort.toFixed(2)}.`
    });
  }

  await evaluateAlertsForShift(shift.id);

  await prisma.rawFile.update({
    where: { id: rawFile.id },
    data: {
      status: "PARSED",
      parsedAt: new Date(),
      reportType: parsed.reportType || null
    }
  });

  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() }
  });

  return res.json({ ok: true, rawFileId: rawFile.id, parsed: true });
});

export default router;
