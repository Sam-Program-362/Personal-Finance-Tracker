import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getSessionUser } from "./session";
import {
  SESSION_TTL_MS,
  hashPassword,
  randomToken,
  sha256Hex,
  verifyPassword,
} from "./password";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function startSession(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<string> {
  const token = randomToken();
  await ctx.db.insert("sessions", {
    userId,
    tokenHash: await sha256Hex(token),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  async handler(ctx, args) {
    const email = normalizeEmail(args.email);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      throw new Error("An account with that email already exists.");
    }

    const userId = await ctx.db.insert("users", {
      email,
      name: args.name.trim() || email.split("@")[0],
      passwordHash: await hashPassword(args.password),
      createdAt: Date.now(),
    });
    const token = await startSession(ctx, userId);
    return { token, userId };
  },
});

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  async handler(ctx, args) {
    const email = normalizeEmail(args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user || !(await verifyPassword(user.passwordHash, args.password))) {
      throw new Error("Invalid email or password.");
    }
    return { token: await startSession(ctx, user._id), userId: user._id };
  },
});

export const logout = mutation({
  args: { token: v.optional(v.string()) },
  async handler(ctx, args) {
    if (!args.token) return { ok: true };
    const tokenHash = await sha256Hex(args.token);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return { ok: true };
  },
});

export const me = query({
  args: { token: v.optional(v.string()) },
  async handler(ctx, args) {
    const user = await getSessionUser(ctx, args.token);
    if (!user) return null;
    return { _id: user._id, email: user.email, name: user.name };
  },
});

/** Drops expired sessions; called opportunistically from the dashboard. */
export const purgeExpiredSessions = mutation({
  args: {},
  async handler(ctx) {
    const all = await ctx.db.query("sessions").collect();
    const now = Date.now();
    let removed = 0;
    for (const session of all) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        removed++;
      }
    }
    return { removed };
  },
});
