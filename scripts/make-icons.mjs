/**
 * Rasterises the brand mark into the sizes the manifest names. Needs
 * rsvg-convert (librsvg) on the PATH. The SVG is the master; the PNGs are
 * committed so a build does not need librsvg.
 */
import { execFileSync } from 'node:child_process';
for (const s of [16, 32, 48, 128]) {
  execFileSync('rsvg-convert', ['-w', String(s), '-h', String(s), 'public/icons/zoreal-square.svg', '-o', `public/icons/icon-${s}.png`]);
}
console.log('icons written');
