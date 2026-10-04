import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Logo } from "../components/ui";
import { formatCurrency } from "../lib/format";

const SAMPLE_TREND = [
  { month: "Jan", income: 5200, expense: 3980 },
  { month: "Feb", income: 5450, expense: 4120 },
  { month: "Mar", income: 5180, expense: 3760 },
  { month: "Apr", income: 5840, expense: 4290 },
  { month: "May", income: 6100, expense: 3980 },
  { month: "Jun", income: 6320, expense: 4110 },
];

const FEATURES = [
  {
    tag: "Visualization",
    title: "Cash flow you can read at a glance",
    body: "Stacked income and spending areas, a running net line, and a category donut — so the month explains itself without a spreadsheet.",
    accent: "text-mint-400",
  },
  {
    tag: "Caching",
    title: "Market data without burning your quota",
    body: "Quotes and daily series are cached server-side in Convex for 10 minutes and 1 hour respectively. Rate limits stop being your problem.",
    accent: "text-amber-400",
  },
  {
    tag: "Live quotes",
    title: "Holdings next to your cash flow",
    body: "Alpha Vantage powers live quotes for the symbols you follow, with a graceful demo fallback when no API key is configured.",
    accent: "text-sky-300",
  },
  {
    tag: "Privacy",
    title: "Your numbers stay yours",
    body: "Passwords are salted and hashed with PBKDF2, and sessions store only a token hash — never the raw credential.",
    accent: "text-violet-300",
  },
];

const STEPS = [
  { n: "01", title: "Create your account", body: "Email and password. No card, no onboarding wizard." },
  { n: "02", title: "Log income and expenses", body: "Categorized entries with dates, editable anytime." },
  { n: "03", title: "Read the story", body: "Charts, savings rate and category splits update instantly." },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[28rem] w-[28rem] max-w-[70vw] rounded-full bg-mint-400/12 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-amber-400/10 blur-[110px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-grid-fade" />

      <div className="relative">
        {/* Nav */}
        <header className="sticky top-0 z-30 border-b border-white/8 bg-ink-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3.5">
            <Logo />
            <nav className="ml-auto hidden items-center gap-7 text-sm text-slate-400 md:flex">
              <a href="#features" className="transition hover:text-slate-200">Features</a>
              <a href="#how" className="transition hover:text-slate-200">How it works</a>
              <a href="#charts" className="transition hover:text-slate-200">Charts</a>
            </nav>
            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="btn-ghost px-3.5 py-2 text-xs sm:text-sm"
              >
                Sign in
              </Link>
              <Link
                to="/auth?returnTo=%2Fdashboard&mode=signup"
                className="btn-primary px-3.5 py-2 text-xs sm:text-sm"
              >
                Get started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="chip border-mint-400/30 bg-mint-400/10 text-mint-300">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
                Live market data · server-side caching
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
                Your money,
                <br />
                <span className="text-mint-400">rendered as a story.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
                Ledgerline turns income and expenses into charts you can actually read —
                cash flow, category splits, savings rate and live holdings, all backed by
                Alpha Vantage quotes cached so you never hit a rate limit.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/auth?returnTo=%2Fdashboard&mode=signup"
                  className="btn-primary px-5 py-3"
                >
                  Create free account
                </Link>
                <Link to="/auth?returnTo=%2Fdashboard" className="btn-ghost px-5 py-3">
                  I already have one
                </Link>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/8 pt-6">
                {[
                  ["3", "chart views"],
                  ["10m", "quote cache"],
                  ["$0", "to start"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-mono text-xl font-semibold text-white">{value}</dt>
                    <dd className="text-xs text-slate-400">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Hero chart card */}
            <div id="charts" className="panel relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label">Cash flow</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-mint-400">
                    {formatCurrency(1840, { signed: true })}
                  </p>
                </div>
                <span className="chip">Last 6 months</span>
              </div>
              <div className="mt-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SAMPLE_TREND} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                    <defs>
                      <linearGradient id="heroInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#43d6a5" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#43d6a5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="heroExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f0b95c" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#f0b95c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis
                      domain={[0, 7000]}
                      tickFormatter={(v: number) => `$${v / 1000}k`}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#43d6a5"
                      strokeWidth={2}
                      fill="url(#heroInc)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#f0b95c"
                      strokeWidth={2}
                      fill="url(#heroExp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/8 pt-4">
                {[
                  ["Income", "$34.1k", "text-mint-400"],
                  ["Spending", "$24.2k", "text-amber-400"],
                  ["Rate", "28.9%", "text-slate-200"],
                ].map(([label, value, tone]) => (
                  <div key={label}>
                    <p className="label">{label}</p>
                    <p className={`mt-1 font-mono text-sm font-semibold ${tone}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-white/8 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="label">Built for clarity</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
                Four things, done properly.
              </h2>
              <p className="mt-3 text-slate-400">
                No account aggregation, no bank logins. Just a fast, honest ledger with
                good charts on top of it.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="panel group p-6 transition hover:border-white/20"
                >
                  <p className={`label ${f.accent}`}>{f.tag}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-white/8 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="label">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              From zero to insight in a minute.
            </h2>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n} className="panel relative overflow-hidden p-6">
                  <span className="absolute -right-2 -top-4 font-mono text-6xl font-bold text-white/[0.05]">
                    {step.n}
                  </span>
                  <p className="font-mono text-sm font-semibold text-mint-400">{step.n}</p>
                  <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/8 py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="panel relative overflow-hidden px-8 py-14">
              <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-mint-400/10 blur-3xl" />
              <h2 className="relative text-3xl font-bold tracking-tight text-white">
                Start tracking today.
              </h2>
              <p className="relative mx-auto mt-3 max-w-md text-slate-400">
                Free, no card, and your first chart renders before your coffee cools.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/auth?returnTo=%2Fdashboard&mode=signup"
                  className="btn-primary px-6 py-3"
                >
                  Create your account
                </Link>
                <Link to="/auth?returnTo=%2Fdashboard" className="btn-ghost px-6 py-3">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/8 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-xs text-slate-400 sm:flex-row sm:justify-between">
            <Logo />
            <p>Market data by Alpha Vantage · cached in Convex · built with React, Tailwind and Recharts.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
