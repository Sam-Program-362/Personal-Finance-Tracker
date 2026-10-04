import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const AV_BASE = "https://www.alphavantage.co/query";

/**
 * Caching strategy
 * ----------------
 * Alpha Vantage's free tier allows ~25 requests/day, so nothing may hit the
 * upstream API on render. Every read goes through `cacheGet`/`cachePut`
 * (internal queries/mutations) which run server-side inside Convex, backed by
 * the `quoteCache` table:
 *
 *   - live quotes  : 10 minute TTL
 *   - daily series : 1 hour TTL
 *
 * If no `ALPHA_VANTAGE_API_KEY` is configured, or upstream returns a rate
 * limit note, we fall back to a deterministic simulated series so the
 * dashboard always has something to render.
 */
const QUOTE_TTL_MS = 10 * 60 * 1000;
const SERIES_TTL_MS = 60 * 60 * 1000;

export const cacheGet = internalQuery({
  args: { symbol: v.string(), kind: v.string() },
  async handler(ctx, args) {
    const row = await ctx.db
      .query("quoteCache")
      .withIndex("by_symbol_kind", (q) =>
        q.eq("symbol", args.symbol).eq("kind", args.kind),
      )
      .unique();
    if (!row) return null;
    return {
      payload: row.payload,
      fetchedAt: row.fetchedAt,
      expired: row.expiresAt <= Date.now(),
    };
  },
});

export const cachePut = internalMutation({
  args: {
    symbol: v.string(),
    kind: v.string(),
    payload: v.any(),
    ttlMs: v.number(),
  },
  async handler(ctx, args) {
    const existing = await ctx.db
      .query("quoteCache")
      .withIndex("by_symbol_kind", (q) =>
        q.eq("symbol", args.symbol).eq("kind", args.kind),
      )
      .unique();
    const fetchedAt = Date.now();
    const expiresAt = fetchedAt + args.ttlMs;
    if (existing) {
      await ctx.db.patch(existing._id, { payload: args.payload, fetchedAt, expiresAt });
    } else {
      await ctx.db.insert("quoteCache", {
        symbol: args.symbol,
        kind: args.kind,
        payload: args.payload,
        fetchedAt,
        expiresAt,
      });
    }
    return { fetchedAt };
  },
});

export const invalidate = internalMutation({
  args: { symbol: v.string() },
  async handler(ctx, args) {
    const rows = await ctx.db
      .query("quoteCache")
      .withIndex("by_symbol_kind", (q) =>
        q.eq("symbol", args.symbol.toUpperCase()),
      )
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);
    return { removed: rows.length };
  },
});

const BASE_PRICES: Record<string, number> = {
  AAPL: 227.4, MSFT: 421.8, NVDA: 118.6, SPY: 561.2, VTI: 271.9,
  TSLA: 245.1, AMZN: 186.3, GOOGL: 168.7, QQQ: 478.5, VOO: 519.7,
};

function seedFrom(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 31 + symbol.charCodeAt(i)) % 99991;
  }
  return h || 7;
}

