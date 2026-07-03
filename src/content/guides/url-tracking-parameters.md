---
title: "What utm_, fbclid and gclid Actually Do"
description: "A field guide to the tracking tail on shared links: what utm_source, fbclid and gclid record, why they rarely break a page, and how to strip them safely."
tools:
  - url-cleaner
relatedGuides:
  - browser-fingerprinting
  - what-your-ip-reveals
updated: 2026-07-03
---

Copy a link out of a newsletter and paste it somewhere. Odds are it arrives with a tail: `?utm_source=newsletter&utm_medium=email` at minimum, often an `fbclid` or `gclid` longer than the page name. That tail is not part of the address. The server would load the same page without a single character of it. So what is it for, who reads it, and is it safe to cut off before you share the link on? Those are the questions this guide answers.

## The query string is a side channel

A URL splits into parts: scheme, host, path, and a query string after the `?`. The path is what tells a server which resource to return. The query string was meant for input the server needs — a search term, a page number, a product variant. Nothing stops anyone from tacking on *extra* keys the server ignores, and that is exactly what tracking parameters are: passengers riding along in the query string, meaningful only to analytics scripts and ad platforms, invisible to the page itself.

Because they are ignored by the server, they are usually safe to remove. Because they are read by third parties, they are worth removing. The catch is telling the two kinds of parameter apart, and that comes down to which family a key belongs to.

## Three families of parameter

Tracking keys sort cleanly into three groups by what they record.

| Family | Example keys | Set by | What it records |
| --- | --- | --- | --- |
| Campaign tags | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | The link author (marketer) | Which channel and campaign sent you — plain text, human-readable |
| Click identifiers | `gclid`, `fbclid`, `msclkid`, `dclid`, `yclid` | The ad network at click time | An opaque token tying this exact click to an auction, profile and device |
| Session / share leakage | `mc_eid`, `igshid`, bare `?s=` / `?t=`, `si` | Email tools, apps, share sheets | A per-recipient or per-share token that can single out one person |

The families differ in a way that matters. Campaign tags are declarative and coarse — `utm_source=newsletter` says only that you came from a newsletter, not *which reader you are*. Click identifiers and per-recipient tokens are the opposite: opaque, unique, and designed to point back at an individual.

## How a click ID becomes a profile

`gclid` is the sharp end, so it is worth following one all the way through. When you click a Google ad, Google mints a Google Click ID — an opaque string like `Cj0KCQjw6ZTABhC...` — and appends it to the destination URL. You never chose it and cannot read it; it is a lookup key into Google's records.

The moment you land, the advertiser's Google Ads tag on the page reads that `gclid` from the URL and sends it back to Google, usually again when you buy something. Now three facts are stitched together: the click Google already logged (the search query, your device, your coarse location, and your logged-in Google identity if you were signed in), the page you landed on, and whatever you did there. `fbclid` does the same job for Meta. The token itself carries no personal data — its power is that it is a **join key** between a profile the platform already holds and a site you just visited. Strip it before the page loads and that join never happens.

## A worked example

Here is a realistic link out of a retailer's email:

```
https://www.example-store.au/shoes/runner-350
  ?utm_source=newsletter
  &utm_medium=email
  &utm_campaign=winter_sale
  &utm_content=hero_button
  &gclid=Cj0KCQjw6ZTABhCUARIs
  &size=10
```

Six parameters. Walk them one at a time:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` — campaign tags. They tell the store's analytics that a winter-sale email drove the visit and that you clicked the hero button rather than a text link. Coarse, but four passengers.
- `gclid` — a click identifier. Opaque, unique, the join key described above.
- `size=10` — **not tracking.** This one the server reads; it selects the size-10 variant. Remove it and the page changes.

Cleaning means deleting the five trackers and keeping `size`:

```
https://www.example-store.au/shoes/runner-350?size=10
```

That is precisely the logic the [URL cleaner](/tools/url-cleaner/) runs: it hands each line to the browser's built-in `URL` parser, checks every key against known tracker names and prefix families (`utm_`, `gclid`, `fbclid` and the rest), drops the matches, and re-serialises the query with everything unrecognised left byte-for-byte in place. Paste the link above and you get the two-parameter version back, with the five removals listed and tagged by the platform that set them.

## When stripping does break a link

The honest limit: not every query parameter is safe to remove, and a blunt "delete everything after `?`" habit will bite you.

Some URLs are **signed**. An AWS S3 presigned download, an image-CDN link, or an unsubscribe URL often carries a cryptographic signature over its parameters — you will see keys like `X-Amz-Signature`, `expires`, or a long `token`. The server recomputes the signature from the parameters present and rejects the request with a `403` if any signed field is missing or altered. Delete the wrong key and the link dies. Tracking parameters are never part of a signature (the advertiser adds them *after* the signed link is generated), so a tool scoped to a known tracker list is safe; a scorched-earth strip is not. This is why the cleaner removes only keys it recognises and leaves `expires`, `token`, `size` and their kind untouched.

## Browser features and their limits

You do not have to clean links by hand for every case. Firefox's Enhanced Tracking Protection, in Strict mode, includes **Query Parameter Stripping**: on navigation it removes a hardcoded shortlist — `fbclid`, `gclid`, `msclkid` and a few more — before the page loads. Brave does similar stripping by default.

Useful, with three real gaps. First, the list is short and mostly click IDs; `utm_` tags are deliberately left alone, because sites use them for first-party analytics and stripping them would break some dashboards. Second, Firefox's stripping is off unless you are in Strict mode. Third, and most important, it acts on links *you navigate to* — it does nothing for a link you **copy and paste to share**, which is exactly the moment your `mc_eid` or `gclid` gets forwarded to someone else attached to your identity. Browser stripping protects you as a reader; it does not stop you leaking a tracker as a sender.

## What to do

- Before you share, bookmark, or file a link in a bug report, run it through the [URL cleaner](/tools/url-cleaner/) and glance at what came off. Reading the platform tags is also a quick way to see who a given site hands your visit to.
- Turn on Firefox Strict mode (or use Brave) so click IDs get stripped on the links you follow, and treat that as a floor, not a ceiling.
- Remember that trackers in the query string are only one channel. Even a spotless URL still exposes your device through [browser fingerprinting](/guides/browser-fingerprinting/) and your network through [what your IP reveals](/guides/what-your-ip-reveals/). Clean links close one door; they are not the whole house.
