import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../convex/_generated/api";
import { clearSession, getToken } from "../lib/session";
import {
  CATEGORY_PALETTE,
  categoryLabel,
  formatCurrency,
  formatMonth,
  type TransactionType,
} from "../lib/format";
import { Logo, PanelHeader, Spinner, StatCard } from "../components/ui";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { MarketPanel } from "../components/MarketPanel";

const TOOLTIP_STYLE = {
  background: "#0d1220",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 12,
  fontSize: 12,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const token = getToken() ?? undefined;

  const me = useQuery(api.users.me, { token });
  const [range, setRange] = useState(12);
  const summary = useQuery(api.transactions.summary, { token, months: range });
  const transactions = useQuery(api.transactions.list, { token, months: range });
  const seedDemo = useMutation(api.transactions.seedDemo);
  const logout = useMutation(api.users.logout);

  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSignOut() {
    await logout({ token: getToken() ?? undefined });
    clearSession();
    navigate("/", { replace: true });
  }

  async function handleSeed() {
    setSeeding(true);
    setNotice(null);
    try {
      const { seeded } = await seedDemo({ token: getToken() ?? undefined });
      setNotice(seeded > 0 ? `Added ${seeded} sample transactions.` : "You already have data.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load sample data.");
    } finally {
      setSeeding(false);
    }
  }

  if (me === undefined) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-6 w-6 text-mint-400" />
      </div>
    );
  }

  if (me === null) {
    // Token invalid or missing — bounce back to auth with the intended path.
    clearSession();
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="panel max-w-sm p-7 text-center">
          <h1 className="text-lg font-semibold text-white">Session expired</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your sign-in is no longer valid. Please sign in again to reach your dashboard.
          </p>
          <a href="/auth?returnTo=%2Fdashboard" className="btn-primary mt-5 w-full">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const trend = summary?.trend ?? [];
  const categoryData = (summary?.spendingByCategory ?? []).map((c) => ({
    name: categoryLabel(c.category),
    value: c.total,
  }));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:block">
              {me.name}
            </span>
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-300 outline-none"
              aria-label="Time range"
            >
              {[3, 6, 12, 24].map((m) => (
                <option key={m} value={m} className="bg-ink-900">
                  Last {m} months
                </option>
              ))}
            </select>
            <button onClick={handleSignOut} className="btn-ghost px-3 py-1.5 text-xs">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {notice ? (
          <p className="rounded-lg border border-mint-400/25 bg-mint-400/10 px-3 py-2 text-xs text-mint-300">
            {notice}
          </p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Net position"
            value={formatCurrency(summary?.net ?? 0, { signed: true })}
            hint={`${formatCurrency(summary?.income ?? 0)} in · ${formatCurrency(summary?.expense ?? 0)} out`}
            tone={(summary?.net ?? 0) >= 0 ? "positive" : "negative"}
          />
          <StatCard
            label="This month"
            value={formatCurrency(summary?.monthExpense ?? 0)}
            hint={`Income ${formatCurrency(summary?.monthIncome ?? 0)}`}
            tone="negative"
          />
          <StatCard
            label="Savings rate"
            value={`${summary?.savingsRate ?? 0}%`}
            hint="Across the selected period"
            tone={(summary?.savingsRate ?? 0) >= 20 ? "positive" : "accent"}
          />
          <StatCard
            label="Largest expense"
            value={summary?.biggestExpense ? formatCurrency(summary.biggestExpense.amount) : "—"}
            hint={summary?.biggestExpense?.description ?? "No expenses yet"}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="panel space-y-5 p-5 lg:col-span-2">
            <PanelHeader
              title="Cash flow"
              subtitle={`Income, spending and running net across ${range} months`}
            />
            <div className="h-64">
              {trend.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 6, right: 6, bottom: 0, left: -6 }}>
                    <defs>
                      <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#43d6a5" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#43d6a5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f2708c" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f2708c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `$${Math.round(v)}`}
                      tickLine={false}
                      axisLine={false}
                      width={58}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(m) => formatMonth(String(m))}
                      formatter={(v: number, name) => [
                        formatCurrency(v),
                        name === "income" ? "Income" : name === "expense" ? "Spending" : "Net",
                      ]}
                    />
                    <Legend
                      formatter={(v) => (v === "income" ? "Income" : v === "expense" ? "Spending" : "Net")}
                      wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#43d6a5"
                      strokeWidth={2}
                      fill="url(#incFill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#f2708c"
                      strokeWidth={2}
                      fill="url(#expFill)"
                    />
                    <Area type="monotone" dataKey="net" stroke="#f0b95c" strokeWidth={2} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-slate-400">
                  Not enough history yet.
                </div>
              )}
            </div>
          </div>

          <div className="panel space-y-5 p-5">
            <PanelHeader title="Where it goes" subtitle="Spending by category" />
            <div className="h-56">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={entry.name} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [formatCurrency(v), "Spent"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-slate-400">
                  No spending recorded.
                </div>
              )}
            </div>
            {categoryData.length > 0 ? (
              <ul className="space-y-2">
                {categoryData.slice(0, 5).map((c, i) => {
                  const total = categoryData.reduce((s, x) => s + x.value, 0);
                  return (
                    <li key={c.name} className="flex items-center gap-2.5 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }}
                      />
                      <span className="flex-1 truncate text-slate-400">{c.name}</span>
                      <span className="font-mono tabular-nums text-slate-300">
                        {formatCurrency(c.value)}
                      </span>
                      <span className="w-10 text-right font-mono tabular-nums text-slate-400">
                        {total > 0 ? Math.round((c.value / total) * 100) : 0}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="panel p-5">
            <PanelHeader title="Add a transaction" subtitle="Takes effect instantly" />
            <div className="mt-5">
              <TransactionForm />
            </div>
          </div>

          <div className="panel space-y-5 p-5 lg:col-span-2">
            <PanelHeader
              title="Activity"
              subtitle={`${transactions?.length ?? 0} entries in the last ${range} months`}
              action={
                transactions && transactions.length === 0 ? (
                  <button onClick={handleSeed} disabled={seeding} className="btn-ghost px-3 py-1.5 text-xs">
                    {seeding ? <Spinner className="h-3.5 w-3.5" /> : "Load sample data"}
                  </button>
                ) : undefined
              }
            />
            {transactions === undefined ? (
              <div className="grid h-40 place-items-center">
                <Spinner className="h-5 w-5 text-mint-400" />
              </div>
            ) : (
              <TransactionList
                transactions={transactions as Array<{
                  _id: string;
                  type: TransactionType;
                  amount: number;
                  description: string;
                  category: string;
                  date: number;
                }>}
                onSeed={handleSeed}
              />
            )}

            <div className="border-t border-white/8 pt-5">
              <PanelHeader title="Monthly balance" subtitle="Net per month" />
              <div className="mt-4 h-48">
                {trend.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 4, right: 6, bottom: 0, left: -6 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={18}
                      />
                      <YAxis
                        tickFormatter={(v: number) => `$${Math.round(v)}`}
                        tickLine={false}
                        axisLine={false}
                        width={58}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(m) => formatMonth(String(m))}
                        formatter={(v: number) => [formatCurrency(v, { signed: true }), "Net"]}
                      />
                      <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                        {trend.map((point) => (
                          <Cell
                            key={point.month}
                            fill={point.net >= 0 ? "#43d6a5" : "#f2708c"}
                            fillOpacity={0.75}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    Not enough history yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <MarketPanel />

        <footer className="pb-4 pt-2 text-center text-xs text-slate-400">
          Ledgerline · market data by Alpha Vantage · cached for 10 min (quotes) and 1 hour (daily series)
        </footer>
      </main>
    </div>
  );
}
