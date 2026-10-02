import { chromium } from 'playwright';
import { describeSupabaseKey } from '../src/lib/supabaseKeys.js';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

function headerKind(headers) {
  const raw = headers.apikey || headers.authorization || '';
  const token = String(raw).replace(/^Bearer\s+/i, '').trim();
  return describeSupabaseKey(token);
}

function isSupabaseAuth(url) {
  return url.includes('supabase.co') && (url.includes('/auth/v1/') || url.includes('/rest/v1/'));
}

const launchOptions = { headless: true };
const browser = await chromium.launch(launchOptions).catch(async () => {
  return chromium.launch({ ...launchOptions, channel: 'msedge' });
}).catch(async () => {
  return chromium.launch({ ...launchOptions, channel: 'chrome' });
});

const page = await browser.newPage();
const consoleLines = [];
const authCalls = [];

page.on('console', (msg) => {
  consoleLines.push({ type: msg.type(), text: msg.text() });
});

page.on('request', (request) => {
  const url = request.url();
  if (!isSupabaseAuth(url)) return;
  const kind = headerKind(request.headers());
  authCalls.push({
    phase: 'request',
    method: request.method(),
    path: (() => { try { return new URL(url).pathname + url.slice(url.indexOf('?')); } catch { return url; } })(),
    keyKind: kind.kind,
    keyOk: kind.ok
  });
});

page.on('response', async (response) => {
  const url = response.url();
  if (!url.includes('/auth/v1/token')) return;
  const kind = headerKind(response.request().headers());
  authCalls.push({
    phase: 'response',
    status: response.status(),
    keyKind: kind.kind,
    keyOk: kind.ok,
    host: (() => { try { return new URL(url).host; } catch { return null; } })()
  });
});

await page.goto(`${base}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);

const bodyText = await page.locator('body').innerText();
const hasEmail = await page.locator('input[type="email"]').count();

if (hasEmail === 0) {
  console.log(JSON.stringify({
    base,
    title: await page.title(),
    loginForm: false,
    bodyPreview: bodyText.slice(0, 400),
    authCalls,
    console: consoleLines.filter((l) => l.type === 'error' || /secret|Forbidden|supabase|Refusing/i.test(l.text)).map((l) => ({
      type: l.type,
      text: l.text.slice(0, 200)
    }))
  }, null, 2));
  await browser.close();
  process.exit(0);
}

await page.locator('input[type="email"]').fill('probe@example.com');
await page.locator('input[type="password"]').fill('probe-password-not-real');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(5000);

const visibleError = await page.locator('text=/Forbidden|Invalid|invalid|failed|configured|secret|Login/i').allTextContents().catch(() => []);

console.log(JSON.stringify({
  base,
  title: await page.title(),
  loginForm: true,
  authCalls,
  visibleError: visibleError.join(' | ').slice(0, 400),
  console: consoleLines.filter((l) => l.type === 'error' || /secret|Forbidden|supabase|Refusing/i.test(l.text)).map((l) => ({
    type: l.type,
    text: l.text.slice(0, 220)
  }))
}, null, 2));

await browser.close();