/** Deterministic pseudo-random walk so demo data is stable across reloads. */
function walk(base: number, seed: number, points: number): number[] {
  const out: number[] = [];
  let v = base;
  let s = seed;
  for (let i = 0; i < points; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    v = Math.max(1, v + (s / 2147483648 - 0.5) * base * 0.04);
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

function simulateQuote(symbol: string) {
  const base = BASE_PRICES[symbol] ?? 100 + (seedFrom(symbol) % 300);
  const change = ((seedFrom(symbol) % 200) / 100 - 1) * 0.03;
  const price = Number((base * (1 + change)).toFixed(2));
  return {
    price,
    change: Number((price * change).toFixed(2)),
    changePercent: Number((change * 100).toFixed(2)),
    latestTradingDay: new Date().toISOString().slice(0, 10),
  };
}

function simulateSeries(symbol: string, days = 30) {
  const base = BASE_PRICES[symbol] ?? 100 + (seedFrom(symbol) % 300);
  const closes = walk(base, seedFrom(symbol), days);
  const points: Array<{ date: string; close: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    points.push({ date: d.toISOString().slice(0, 10), close: closes[days - 1 - i] });
  }
  return { points };
}

function isRateLimited(payload: any): boolean {
  return Boolean(payload?.Note || payload?.Information || payload?.["Error Message"]);
}

/**
 * Cache-through wrapper: returns a fresh cached payload when possible,
 * otherwise calls `fetcher` and stores the result for `ttlMs`.
 */
async function cacheThrough(
  ctx: any,
  symbol: string,
  kind: string,
  ttlMs: number,
  fetcher: (apiKey: string) => Promise<any>,
): Promise<{ data: any; fetchedAt: number; cached: boolean; simulated: boolean }> {
  const cached = await ctx.runQuery(internal.market.cacheGet, { symbol, kind });

  if (cached && !cached.expired) {
    return { data: cached.payload, fetchedAt: cached.fetchedAt, cached: true, simulated: false };
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  let payload: any = null;
  let simulated = false;

  if (apiKey) {
    try {
      const fetched = await fetcher(apiKey);
      if (!isRateLimited(fetched)) {
        payload = fetched;
      }
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    // No key, rate limited, or upstream failed. Prefer stale cache over
    // fabricated data; only simulate when we have nothing real to show.
    if (cached) {
      return { data: cached.payload, fetchedAt: cached.fetchedAt, cached: true, simulated: false };
    }
    payload = kind === "quote" ? simulateQuote(symbol) : simulateSeries(symbol);
    simulated = true;
  }

  const { fetchedAt } = await ctx.runMutation(internal.market.cachePut, {
    symbol,
    kind,
    payload,
    ttlMs,
  });
  return { data: payload, fetchedAt, cached: false, simulated };
}

export const getQuote = action({
  args: { symbols: v.array(v.string()) },
  handler: async (ctx, args) => {
    const symbols = args.symbols
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 10);

    return await Promise.all(
      symbols.map(async (symbol) => {
        const r = await cacheThrough(
          ctx,
          symbol,
          "quote",
          QUOTE_TTL_MS,
          async (apiKey) => {
            const res = await fetch(
              `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
            );
            return await res.json();
          },
        );

        const g = r.data?.["Global Quote"];
        if (g) {
          return {
            symbol,
            price: Number(parseFloat(g["05. price"] ?? "0").toFixed(2)),
            change: Number(parseFloat(g["09. change"] ?? "0").toFixed(2)),
            changePercent: Number(parseFloat(g["10. change percent"] ?? "0").toFixed(2)),
            latestTradingDay: g["07. latest trading day"] ?? "",
            fetchedAt: r.fetchedAt,
            cached: r.cached,
            simulated: r.simulated,
          };
        }
        // Already in normalized (simulated) shape.
        return {
          symbol,
          price: r.data.price,
          change: r.data.change,
          changePercent: r.data.changePercent,
          latestTradingDay: r.data.latestTradingDay ?? "",
          fetchedAt: r.fetchedAt,
          cached: r.cached,
          simulated: r.simulated,
        };
      }),
    );
  },
});

export const getSeries = action({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const symbol = args.symbol.trim().toUpperCase();
    const r = await cacheThrough(
      ctx,
      symbol,
      "series",
      SERIES_TTL_MS,
      async (apiKey) => {
        const res = await fetch(
          `${AV_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${apiKey}`,
        );
        return await res.json();
      },
    );

    const series = r.data?.["Time Series (Daily)"];
    if (!series) {
      return {
        symbol,
        points: r.data?.points ?? [],
        fetchedAt: r.fetchedAt,
        cached: r.cached,
        simulated: r.simulated,
      };
    }

    const points = Object.entries(series)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, values]) => ({
        date,
        close: Number(parseFloat((values as Record<string, string>)["4. close"])),
      }));

    return {
      symbol,
      points,
      fetchedAt: r.fetchedAt,
      cached: r.cached,
      simulated: r.simulated,
    };
  },
});

export const refresh = action({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const symbol = args.symbol.trim().toUpperCase();
    await ctx.runMutation(internal.market.invalidate, { symbol });
    return { invalidated: symbol };
  },
});

/** Cache status for the dashboard's "cache efficiency" panel. */
export const cacheStats = query({
  args: {},
  async handler(ctx) {
    const rows = await ctx.db.query("quoteCache").collect();
    const now = Date.now();
    const byKind: Record<string, number> = {};
    for (const r of rows) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    return {
      entries: rows.length,
      fresh: rows.filter((r) => r.expiresAt > now).length,
      byKind,
      rows: rows
        .sort((a, b) => b.fetchedAt - a.fetchedAt)
        .slice(0, 12)
        .map((r) => ({
          symbol: r.symbol,
          kind: r.kind,
          ageSeconds: Math.round((now - r.fetchedAt) / 1000),
          expired: r.expiresAt <= now,
        })),
    };
  },
});
