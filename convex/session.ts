import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { sha256Hex } from "./password";

/** Either a query or mutation context; both expose a compatible `db`. */
type SessionCtx = QueryCtx | MutationCtx;

export async function getSessionUser(
  ctx: SessionCtx,
  token?: string | null,
): Promise<Doc<"users"> | null> {
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
    .unique();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

/** Same as `getSessionUser` but throws, for protected queries/mutations. */
export async function requireUser(
  ctx: SessionCtx,
  token?: string | null,
): Promise<Doc<"users">> {
  const user = await getSessionUser(ctx, token);
  if (!user) throw new Error("Your session expired. Please sign in again.");
  return user;
}
