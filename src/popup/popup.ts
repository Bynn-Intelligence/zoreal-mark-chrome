import { normaliseUrl, siteOf, textHash } from '@zoreal/mark-verify';
import QRCode from 'qrcode';
import type { MarkSummary, OrderCreated, OrderStatus, SignTarget, TabState } from '../shared/messages.js';
import { qrFrame, launchLink } from '../shared/qr.js';
import { newOrderKey, seal } from '../shared/seal.js';
import { icon, subjectLine, verdictView } from '../ui/verdict.js';

/**
 * The toolbar popup: what this tab's Marks verified as, and the sign flow.
 * The popup is the surface a page cannot draw, which is why the verdict list
 * and the QR code live here rather than in the page.
 */

const app = document.getElementById('app')!;
const send = <T,>(msg: unknown): Promise<T> => chrome.runtime.sendMessage(msg) as Promise<T>;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

async function activeTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

function header(): string {
  return `<header><img src="/icons/icon-32.png" alt="" /><span class="title">ZOREAL Mark</span><span class="spacer"></span><button class="icon" id="options" aria-label="Settings" title="Settings">${icon('info')}</button></header>`;
}

function itemHtml(m: MarkSummary, pageLevel = false): string {
  const v = verdictView(m);
  const who = m.verdict === 'not_verified' || m.verdict === 'cannot_verify_now' || m.verdict === 'no_signature' ? '' : `<div class="who">${esc(subjectLine(m))}</div>`;
  const when = m.time?.at ? `${m.time.at.slice(0, 16).replace('T', ' ')} UTC${m.time.status === 'unconfirmed' ? ', unconfirmed' : ''}` : '';
  const meta = [pageLevel ? 'This page is signed' : '', v.detail ?? '', when].filter(Boolean).join(' · ');
  return `<div class="card item"><span class="verdict ${v.style}">${icon(v.icon)}<span>${esc(v.label)}</span></span>${who}${meta ? `<div class="meta">${esc(meta)}</div>` : ''}</div>`;
}

async function renderHome(): Promise<void> {
  const tab = await activeTab();
  const state = tab?.id !== undefined ? await send<TabState | null>({ type: 'tabState', tabId: tab.id }) : null;
  const marks = state?.marks ?? [];
  const list = [...(state?.page ? [itemHtml(state.page, true)] : []), ...marks.map((m) => itemHtml(m))].join('');
  app.innerHTML = `${header()}
    <section><h2>On this page</h2>
      ${list || `<div class="card empty"><b>No Marks on this page.</b><br/>A Mark is text wrapped in <code>::ZOREAL-SIGNED::</code> and a signature marker. When one is here, its verdict appears in this list and in the toolbar badge, which a page cannot imitate.</div>`}
    </section>
    <section><h2>Sign what you are writing</h2>
      <div class="card sign" id="sign"><div class="skeleton" style="height:40px"></div></div>
    </section>`;
  document.getElementById('options')!.addEventListener('click', () => chrome.runtime.openOptionsPage());
  await renderSignStart(tab);
}

