import type { FetchResult } from '@zoreal/mark-verify';
import type { OrderCreated, OrderStatus } from './messages.js';

/**
 * The record service client. Records are fetched by id with no credentials,
 * no cookie and no reader identity, and cached locally because they are
 * immutable once their timestamp is confirmed. Nothing here sends anything
 * about the page or the reader.
 */
export class RecordService {
  constructor(private readonly baseUrl: string, private readonly apiPrefix = '/v1') {}

  private api(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${this.apiPrefix}${path}`;
  }

  recordUrl(id: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}/mark/${id}`;
  }

  async fetchRecord(id: string): Promise<FetchResult> {
    const cached = await readCache(id);
    if (cached) return { status: 'ok', record: cached };
    let res: Response;
    try {
      res = await fetch(this.recordUrl(id), { headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' });
    } catch (e) {
      return { status: 'unavailable', reason: e instanceof Error ? e.message : 'network error' };
    }
    if (res.status === 404) return { status: 'not_found' };
    if (!res.ok) return { status: 'unavailable', reason: `HTTP ${res.status}` };
    let record: unknown;
    try {
      record = await res.json();
    } catch {
      return { status: 'unavailable', reason: 'the record is not JSON' };
    }
    await writeCache(id, record);
    return { status: 'ok', record };
  }

  async createOrder(body: Record<string, unknown>): Promise<OrderCreated> {
    const res = await fetch(this.api('/zoreal/mark/orders'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, credentials: 'omit', body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`the record service answered HTTP ${res.status}: ${await res.text().catch(() => '')}`);
    return (await res.json()) as OrderCreated;
  }

  async pollOrder(order: string): Promise<OrderStatus> {
    const res = await fetch(this.api(`/zoreal/mark/orders/${encodeURIComponent(order)}`), { headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' });
    if (!res.ok) throw new Error(`the record service answered HTTP ${res.status}`);
    return (await res.json()) as OrderStatus;
  }

  async reportSighting(id: string, urlSeen: string): Promise<void> {
    await fetch(this.api('/zoreal/mark/sightings'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify({ id, url_seen: urlSeen }),
    }).catch(() => undefined);
  }

  /** Development only: the mock serves the fixture anchors. Never called for a production origin. */
  async fetchDevAnchors(): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/pki/dev-anchors`, { credentials: 'omit' });
    if (!res.ok) throw new Error(`no dev anchors: HTTP ${res.status}`);
    return res.json();
  }
}

const CACHE_PREFIX = 'rec:';
const PENDING_TTL_MS = 60_000;

async function readCache(id: string): Promise<unknown | undefined> {
  const got = await chrome.storage.local.get(CACHE_PREFIX + id);
  const entry = got[CACHE_PREFIX + id] as { record: unknown; storedAt: number; immutable: boolean } | undefined;
  if (!entry) return undefined;
  if (!entry.immutable && Date.now() - entry.storedAt > PENDING_TTL_MS) return undefined;
  return entry.record;
}

async function writeCache(id: string, record: unknown): Promise<void> {
  const ts = (record as { timestamp?: { status?: string } } | null)?.timestamp?.status;
  await chrome.storage.local.set({ [CACHE_PREFIX + id]: { record, storedAt: Date.now(), immutable: ts === 'confirmed' } });
}

export async function clearRecordCache(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((k) => k.startsWith(CACHE_PREFIX));
  if (keys.length) await chrome.storage.local.remove(keys);
}
