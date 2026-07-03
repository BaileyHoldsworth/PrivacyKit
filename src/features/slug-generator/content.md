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
A CMS wants a URL fragment for every post you publish, and typing one by hand for a title full of accents, ampersands and stray punctuation is where inconsistency creeps in. This tool takes the human-readable title and returns the machine-readable address — one line in, one slug out, or a whole column of them at once.

## How to use

1. Choose a **Separator** — hyphen for public web URLs (the default), or underscore for systems that demand it.
2. Optionally set a **Max length** in characters; leave it blank for no limit. Truncation lands on a word boundary, so a slug is never cut through the middle of a word.
3. Paste your titles into the text box, **one per line**. Each line is converted as you type.
4. Read the **before → after** list underneath — the running count shows how many lines produced a slug.
5. Grab a single result with its **Copy** button, or use **Copy all slugs** to put the whole list on your clipboard, one slug per line.

## How it works

Conversion runs as a fixed pipeline on each line. First the text is normalised with Unicode NFKD, which decomposes accented and composed characters into a base letter plus separate combining marks; those marks are then deleted. The result is lowercased, every `&` is expanded to the word `and`, and every remaining run of characters outside `a–z` and `0–9` is collapsed into a single separator. Leading and trailing separators are trimmed.

Take the title `Naïve Bayes & k-NN: A 2025 Comparison`. NFKD turns `ï` into `i` plus a combining diaeresis, which is stripped, giving `Naive Bayes & k-NN: A 2025 Comparison`. Lowercasing and the ampersand rule produce `naive bayes and k-nn: a 2025 comparison`, and collapsing the spaces, colon and hyphens leaves the slug `naive-bayes-and-k-nn-a-2025-comparison`.

Add a **Max length** of 25 and the truncation step takes over. The first 25 characters are `naive-bayes-and-k-nn-a-20`, but that cut falls inside `2025`, so the tool steps back to the last separator and drops the partial word, yielding `naive-bayes-and-k-nn-a`. A word longer than the limit on its own is the one case that gets hard-cut, because there is no earlier boundary to retreat to.

## Use cases & limitations

Static-site authors, bloggers and anyone importing a spreadsheet of titles into a CMS are the main users here — paste the whole title column, copy every slug back, and the permalinks stay consistent instead of being improvised post by post. If you also need to strip tracking parameters or tidy an existing address, the [URL cleaner](/tools/url-cleaner/) and [URL encoder/decoder](/tools/url-encoder-decoder/) handle those jobs; the [case converter](/tools/case-converter/) is what to reach for when you want a title in kebab-case for something other than a URL.

Two things to check before publishing. An apostrophe is treated as punctuation, not elided, so `Rossi's Kitchen` becomes `rossi-s-kitchen` rather than `rossis-kitchen`. And the tool makes no promise of uniqueness: distinct titles can collapse onto the same slug — `Node.js!` and `Node JS` both produce `node-js` — so dedupe the output against the URLs you already have.
