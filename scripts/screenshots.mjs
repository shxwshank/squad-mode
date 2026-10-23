// Takes 390x844 screenshots of every screen. Needs `npm run build` first and
// Playwright (`npm i -D playwright && npx playwright install chromium`), or set
// CHROME_PATH to any Chromium binary.
// Usage: node scripts/screenshots.mjs
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const PORT = 4179;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const url = `http://localhost:${PORT}/`;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('preview server did not start');
}

const args = process.env.CHROME_ARGS ? JSON.parse(process.env.CHROME_ARGS) : [];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args, headless: true });
const errors = [];
try {
  await waitForServer();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (name, opts = {}) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}${name}.png`, ...opts }); console.log('saved', name); };

  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await shot('01-home');
  await page.locator('#main').evaluate((el) => el.scrollTo(0, 99999));
  await shot('02-home-scrolled');
  await page.locator('#main').evaluate((el) => el.scrollTo(0, 0));

  await page.getByRole('button', { name: /Simulate a card swipe/ }).click();
  await shot('03-swipe-sheet');
  await page.getByRole('button', { name: /Custom split/ }).click();
  await page.locator('.who-chip').nth(4).click();
  await shot('04-swipe-custom');
  await page.getByRole('button', { name: /^Group/ }).click();
  await page.waitForTimeout(300);
  await shot('05-after-log-toast');

  await page.getByRole('button', { name: /Add a cash or UPI payment/ }).click();
  await page.locator('#cash-amt').fill('360');
  await page.locator('#cash-title').fill('Coconuts at Kudle');
  await shot('06-add-cash');
  await page.getByRole('button', { name: 'Add payment' }).click();

  await page.getByRole('button', { name: /^Invite/ }).first().click();
  await shot('07-invite');
  await page.getByRole('button', { name: /Send on WhatsApp/ }).click();

  await page.getByRole('button', { name: 'Activity' }).click();
  await shot('08-activity');

  await page.getByRole('button', { name: 'Settle' }).click();
  await shot('09-end-trip');
  await page.getByRole('button', { name: /End trip and settle up/ }).click();
  await shot('10-settle');
  const markBtns = page.getByRole('button', { name: /paying by UPI/ });
  await markBtns.first().click();
  await page.waitForTimeout(1200);
  await markBtns.first().click();
  await page.waitForTimeout(1200);
  await shot('11-settle-progress');
  await page.locator('#main').evaluate((el) => el.scrollTo(0, 99999));
  await shot('12-settle-nudges');

  await page.getByRole('button', { name: 'Trip menu' }).click();
  await shot('13-menu');
  await page.getByRole('button', { name: /Start a new trip/ }).click();
  await shot('14-setup');

  // narrow phone
  await page.setViewportSize({ width: 360, height: 760 });
  await page.getByRole('button', { name: /Back to/ }).click();
  await page.getByRole('button', { name: 'Trip', exact: true }).click();
  await shot('15-home-360');

  // desktop frame
  const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desk.goto(url);
  await desk.evaluate(() => localStorage.clear());
  await desk.reload();
  await desk.waitForTimeout(900);
  await desk.screenshot({ path: `${OUT}16-desktop.png` });
  console.log('saved 16-desktop');
} finally {
  await browser.close();
  server.kill();
  console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors');
}
