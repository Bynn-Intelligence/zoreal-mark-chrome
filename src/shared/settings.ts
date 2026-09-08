import type { Settings } from './messages.js';

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'https://zoreal.com',
  sightings: false,
};

export async function loadSettings(): Promise<Settings> {
  const got = await chrome.storage.local.get('settings');
  const s = (got.settings ?? {}) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...s };
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
