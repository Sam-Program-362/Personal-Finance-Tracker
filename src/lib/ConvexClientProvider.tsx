import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

/**
 * The Convex client talks to the same origin as the app and relies on the
 * dev-server proxy (see `vite.config.ts`). That keeps the browser on one
 * origin, so it never has to reach the loopback-only Convex backend
 * directly. For a hosted deployment, set `VITE_CONVEX_URL` to the cloud
 * deployment URL and it takes over.
 */
const configured = import.meta.env.VITE_CONVEX_URL as string | undefined;
const isLoopback = configured
  ? /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/i.test(configured)
  : true;

const url = !isLoopback && configured ? configured : window.location.origin;

const convex = new ConvexReactClient(url);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
