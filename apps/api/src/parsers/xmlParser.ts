import { XMLParser } from "fast-xml-parser";

export type ParsedShift = {
  registerId?: string;
  operatorId?: string;
  startAt?: Date;
  endAt?: Date;
  totalSales: number;
  fuelSales: number;
  nonFuelSales: number;
  refunds: number;
  voidCount: number;
  discountTotal: number;
  taxTotal: number;
  customerCount?: number;
  departmentSales: { name: string; amount: number }[];
  reportType?: string;
  cashShort?: number;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  parseTagValue: false,
  trimValues: true
});

const findAllStrings = (value: unknown, results: string[] = []): string[] => {
  if (typeof value === "string") {
    results.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => findAllStrings(entry, results));
  } else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((entry) => findAllStrings(entry, results));
  }
  return results;
};

const findAllKeyValues = (value: unknown, results: Record<string, string[]> = {}): Record<string, string[]> => {
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (typeof entry === "string") {
        results[key] = [...(results[key] || []), entry];
      } else if (Array.isArray(entry)) {
        entry.forEach((child) => findAllKeyValues(child, results));
      } else if (entry && typeof entry === "object") {
        findAllKeyValues(entry, results);
      }
    }
  }
  return results;
};

const toNumber = (value?: string | number, fallback = 0): number => {
  if (typeof value === "number") return value;
  if (!value) return fallback;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const findNumberByKeys = (data: Record<string, string[]>, keys: string[]): number => {
  for (const key of keys) {
    const hit = Object.entries(data).find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
    if (hit) {
      const value = hit[1].find(Boolean);
      if (value) return toNumber(value);
    }
  }
  return 0;
};

const findStringByKeys = (data: Record<string, string[]>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const hit = Object.entries(data).find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
    if (hit) {
      return hit[1].find(Boolean);
    }
  }
  return undefined;
};

const parseDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

export const parseXmlGateway = (rawXml: string): ParsedShift | null => {
  const data = parser.parse(rawXml);
  const flat = findAllKeyValues(data);

  const reportType = findStringByKeys(flat, ["ReportType", "ReportName", "ShiftReport", "StoreSummary"]);
  const registerId = findStringByKeys(flat, ["Register", "RegisterId", "Till", "POS"]);
  const operatorId = findStringByKeys(flat, ["Operator", "Cashier", "Employee"]);
  const startAt = parseDate(findStringByKeys(flat, ["Start", "From", "Begin", "Open"]));
  const endAt = parseDate(findStringByKeys(flat, ["End", "To", "Close"]));

  const totalSales = findNumberByKeys(flat, ["TotalSales", "Total", "Gross"]);
  const fuelSales = findNumberByKeys(flat, ["FuelSales", "Fuel", "Gas"]);
  const nonFuelSales = findNumberByKeys(flat, ["InsideSales", "NonFuel", "Merchandise"]);
  const refunds = findNumberByKeys(flat, ["Refund", "Return"]);
  const voidCount = Math.round(findNumberByKeys(flat, ["Void", "Voids"]));
  const discountTotal = findNumberByKeys(flat, ["Discount", "Markdown"]);
  const taxTotal = findNumberByKeys(flat, ["Tax"]);
  const customerCount = Math.round(findNumberByKeys(flat, ["CustomerCount", "Customers", "Transactions"])) || undefined;
  const cashShort = findNumberByKeys(flat, ["CashShort", "Short"]);

  const allStrings = findAllStrings(data);
  const departmentSales: { name: string; amount: number }[] = [];

  for (let i = 0; i < allStrings.length - 1; i += 1) {
    const name = allStrings[i];
    const amount = toNumber(allStrings[i + 1], NaN);
    if (Number.isFinite(amount) && /dept|department|category|sales/i.test(name)) {
      departmentSales.push({ name, amount });
    }
  }

  if (totalSales === 0 && fuelSales === 0 && nonFuelSales === 0) {
    return null;
  }

  return {
    registerId,
    operatorId,
    startAt,
    endAt,
    totalSales,
    fuelSales,
    nonFuelSales,
    refunds,
    voidCount,
    discountTotal,
    taxTotal,
    customerCount,
    departmentSales,
    reportType,
    cashShort
  };
};
