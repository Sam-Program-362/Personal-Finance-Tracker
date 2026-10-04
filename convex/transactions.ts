import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./session";

const DAY_MS = 86_400_000;

export const list = query({
  args: {
    token: v.optional(v.string()),
    months: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const user = await requireUser(ctx, args.token);
    const months = Math.min(Math.max(args.months ?? 12, 1), 60);
    const since = Date.now() - months * 30 * DAY_MS;
    return await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", since),
      )
      .collect();
  },
});

export const summary = query({
  args: { token: v.optional(v.string()), months: v.optional(v.number()) },
  async handler(ctx, args) {
    const user = await requireUser(ctx, args.token);
    const months = Math.min(Math.max(args.months ?? 12, 1), 60);
    const since = Date.now() - months * 30 * DAY_MS;
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", since),
      )
      .collect();

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const monthStart = thisMonthStart.getTime();

    let income = 0;
    let expense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    const byCategory: Record<string, number> = {};

    for (const t of rows) {
      if (t.type === "income") {
        income += t.amount;
        if (t.date >= monthStart) monthIncome += t.amount;
      } else {
        expense += t.amount;
        if (t.date >= monthStart) monthExpense += t.amount;
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      }
    }

    // Net worth trend: cumulative income - expense, per month bucket.
    const buckets = new Map<string, { income: number; expense: number }>();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, { income: 0, expense: 0 });
    }
    for (const t of rows) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (t.type === "income") bucket.income += t.amount;
      else bucket.expense += t.amount;
    }

    let running = 0;
    const trend = Array.from(buckets.entries()).map(([month, v]) => {
      running += v.income - v.expense;
      return {
        month,
        income: Number(v.income.toFixed(2)),
        expense: Number(v.expense.toFixed(2)),
        net: Number((v.income - v.expense).toFixed(2)),
        cumulative: Number(running.toFixed(2)),
      };
    });

    const spendingByCategory = Object.entries(byCategory)
      .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
      .sort((a, b) => b.total - a.total);

    const biggest = rows.reduce<(typeof rows)[number] | null>(
      (max, t) =>
        t.type === "expense" && (!max || t.amount > max.amount) ? t : max,
      null,
    );

    return {
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      net: Number((income - expense).toFixed(2)),
      monthIncome: Number(monthIncome.toFixed(2)),
      monthExpense: Number(monthExpense.toFixed(2)),
      savingsRate:
        income > 0
          ? Number((((income - expense) / income) * 100).toFixed(1))
          : 0,
      count: rows.length,
      spendingByCategory,
      trend,
      biggestExpense: biggest
        ? {
            description: biggest.description,
            amount: biggest.amount,
            category: biggest.category,
          }
        : null,
    };
  },
});

export const add = mutation({
  args: {
    token: v.optional(v.string()),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const user = await requireUser(ctx, args.token);
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }
    const description = args.description.trim();
    if (!description) throw new Error("Description is required.");
    return await ctx.db.insert("transactions", {
      userId: user._id as Id<"users">,
      type: args.type,
      amount: Number(args.amount.toFixed(2)),
      description,
      category: args.category,
      date: args.date ?? Date.now(),
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { token: v.optional(v.string()), id: v.id("transactions") },
  async handler(ctx, args) {
    const user = await requireUser(ctx, args.token);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== user._id) {
      throw new Error("Transaction not found.");
    }
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

export const seedDemo = mutation({
  args: { token: v.optional(v.string()) },
  async handler(ctx, args) {
    const user = await requireUser(ctx, args.token);
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .first();
    if (existing) return { seeded: 0 };

    const now = Date.now();
    const demo: Array<{
      type: "income" | "expense";
      amount: number;
      description: string;
      category: string;
      daysAgo: number;
    }> = [
      { type: "income", amount: 5200, description: "Salary — Northwind Labs", category: "salary", daysAgo: 12 },
      { type: "income", amount: 640, description: "Freelance design sprint", category: "freelance", daysAgo: 5 },
      { type: "expense", amount: 1850, description: "Rent", category: "housing", daysAgo: 14 },
      { type: "expense", amount: 412.35, description: "Whole Foods weekly run", category: "groceries", daysAgo: 6 },
      { type: "expense", amount: 68.2, description: "Ramen + izakaya night", category: "dining", daysAgo: 3 },
      { type: "expense", amount: 132.9, description: "Metro card reload", category: "transport", daysAgo: 9 },
      { type: "expense", amount: 143.11, description: "Electricity + internet", category: "utilities", daysAgo: 7 },
      { type: "expense", amount: 54, description: "Concert tickets", category: "entertainment", daysAgo: 2 },
      { type: "expense", amount: 96.4, description: "Pharmacy pickup", category: "health", daysAgo: 4 },
      { type: "income", amount: 210, description: "Dividend payout", category: "investments", daysAgo: 10 },
    ];

    let seeded = 0;
    for (const d of demo) {
      await ctx.db.insert("transactions", {
        userId: user._id as Id<"users">,
        type: d.type,
        amount: d.amount,
        description: d.description,
        category: d.category,
        date: now - d.daysAgo * DAY_MS,
        createdAt: now,
      });
      seeded++;
    }
    return { seeded };
  },
});
