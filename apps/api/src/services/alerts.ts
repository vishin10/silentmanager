import { prisma } from "../utils/prisma.js";
import { AlertSeverity } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const createAlert = async (input: {
  storeId: string;
  shiftId?: string;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
}) => {
  return prisma.alert.create({ data: input });
};

const toNumber = (value: Decimal) => Number(value.toString());

export const evaluateAlertsForShift = async (shiftId: string) => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { store: true }
  });
  if (!shift) return [];

  const alerts = [] as Promise<unknown>[];
  const totalSales = toNumber(shift.totalSales);
  const nonFuelSales = toNumber(shift.nonFuelSales);

  if (shift.voidCount >= 5) {
    alerts.push(
      createAlert({
        storeId: shift.storeId,
        shiftId: shift.id,
        severity: "critical",
        type: "HighVoids",
        title: "High void count",
        message: `Void count is ${shift.voidCount}, which exceeds the critical threshold.`
      })
    );
  }

  if (nonFuelSales === 0 && totalSales > 0) {
    alerts.push(
      createAlert({
        storeId: shift.storeId,
        shiftId: shift.id,
        severity: "warn",
        type: "ZeroInsideSales",
        title: "Zero inside sales",
        message: "Inside sales are zero while total sales are above zero."
      })
    );
  }

  if (shift.refunds.toNumber() > 0) {
    alerts.push(
      createAlert({
        storeId: shift.storeId,
        shiftId: shift.id,
        severity: "info",
        type: "Refunds",
        title: "Refunds recorded",
        message: `Refunds total $${shift.refunds.toFixed(2)} for this shift.`
      })
    );
  }

  const startAt = shift.startAt ?? shift.createdAt;
  const weekday = startAt.getUTCDay();
  const pastShifts = await prisma.shift.findMany({
    where: {
      storeId: shift.storeId,
      startAt: { not: null }
    },
    orderBy: { startAt: "desc" },
    take: 40
  });

  const sameWeekday = pastShifts.filter((item) => item.startAt && item.startAt.getUTCDay() === weekday);
  const lastFour = sameWeekday.slice(0, 4);
  if (lastFour.length >= 3) {
    const avg =
      lastFour.reduce((sum, item) => sum + Number(item.totalSales.toString()), 0) / lastFour.length;
    if (totalSales < avg * 0.7) {
      alerts.push(
        createAlert({
          storeId: shift.storeId,
          shiftId: shift.id,
          severity: "warn",
          type: "LowSalesDrop",
          title: "Sales dip vs typical",
          message: `Total sales $${totalSales.toFixed(2)} are more than 30% below the recent average of $${avg.toFixed(2)}.`
        })
      );
    }
  }

  return Promise.all(alerts);
};
