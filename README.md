# Ledgerline

A personal finance tracker focused on **data visualization and caching**. Track income
and expenses, watch your cash flow and category splits, and follow holdings with live
Alpha Vantage quotes that are cached so you never burn the free-tier rate limit.

## Stack

| Concern    | Choice                                   |
| ---------- | ---------------------------------------- |
| Frontend   | Vite + React 18 + TypeScript             |
| Styling    | Tailwind CSS                             |
| Charts     | Recharts                                 |
| Backend/DB | Convex (queries, mutations, actions)     |
| Auth       | Email/password, PBKDF2 + bearer sessions |
| Market data| Alpha Vantage (`GLOBAL_QUOTE`, `TIME_SERIES_DAILY`) |

## Getting started

```bash
bun install
bun run dev        # starts Convex + Vite together
```

`bun run dev` runs `scripts/dev.mjs`, which owns **both** processes. The Convex local
backend only lives as long as `convex dev` is running, so it is spawned as a child in
its own process group and shut down together with Vite. The script waits for the
deployment to answer `/version` before starting Vite, so the app never boots against a
dead backend.

The Convex client talks to the **same origin** as the app and relies on the dev-server
proxy in `vite.config.ts`, so a browser outside the container never needs to reach the
loopback-only Convex backend directly.

## Caching strategy

Alpha Vantage's free tier allows roughly 25 requests/day, so nothing hits the upstream
API on render. Every read goes through `cacheThrough` in `convex/market.ts`, backed by
the `quoteCache` table:

| Data          | TTL   | Rationale                              |
| ------------- | ----- | -------------------------------------- |
| Live quotes   | 10 min| Prices move fast                       |
| Daily series  | 1 hour| One close per day, no benefit refreshing |

Behaviour when upstream cannot be reached:

1. **Fresh cache hit** → served from cache, no upstream call.
2. **No key / rate limited / network error** → prefer a **stale** cache entry over
   fabricated data.
3. **Nothing cached at all** → fall back to a deterministic simulated series, clearly
   badged as *demo data* in the UI.

The dashboard's "Cache health" panel shows entry counts, freshness and cache age, and
`market.refresh` invalidates a single symbol on demand.

## Verification

Three suites run against the live app, not mocks:

```bash
bun tsc -b --noEmit                      # types

# Backend: auth, isolation, aggregates, caching behaviour
VERIFY_CONVEX_URL=http://127.0.0.1:5173 bun scripts/verify-backend.mjs

# Browser: signup, charts render, no console errors, mobile overflow
VERIFY_APP_URL=http://127.0.0.1:5173 bun scripts/verify-ui.mjs

# Visual: WCAG AA contrast, overflow, layout across 1440/768/390
VERIFY_APP_URL=http://127.0.0.1:5173 bun scripts/audit-visual.mjs
```

The browser suites need Chromium once:

```bash
bunx playwright install chromium
```

## Environment

| Variable                    | Required | Purpose                                  |
| --------------------------- | -------- | ---------------------------------------- |
| `ALPHA_VANTAGE_API_KEY`     | no       | Real market data; simulated without it   |
| `VITE_CONVEX_URL`           | prod     | Cloud Convex deployment URL              |

`VITE_CONVEX_URL` is written to `.env.local` automatically for local dev and points at
the loopback backend. **For a production deploy you must set it to a hosted Convex
deployment URL** — the static host serves only the frontend bundle and cannot run the
Convex backend, so the client would otherwise have no API to talk to.

## Deploying

```bash
freebuff-deploy check     # confirm install/build commands
```

Install is `bun install`, build is `vite build`, which emits static output to `dist/`.
Set `VITE_CONVEX_URL` for the hosted deployment before publishing.
