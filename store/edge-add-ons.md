# Microsoft Edge Add-ons listing

Edge runs the Chrome package unchanged, so the listing takes the same zip the Chrome
Web Store takes, from the same release. The first version is created by hand in
Partner Center, which assigns the product id; every later version goes through
`.github/workflows/release.yml` and `scripts/edge-publish.mjs`.

## Account

A Microsoft Partner Center account enrolled in the Microsoft Edge program, under the
company, not a person. Registration is free.

## Package

Upload `zoreal-mark-chrome-<version>.zip` from the latest GitHub release. Partner Center
reads the name and the short description from the manifest; both are fixed there and
change only with a new package.

## Availability

Visibility public, all markets.

## Properties

- **Category:** Social & Communication
- **Website:** `https://zoreal.com/product/mark`
- **Support contact:** the support address on zoreal.com
- **Mature content:** no

## Privacy

The same answers as the Chrome listing, from `chrome-web-store.md`: the single purpose
text, one justification per permission (all sites, storage, scripting, contextMenus,
alarms), no remote code, the data usage ticks (web history and website content, both
only when the user signs; nothing else) with all three certifications, and the privacy
policy URL `https://zoreal.com/privacy/mark-extension`.

## Store listing, English

- **Description:** the plain-text block in `chrome-web-store.md`. Edge allows 250 to
  10,000 characters; it is about 7,400.
- **Extension logo:** `store/logo-300.png`, 300 x 300.
- **Screenshots:** the three in `store/screenshots/`, 1280 x 800, in order.
- **Small promotional tile 440 x 280, large 1400 x 560:** optional, none yet.
- **Search terms:** verified human, signature, provenance, authenticity, ZOREAL, Mark,
  sign posts.

## Notes for certification

```text
No account or credentials are needed. Verification runs on any page that carries a ZOREAL Mark: the README at https://github.com/Bynn-Intelligence/zoreal-mark-chrome contains example Marks that render each verdict when the extension is installed. Signing requires the ZOREAL ID app on a phone and is not needed to review verification. The extension loads no remote code and sends nothing about the user; the privacy notice at https://zoreal.com/privacy/mark-extension describes the two requests it makes.
```

Certification takes up to seven business days.

## Automating later versions

On the Partner Center **Publish API** page, enable the API-key experience and create
API credentials. Copy the client id and the API key (the key expires and is renewed on
the same page), and the product id from the extension's overview page. Then:

```sh
gh secret set EDGE_PRODUCT_ID
gh secret set EDGE_CLIENT_ID
gh secret set EDGE_API_KEY
```

From then on every release uploads the package to the draft and submits it. If a
previous version is still in certification the store refuses a second submission; the
draft keeps the newer package and the next release submits it.
