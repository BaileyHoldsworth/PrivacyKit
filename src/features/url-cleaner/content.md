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
<!-- content-pending: Phase C -->
