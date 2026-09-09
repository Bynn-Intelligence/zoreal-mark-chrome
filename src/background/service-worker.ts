import { PRODUCTION_ANCHORS, verifyMark, type TrustAnchors, type VerifyResult } from '@zoreal/mark-verify';
import { RecordService, clearRecordCache } from '../shared/api.js';
import type { MarkSummary, Request, TabState } from '../shared/messages.js';
import { isLocalDev, loadSettings, saveSettings } from '../shared/settings.js';

/**
 * The service worker. Verification runs here and only here, so a page has no
 * way to influence it: the content script sends the text it found and the id,
 * the worker fetches the record, runs the verifier against the pinned roots,
 * and returns the verdict. Per-tab state feeds the toolbar badge and the popup.
 */

/**
 * Per-tab state lives in session storage, not in a variable. Chrome stops an
 * idle service worker after half a minute and starts a fresh one on the next
 * message, and a variable does not survive that: the popup then opened on a
 * page full of badges and said there were no Marks on it. Session storage
 * lasts until the browser closes and is cleared per tab on navigation.
 */
const store = chrome.storage.session;
const log = (...args: unknown[]): void => console.debug('[ZOREAL Mark]', ...args);

async function getTab(tabId: number): Promise<TabState | null> {
  const key = `tab:${tabId}`;
  return ((await store.get(key))[key] as TabState | undefined) ?? null;
}
async function setTab(tabId: number, state: TabState): Promise<void> {
  await store.set({ [`tab:${tabId}`]: state });
}
async function clearTab(tabId: number): Promise<void> {
  await store.remove([`tab:${tabId}`, `frame:${tabId}`]);
}
/** The frame that last held the cursor in an editable box, per tab. */
async function getFrame(tabId: number): Promise<number> {
  const key = `frame:${tabId}`;
  return ((await store.get(key))[key] as number | undefined) ?? 0;
}
async function setFrame(tabId: number, frameId: number): Promise<void> {
  await store.set({ [`frame:${tabId}`]: frameId });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'zoreal-sign', title: 'Sign this with ZOREAL Mark', contexts: ['editable'] });
  // Content scripts land only in pages loaded after the extension. The tabs
  // already open at install or reload would otherwise answer nothing until
  // reloaded, and the popup would blame the cursor.
  void injectIntoOpenTabs();
});

const CONTENT_FILES = chrome.runtime.getManifest().content_scripts?.[0]?.js ?? [];

async function injectIntoOpenTabs(): Promise<void> {
  const open = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
  await Promise.all(open.map((t) => (t.id === undefined ? Promise.resolve() : ensureContent(t.id))));
}

/** True when the page answers; injects first when it does not (once, idempotent). */
async function ensureContent(tabId: number): Promise<boolean> {
  const alive = await chrome.tabs.sendMessage(tabId, { type: 'ping' }).then(() => true).catch(() => false);
  if (alive) return true;
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: CONTENT_FILES });
    return await chrome.tabs.sendMessage(tabId, { type: 'ping' }).then(() => true).catch(() => false);
  } catch {
    return false; // chrome://, the Web Store, and other pages no extension may touch
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'zoreal-sign') return;
  // The menu knows which frame was right-clicked; the popup asks that one.
  if (tab?.id !== undefined) void setFrame(tab.id, info.frameId ?? 0);
  void openPopup();
});

chrome.tabs.onRemoved.addListener((tabId) => { void clearTab(tabId); });
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading') {
    log('tab', tabId, 'loading; state cleared');
    void clearTab(tabId);
    void chrome.action.setBadgeText({ tabId, text: '' });
  }
});

chrome.runtime.onMessage.addListener((msg: Request, sender, sendResponse) => {
  handle(msg, sender).then(sendResponse, (e) => sendResponse({ error: e instanceof Error ? e.message : String(e) }));
  return true;
});

