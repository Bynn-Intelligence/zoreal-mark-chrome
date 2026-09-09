# ZOREAL Mark for Chrome

Sign what you post, anywhere, and let anyone verify it.

**A Mark is not a likelihood. It is proof.** Other tools estimate that a post is 99.9%
likely to come from a human. A ZOREAL Mark says that a real human, verified by ZOREAL,
stands behind this post, or it says nothing at all. It verifies, or it does not.

**Human first. Identity when needed.** Sometimes you need to know a person is there.
Sometimes you need to know who. Choose the question that fits the moment: a Mark is signed
as a verified human, a pseudonym for that site and nothing more, or under the signer's
legal name when the moment calls for a name.

A Mark is a post, a comment, an article or a file wrapped in two markers and a short id,
signed on the writer's phone with their ZOREAL ID. Anyone reading it, on any site, can
verify that a real human, verified by ZOREAL, vouched for exactly this text, on exactly
this page, at exactly this time. The platform is not involved, cannot strip it, and does
not need to know ZOREAL exists.

```text
::ZOREAL-MARK::

I was at the launch and the demo was real.

::ZOREAL-SIGNATURE:7QK39F2MXR84B5NPD4T6HW2A::
```

The same Mark on one line, for a field that cannot hold a line break, verifies the same:

```text
::ZOREAL-MARK:: I was at the launch and the demo was real. ::ZOREAL-SIGNATURE:7QK39F2MXR84B5NPD4T6HW2A::
```

This extension does two things:

- **Verifies** every Mark on every page you read, in every frame, against ZOREAL's root
  certificates pinned in the build, and shows the verdict as a badge beside the text, in
  the toolbar, and in the popup. Hover a badge for who vouched, at what presence grade,
  and when.
- **Signs** what you write. Your phone holds the key and does the signing; the extension
  prepares the order, shows the code your ZOREAL ID scans, and writes the Mark into the
  box once the phone has approved.

Free and unlimited to sign, free and unlimited to verify. No account, no key and no
login in the browser. Nothing to verify needs anything from you.

## About ZOREAL

