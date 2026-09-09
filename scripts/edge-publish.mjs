/**
 * Uploads the packed extension to the Microsoft Edge Add-ons store and
 * publishes it, through the Add-ons Update REST API v1.1 (API key). The first
 * version of an extension cannot be created this way; it is uploaded by hand
 * in Partner Center, which assigns the product id. Every later version goes
 * through here.
 *
 *   EDGE_PRODUCT_ID   the GUID on the extension's overview page in Partner Center
 *   EDGE_CLIENT_ID    from the Publish API page in Partner Center
 *   EDGE_API_KEY      from the same page; it expires and must be renewed there
 *
 * Usage: node scripts/edge-publish.mjs release/zoreal-mark-chrome-<version>.zip
 *
 * The upload replaces the draft submission's package. Publishing then sends
 * the draft to certification. If a previous version is still in certification
 * the store refuses a second submission; the draft keeps the new package and
 * the next release publishes it, so that case is reported and not treated as
 * a failure.
 */
import { readFileSync } from 'node:fs';

const API = 'https://api.addons.microsoftedge.microsoft.com';
const file = process.argv[2];
const { EDGE_PRODUCT_ID: product, EDGE_CLIENT_ID: clientId, EDGE_API_KEY: apiKey } = process.env;
if (!file || !product || !clientId || !apiKey) {
  console.error('usage: EDGE_PRODUCT_ID=… EDGE_CLIENT_ID=… EDGE_API_KEY=… node scripts/edge-publish.mjs <zip>');
  process.exit(2);
}
const headers = { Authorization: `ApiKey ${apiKey}`, 'X-ClientID': clientId };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The Location header carries the operation id; take the last path segment
// so a full URL and a bare id both work.
function operationId(res) {
  const loc = res.headers.get('location');
  if (!loc) throw new Error(`no Location header on ${res.status} response`);
  return loc.split('/').filter(Boolean).pop();
}

async function poll(url, what) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(url, { headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${what} status ${res.status}: ${JSON.stringify(body)}`);
    if (body.status !== 'InProgress') return body;
    await sleep(5000);
  }
  throw new Error(`${what} still in progress after five minutes`);
}

const zip = readFileSync(file);
console.log(`uploading ${file} (${zip.length} bytes) to product ${product}`);
const up = await fetch(`${API}/v1/products/${product}/submissions/draft/package`, {
  method: 'POST', headers: { ...headers, 'Content-Type': 'application/zip' }, body: zip,
});
if (up.status !== 202) throw new Error(`upload refused: ${up.status} ${await up.text()}`);
const upload = await poll(`${API}/v1/products/${product}/submissions/draft/package/operations/${operationId(up)}`, 'upload');
if (upload.status !== 'Succeeded') throw new Error(`upload failed: ${upload.message} ${JSON.stringify(upload.errors)}`);
console.log(`upload: ${upload.message}`);

const { version } = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
const notes = `Automated release v${version} from the public repository. No account or test credentials are needed: verification runs on any page carrying a ZOREAL Mark, and the README at https://github.com/Bynn-Intelligence/zoreal-mark-chrome carries example Marks that show each verdict.`;
const pub = await fetch(`${API}/v1/products/${product}/submissions`, {
  method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }),
});
if (pub.status !== 202) throw new Error(`publish refused: ${pub.status} ${await pub.text()}`);
const publish = await poll(`${API}/v1/products/${product}/submissions/operations/${operationId(pub)}`, 'publish');
if (publish.status === 'Succeeded') { console.log(`publish: ${publish.message}`); process.exit(0); }
if (publish.errorCode === 'InProgressSubmission') {
  console.log(`not published: a previous version is still in certification; the draft holds v${version} and the next release publishes it`);
  process.exit(0);
}
throw new Error(`publish failed: ${publish.errorCode} ${publish.message} ${JSON.stringify(publish.errors)}`);
