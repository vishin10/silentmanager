import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/requireAuth.js";
import { z } from "zod";

const router = Router({ mergeParams: true });

const classifyIntent = (question: string) => {
  const q = question.toLowerCase();
  if (q.includes("highest") && q.includes("week")) return "HIGHEST_DAY_WEEK";
  if (q.includes("worst") && q.includes("yesterday")) return "WORST_SHIFT_YESTERDAY";
  if (q.includes("compare") && q.includes("last week")) return "COMPARE_WEEK_VS_LAST_WEEK";
  if (q.includes("refund")) return "REFUNDS_TODAY";
  if (q.includes("fuel") && (q.includes("inside") || q.includes("non-fuel"))) return "FUEL_VS_INSIDE_WEEK";
  return "UNKNOWN";
};

const startOfWeek = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const endOfDay = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

router.post("/", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const schema = z.object({ question: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const store = await prisma.store.findFirst({
    where: { id: req.params.storeId, ownerId: req.userId }
  });
  if (!store) return res.status(404).json({ error: "Store not found" });

  const intent = classifyIntent(parsed.data.question);
  const now = new Date();
  let answer = "I can help with shift summaries, refunds, and week comparisons. Try a suggested prompt.";

  if (intent === "HIGHEST_DAY_WEEK") {
    const start = startOfWeek(now);
    const shifts = await prisma.shift.findMany({
      where: { storeId: store.id, startAt: { gte: start } }
    });
    const totals = new Map<string, number>();
    shifts.forEach((shift) => {
      const dateKey = shift.startAt ? shift.startAt.toISOString().slice(0, 10) : "unknown";
      totals.set(dateKey, (totals.get(dateKey) || 0) + Number(shift.totalSales.toString()));
    });
    let bestDay = "";
    let bestTotal = 0;
    for (const [day, total] of totals.entries()) {
      if (total > bestTotal) {
        bestTotal = total;
        bestDay = day;
      }
    }
    answer = bestDay
      ? `Highest day this week was ${bestDay} with $${bestTotal.toFixed(2)} in total sales.`
      : "No shift data yet for this week.";
  }

  if (intent === "WORST_SHIFT_YESTERDAY") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);
    const end = endOfDay(yesterday);
    const shifts = await prisma.shift.findMany({
      where: { storeId: store.id, startAt: { gte: start, lte: end } },
      orderBy: { totalSales: "asc" }
    });
    const worst = shifts[0];
    answer = worst
      ? `Worst shift yesterday was $${Number(worst.totalSales).toFixed(2)} from register ${worst.registerId || "?"}.`
      : "No shift data found for yesterday.";
  }

  if (intent === "COMPARE_WEEK_VS_LAST_WEEK") {
    const start = startOfWeek(now);
    const lastWeekStart = new Date(start);
    lastWeekStart.setDate(start.getDate() - 7);
    const lastWeekEnd = new Date(start);
    lastWeekEnd.setMilliseconds(-1);
    const [thisWeek, lastWeek] = await Promise.all([
      prisma.shift.findMany({ where: { storeId: store.id, startAt: { gte: start } } }),
      prisma.shift.findMany({
        where: { storeId: store.id, startAt: { gte: lastWeekStart, lte: lastWeekEnd } }
      })
    ]);
    const sum = (rows: typeof thisWeek) =>
      rows.reduce((acc, row) => acc + Number(row.totalSales.toString()), 0);
    const thisTotal = sum(thisWeek);
    const lastTotal = sum(lastWeek);
    const diff = thisTotal - lastTotal;
    const direction = diff >= 0 ? "up" : "down";
    answer = `This week is $${thisTotal.toFixed(2)} vs $${lastTotal.toFixed(2)} last week, ${direction} by $${Math.abs(diff).toFixed(2)}.`;
  }

  if (intent === "REFUNDS_TODAY") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const shifts = await prisma.shift.findMany({
      where: { storeId: store.id, startAt: { gte: start } }
    });
    const total = shifts.reduce((acc, row) => acc + Number(row.refunds.toString()), 0);
    answer = total > 0 ? `Refunds today total $${total.toFixed(2)}.` : "No refunds recorded today.";
  }

  if (intent === "FUEL_VS_INSIDE_WEEK") {
    const start = startOfWeek(now);
    const shifts = await prisma.shift.findMany({
      where: { storeId: store.id, startAt: { gte: start } }
    });
    const fuel = shifts.reduce((acc, row) => acc + Number(row.fuelSales.toString()), 0);
    const inside = shifts.reduce((acc, row) => acc + Number(row.nonFuelSales.toString()), 0);
    answer = `This week fuel sales are $${fuel.toFixed(2)} and inside sales are $${inside.toFixed(2)}.`;
  }

  await prisma.chatQuery.create({
    data: {
      storeId: store.id,
      userId: req.userId,
      question: parsed.data.question,
      intent,
      answer
    }
  });

  return res.json({ intent, answer });
});

router.get("/history", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const store = await prisma.store.findFirst({
    where: { id: req.params.storeId, ownerId: req.userId }
  });
  if (!store) return res.status(404).json({ error: "Store not found" });

  const history = await prisma.chatQuery.findMany({
    where: { storeId: store.id, userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return res.json(history);
});

export default router;
