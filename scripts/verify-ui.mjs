/**
 * Browser verification: loads the landing page, signs up, loads sample data
 * and screenshots the dashboard, asserting charts and key UI actually render.
 *
 * Run with:
 *   bunx playwright@1.49.1 install chromium --with-deps
 *   VERIFY_APP_URL=http://169.254.0.21:5173 bun scripts/verify-ui.mjs
 */
import { chromium } from "playwright";

const base = process.env.VERIFY_APP_URL ?? "http://127.0.0.1:5173";
const shots = new URL("../screenshots/", import.meta.url).pathname;

const assert = (label, cond, extra = "") => {
  if (!cond) {
    console.error(`FAIL  ${label} ${extra}`);
    process.exitCode = 1;
  } else {
    console.log(`ok    ${label} ${extra}`);
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

// --- landing ---
await page.goto(base, { waitUntil: "networkidle" });
assert("landing hero heading", await page.locator("h1").first().isVisible());
assert(
  "landing mentions Alpha Vantage",
  (await page.textContent("body")).includes("Alpha Vantage"),
);
await page.screenshot({ path: `${shots}01-landing.png`, fullPage: true });

// --- auth redirect preserves returnTo ---
await page.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
assert("dashboard redirects when signed out", page.url().includes("/auth"));
assert("returnTo preserved", decodeURIComponent(page.url()).includes("returnTo=/dashboard"));

// --- sign up ---
await page.click("text=Create an account");
await page.fill('input[type="email"]', `ui-${Date.now()}@example.com`);
await page.fill('input[type="password"]', "a strong password");
await page.fill('input[autocomplete="name"]', "UI Tester");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 20_000 });
assert("signup lands on dashboard", page.url().includes("/dashboard"));

// --- empty state + seed ---
await page.waitForSelector("text=No transactions yet", { timeout: 20_000 });
await page.screenshot({ path: `${shots}02-dashboard-empty.png`, fullPage: true });
await page.click("text=Load sample data");
await page.waitForSelector("text=Whole Foods weekly run", { timeout: 20_000 });

// --- charts render ---
const svgCount = await page.locator(".recharts-surface").count();
assert("recharts surfaces rendered", svgCount >= 4, `(${svgCount} charts)`);
const barCount = await page.locator(".recharts-bar-rectangle").count();
assert("bar chart has bars", barCount > 0, `(${barCount} bars)`);
const pieCount = await page.locator(".recharts-pie-sector").count();
assert("pie chart has slices", pieCount > 0, `(${pieCount} slices)`);
const areaPath = await page.locator(".recharts-area-area").count();
assert("area chart has filled areas", areaPath > 0, `(${areaPath} areas)`);

// --- stat values ---
const body = (await page.textContent("body")) ?? "";
assert("shows rent transaction", body.includes("Rent"));
assert("shows savings rate", body.includes("Savings rate"));
assert("market panel present", body.includes("Live holdings"));

// --- add a transaction through the UI ---
await page.fill('input[placeholder="Weekly groceries"]', "UI verification coffee");
await page.fill('input[placeholder="0.00"]', "42.50");
await page.click('button[type="submit"]:has-text("Add expense")');
await page.waitForSelector("text=UI verification coffee", { timeout: 20_000 });
assert("new transaction appears", true);

// --- market data loads ---
await page.waitForSelector(".recharts-area-area", { timeout: 25_000 });
const marketBody = (await page.textContent("body")) ?? "";
assert("market panel shows a symbol", /AAPL|MSFT|SPY|NVDA/.test(marketBody));

await page.screenshot({ path: `${shots}03-dashboard.png`, fullPage: true });

// --- sign out returns to landing ---
await page.click("text=Sign out");
await page.waitForURL((url) => !url.pathname.includes("dashboard"), { timeout: 20_000 });
assert("sign out leaves dashboard", !page.url().includes("/dashboard"));

// --- mobile viewport ---
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base, { waitUntil: "networkidle" });
const scrollX = await mobile.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
assert("no horizontal overflow on mobile", scrollX <= 1, `(${scrollX}px)`);
await mobile.screenshot({ path: `${shots}04-landing-mobile.png`, fullPage: true });

const realErrors = errors.filter((e) => !e.includes("favicon"));
assert("no console/page errors", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(process.exitCode ? "\nSOME CHECKS FAILED" : "\nAll UI checks passed");
