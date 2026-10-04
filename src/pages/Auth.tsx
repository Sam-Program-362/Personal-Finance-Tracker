import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { setSession, type StoredUser } from "../lib/session";
import { Logo, Spinner } from "../components/ui";

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const register = useMutation(api.users.register);
  const login = useMutation(api.users.login);

  const returnTo = params.get("returnTo") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result =
        mode === "signup"
          ? await register({ email, password, name: name || email.split("@")[0] })
          : await login({ email, password });

      const user: StoredUser = { _id: result.userId, email, name: name || email.split("@")[0] };
      setSession(result.token, user);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-mint-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <Logo />

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="panel p-7">
              <div className="mb-6">
                <p className="label">
                  {mode === "signin" ? "Welcome back" : "Start tracking"}
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {mode === "signin" ? "Sign in to Ledgerline" : "Create your account"}
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  {mode === "signin"
                    ? "Your transactions and charts are waiting."
                    : "Track income, expenses and holdings in about a minute."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" ? (
                  <label className="block">
                    <span className="label">Name</span>
                    <input
                      className="input mt-1.5"
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="label">Email</span>
                  <input
                    className="input mt-1.5"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>

                <label className="block">
                  <span className="label">Password</span>
                  <input
                    className="input mt-1.5"
                    type="password"
                    required
                    minLength={8}
                    placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </label>

                {error ? (
                  <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-400">
                    {error}
                  </p>
                ) : null}

                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? <Spinner /> : null}
                  {busy
                    ? "Please wait…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-400">
                {mode === "signin" ? "New here? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                  }}
                  className="font-semibold text-mint-400 transition hover:text-mint-300"
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              New accounts start empty —{" "}
              <Link to="/" className="text-slate-400 underline-offset-2 hover:underline">
                back to the overview
              </Link>{" "}
              to see how it works.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
