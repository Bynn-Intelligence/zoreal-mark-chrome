import { describe, expect, it } from 'vitest';
import { newOrderKey, seal, unseal } from '../src/shared/seal.js';
import { launchLink, qrFrame } from '../src/shared/qr.js';

describe('the order key', () => {
  it('seals the text so only the key holder reads it', async () => {
    const key = newOrderKey();
    const sealed = await seal('I was at the launch.', key);
    expect(await unseal(sealed, key)).toBe('I was at the launch.');
    await expect(unseal(sealed, newOrderKey())).rejects.toThrow();
    expect(await seal('x', key)).not.toBe(await seal('x', key)); // a fresh nonce every time
  });

  it('never puts the key anywhere but the QR frame and the link fragment', async () => {
    const key = newOrderKey();
    const created = Date.now() - 2500;
    const frame = await qrFrame('TOKEN', 'SECRET', created, key);
    const [prefix, token, time, mac, k] = frame.split('.');
    expect(prefix).toBe('zoreal');
    expect(token).toBe('TOKEN');
    expect(time).toBe('2');
    expect(mac).toMatch(/^[0-9a-f]{64}$/);
    expect(k).toHaveLength(43);
    const link = launchLink('ORDER', 'START', key);
    expect(new URL(link).hash).toBe(`#k=${k}`);
    expect(new URL(link).search).not.toContain(k);
  });

  it('changes the frame every second under the same secret', async () => {
    const key = newOrderKey();
    const a = await qrFrame('T', 'S', 0, key, 1000);
    const b = await qrFrame('T', 'S', 0, key, 2000);
    expect(a).not.toBe(b);
    expect(a.split('.')[3]).not.toBe(b.split('.')[3]);
  });
});
