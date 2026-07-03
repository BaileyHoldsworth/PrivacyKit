---
name: URL Tracker Cleaner
title: URL Cleaner — Remove Tracking Parameters | PrivacyKit
description: Strip tracking parameters like utm_source, fbclid and gclid from a single link or a whole list, entirely in your browser. See exactly what each URL was carrying.
category: privacy
keywords:
  - url cleaner
  - remove utm
  - tracking parameters
  - clean link
  - fbclid
  - utm remover
icon: unlink
related:
  - browser-fingerprint
  - url-encoder-decoder
  - slug-generator
  - qr-code-generator
privacy: local
affiliateGroup: vpn
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Which tracking parameters does this remove?
    a: >-
      The remover targets known analytics and click-ID parameters grouped by the
      platform that sets them: every `utm_` tag (Google Analytics campaigns),
      `fbclid` (Facebook), `gclid`/`gclsrc`/`dclid` (Google Ads and
      DoubleClick), `msclkid` (Microsoft Ads), `mc_cid`/`mc_eid` (Mailchimp),
      `igshid` (Instagram), the HubSpot set (`__hstc`, `_hsenc`, `_hsmi` and
      friends), `yclid` (Yandex), plus `vero_*` and `oly_*` prefixes. Every
      other query parameter is left exactly as it was.
  - q: Will removing these parameters break the link?
    a: >-
      No. These are appended for attribution — they tell the *sender* who
      clicked, not the *server* which page to load. A product page resolves to
      the same page whether or not `utm_source=newsletter` is on the end of it.
      The one class of parameter that does control the page (a search query, a
      product ID, a page number) is never in the strip list, so it is preserved.
  - q: Why does it keep a lone `s` or `t` parameter on some links?
    a: >-
      Twitter/X uses bare `?t=` and `?s=` as share trackers, but plenty of other
      sites use single-letter keys for real content — WordPress search is
      `?s=query`, for instance. To avoid deleting something meaningful, those
      short ambiguous keys are only stripped when the link's host is actually
      `twitter.com` or `x.com`; `si` is likewise scoped to Spotify and YouTube.
      Unambiguous keys like `utm_source` are removed on every host.
  - q: Can I clean a whole list of URLs at once?
    a: >-
      Yes — paste one URL per line and every line is cleaned independently as you
      type. The output pane gives you the full cleaned list to copy or download,
      and the detail list below shows, per URL, which parameters were cut and
      which platform each belonged to.
  - q: Does anything get sent to a server when I paste a link?
    a: >-
      Nothing. Parsing uses the browser's built-in `URL` API and all editing
      happens in the page — no request is made, so a link you are about to
      report or archive is not itself logged anywhere. You can confirm this in
      your browser's network tab while pasting.
  - q: What are fbclid and gclid, exactly?
    a: >-
      They are click identifiers. `gclid` (Google Click ID) and `fbclid`
      (Facebook Click ID) are opaque tokens minted when you click an ad or a
      shared link; the destination site sends the token back to the ad platform
      to tie your visit to a specific click, campaign and often a profile.
      Removing them before you save or share a link breaks that association.
---
A link copied out of an email newsletter usually arrives dragging a tail: a couple of `utm_` tags, maybe an `fbclid`, sometimes a click ID longer than the page name itself. None of that changes which page loads — it just records who forwarded the link and where they clicked. This tool cuts that tail off, one link or a thousand, and tells you exactly what each one was carrying.

## How to use

1. Paste your links into the top box, one URL per line. Cleaning runs on its own about 150 ms after you stop typing — there is no button to press.
2. Read the stripped result in the **Cleaned URLs** box, or use **Copy all** to take the whole list, or **Download** to save it as `cleaned-urls.txt`.
3. Scroll to **What was removed** for a per-link breakdown: each deleted parameter shows as a chip, and hovering a chip reveals its value and the platform that set it.
4. Check the two counters for a running total of links cleaned and tracking parameters removed.
5. Hit **Clear** to empty the input and start over.

## How it works

Each line is handed to the browser's built-in `URL` parser, which splits it into scheme, host, path and query string. Only the query string is touched. Every parameter key is checked against a list of known trackers grouped by who sets them, matched two ways: exact names (`fbclid`, `gclid`, `msclkid`) and whole prefix families (anything starting `utm_`, `vero_` or `oly_`). Matching ignores case. A few trackers use letters that innocent sites also use for real content — bare `?t=` and `?s=` on Twitter/X, `?si=` on Spotify and YouTube — so those keys are only stripped when the link's host actually belongs to that platform. Everything unrecognised is left byte-for-byte where it was.

Take `https://shop.example.au/boots?colour=olive&utm_source=insta&utm_medium=story&fbclid=IwAR3kQ9x&size=11`. Five keys get inspected. `utm_source` and `utm_medium` match the `utm_` prefix; `fbclid` is an exact Facebook click ID — three removals. `colour` and `size` match nothing, so they stay. The query is re-serialised and you get back `https://shop.example.au/boots?colour=olive&size=11`, with the three cut parameters listed below tagged "UTM campaign tags" and "Facebook". A link that had no trackers is echoed back untouched, marked "Already clean", so the tool never silently reshuffles a URL it did not need to change.

## Use cases & limitations

Clean a link before you share it, bookmark it, paste it into a bug report, or archive it — anywhere the recipient has no business knowing which campaign you came from. Pasting a batch of newsletter or ad links and reading the platform tags is also a quick way to *see* who is tracking a given site. Because the whole thing runs offline once loaded, it works on a plane or behind a firewall. If your next step is generating a [QR code](/tools/qr-code-generator/) or a clean [slug](/tools/slug-generator/), strip the parameters here first so the tracking never gets baked in.

The honest limit: this edits the query string and nothing else. A tracker built into the path itself, or one hidden behind a link-shortener redirect, survives — the tool does not follow redirects or unwrap shortened links to find the real destination. It also only removes parameters it recognises, so a brand-new or renamed tracker slips through until the list catches up.

## Privacy note

The link never leaves your device. Parsing and editing use the browser's own `URL` API with no network call, which matters because the URL you are about to report or archive may itself contain a session token or search term you would rather not log anywhere. If you want to see who is quietly building a profile from links like these, the [browser fingerprint](/tools/browser-fingerprint/) tool exposes what your own device leaks even when no tag is attached; to understand the `%20`-style escaping inside a messy query, reach for the [URL encoder/decoder](/tools/url-encoder-decoder/).
