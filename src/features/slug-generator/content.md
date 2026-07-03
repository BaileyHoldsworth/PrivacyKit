---
name: Slug Generator
title: Slug Generator — SEO-Friendly URL Slugs | PrivacyKit
description: >-
  Turn titles into clean URL slugs in your browser: Unicode NFKD accent
  stripping, lowercase, hyphen or underscore separators, and word-boundary
  length limits.
category: text
keywords:
  - slug generator
  - url slug
  - slugify
  - seo url
  - permalink
icon: slash
related:
  - case-converter
  - url-encoder-decoder
  - url-cleaner
privacy: local
affiliateGroup: dev
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Should URL slugs use hyphens or underscores?
    a: >-
      Hyphens. Google's documentation explicitly recommends hyphens as word
      separators in URLs because `red-widgets` is read as two words while
      `red_widgets` is treated closer to one token. The underscore option
      exists here for systems that require it — some legacy CMSs, file naming
      conventions, or Python identifiers — but for a public web page URL,
      keep the default hyphen.
  - q: How are accented characters like é, ü or ñ handled?
    a: >-
      Each title is run through Unicode NFKD normalisation, which decomposes
      accented letters into a base letter plus a combining mark — `é` becomes
      `e` + `´` — and the marks are then stripped. So *Crème Brûlée & Café*
      slugifies to `creme-brulee-and-cafe`. This works for Latin-script
      accents and ligatures, but it is not transliteration: characters with no
      Latin decomposition (Cyrillic, Greek, CJK) are removed entirely, so a
      fully non-Latin title can produce an empty slug.
  - q: What happens to ampersands and other punctuation?
    a: >-
      The `&` character is special-cased into the word `and`, so
      "Tips & Tricks" becomes `tips-and-tricks` rather than `tips-tricks`,
      which reads better and keeps the word searchable. Every other character
      that is not a–z or 0–9 — em dashes, quotes, emoji, whitespace runs — is
      collapsed into a single separator, and leading or trailing separators
      are trimmed off.
  - q: How long should a URL slug be?
    a: >-
      There is no hard ranking penalty for long slugs, but shorter ones are
      easier to read in search results, share intact, and type. A common
      target is under about 60 characters. Set the max-length field and the
      tool truncates at a word boundary — a limit of 25 turns
      `a-very-long-post-title-about-nothing` into `a-very-long-post-title`,
      never cutting mid-word. Only a single word longer than the limit itself
      gets hard-cut.
  - q: Can I slugify a whole list of titles at once?
    a: >-
      Yes — paste one title per line and each line converts independently as
      you type, shown in a before → after list. Each row has its own copy
      button, and **Copy all slugs** puts the full set on your clipboard, one
      slug per line, ready to paste into a spreadsheet or CMS import.
  - q: Why did changing a slug on a published page break my traffic?
    a: >-
      A slug is part of the page's address, so changing it creates a new URL
      and orphans the old one — search engines and existing links still point
      at the original. If you must rename a published page, keep the old URL
      alive with a 301 redirect to the new slug. For pages that are not yet
      published, pick the slug once and leave it alone.
---
<!-- content-pending: Phase C -->
