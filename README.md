# ZOREAL Mark for Chrome

Sign what you post, anywhere, and let anyone verify it.

A Mark is a comment, a post or a file wrapped in two markers and a short id, signed by
the key in the holder's ZOREAL ID with a presence attestation. Anyone reading it, on any
site, can verify that a live, chip-verified human vouched for exactly this text, on
exactly this page, at exactly this time. The platform is not involved, cannot strip it,
and does not need to know ZOREAL exists.

```text
::ZOREAL-SIGNED:: I was at the launch and the demo was real. ::ZOREAL-SIGNATURE:7QK39F2MXR84B5NPD4T6HW2A::
```

This extension does three things:

- **Verifies** every Mark on the page you are looking at, against roots pinned in the
  build, and shows the verdict in the toolbar and next to the text.
- **Prepares and pastes** a Mark for text you are about to post. Your phone signs; the
  extension only canonicalises the text, reads the site from the page and inserts the
  markers once your ZOREAL ID has approved.
- **Explains** what a Mark proves, and what it does not, on every hover card.

Free and unlimited to sign, free and unlimited to verify. No account is needed to verify.

## Status

**Not yet usable against live records.** The extension, the verifier package and the
record service are being built together. Until the record service serves records, this
extension verifies the conformance fixtures through the local mock server in `dev/` and
nothing else. This section is kept true; if it says the service is not live, it is not.

## What a Mark asserts

| Asserts | Proven by |
|---|---|
| A chip-verified human vouched for this text | A device signature under a content-signing certificate issued against a government document chip, countersigned by ZOREAL |
| A live human was present when it was signed, at the stated grade | A presence attestation bound to that signature |
| It was signed for this page | The page URL is inside the signed payload |
| It was signed at this time | An RFC 3161 timestamp over the record |

It does **not** assert that the human wrote the text (a signer can vouch for AI output),
that the text is true, that the persona is one person across sites (by design it is not),
or anything about the platform account that posted it.

## The verdicts

| Verdict | Meaning |
|---|---|
| **Verified here** | Everything checks, and the record was signed for this page |
| **Verified for another page** | Everything checks, but the record names a different page, which is shown. The text was moved |
| **Verified, not bound to a page** | Everything checks; the Mark was made without a page (from the phone, or in a chat with no URL) |
| **Posted by an agent operated by a verified human** | A delegated Mark, opened with `::ZOREAL-DELEGATED::` |
| **Withdrawn by the signer on a date** | The signature is still valid; the signer withdrew it |
| **Cannot verify now** | The record could not be fetched and is not cached. This is never shown as a failure |
| **Not verified** | A check failed. The badge says which |

Only a URL match earns the strong badge. A moved or unbound Mark is drawn in the
secondary style so nobody mistakes one for the other.

## How verification works

The extension calls [`@zoreal/mark-verify`](https://github.com/Bynn-Intelligence/zoreal-mark-verify),
which performs every step in order and fails closed: parse the markers, fetch the record,
validate the classical and post-quantum certificate chains to the pinned roots, check
revocation as of the timestamp, check key usage, validate the presence attestation and
its binding to the device signature, verify the device signature over the canonical
payload, verify the timestamp token and the Merkle inclusion proof, canonicalise the text
on the page and compare its hash, and compare the page URL to the signed one.

Records are fetched by id with no credential, no cookie and no reader identity, and are
cached locally because they are immutable. Verifying a Mark tells ZOREAL only that a
record was fetched.

One opt-in exception: **sighting reports**. If you turn them on, the extension tells the
record service the id and the URL when it finds a Mark verified for another page, so a
signer who asked to be alerted when their words are moved can be. It sends nothing about
you. Off by default.

## Signing

1. Write your text. On sites in the community list the sign control appears beside the
   box; anywhere else, open the extension from the toolbar or the context menu with the
   box focused.
2. Choose the identity: **a verified human** (a persona derived from the site, the same
   on every page of that site and unrelated to any other site) or **your legal name**
   (public and permanent; the extension warns you twice).
3. Scan the QR code with ZOREAL ID. On a phone, the extension opens the app directly.
4. Read the text on your phone and approve. The phone signs; the extension inserts the
   markers and the id.

There is nothing to set up and nothing to pair. The extension never holds a signing key or
any standing credential. It canonicalises the text, normalises the page URL, derives the
site from the page, seals the text under a key that exists only inside the QR code, and
creates a sign order carrying the hash and the URL. Your phone reads the text after
scanning, and signs after a biometric unlock and a recent presence check. ZOREAL sees the
hash and the URL, never the text.

### The site list

`sites.json` tells the extension where the post and comment boxes are on each site, so the
sign control can sit beside them. Selectors change whenever a site redesigns, so the list
is maintained by everyone: add or fix an entry with a pull request. The list places the
control and nothing else; it never affects what is signed or how a Mark is verified, and a
site that is not listed still signs from the toolbar.

## Development

Requires Node 22 or later.

```sh
npm install
npm run dev        # Vite with CRXJS, hot reload of the unpacked extension in dist/
npm run build      # Production build into dist/
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run mock       # Local record server serving the conformance fixtures on port 4820
```

Load `dist/` as an unpacked extension at `chrome://extensions` with Developer mode on.
Point the options page at `http://localhost:4820` to verify against the mock, and open
`http://localhost:4820/demo` for a page carrying one Mark per conformance case.

`dev/e2e.mjs` does the same without hands: it loads `dist/` into a Chromium build, sets
the record service to the mock, opens the demo page and checks that every fixture case
rendered the verdict it expects, then screenshots into `dev/screens/`. It needs
`puppeteer-core` (`npm install --no-save puppeteer-core`) and a Chromium build that still
honours `--load-extension`, which branded Google Chrome no longer does since version 137:
point `CHROME` at Chrome for Testing or Chromium.

Until `@zoreal/mark-verify` is on npm, link it from a local checkout with `npm link`.

### Layout

```text
src/
  manifest.ts     The Manifest V3 definition CRXJS builds from
  background/     service-worker.ts: verification, record fetch and cache, sign orders, tab state
  content/        content.ts: finds Marks in the page, draws inline badges and the hover card, the sign control
  shared/         The message protocol, settings, the record service client, the order key, the QR frames
  popup/          The toolbar popup: verdicts on this tab, the Sign flow
  options/        Record service URL, mirror, sighting reports
sites.json        Community-maintained: where the post and comment boxes are, per site
  ui/             Shared DOM helpers, styles, inlined Lucide icons
dev/
  mock/           Local record server over the conformance fixtures, with the demo page at /demo
  e2e.mjs         Loads the built extension into Chromium and checks every fixture case
```

### Contributing

Before every commit, read added lines as a stranger would. Nothing in this repository
references a private repository, an internal hostname, a local path, or an internal
document. Engineering reasons stay; internal pointers go.

```sh
git diff --cached | grep -niE 'section [0-9]|docs/[0-9]|products/|/Users/|internal|roadmap|localhost:(3[01]|51[78])[0-9]{2}'
```

No emojis: icons are [Lucide](https://lucide.dev), inlined as SVG. No em-dashes. No remote
code, fonts or analytics; the extension renders with the network off.

## Privacy, in one paragraph

ZOREAL never sees the text you sign or the text you verify. Signing sends a hash and a
URL. Verifying fetches a public record by id, anonymously. The extension keeps no history
of what you verified beyond a cache of the records themselves, and sends nothing else
unless you turn sighting reports on.

## License

MIT
