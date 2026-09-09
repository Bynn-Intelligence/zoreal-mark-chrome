# Chrome Web Store listing

What the store form asks for, kept here so a listing is a copy and paste and every
version says the same thing. The first upload is done by hand in the developer
dashboard, which assigns the item id; every later version goes through
`.github/workflows/release.yml`.

## Item

- **Name:** ZOREAL Mark
- **Summary** (132 characters at most): Verify that a real human, verified by ZOREAL, vouched for what you are reading. Sign what you post. Works on any site.
- **Category:** Social & Communication
- **Language:** English

## Description

ZOREAL Mark shows you which posts, comments and articles a real human stands behind.

A Mark is two markers and a short code that a person adds to their own words after
signing them with ZOREAL ID on their phone. This extension finds every Mark on every page
you read and checks it: the signature, the person's certificate, the proof that a live
human was present when it was signed, the timestamp, and that the words on the page are
the words that were signed. A verified Mark shows as a badge beside the text. Hover the
badge to see who vouched for it, as a pseudonym for that site or under their legal name,
and when.

It also lets you sign what you write. Put the cursor in any text box, open the extension,
scan the code with ZOREAL ID, read the text on your phone and approve it. The Mark is
written into the box for you.

What a Mark says: a real human, verified by ZOREAL, vouched for exactly this text, on
exactly this page, at exactly this time. What it does not say: who wrote the text, or that
it is true.

Verification runs in your browser against ZOREAL's published root certificates. The
extension holds no account, no key and no login. It fetches public records by their code
and sends nothing about you or the pages you read.

## Single purpose

Verify ZOREAL Marks on the pages the user reads, and create one for text the user writes.

## Permission justifications

- **Run on all sites (content script and host access):** a Mark can appear on any page,
  and verifying it wherever it appears is the extension's purpose. The same access lets
  the extension put its script back into tabs that were open before an update and tell
  which page a Mark inside an embedded frame belongs to.
- **storage:** the user's settings, a cache of public records already verified, and
  per-tab state that survives the background worker being suspended.
- **scripting:** re-inserting the content script into already open tabs after an install
  or update, and checking that each frame of a tab has a running copy.
- **activeTab:** the popup's view of the current tab.
- **contextMenus:** the "Sign this with ZOREAL Mark" entry on editable fields.
- **alarms:** a once-a-minute check that the active tab's frames have a running copy.

## Data usage disclosure

- Does not collect or transmit personal communications, browsing history, user activity,
  location, financial, health or authentication information, or website content.
- The extension sends to ZOREAL only: the public code of a Mark, to fetch its public
  record; and, when the user signs, the text they chose to sign, sealed so that ZOREAL
  cannot read it, with the address of the page it is for.
- No data is sold, used for advertising, or used for creditworthiness or lending.

## Privacy policy

Publish at `https://zoreal.com/mark/extension-privacy`; the text is the "Privacy, in one
paragraph" section of the README, expanded with the disclosure above.

## Assets

- Icon 128 x 128: `public/icons/icon-128.png`
- Screenshots, 1280 x 800, at least one: a page with verified Marks and the hover card
  open; the popup folded to counts; the signing QR beside a text box.
- Small promo tile 440 x 280, optional.
