import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getToken } from "../lib/session";
import {
  CATEGORY_META,
  categoryColor,
  formatCurrency,
  formatDate,
  type TransactionType,
} from "../lib/format";
import { EmptyState } from "./ui";

interface Txn {
  _id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: number;
}

export function TransactionList({
  transactions,
  onSeed,
}: {
  transactions: Txn[];
  onSeed?: () => void;
}) {
  const remove = useMutation(api.transactions.remove);
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const rows = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);
    return [...rows].sort((a, b) => b.date - a.date);
  }, [transactions, filter]);

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      await remove({ token: getToken() ?? undefined, id: id as never });
    } finally {
      setPendingId(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        body="Add your first income or expense, or load a sample month to see the charts come alive."
        action={
          onSeed ? (
            <button onClick={onSeed} className="btn-primary mt-1">
              Load sample data
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {(["all", "expense", "income"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`chip capitalize transition ${
              filter === value
                ? "border-mint-400/50 bg-mint-400/10 text-mint-300"
                : "hover:border-white/25 hover:text-slate-200"
            }`}
          >
            {value}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-slate-400">
          {visible.length} shown
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/12 py-8 text-center text-sm text-slate-400">
          No {filter} entries in this period.
        </p>
      ) : (
        <ul className="divide-y divide-white/6">
          {visible.map((t) => {
            const meta = CATEGORY_META[t.category];
            const income = t.type === "income";
            return (
              <li
                key={t._id}
                className="group flex items-center gap-3 py-3 transition hover:bg-white/[0.02] sm:gap-4"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm"
                  style={{
                    borderColor: `${categoryColor(t.category)}33`,
                    backgroundColor: `${categoryColor(t.category)}14`,
                    color: categoryColor(t.category),
                  }}
                >
                  {meta?.icon ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {t.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {meta?.label ?? t.category} · {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    income ? "text-mint-400" : "text-slate-200"
                  }`}
                >
                  {income ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </span>
                <button
                  onClick={() => handleDelete(t._id)}
                  disabled={pendingId === t._id}
                  aria-label={`Delete ${t.description}`}
                  className="shrink-0 rounded-lg border border-transparent px-2 py-1 text-xs text-slate-400 opacity-0 transition hover:border-rose-400/30 hover:text-rose-400 focus:opacity-100 group-hover:opacity-100"
                >
                  {pendingId === t._id ? "…" : "Delete"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