async function renderSignStart(tab: chrome.tabs.Tab | undefined): Promise<void> {
  const box = document.getElementById('sign')!;
  let target: SignTarget | null = null;
  if (tab?.id !== undefined) {
    target = (await chrome.tabs.sendMessage(tab.id, { type: 'getSignTarget' }).catch(() => null)) as SignTarget | null;
  }
  if (!target || !target.found) {
    box.innerHTML = `<div class="empty"><b>Put the cursor in the text box you are writing in</b>, then open this again. On listed sites a sign control appears beside the box; everywhere else this works from the toolbar or the context menu.</div>`;
    return;
  }
  const text = target.text.trim();
  if (!text) {
    box.innerHTML = `<div class="empty"><b>The box is empty.</b> Write what you want to vouch for first, then sign it.</div>`;
    return;
  }
  const site = siteOf(target.pageUrl);
  box.innerHTML = `
    <div class="preview">${esc(text.slice(0, 280))}${text.length > 280 ? '…' : ''}</div>
    <div class="meta">On <b>${esc(site)}</b>, bound to this page.</div>
    <div class="identity" role="radiogroup" aria-label="Identity">
      <label><input type="radio" name="identity" value="persona" checked /><span><span class="name">A verified human</span><br/><span class="desc">A pseudonym derived for ${esc(site)}: the same on every page of this site, unrelated to any other site.</span></span></label>
      <label><input type="radio" name="identity" value="legal_name" /><span><span class="name">Your legal name</span><br/><span class="desc">Your name and document number, verified against your passport or ID card.</span></span></label>
    </div>
    <div class="warn" id="warn" hidden>${icon('triangle-alert')}<span>A legal-name Mark is public and permanent. It can be withdrawn, never deleted, and the record stays on a public URL. Your phone will ask you to confirm this a second time.</span></div>
    <div class="row"><button class="primary" id="go">${icon('qr-code')}<span>Sign with ZOREAL ID</span></button></div>`;
  box.querySelectorAll('input[name="identity"]').forEach((el) => el.addEventListener('change', () => {
    document.getElementById('warn')!.hidden = (box.querySelector('input[name="identity"]:checked') as HTMLInputElement).value !== 'legal_name';
  }));
  document.getElementById('go')!.addEventListener('click', () => {
    const identity = (box.querySelector('input[name="identity"]:checked') as HTMLInputElement).value as 'persona' | 'legal_name';
    void runSignFlow(tab!, target!, text, identity);
  });
}

