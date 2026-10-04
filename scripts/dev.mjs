/**
 * Preview entrypoint.
 *
 * The local Convex backend only lives for as long as `convex dev` is
 * running, so this script owns both processes: it starts Convex, waits for
 * the deployment to become reachable, then starts Vite in the foreground.
 *
 * Both run in their own process groups so shutdown can take down the Convex
 * backend binary too. Killing only the `convex` wrapper leaves an orphaned
 * backend holding port 3210, which makes the next start fail.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CONVEX_URL = process.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3210";

const groups = [];

function shutdown(code = 0) {
  for (const pid of groups) {
    try {
      // Negative pid targets the whole process group.
      process.kill(-pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function convexIsUp() {
  try {
    const res = await fetch(`${CONVEX_URL}/version`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// --- 1. Convex backend -------------------------------------------------
if (await convexIsUp()) {
  console.log(`[dev] reusing backend already listening at ${CONVEX_URL}`);
} else {
  // Long-running `convex dev` (not `--once`): the local backend is a child of
  // this process and exits when it does, so `--once` would take the API down
  // as soon as the push finished.
  const convex = spawn("bun", ["convex", "dev"], {
    stdio: "inherit",
    env: process.env,
    detached: true,
  });
  groups.push(convex.pid);
  convex.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[dev] convex exited with code ${code}`);
      shutdown(code);
    }
  });

  // Wait until the deployment answers before starting Vite, otherwise the
  // client boots against a dead URL and the first render throws.
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await convexIsUp()) {
      ready = true;
      break;
    }
    await sleep(500);
  }
  if (!ready) {
    console.error(`[dev] Convex backend never became reachable at ${CONVEX_URL}`);
    shutdown(1);
  }
  console.log(`[dev] convex ready at ${CONVEX_URL}`);
}

// --- 2. Vite -----------------------------------------------------------
const vite = spawn("bun", ["run", "vite"], {
  stdio: "inherit",
  env: process.env,
  detached: true,
});
groups.push(vite.pid);
vite.on("exit", (code) => shutdown(code ?? 0));
