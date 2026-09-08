import type { Settings } from './messages.js';

export const DEFAULT_SETTINGS: Settings = {
  // The API origin. Records are the same bytes at https://zoreal.com/mark/<id>,
  // which is the URL a person opens; the extension fetches them from the API
  // directly and creates its orders there.
  baseUrl: 'https://api.zoreal.com',
  apiPrefix: '/v1',
  sightings: false,
};

export async function loadSettings(): Promise<Settings> {
  const got = await chrome.storage.local.get('settings');
  const s = (got.settings ?? {}) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...s, apiPrefix: normalisePrefix(s.apiPrefix ?? DEFAULT_SETTINGS.apiPrefix) };
}

/** "/v1" or "/api/v1": a leading slash, no trailing one. */
export function normalisePrefix(p: string): string {
  const t = p.trim().replace(/\/+$/, '');
  return t.startsWith('/') ? t : `/${t}`;
}

export async function saveSettings(s: Settings): Promise<void> {
  await chrome.storage.local.set({ settings: s });
}

/** Local development against the mock record server, and nothing else. */
export function isLocalDev(baseUrl: string): boolean {
  try {
    const u = new URL(baseUrl);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
