/**
 * Programmatic visual audit: layout boxes, contrast, overflow and overlap
 * detection on the landing page and dashboard.
 */
import { chromium } from "playwright";

const base = process.env.VERIFY_APP_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});

const assert = (label, cond, extra = "") => {
  console.log(`${cond ? "ok   " : "FAIL "} ${label} ${extra}`);
  if (!cond) process.exitCode = 1;
};

async function audit(page, name) {
  const report = await page.evaluate(() => {
    const problems = [];
    const seen = [];

    const parseColor = (c) => {
      const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const l1 = lum(a), l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    // Effective background by walking ancestors.
    const bgOf = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const c = parseColor(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0.5) return c;
        node = node.parentElement;
      }
      return { r: 8, g: 11, b: 18, a: 1 };
    };

    const els = [...document.querySelectorAll("body *")].filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (parseFloat(cs.opacity) < 0.3) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    // 1. Text with no glyphs (zero-height boxes)
    for (const el of els) {
      const onlyChild = el.children.length === 0 && el.textContent.trim().length > 0;
      if (!onlyChild) continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()];
      if (rects.length > 0 && rects.every((r) => r.height < 1)) {
        problems.push(`zero-height text: "${el.textContent.trim().slice(0, 40)}"`);
      }
    }

    // 2. Horizontal overflow
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (docOverflow > 1) problems.push(`page overflows horizontally by ${docOverflow}px`);

    // 3. Elements escaping the viewport
    const vw = document.documentElement.clientWidth;
    for (const el of els) {
      if (el.closest("svg")) continue;
      const cs = getComputedStyle(el);
      if (cs.position === "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 2 || r.left < -2) {
        // Recharts tooltips/legends can legitimately sit outside while hidden.
        if (el.offsetParent !== null && r.width > 0) {
          problems.push(
            `escapes viewport: <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 40)}"> right=${Math.round(r.right)} vw=${vw}`,
          );
        }
      }
      seen.push(el);
    }

    // 4. Contrast of visible text against its effective background
    let worst = { ratio: 99, text: "", cls: "" };
    for (const el of els) {
      if (el.children.length > 0 && el.textContent.trim().length > 20) continue;
      const text = el.textContent.trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      const fg = parseColor(cs.color);
      if (!fg || fg.a < 0.5) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 4) continue;
      const size = parseFloat(cs.fontSize);
      const weight = Number(cs.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const cr = ratio(fg, bgOf(el));
      const required = large ? 3 : 4.5;
      if (cr < required && cr < worst.ratio) {
        worst = { ratio: cr, text: text.slice(0, 30), cls: String(el.className).slice(0, 50) };
      }
      if (cr < required) {
        problems.push(
          `low contrast ${cr.toFixed(2)} (need ${required}) size=${size} "${text.slice(0, 30)}" .${String(el.className).slice(0, 40)}`,
        );
      }
    }

    return {
      problems: [...new Set(problems)],
      worst,
      elCount: els.length,
      docOverflow,
    };
  });

  console.log(`\n=== ${name} (${report.elCount} visible elements) ===`);
  assert(`${name}: no visual problems`, report.problems.length === 0, `${report.problems.length} issues`);
  for (const p of report.problems.slice(0, 15)) console.log(`      - ${p}`);
  return report;
}

// --- landing ---
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(base, { waitUntil: "networkidle" });
await audit(page, "landing 1440");

await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(500);
await audit(page, "landing 768");

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
await audit(page, "landing 390");

// --- dashboard ---
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(`${base}/auth?returnTo=%2Fdashboard`, { waitUntil: "networkidle" });
await page.click("text=Create an account");
await page.fill('input[type="email"]', `audit-${Date.now()}@example.com`);
await page.fill('input[type="password"]', "a strong password");
await page.fill('input[autocomplete="name"]', "Audit User");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 20000 });
await page.waitForSelector("text=No transactions yet", { timeout: 20000 });
await page.click("text=Load sample data");
await page.waitForSelector("text=Whole Foods weekly run", { timeout: 20000 });
await page.waitForTimeout(3500);
await audit(page, "dashboard 1440");

await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(800);
await audit(page, "dashboard 768");

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
await audit(page, "dashboard 390");

await browser.close();
console.log(process.exitCode ? "\nAUDIT FOUND ISSUES" : "\nVisual audit clean");
