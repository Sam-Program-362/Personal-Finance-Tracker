import { useCallback, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../convex/_generated/api";
import { formatCurrency, relativeAge } from "../lib/format";
import { Badge, PanelHeader, Spinner } from "./ui";

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  latestTradingDay: string;
  fetchedAt: number;
  cached: boolean;
  simulated: boolean;
}

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "SPY", "NVDA"];
const POOL = [
  "AAPL", "MSFT", "NVDA", "SPY", "VTI", "TSLA", "AMZN", "GOOGL", "QQQ", "VOO",
];

export function MarketPanel() {
  const getQuote = useAction(api.market.getQuote);
  const getSeries = useAction(api.market.getSeries);
  const refresh = useAction(api.market.refresh);
  const cacheStats = useQuery(api.market.cacheStats);

  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [active, setActive] = useState<string>(DEFAULT_SYMBOLS[0]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [series, setSeries] = useState<Array<{ date: string; close: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (next: string[], target: string) => {
      setLoading(true);
      setError(null);
      try {
        const [q, s] = await Promise.all([
          getQuote({ symbols: next }),
          getSeries({ symbol: target }),
        ]);
        setQuotes(q as Quote[]);
        setSeries((s as { points: Array<{ date: string; close: number }> }).points);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load market data.");
      } finally {
        setLoading(false);
      }
    },
    [getQuote, getSeries],
  );

  useEffect(() => {
    void load(symbols, active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSymbol(symbol: string) {
    const next = symbols.includes(symbol)
      ? symbols
      : [...symbols.filter((s) => s !== active), symbol].slice(-4);
    setSymbols(next);
    setActive(symbol);
    setLoading(true);
    setError(null);
    try {
      const [q, s] = await Promise.all([
        getQuote({ symbols: next }),
        getSeries({ symbol }),
      ]);
      setQuotes(q as Quote[]);
      setSeries((s as { points: Array<{ date: string; close: number }> }).points);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load market data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh({ symbol: active });
      await load(symbols, active);
    } finally {
      setRefreshing(false);
    }
  }

  const current = quotes.find((q) => q.symbol === active);
  const anySimulated = quotes.some((q) => q.simulated);
  const anyCached = quotes.some((q) => q.cached);

  return (
    <section className="panel space-y-5 p-5">
      <PanelHeader
        title="Live holdings"
        subtitle="Quotes via Alpha Vantage, cached server-side to respect rate limits"
        action={
          <div className="flex items-center gap-2">
            {anySimulated ? <Badge tone="accent">demo data</Badge> : null}
            {anyCached ? <Badge tone="neutral">cached</Badge> : null}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              {refreshing ? <Spinner className="h-3.5 w-3.5" /> : "↻"} Refresh
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {symbols.map((symbol) => {
          const quote = quotes.find((q) => q.symbol === symbol);
          const up = (quote?.changePercent ?? 0) >= 0;
          const isActive = symbol === active;
          return (
            <button
              key={symbol}
              onClick={() => handleSymbol(symbol)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? "border-mint-400/50 bg-mint-400/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <span className="font-mono text-xs font-semibold text-slate-200">{symbol}</span>
              {quote ? (
                <>
                  <span className="font-mono text-xs tabular-nums text-slate-300">
                    {formatCurrency(quote.price, { compact: true })}
                  </span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      up ? "text-mint-400" : "text-rose-400"
                    }`}
                  >
                    {up ? "+" : ""}
                    {quote.changePercent.toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-slate-400">…</span>
              )}
            </button>
          );
        })}
        <select
          value=""
          onChange={(e) => e.target.value && handleSymbol(e.target.value)}
          className="rounded-xl border border-dashed border-white/12 bg-transparent px-3 py-2 text-xs text-slate-400 outline-none transition hover:border-white/30 hover:text-slate-300"
        >
          <option value="">+ add symbol</option>
          {POOL.filter((s) => !symbols.includes(s)).map((s) => (
            <option key={s} value={s} className="bg-ink-900">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="h-52">
        {loading ? (
          <div className="grid h-full place-items-center">
            <Spinner className="h-5 w-5 text-mint-400" />
          </div>
        ) : series.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#43d6a5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#43d6a5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => d.slice(5)}
                tickLine={false}
                axisLine={false}
                minTickGap={26}
              />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                tickFormatter={(v: number) => `$${Math.round(v)}`}
                tickLine={false}
                axisLine={false}
                width={54}
              />
              <Tooltip
                contentStyle={{
                  background: "#0d1220",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(d) => d}
                formatter={(v: number) => [formatCurrency(v), "Close"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#43d6a5"
                strokeWidth={2}
                fill="url(#priceFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 text-xs text-slate-400">
            No series data for {active}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold text-white">{active}</span>
          {current ? (
            <>
              <span className="font-mono text-lg tabular-nums text-slate-300">
                {formatCurrency(current.price)}
              </span>
              <span
                className={`font-mono text-sm tabular-nums ${
                  current.changePercent >= 0 ? "text-mint-400" : "text-rose-400"
                }`}
              >
                {current.changePercent >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(current.changePercent).toFixed(2)}%
              </span>
            </>
          ) : null}
        </div>
        {current ? (
          <p className="text-xs text-slate-400">
            {current.cached ? "from cache" : "fresh fetch"} ·{" "}
            {relativeAge(Math.round((Date.now() - current.fetchedAt) / 1000))} ago
            {current.latestTradingDay ? ` · ${current.latestTradingDay}` : ""}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-400">
          {error}
        </p>
      ) : null}

      {cacheStats ? (
        <div className="rounded-xl border border-white/8 bg-ink-850/60 p-3">
          <p className="label">Cache health</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            <span className="font-mono text-slate-300">{cacheStats.entries}</span> cached responses ·{" "}
            <span className="font-mono text-mint-400">{cacheStats.fresh}</span> still fresh ·{" "}
            {Object.entries(cacheStats.byKind)
              .map(([kind, count]) => `${count} ${kind}${count === 1 ? "" : "s"}`)
              .join(" · ") || "nothing cached yet"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
