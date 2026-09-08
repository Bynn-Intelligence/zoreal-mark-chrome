import { toBase64Url, toHex, utf8 } from '@zoreal/mark-verify';

/**
 * One animated QR frame: zoreal.<qr_token>.<time>.<hmac>.<key>, where time is
 * whole seconds since the order was created and hmac is HMAC-SHA-256 over the
 * decimal time under the order's qr_secret. Frames are generated live, one per
 * second, never in advance; the server refuses a frame older than a few
 * seconds, which is what makes a screenshot of the code useless to a relay.
 */
export async function qrFrame(qrToken: string, qrSecret: string, createdAtMs: number, orderKey: Uint8Array, nowMs = Date.now()): Promise<string> {
  const time = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));
  const key = await crypto.subtle.importKey('raw', utf8(qrSecret) as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(String(time)) as BufferSource));
  return `zoreal.${qrToken}.${time}.${toHex(mac)}.${toBase64Url(orderKey)}`;
}

/** The same-device launch link: the key rides in the fragment, which the browser never sends. */
export function launchLink(order: string, startToken: string, orderKey: Uint8Array): string {
  return `https://id.zoreal.com/sign?o=${encodeURIComponent(order)}&t=${encodeURIComponent(startToken)}#k=${toBase64Url(orderKey)}`;
}
