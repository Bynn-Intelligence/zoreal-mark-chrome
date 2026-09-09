/**
 * Loads the built extension into a local Chrome, points it at the mock record
 * server, opens the demo page and checks that every fixture case rendered the
 * verdict the fixture expects. Screenshots land in dev/screens/.
 *
 *   npm run build && npm run mock &   (in another shell)
 *   node dev/e2e.mjs
 *
 * Needs puppeteer-core (installed without saving) and a Chromium build that
 * still honours --load-extension: Chrome for Testing or Chromium. Branded
 * Google Chrome dropped that flag in version 137. Point CHROME at the binary.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DIST = new URL('../dist', import.meta.url).pathname;
const MOCK = 'http://localhost:4820';
mkdirSync('dev/screens', { recursive: true });

const require = createRequire(import.meta.url);
const cases = JSON.parse(readFileSync(require.resolve('@zoreal/mark-verify/fixtures/index.json'), 'utf8'));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  pipe: true,
  args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`, '--enable-unsafe-extension-debugging', '--no-first-run', '--window-size=1200,900'],
  defaultViewport: { width: 1200, height: 900 },
});
try {
  const worker = await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().startsWith('chrome-extension://'), { timeout: 15000 });
  const extId = new URL(worker.url()).host;
  console.log('extension', extId);

  // Point the extension at the mock through its own options page.
  const options = await browser.newPage();
  await options.goto(`chrome-extension://${extId}/src/options/index.html`);
  await options.waitForSelector('#baseUrl');
  await options.$eval('#baseUrl', (el, v) => { el.value = v; }, MOCK);
  await options.click('#save');
  await options.waitForFunction(() => document.getElementById('status')?.textContent === 'Saved');
  await options.screenshot({ path: 'dev/screens/options.png' });

  const page = await browser.newPage();
  await page.goto(`${MOCK}/demo`, { waitUntil: 'networkidle0' });
  const hosts = await page.$$eval('[data-zoreal-mark-host]:not([data-zoreal-mark-host="sign"])', (els) => els.map((e) => e.getAttribute('data-zoreal-mark-host')));
  console.log(`${hosts.length} badges placed`);

  // Each badge writes its verdict on its host element once the background answers.
  await page.waitForFunction(() => {
    const hosts = [...document.querySelectorAll('[data-zoreal-mark-host]:not([data-zoreal-mark-host="sign"])')];
    return hosts.length > 0 && hosts.every((h) => h.hasAttribute('data-zoreal-verdict'));
  }, { timeout: 60000 });
  const verdicts = await page.$$eval('[data-zoreal-mark-host]:not([data-zoreal-mark-host="sign"])', (els) => els.map((e) => [e.getAttribute('data-zoreal-mark-host'), e.getAttribute('data-zoreal-verdict'), e.getAttribute('data-zoreal-reason')]));
  const byId = new Map();
  for (const [id, v, reason] of verdicts) byId.set(id, (byId.get(id) ?? new Set()).add(v + (reason ? ` (${reason})` : '')));
  console.log(`${verdicts.length} verdicts rendered`);

  let failures = 0;
  for (const c of cases.filter((c) => c.pageUrl !== undefined && c.text !== undefined)) {
    // The demo page renders every case; cases that reuse one id with different text or page cannot all be right at once,
    // so only compare cases whose text and page match what the demo shows.
    if (c.pageUrl !== null && !String(c.pageUrl).startsWith('https://www.youtube.com') && !String(c.pageUrl).startsWith('https://app.slack.com') && c.pageUrl !== 'https://example.org/repost' && c.pageUrl !== `${MOCK}/demo`) continue;
    const got = c.name === 'fail-1-bad-id' ? byId.get('broken') : byId.get(c.id);
    if (!got) { console.log(`  MISSING ${c.name}`); failures++; continue; }
    // On the demo page every page-bound record is "for another page", because the demo is not the page it was signed for.
    const expected = c.pageUrl !== `${MOCK}/demo` && (c.expect.verdict === 'verified_here' || c.expect.verdict === 'verified_in_channel') ? 'verified_other_page' : c.expect.verdict;
    const ok = [...got].some((g) => g.startsWith(expected)) || (c.name.startsWith('ok-email') && got.has('verified_unbound'));
    if (!ok) { console.log(`  WRONG ${c.name}: expected ${expected}, got ${[...got].join('/')}`); failures++; }
  }
  console.log(failures === 0 ? 'every case rendered as expected' : `${failures} mismatches`);

  // A strongly verified Mark shows its words and its badge, not its markers:
  // both marker strings are hidden, and a paragraph holding only a marker
  // is hidden with it. The block-form copy in #here is the one to check.
  const hidden = await page.evaluate(() => {
    const here = document.getElementById('here');
    if (!here) return null;
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const markers = [...here.querySelectorAll('[data-zoreal-marker]')];
    const paragraphs = [...here.querySelectorAll('p')];
    return { markers: markers.length, markersVisible: markers.filter(visible).length, paragraphsVisible: paragraphs.filter(visible).length,
      visibleText: here.innerText.replace(/\s+/g, ' ').trim().slice(0, 80), verdict: here.querySelector('[data-zoreal-verdict]')?.getAttribute('data-zoreal-verdict') };
  });
  console.log('verified block:', JSON.stringify(hidden));
  await page.evaluate(() => document.getElementById('here')?.scrollIntoView({ block: 'center' }));
  await (await page.$('#here'))?.screenshot({ path: 'dev/screens/verified-block.png' });
  if (!hidden || hidden.verdict !== 'verified_here' || hidden.markers !== 2 || hidden.markersVisible !== 0 || hidden.visibleText.includes('::ZOREAL')) { console.log('  WRONG: markers of a verified Mark still visible'); failures++; }

  // Hover the first badge for the card, and focus the demo box for the sign control.
  await page.hover('[data-zoreal-mark-host]:not([data-zoreal-mark-host="sign"])');
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'dev/screens/demo-hover.png' });
  await page.click('#demo-box');
  await page.type('#demo-box', 'I was at the launch and the demo was real.');
  await new Promise((r) => setTimeout(r, 300));
  const controlShown = await page.$eval('[data-zoreal-mark-host="sign"]', (el) => el.style.display !== 'none');
  console.log(`sign control shown beside the listed box: ${controlShown}`);
  await page.screenshot({ path: 'dev/screens/demo-sign-control.png' });

  // The popup, opened as a page: the sign flow reads the demo tab's box through the content script.
  const popup = await browser.newPage();
  await popup.goto(`chrome-extension://${extId}/src/popup/index.html`);
  await new Promise((r) => setTimeout(r, 800));
  await popup.screenshot({ path: 'dev/screens/popup.png' });
  process.exitCode = failures === 0 && controlShown ? 0 : 1;
} finally {
  await browser.close();
}
