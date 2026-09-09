/**
 * Rasterises the brand mark into the sizes the manifest names. Needs
 * rsvg-convert (librsvg) on the PATH. The SVG is the master; the PNGs are
 * committed so a build does not need librsvg.
 *
 * The master's viewBox leaves the glyph on about 80% of the canvas, which
 * reads as a small icon in the toolbar. The rendering crops to the glyph
 * with a 3% margin on each side, so the mark fills the icon space. The
 * viewBox below is the glyph's measured bounds, squared on its centre;
 * remeasure it if the master changes.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const FILLED_VIEWBOX = '7.3 6.1 63.6 63.6';
const master = readFileSync('public/icons/zoreal-square.svg', 'utf8');
const filled = master.replace(/viewBox="[^"]*"/, `viewBox="${FILLED_VIEWBOX}"`);
const tmp = 'public/icons/.zoreal-square-filled.svg';
writeFileSync(tmp, filled);
try {
  for (const s of [16, 32, 48, 128]) {
    execFileSync('rsvg-convert', ['-w', String(s), '-h', String(s), tmp, '-o', `public/icons/icon-${s}.png`]);
  }
} finally {
  unlinkSync(tmp);
}
console.log('icons written');
