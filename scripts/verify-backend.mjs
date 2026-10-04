/**
 * End-to-end verification against the running local Convex deployment.
 * Run with: bun scripts/verify-backend.mjs
 */
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const { api } = await import("../convex/_generated/api.js");

// The preview and this script run in separate network namespaces, so reach
// Convex through the Vite proxy on the preview's reachable address.
const target =
  process.env.VERIFY_CONVEX_URL ?? env.VITE_CONVEX_URL ?? "http://127.0.0.1:5173";
const client = new ConvexHttpClient(target);

const assert = (label, cond, extra = "") => {
  if (!cond) {
    console.error(`FAIL  ${label} ${extra}`);
    process.exitCode = 1;
  } else {
    console.log(`ok    ${label} ${extra}`);
  }
};

const email = `verify-${Date.now()}@example.com`;

// --- auth ---
const reg = await client.mutation(api.users.register, {
  email,
  password: "correct horse battery",
  name: "Verify Bot",
});
assert("register returns a token", typeof reg.token === "string" && reg.token.length > 16);

const me = await client.query(api.users.me, { token: reg.token });
assert("session resolves the user", me?.email === email, `(${me?.email})`);

const dupe = await client
  .mutation(api.users.register, { email, password: "another password", name: "X" })
  .then(() => null, (e) => e);
assert("duplicate email rejected", dupe !== null);

const badLogin = await client
  .mutation(api.users.login, { email, password: "wrong password" })
  .then(() => null, (e) => e);
assert("wrong password rejected", badLogin !== null);

const noAuth = await client.query(api.users.me, { token: "not-a-real-token" });
assert("invalid token resolves to null", noAuth === null);

const protectedCall = await client
  .query(api.transactions.summary, { token: "not-a-real-token" })
  .then(() => null, (e) => e);
assert("protected query rejects bad token", protectedCall !== null);

// --- transactions ---
const seeded = await client.mutation(api.transactions.seedDemo, { token: reg.token });
assert("seedDemo inserts rows", seeded.seeded === 10, `(inserted ${seeded.seeded})`);

const reseed = await client.mutation(api.transactions.seedDemo, { token: reg.token });
assert("seedDemo is idempotent", reseed.seeded === 0);

await client.mutation(api.transactions.add, {
  token: reg.token,
  type: "expense",
  amount: 123.456,
  description: "Verification expense",
  category: "dining",
});

const list = await client.query(api.transactions.list, { token: reg.token, months: 12 });
assert("list returns all rows", list.length === 11, `(${list.length} rows)`);

const bad = await client
  .mutation(api.transactions.add, {
    token: reg.token,
    type: "expense",
    amount: -5,
    description: "Negative",
    category: "dining",
  })
  .then(() => null, (e) => e);
assert("negative amount rejected", bad !== null);

const summary = await client.query(api.transactions.summary, { token: reg.token, months: 12 });
assert("summary income > 0", summary.income > 0, `(${summary.income})`);
assert("summary expense > 0", summary.expense > 0, `(${summary.expense})`);
assert("net = income - expense", Math.abs(summary.net - (summary.income - summary.expense)) < 0.02);
assert("trend has one bucket per month", summary.trend.length === 12, `(${summary.trend.length})`);
assert(
  "largest expense is rent",
  summary.biggestExpense?.description === "Rent",
  `(${summary.biggestExpense?.description})`,
);
assert(
  "category totals sum to expense",
  Math.abs(
    summary.spendingByCategory.reduce((s, c) => s + c.total, 0) - summary.expense,
  ) < 0.05,
);

// isolation between users
const other = await client.mutation(api.users.register, {
  email: `other-${Date.now()}@example.com`,
  password: "another strong password",
  name: "Other",
});
const otherSummary = await client.query(api.transactions.summary, { token: other.token });
assert("users are isolated", otherSummary.income === 0 && otherSummary.count === 0);

const otherRead = await client.query(api.transactions.list, { token: other.token });
assert("other user sees no rows", otherRead.length === 0);

// cross-user delete is rejected
const targetId = list[0]._id;
const crossDelete = await client
  .mutation(api.transactions.remove, { token: other.token, id: targetId })
  .then(() => null, (e) => e);
assert("cross-user delete rejected", crossDelete !== null);

// --- market + caching ---
// The cache is global (market data is the same for every user), so assert on
// deltas rather than absolute counts, which would leak across runs.
const statsBefore = await client.query(api.market.cacheStats, {});

const q1 = await client.action(api.market.getQuote, { symbols: ["AAPL", "MSFT"] });
assert("quotes returned", q1.length === 2);
assert("quotes have numeric prices", q1.every((q) => Number.isFinite(q.price) && q.price > 0));

const statsAfterFirst = await client.query(api.market.cacheStats, {});
assert(
  "cache stores each fetched symbol",
  statsAfterFirst.entries >= statsBefore.entries &&
    ["AAPL", "MSFT"].every((s) =>
      statsAfterFirst.rows.some((r) => r.symbol === s && r.kind === "quote"),
    ),
  `(${statsBefore.entries} -> ${statsAfterFirst.entries})`,
);

const q2 = await client.action(api.market.getQuote, { symbols: ["AAPL", "MSFT"] });
assert(
  "second call is served from cache",
  q2.every((q) => q.cached === true),
);
assert(
  "cached payload is identical",
  JSON.stringify(q1.map((q) => q.price)) === JSON.stringify(q2.map((q) => q.price)),
);

const statsBeforeRefresh = await client.query(api.market.cacheStats, {});
await client.action(api.market.refresh, { symbol: "AAPL" });
const statsAfterRefresh = await client.query(api.market.cacheStats, {});
assert(
  "refresh invalidates the symbol's entries",
  statsAfterRefresh.rows.every((r) => r.symbol !== "AAPL"),
  `(${statsBeforeRefresh.entries} -> ${statsAfterRefresh.entries} entries)`,
);

const series = await client.action(api.market.getSeries, { symbol: "AAPL" });
assert("series has points", series.points.length > 10, `(${series.points.length} points)`);
assert(
  "series points are well-formed",
  series.points.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(p.close)),
);
const seriesCached = await client.action(api.market.getSeries, { symbol: "AAPL" });
assert("series second call is cached", seriesCached.cached === true);

// --- logout ---
await client.mutation(api.users.logout, { token: reg.token });
const afterLogout = await client.query(api.users.me, { token: reg.token });
assert("logout invalidates the session", afterLogout === null);

console.log(process.exitCode ? "\nSOME CHECKS FAILED" : "\nAll checks passed");