[ZOREAL](https://zoreal.com) is proof of a real human. A person enrols once in the ZOREAL
ID app by reading their government document and its chip, matching their face to it, and
passing a liveness check; the app then holds a key in the phone's secure hardware that
only that person can use, and every use is gated by their fingerprint or face. Mark is
what that proof looks like pointed at a text box: a signature anyone can check, on any
site, with no platform involved.

Read more at [zoreal.com/product/mark](https://zoreal.com/product/mark). This extension
and the verifier it embeds are open source, so what a Mark proves can be read as well as
trusted.

## Status

Built and exercised end to end: real Marks have been signed from a phone through this
extension, from a plain text box and from an editor embedded in an iframe, and verified
with the shipped verifier. Fifty-one conformance cases render their expected verdicts in
a real Chrome on every build. Not yet: the Chrome Web Store listing, the production
record service keys, and the verifier package on npm. This section is kept true.

## What a Mark asserts

| Asserts | Proven by |
|---|---|
| A real human, verified by ZOREAL, vouched for this text | A signature by a key that only that person's phone can use, under a certificate ZOREAL issued after verifying the person: their government document and its chip, their face against that document, and a liveness capture. ZOREAL countersigns the signature |
| A live human was present when it was signed, at the stated grade | A presence attestation bound to that signature: a fresh liveness check for `live`, one within the last fifteen minutes for `recent` |
| It was signed for this page | The page URL is inside the signed payload |
| It was signed at this time | An RFC 3161 timestamp from a public authority over the record, through a Merkle inclusion proof |

It does **not** assert that the human wrote the text (a signer can vouch for AI output),
that the text is true, that the persona is one person across sites (by design it is not),
or anything about the platform account that posted it.

## The verdicts

| Verdict | Meaning |
|---|---|
| **Verified by ZOREAL** | Everything checks, and the record was signed for this page |
| **Verified for another page** | Everything checks, but the record names a different page, which is shown. The text was moved |
| **Verified, not bound to a page** | Everything checks; the Mark was made without a page (from the phone, or in a chat with no URL) |
| **Posted by an agent operated by a verified human** | A delegated Mark, opened with `::ZOREAL-DELEGATED::` |
| **Withdrawn by the signer on a date** | The signature is still valid; the signer withdrew it |
| **Cannot verify now** | The record could not be fetched and is not cached. This is never shown as a failure |
| **Not verified** | A check failed. The badge says which |
| **No signature found** | An opening marker with no closing marker after it, or a malformed id. A platform that truncates long posts cuts the signature first |

Only a URL match earns the strong badge. A moved or unbound Mark is drawn in the
secondary style so nobody mistakes one for the other. On a strongly verified Mark the
markers are hidden and the post reads as the words and the badge; anything short of that
keeps its markers on screen, because a Mark that did not verify should look like what it
is.

## What it does on a page

- Every frame is a page. Marks inside an embedded editor, a chat widget or a comment box
  served from another origin are found, badged, and judged against the page you are
  looking at.
- One badge per occurrence, placed after the closing marker, with the verdict also
  written on the badge's host element as a data attribute for assistive tools.
- Marks posted over several lines, which platforms render as several paragraphs, are
  found by climbing from the closing marker until the opening marker is in view.
- The hover card is drawn in one layer above the whole page, so a post's own layout
  cannot clip or cover it. Click a badge to pin it; Escape or a click elsewhere closes it.
- The popup folds the page's Marks to one row per verdict with a count, shows each Mark's
  words, and a click scrolls the page to that Mark and outlines the post.
- Pages that re-render are followed: text rewritten in place is rescanned, a badge the
  page drops goes straight back, and a page restored from the back/forward cache is
  rescanned. If a frame ever loses its script, the extension notices within a minute and
  puts one back.
- Both the page side and the background worker log what they do under a `[ZOREAL Mark]`
  prefix at debug level. In the worker's console, `zorealDiagnose()` lists every tab and
  frame with whether a script is alive there, and `zorealHeal()` repairs the active tab.

## How verification works

The extension embeds [`@zoreal/mark-verify`](https://github.com/Bynn-Intelligence/zoreal-mark-verify),
which performs every step in order and fails closed: parse the markers, fetch the record,
validate the classical and post-quantum certificate chains to the pinned roots, check
revocation as of the timestamp, check key usage, validate the presence attestation and
its binding to the device signature, verify the device signature over the canonical
payload, verify the timestamp token and the Merkle inclusion proof, canonicalise the text
on the page and compare its hash, and compare the page URL to the signed one.

Records are fetched by id with no credential, no cookie and no reader identity, and are
cached locally because they are immutable. One request per id at a time, a missing record
remembered for a minute, and a ceiling of three hundred fetches a minute from one
browser, past which a Mark reads "cannot verify now" rather than the record service
reading a flood. Verifying a Mark tells ZOREAL only that a record was fetched.

One opt-in exception: **sighting reports**. If you turn them on, the extension tells the
record service the id and the URL when it finds a Mark verified for another page, so a
signer who asked to be alerted when their words are moved can be. It sends nothing about
you. Off by default.

## Signing

1. Write your text. On sites in the community list the sign control appears beside the
   box; anywhere else, open the extension from the toolbar with the cursor in the box, or
   right-click the box and choose "Sign this with ZOREAL Mark".
2. Choose the identity: **a verified human** (a persona derived from the site, the same
   on every page of that site and unrelated to any other site) or **your legal name**
   (public and permanent; the extension warns you twice).
3. Scan the code with ZOREAL ID, or with the phone's own camera, which opens the app. On a
   phone, the extension opens the app directly.
4. Read the text on your phone, slide to sign, and confirm with your fingerprint or face.
   The extension writes the Mark into the box.

The code changes every second and a frame more than thirty seconds old is refused, so a
screenshot of it relayed to someone else is useless. There is nothing to set up and
nothing to pair. The extension canonicalises the text, normalises the page URL, derives
the site from the page, seals the text under a key that exists only inside the code, and
creates a sign order carrying the hash and the URL. Your phone reads the text after
scanning. ZOREAL sees the hash and the URL, never the text.

### The site list

`sites.json` tells the extension where the post and comment boxes are on each site, so the
sign control can sit beside them. Selectors change whenever a site redesigns, so the list
is maintained by everyone: add or fix an entry with a pull request. The list places the
control and nothing else; it never affects what is verified or how, and a site that is
not listed still signs from the toolbar and the context menu.

## Install

**From the Chrome Web Store**, once the listing is live: the link is added here that
day. It installs on Chrome, Edge, Brave, Vivaldi, Arc and Opera, and updates itself
silently on the browser's next update check after a new version passes review.

**By hand**, from a release, for anyone who wants to run the code they can read or does
not want to wait for the store:

1. Open the [releases page](https://github.com/Bynn-Intelligence/zoreal-mark-chrome/releases)
   and download `zoreal-mark-chrome-<version>.zip` from the latest release. Every tagged
   version has one; CI builds it.
2. Unzip it somewhere it can stay. Chrome loads the extension from that folder every
   time, so do not delete it afterwards.
3. Open `chrome://extensions`, turn on **Developer mode** (top right), click **Load
   unpacked**, and pick the unzipped folder. The ZOREAL Mark icon appears in the toolbar;
   pin it from the puzzle-piece menu if you want it visible.
4. To update, download the newer zip, unzip it over the same folder, and press the reload
   icon on the extension's card. A hand-installed copy does not update itself.

Edge, Brave, Vivaldi, Arc and Opera take the same zip the same way through their own
extensions page. Firefox and Safari are separate packages and are not built yet.

## Development

Requires Node 22 or later.

```sh
npm install
npm run dev        # Vite with CRXJS, hot reload of the unpacked extension in dist/
npm run build      # Production build into dist/: talks to the record service only
npm run build:local # The same, allowed to reach a record service on localhost too
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run pack       # release/zoreal-mark-chrome-<version>.zip from the built manifest
npm run mock       # Local record server serving the conformance fixtures on port 4820
```

Load `dist/` as an unpacked extension at `chrome://extensions` with Developer mode on, and
reload it there after every build. Use `npm run build:local` or `npm run dev` for a build
that may reach localhost; a release build refuses to. Point the options page at `http://localhost:4820` to
verify against the mock, and open `http://localhost:4820/demo` for a page carrying one
Mark per conformance case, plus one signed for that very page so a strong verdict can be
seen. `/demo-frame` is the same page inside an iframe.

`dev/e2e.mjs` does the same without hands: it loads `dist/` into a Chromium build, sets
the record service to the mock, opens the demo page, checks that every fixture case
rendered the verdict it expects, that the badge count settles, and that a strongly
verified Mark hides its markers. It needs `puppeteer-core`
(`npm install --no-save puppeteer-core`) and a Chromium build that still honours
`--load-extension`, which branded Google Chrome no longer does since version 137: point
`CHROME` at Chrome for Testing or Chromium. Set `E2E_SCREENSHOTS=0` to skip the
screenshots.

Until `@zoreal/mark-verify` is on npm, link it from a local checkout with `npm link`.

### Releasing

CI typechecks, tests, builds and packs on every push. A tag `v<version>` matching the
manifest version builds, uploads to the Chrome Web Store, publishes, and attaches the
package to a GitHub release; see `.github/workflows/release.yml` for the secrets it
needs and `store/chrome-web-store.md` for the listing text.

### Layout

```text
src/
  manifest.ts     The Manifest V3 definition CRXJS builds from
  background/     service-worker.ts: verification, record fetch and cache, sign orders, tab state, frame health
  content/        content.ts: finds Marks in every frame, badges, the hover card layer, the sign control, reveal
  shared/         The message protocol, settings, the record service client, the order key, the QR frames
  popup/          The toolbar popup: the page's Marks, the Sign flow
  options/        Record service origin and API prefix, sighting reports
  ui/             Shared DOM helpers, styles, inlined Lucide icons
sites.json        Community-maintained: where the post and comment boxes are, per site
store/            The Chrome Web Store listing text and permission justifications
scripts/          Icon rendering and packaging
dev/
  mock/           Local record server over the conformance fixtures, with the demo page at /demo
  e2e.mjs         Loads the built extension into Chromium and checks every fixture case
```

### Contributing

Contributions are welcome, and the one we need most is `sites.json`. Every site people
write on, in every country, should have an entry, and selectors rot whenever a site
redesigns, so an entry is only as good as the last person who checked it. Add or fix one
with a pull request that names the page you checked and the date. Boxes inside a closed
shadow root cannot be reached by a selector; say so in the entry if you find one.

Wanted, with no entry yet: Weibo, Bilibili, Xiaohongshu, Zhihu, Douyin and Kuaishou on
the web; Naver Blog and Naver Cafe, Daum Cafe, DC Inside; LINE VOOM, Yahoo Japan
comments, niconico; OK.ru; Tumblr; Kick, Rumble; Truth Social, Gab; Flashback; and the
forum software that runs thousands of sites (Discourse, XenForo, phpBB, vBulletin), one
domain at a time. The entries for TikTok, VK, Quora, Medium, Substack, Pinterest and
Nextdoor were written from memory of those sites and need a check by someone on them.

Code contributions: open an issue first for anything beyond a fix, run `npm test` and
`npm run typecheck`, and keep the extension as it is: no remote code, no third-party
requests, no analytics. It renders with the network off and verifies with nothing but
the record.

## Privacy, in one paragraph

ZOREAL never sees the text you sign or the text you verify. Signing sends a hash and a
URL. Verifying fetches a public record by id, anonymously. The extension keeps no history
of what you verified beyond a cache of the records themselves, and sends nothing else
unless you turn sighting reports on.

## Try it on this page

With the extension installed, this README is a test page: every Mark below gets a badge
as soon as the page loads, and the popup lists them. Hover a badge for the card.

A Mark as it is posted, each marker on its own line:

::ZOREAL-MARK::

keso njure

::ZOREAL-SIGNATURE:GKJQTMHEDSG0RRV6VQS4ACXP::

The same format on one line:

::ZOREAL-MARK:: keso e gott ::ZOREAL-SIGNATURE:XCTZ18HAB05B5RJB938NB20J::

A Mark whose text was changed after signing (the record says "kebab"), which must read
**Not verified**, the text was altered:

::ZOREAL-MARK:: kebab, but with extra words nobody signed ::ZOREAL-SIGNATURE:CDXD81FMWQPT8RGG8C8PK5BW::

A Mark cut short by a platform that truncates long posts, so the id is incomplete. This
one needs no server at all and reads **No signature found**:

::ZOREAL-MARK:: this post was longer than the platform allowed ::ZOREAL-SIGNATURE:GKJQTMHEDSG0RR::

An id of the right length that is not one: Crockford base32 never uses I, L, O or U, so
this also reads **No signature found** without a server:

::ZOREAL-MARK:: a plausible sentence ::ZOREAL-SIGNATURE:0000000000000000000000IL::

A post whose closing marker was cut off entirely shows nothing: the extension keys on
the signature marker, so a Mark with no signature marker is just text.

The three real Marks above were signed with a ZOREAL ID in the lab, for pages of a local
development setup. Against the public record service, which is not live yet, they read
**Cannot verify now**, which is honest: the record cannot be fetched. Once the service is
live they will be re-signed here, bound to this very page, and read **Verified by
ZOREAL**. For every verdict today, run the local demo in [Development](#development).

## License

MIT
