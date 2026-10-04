import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-mint-400 to-mint-500 text-ink-950 shadow-[0_8px_24px_-10px_rgba(67,214,165,0.9)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M4 18.5 9 11l4 3.5L20 5.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[17px] font-extrabold tracking-tight text-white">
        Ledger<span className="text-mint-400">line</span>
      </span>
    </Link>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "text-slate-100",
    positive: "text-mint-400",
    negative: "text-rose-400",
    accent: "text-amber-400",
  };
  return (
    <div className="panel-tight group relative overflow-hidden p-4 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <p className="label">{label}</p>
        {icon ? <span className="text-slate-400 transition group-hover:text-slate-400">{icon}</span> : null}
      </div>
      <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${tones[tone]}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "border-white/10 bg-white/[0.04] text-slate-400",
    positive: "border-mint-400/30 bg-mint-400/10 text-mint-300",
    negative: "border-rose-400/30 bg-rose-400/10 text-rose-400",
    accent: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-lg text-slate-400">
        ◔
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-400">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