async function handle(msg: Request, sender: chrome.runtime.MessageSender): Promise<unknown> {
  switch (msg.type) {
    case 'verify': {
      const tabId = sender.tab?.id;
      // A Mark inside a frame is judged against the page the reader is on,
      // which only the extension knows: a cross-origin frame sees at most the
      // top page's origin. The same rule binds a Mark signed in a frame.
      const pageUrl = pageUrlFor(sender, msg.pageUrl);
      const results: MarkSummary[] = [];
      for (const m of msg.marks) {
        const summary = await verifyOne(m, pageUrl);
        results.push({ ...summary, text: m.text, where: { frameId: sender.frameId ?? 0, ordinal: m.ordinal } });
      }
      log('verify', msg.marks.length, 'mark(s) from tab', tabId, 'frame', sender.frameId, 'on', pageUrl, '->', results.map((r) => r.verdict).join(', '));
      if (tabId !== undefined) {
        const prev = await getTab(tabId);
        const merged = mergeMarks(prev?.marks ?? [], results);
        const state: TabState = { url: pageUrl, marks: merged, page: prev?.page ?? undefined, updatedAt: Date.now() };
        await setTab(tabId, state);
        await updateBadge(tabId, state);
      }
      return { results };
    }
    case 'verifyPage': {
      const tabId = sender.tab?.id;
      const page = await verifyOne({ marker: 'signed', text: msg.text, id: msg.id }, msg.pageUrl);
      log('verifyPage', msg.id, 'from tab', tabId, '->', page.verdict);
      if (tabId !== undefined) {
        const prev = await getTab(tabId);
        const state: TabState = { url: msg.pageUrl, marks: prev?.marks ?? [], page, updatedAt: Date.now() };
        await setTab(tabId, state);
        await updateBadge(tabId, state);
      }
      return { result: page };
    }
    case 'tabState': {
      const tabId = msg.tabId ?? (await activeTabId());
      return tabId === undefined ? null : getTab(tabId);
    }
    case 'openPopupForSigning':
      return { opened: await openPopup() };
    case 'ensureContent':
      return { ok: await ensureContent(msg.tabId) };
    case 'editableFocused':
      if (sender.tab?.id !== undefined) await setFrame(sender.tab.id, sender.frameId ?? 0);
      return { ok: true };
    case 'signFrame':
      return { frameId: await getFrame(msg.tabId) };
    case 'createOrder': {
      const s = await loadSettings();
      return new RecordService(s.baseUrl, s.apiPrefix).createOrder(msg.body);
    }
    case 'pollOrder': {
      const s = await loadSettings();
      return new RecordService(s.baseUrl, s.apiPrefix).pollOrder(msg.order);
    }
    case 'getSettings':
      return loadSettings();
    case 'saveSettings':
      await saveSettings(msg.settings);
      await clearRecordCache();
      return { ok: true };
    case 'clearCache':
      await clearRecordCache();
      return { ok: true };
  }
}

/** The top page's URL for a message from a frame, the frame's own for the top document. */
function pageUrlFor(sender: chrome.runtime.MessageSender, reported: string): string {
  return (sender.frameId ?? 0) !== 0 && sender.tab?.url ? sender.tab.url : reported;
}

async function verifyOne(m: { marker: 'signed' | 'delegated'; text: string; id: string }, pageUrl: string): Promise<MarkSummary> {
  const settings = await loadSettings();
  const service = new RecordService(settings.baseUrl, settings.apiPrefix);
  const anchors = await anchorsFor(settings.baseUrl, service);
  const result: VerifyResult = await verifyMark(
    { marker: m.marker, text: m.text, id: m.id },
    { fetchRecord: (id) => service.fetchRecord(id), anchors, pageUrl },
  );
  if (result.verdict === 'verified_other_page' && settings.sightings) {
    void service.reportSighting(m.id, pageUrl);
  }
  const { record: _record, ...summary } = result;
  return { ...summary, id: m.id, marker: m.marker };
}

/**
 * Production pins the roots compiled into the verifier and never fetches
 * them. The one exception is a mock record server on localhost, which serves
 * fixture records under fixture roots; those are fetched from it, and only
 * when the configured origin is localhost. A production origin can never
 * reach this branch.
 */
let devAnchors: TrustAnchors | undefined;
async function anchorsFor(baseUrl: string, service: RecordService): Promise<TrustAnchors> {
  if (!isLocalDev(baseUrl)) return PRODUCTION_ANCHORS;
  if (!devAnchors) {
    try {
      devAnchors = (await service.fetchDevAnchors()) as TrustAnchors;
    } catch {
      return PRODUCTION_ANCHORS;
    }
  }
  return devAnchors;
}

/** One entry per occurrence on the page: the same id twice is two places to point at. */
function mergeMarks(prev: MarkSummary[], next: MarkSummary[]): MarkSummary[] {
  const key = (m: MarkSummary) => (m.where ? `${m.where.frameId}:${m.where.ordinal}` : m.id);
  const byKey = new Map(prev.map((m) => [key(m), m]));
  for (const m of next) byKey.set(key(m), m);
  return [...byKey.values()];
}

async function updateBadge(tabId: number, state: TabState): Promise<void> {
  const all = [...state.marks, ...(state.page ? [state.page] : [])];
  if (all.length === 0) {
    await chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }
  const strong = all.filter((m) => m.verdict === 'verified_here' || m.verdict === 'verified_in_channel' || m.verdict === 'verified_email').length;
  const failed = all.filter((m) => m.verdict === 'not_verified').length;
  // The toolbar is the reader's own check, so it states the worst case first.
  const colour = failed > 0 ? '#D93036' : strong > 0 ? '#00758D' : '#697386';
  await chrome.action.setBadgeBackgroundColor({ tabId, color: colour });
  await chrome.action.setBadgeTextColor?.({ tabId, color: '#FFFFFF' });
  await chrome.action.setBadgeText({ tabId, text: String(all.length) });
}

async function activeTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id;
}

async function openPopup(): Promise<boolean> {
  try {
    await chrome.action.openPopup();
    return true;
  } catch {
    return false;
  }
}
