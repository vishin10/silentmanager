export type AlertSeverity = "info" | "warn" | "critical";

export type ChatIntent =
  | "HIGHEST_DAY_WEEK"
  | "WORST_SHIFT_YESTERDAY"
  | "COMPARE_WEEK_VS_LAST_WEEK"
  | "REFUNDS_TODAY"
  | "FUEL_VS_INSIDE_WEEK"
  | "UNKNOWN";

export const INTENT_LABELS: Record<ChatIntent, string> = {
  HIGHEST_DAY_WEEK: "highest day this week",
  WORST_SHIFT_YESTERDAY: "worst shift yesterday",
  COMPARE_WEEK_VS_LAST_WEEK: "compare this week vs last week",
  REFUNDS_TODAY: "any refunds today",
  FUEL_VS_INSIDE_WEEK: "fuel vs inside sales this week",
  UNKNOWN: "unknown"
};
