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

The store shows this as plain text: no markdown, line breaks kept. The field allows
16,000 characters; this runs to about 7,000, which is long enough to answer every
question a reader has before installing and short enough to be read.

```text
ZOREAL Mark shows you which posts, comments and articles a real human stands behind, and lets you sign your own.

A MARK IS PROOF, NOT A LIKELIHOOD
Other tools estimate that a post is 99.9% likely to come from a human. A ZOREAL Mark says that a real human, verified by ZOREAL, stands behind this text, or it says nothing at all. It verifies, or it does not. There is no score and no guess.

HUMAN FIRST. IDENTITY WHEN NEEDED.
Sometimes you need to know a person is there. Sometimes you need to know who. Choose the question that fits the moment: a Mark is signed as a verified human, a pseudonym for that site and nothing more, or under the signer's legal name when the moment calls for a name.

WHAT A MARK LOOKS LIKE
A Mark is a post, a comment, an article or a file wrapped in two markers and a short code:

::ZOREAL-MARK::
I was at the launch and the demo was real.
::ZOREAL-SIGNATURE:7QK39F2MXR84B5NPD4T6HW2A::

The writer adds it to their own words after signing them with ZOREAL ID on their phone. It is plain text, so it survives being posted anywhere: a social feed, a comment thread, a forum, a chat, an email, a document. The platform is not involved, cannot strip it, and does not need to know ZOREAL exists. The same Mark on one line, for a field that cannot hold a line break, verifies the same.

WHAT THE EXTENSION DOES ON THE PAGES YOU READ
It finds every Mark on every page, in every frame, and checks it: the signature, the signer's certificate against ZOREAL's root certificates pinned in the build, the proof that a live human was present when it was signed, the timestamp, and that the words on the page are exactly the words that were signed. The verdict appears as a badge beside the text, in the toolbar icon, and in the popup.

Verified by ZOREAL: everything checks, and the text was signed for this very page. The markers are hidden and the post reads as the words and the badge.
Verified for another page: everything checks, but it was signed for a different page, which is shown. The text was moved.
Verified, not bound to a page: everything checks; the Mark was made without a page, for example from the phone or in a chat with no address.
Posted by an agent operated by a verified human: a delegated Mark. A verified person set an assistant or a bot loose and put their name behind it.
Withdrawn by the signer: the signature is still valid; the signer took it back on the date shown.
Not verified: a check failed. The badge says which.
Cannot verify now: the record could not be fetched. This is never shown as a failure.

Only an exact page match earns the strong badge. A moved or unbound Mark is drawn in a secondary style so nobody mistakes one for the other.

Hover a badge for who vouched, at what presence grade, and when. Click it to pin the card. The popup folds the page's Marks to one row per verdict with a count, shows each Mark's words, and a click scrolls the page to that Mark and outlines the post.

SIGN WHAT YOU WRITE
Your phone holds the key and does the signing. The extension prepares the order, shows the code your ZOREAL ID scans, and writes the Mark into the text box once the phone has approved.

1. Write your text. On sites in the community list a sign control appears beside the box. Anywhere else, open the extension from the toolbar with the cursor in the box, or right-click the box and choose "Sign this with ZOREAL Mark".
2. Choose the identity: a verified human, a persona derived from the site, the same on every page of that site and unrelated to any other site; or your legal name, which is public and permanent. The extension warns you twice before a legal-name Mark.
3. Scan the code with ZOREAL ID, or with the phone's own camera, which opens the app.
4. Read the text on your phone, slide to sign, and confirm with your fingerprint or face. The Mark is written into the box. Post it as you would anything else.

The code changes every second and one more than thirty seconds old is refused, so a screenshot of it relayed to someone else is useless. The text is sealed in your browser under a key that exists only inside the code; ZOREAL sees a hash and the page address, never the words. Your phone reads the text after scanning, so you approve exactly what will carry your Mark.

Signing is free and unlimited. Verifying is free and unlimited.

YOU NEED ZOREAL ID ON YOUR PHONE TO SIGN
It is free and enrolling takes about a minute: get the app at zoreal.com, read your passport or ID card with the phone, match your face to it, and pass a liveness check. From then on you can sign anything you write, on any site, as often as you like. Verifying needs nothing: no app, no account, no login.

WHERE IT WORKS
Verification works on every site. The inline sign control is placed by a community-maintained list that knows where the post and comment boxes are on X, YouTube, Reddit, LinkedIn, Facebook, Instagram, Threads, TikTok, Bluesky, Mastodon, Discord, Slack, WhatsApp Web, Telegram Web, Twitch, GitHub, GitLab, Stack Overflow, Hacker News, Wikipedia, Medium, Substack, Quora, Pinterest, Nextdoor, Gmail, Outlook on the web and more. A site that is not listed still signs from the toolbar and the context menu, and anyone can add a site with a pull request.

WHAT A MARK SAYS, AND WHAT IT DOES NOT
It says: a real human, verified by ZOREAL, vouched for exactly this text, on exactly this page, at exactly this time, and a live person was present when it was signed.

It does not say who wrote the text (a person can vouch for words an assistant drafted), that the text is true, that a persona is the same person on another site (by design it is not), or anything about the platform account that posted it.

PRIVACY
The extension holds no account, no key and no login. Verification runs in your browser. It fetches public records by their code, with no cookie and no identity, and caches them locally. It sends nothing about you, your browsing, or the pages you read. When you sign, it sends the sealed text and the page address so that the record can be made; nothing else.

One opt-in exception: sighting reports. If you turn them on, the extension tells ZOREAL the code and the page address when it finds a Mark verified for another page, so a signer who asked to be alerted when their words are moved can be. Off by default, and it never sends anything about you.

Permissions, in plain words: access to all sites, because a Mark can appear on any page and verifying it wherever it appears is the whole point; storage, for your settings and the local cache of records already verified; scripting, to put the extension back into tabs that were open before it was installed or updated; the context menu, for the "Sign this" entry; and alarms, for a once-a-minute check that each tab still has a running copy.

ABOUT ZOREAL
ZOREAL is proof of a real human. A person enrols once in the ZOREAL ID app by reading their government document, matching their face to it and passing a liveness check. The app then holds a key in the phone's secure hardware that only that person can use, and every use is gated by their fingerprint or face. Mark is what that proof looks like pointed at a text box: a signature anyone can check, on any site, with no platform involved.

The extension and the verifier it embeds are open source, so what a Mark proves can be read as well as trusted. Read more at zoreal.com/product/mark.
```

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

`https://zoreal.com/privacy/mark-extension`, published on the site beside the general
ZOREAL Privacy Notice; the matching terms are at `https://zoreal.com/terms/mark-extension`.

## Assets

- Store icon 128 x 128: `store/icon-128.png`, the mark on the dark tile the ZOREAL ID app
  icon uses, with the store's 16 px transparent padding (rendered by
  `scripts/make-icons.mjs`). Not the toolbar icon, which fills its canvas.
- Screenshots, 1280 x 800, in `store/screenshots/`: `1-verified-with-card.png` (a
  comment thread with a verified Mark and the hover card open), `2-popup.png` (the
  popup folded to counts), `3-sign-with-phone.png` (the signing QR). Upload in that
  order.
- Small promo tile 440 x 280, optional.
