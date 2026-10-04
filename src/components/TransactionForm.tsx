import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getToken } from "../lib/session";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
} from "../lib/format";
import { Spinner } from "./ui";

export function TransactionForm({ onAdded }: { onAdded?: () => void }) {
  const add = useMutation(api.transactions.add);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("groceries");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!description.trim()) {
      setError("Add a short description.");
      return;
    }

    setSaving(true);
    try {
      await add({
        token: getToken() ?? undefined,
        type,
        amount: parsed,
        description: description.trim(),
        category,
        date: new Date(`${date}T12:00:00`).getTime(),
      });
      setAmount("");
      setDescription("");
      onAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-ink-850 p-1">
        {(["expense", "income"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setType(value);
              setCategory(value === "expense" ? "groceries" : "salary");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${
              type === value
                ? value === "expense"
                  ? "bg-rose-400/15 text-rose-400"
                  : "bg-mint-400/15 text-mint-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Amount</span>
          <input
            className="input mt-1.5 font-mono"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Date</span>
          <input
            className="input mt-1.5"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span className="label">Description</span>
        <input
          className="input mt-1.5"
          placeholder="Weekly groceries"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div>
        <span className="label">Category</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`chip capitalize transition ${
                category === c
                  ? "border-mint-400/50 bg-mint-400/10 text-mint-300"
                  : "hover:border-white/25 hover:text-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-400">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? <Spinner /> : null}
        {saving ? "Saving…" : `Add ${type}`}
      </button>
    </form>
  );
}
