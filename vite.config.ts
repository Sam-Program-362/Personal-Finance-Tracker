import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const CONVEX_TARGET = "http://127.0.0.1:3210";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    // Freebuff requires HMR to remain disabled.
    hmr: false,
    proxy: {
      // Convex's local backend listens on loopback only, which a browser
      // outside this container cannot reach. Proxying the API (including the
      // websocket upgrade used for live queries) through Vite lets the app
      // run entirely on one origin.
      "/api": { target: CONVEX_TARGET, changeOrigin: true, ws: true },
      "/version": { target: CONVEX_TARGET, changeOrigin: true },
      "/admin_api": { target: CONVEX_TARGET, changeOrigin: true, ws: true },
    },
  },
});
