export const CURRENCY = "USD";

export const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "investments",
  "other",
] as const;

export const EXPENSE_CATEGORIES = [
  "housing",
  "groceries",
  "dining",
  "transport",
  "utilities",
  "entertainment",
  "health",
  "other",
] as const;

export type TransactionType = "income" | "expense";

export function formatCurrency(
  value: number,
  opts: { compact?: boolean; signed?: boolean } = {},
): string {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    notation: opts.compact && abs >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 2,
    minimumFractionDigits: opts.compact ? 0 : 2,
  }).format(abs);

  if (!opts.signed) return value < 0 ? `-${formatted}` : formatted;
  return `${value >= 0 ? "+" : "-"}${formatted}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export function relativeAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

const CATEGORY_ICONS: Record<string, string> = {
  housing: "⌂",
  groceries: "◑",
  dining: "◗",
  transport: "→",
  utilities: "⚡",
  entertainment: "♪",
  health: "✚",
  salary: "▲",
  freelance: "✦",
  investments: "◉",
  other: "•",
};

export const CATEGORY_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  housing: { label: "Housing", color: "#43d6a5", icon: CATEGORY_ICONS.housing },
  groceries: { label: "Groceries", color: "#7ee3c0", icon: CATEGORY_ICONS.groceries },
  dining: { label: "Dining", color: "#f0b95c", icon: CATEGORY_ICONS.dining },
  transport: { label: "Transport", color: "#7dd3fc", icon: CATEGORY_ICONS.transport },
  utilities: { label: "Utilities", color: "#c4b5fd", icon: CATEGORY_ICONS.utilities },
  entertainment: { label: "Entertainment", color: "#f2708c", icon: CATEGORY_ICONS.entertainment },
  health: { label: "Health", color: "#5eead4", icon: CATEGORY_ICONS.health },
  salary: { label: "Salary", color: "#43d6a5", icon: CATEGORY_ICONS.salary },
  freelance: { label: "Freelance", color: "#f0b95c", icon: CATEGORY_ICONS.freelance },
  investments: { label: "Investments", color: "#a5b4fc", icon: CATEGORY_ICONS.investments },
  other: { label: "Other", color: "#94a3b8", icon: CATEGORY_ICONS.other },
};

/** Stable, readable color per category for chart consistency. */
export function categoryColor(category: string): string {
  return CATEGORY_META[category]?.color ?? CATEGORY_META.other.color;
}

export function categoryLabel(category: string): string {
  return CATEGORY_META[category]?.label ?? category;
}

/** Deterministic slate scale for top-N spending slices. */
export const CATEGORY_PALETTE = [
  "#43d6a5",
  "#f0b95c",
  "#7dd3fc",
  "#c4b5fd",
  "#f2708c",
  "#5eead4",
  "#fdba74",
  "#a5b4fc",
  "#94a3b8",
  "#86efac",
];