async function runSignFlow(tab: chrome.tabs.Tab, target: SignTarget, text: string, identity: 'persona' | 'legal_name'): Promise<void> {
  const box = document.getElementById('sign')!;
  const url = normaliseUrl(target.pageUrl);
  const site = siteOf(target.pageUrl);
  const hash = await textHash(text);
  const key = newOrderKey();
  const sealed = await seal(text, key);
  box.innerHTML = `<div class="qr"><div class="skeleton" style="width:216px;height:216px"></div><div class="status">${icon('loader-circle')}<span>Creating the sign order</span></div></div>`;
  let order: OrderCreated;
  const createdAt = Date.now();
  try {
    order = await send<OrderCreated & { error?: string }>({ type: 'createOrder', body: { kind: 'text', binding: 'page', url, site, identity, hash, visible_sealed: sealed } });
    if ((order as { error?: string }).error) throw new Error((order as { error?: string }).error);
  } catch (e) {
    box.innerHTML = `<div class="err">${esc(e instanceof Error ? e.message : String(e))}</div><div class="row"><button id="retry">Try again</button></div>`;
    document.getElementById('retry')!.addEventListener('click', () => void renderSignStart(tab));
    return;
  }
  const mobile = /Android|iPhone|iPad/.test(navigator.userAgent);
  box.innerHTML = `<div class="qr">
      <button class="frame" id="frame" aria-label="QR code for ZOREAL ID. Press to enlarge."><canvas id="qr" width="200" height="200"></canvas></button>
      <div class="status" id="status">${icon('smartphone')}<span>Scan with ZOREAL ID</span></div>
      <div class="countdown" id="countdown"></div>
      ${mobile ? `<a class="link" id="launch" href="${esc(launchLink(order.order, order.start_token, key))}">Open ZOREAL ID on this phone</a>` : ''}
      <button id="cancel">Cancel</button>
    </div>`;
  const canvas = document.getElementById('qr') as HTMLCanvasElement;
  const status = document.getElementById('status')!;
  const countdown = document.getElementById('countdown')!;
  let stopped = false;
  document.getElementById('cancel')!.addEventListener('click', () => { stopped = true; void renderSignStart(tab); });
  document.getElementById('frame')!.addEventListener('click', () => {
    const full = document.createElement('div');
    full.className = 'fullscreen';
    const c = document.createElement('canvas');
    full.append(c);
    full.addEventListener('click', () => full.remove());
    document.body.append(full);
    const tick = async (): Promise<void> => { if (!full.isConnected || stopped) return; await QRCode.toCanvas(c, await qrFrame(order.qr_token, order.qr_secret, createdAt, key), { errorCorrectionLevel: 'L', margin: 1, width: 320 }); setTimeout(() => void tick(), 1000); };
    void tick();
  });
  // Frames are generated live, one per second, never in advance.
  const expiresAt = createdAt + order.expires_in * 1000;
  const frameLoop = async (): Promise<void> => {
    if (stopped) return;
    const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    countdown.textContent = left > 0 ? `${left} s left to scan` : 'The code has expired';
    if (left === 0) { stopped = true; status.innerHTML = `${icon('clock')}<span>The order expired before it was scanned.</span>`; return; }
    try {
      await QRCode.toCanvas(canvas, await qrFrame(order.qr_token, order.qr_secret, createdAt, key), { errorCorrectionLevel: 'L', margin: 1, width: 200 });
    } catch (e) {
      status.innerHTML = `<span class="err">${esc(e instanceof Error ? e.message : String(e))}</span>`;
    }
    setTimeout(() => void frameLoop(), 1000);
  };
  void frameLoop();
  const HINTS: Record<string, string> = { waiting_for_scan: 'Scan with ZOREAL ID', claimed: 'Read the text on your phone and approve', presence: 'Your phone is checking that you are present', signing: 'Signing on your phone' };
  const poll = async (): Promise<void> => {
    if (stopped) return;
    let s: OrderStatus & { error?: string };
    try {
      s = await send<OrderStatus & { error?: string }>({ type: 'pollOrder', order: order.order });
      if (s.error) throw new Error(s.error);
    } catch (e) {
      status.innerHTML = `<span class="err">${esc(e instanceof Error ? e.message : String(e))}</span>`;
      setTimeout(() => void poll(), 2000);
      return;
    }
    if (s.status === 'pending') {
      status.innerHTML = `${icon(s.hint === 'waiting_for_scan' || !s.hint ? 'smartphone' : 'loader-circle')}<span>${esc(HINTS[s.hint ?? ''] ?? 'Waiting for your phone')}</span>`;
      setTimeout(() => void poll(), 2000);
      return;
    }
    stopped = true;
    if (s.status === 'complete') {
      const inserted = (await chrome.tabs.sendMessage(tab.id!, { type: 'insertMark', id: s.id, marker: 'signed' }).catch(() => ({ ok: false }))) as { ok: boolean };
      box.innerHTML = `<div class="done">${icon('badge-check')}<span>Signed. ${inserted.ok ? 'The Mark is in your text box; post it as it is.' : 'Copy the Mark below into your post.'}</span></div>
        ${inserted.ok ? '' : `<div class="preview">::ZOREAL-SIGNED:: ${esc(text)} ::ZOREAL-SIGNATURE:${esc(s.id)}::</div>`}
        <div class="meta">Record <a class="link" href="#" id="rec">${esc(s.id)}</a></div>`;
      document.getElementById('rec')!.addEventListener('click', async (e) => { e.preventDefault(); const st = await send<{ baseUrl: string }>({ type: 'getSettings' }); void chrome.tabs.create({ url: `${st.baseUrl}/mark/${s.id}` }); });
      return;
    }
    const why = s.status === 'failed' ? s.reason : s.status === 'throttled' ? 'You have reached the signing ceiling for this hour.' : s.status === 'declined' ? 'Declined on the phone.' : 'The order expired.';
    box.innerHTML = `<div class="err">${esc(why)}</div><div class="row"><button id="retry">Start over</button></div>`;
    document.getElementById('retry')!.addEventListener('click', () => void renderSignStart(tab));
  };
  setTimeout(() => void poll(), 2000);
}

void renderHome();
