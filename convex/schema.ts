import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const CATEGORIES = [
  "housing",
  "groceries",
  "dining",
  "transport",
  "utilities",
  "entertainment",
  "health",
  "salary",
  "freelance",
  "investments",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const INCOME_CATEGORIES: Category[] = [
  "salary",
  "freelance",
  "investments",
  "other",
];

export const EXPENSE_CATEGORIES: Category[] = [
  "housing",
  "groceries",
  "dining",
  "transport",
  "utilities",
  "entertainment",
  "health",
  "other",
];

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    // SHA-256 of the bearer token; the raw token only ever lives in the client.
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["tokenHash"])
    .index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_type", ["userId", "type"]),

  // Server-side cache for Alpha Vantage responses so the free-tier rate
  // limit is never burned on every render.
  quoteCache: defineTable({
    symbol: v.string(),
    kind: v.string(),
    payload: v.any(),
    fetchedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_symbol_kind", ["symbol", "kind"])
    .index("by_expiry", ["expiresAt"]),
});
