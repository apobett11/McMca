import { chromium } from 'playwright';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${base}/#/login`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

const info = await page.evaluate(() => {
  const cs = (el) => getComputedStyle(el);
  const body = cs(document.body);
  const html = cs(document.documentElement);
  const app = document.getElementById('app');
  const first = app?.firstElementChild;
  return {
    dataTheme: document.documentElement.getAttribute('data-theme'),
    storedTheme: localStorage.getItem('mcmca-theme'),
    htmlBg: html.backgroundColor,
    htmlColorScheme: html.colorScheme,
    bodyBg: body.backgroundColor,
    bodyColor: body.color,
    appBg: app ? cs(app).backgroundColor : null,
    firstBg: first ? cs(first).backgroundColor : null,
    firstTag: first?.tagName,
    firstClass: first?.className || null,
    hasStylesheet: [...document.styleSheets].length,
    title: document.title,
    textSample: document.body.innerText.slice(0, 180)
  };
});

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'scripts/login-theme-check.png', fullPage: true });
await browser.close();
