---
name: Regex Tester
title: Regex Tester — Live JavaScript Regular Expressions | PrivacyKit
description: Test JavaScript regular expressions live — highlighted matches, numbered and named capture groups, a replacement preview and all six flags, in your browser.
category: text
keywords:
  - regex
  - regex tester
  - regular expression
  - regex101
  - pattern match
icon: regex
related:
  - text-diff
  - case-converter
  - json-formatter
  - slug-generator
privacy: local
popular: true
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Which regex flavour does this tester use?
    a: >-
      JavaScript (ECMAScript) — the `RegExp` engine built into your browser,
      the same one Node.js uses. Most patterns written for PCRE carry over,
      but not all of it: JavaScript has no possessive quantifiers, no atomic
      groups and no `\A`/`\z` anchors. Lookahead, lookbehind, named groups and
      Unicode property classes (`\p{…}` with the `u` flag) all work in current
      browsers.
  - q: Why does my pattern only find the first match?
    a: >-
      The `g` (global) flag is off. Without it the engine stops after the
      first match, exactly as a single `regex.exec()` call does in code. This
      tester ticks `g` by default; untick it when you want single-match
      behaviour, such as validating an entire string with `^…$`.
  - q: How do I use capture groups in the replacement?
    a: >-
      In the replacement field, `$1`, `$2`… insert numbered groups, `$<name>`
      inserts a named group, `$&` inserts the whole match and `$$` produces a
      literal dollar sign. Replacing `(?<day>\d{2})/(?<month>\d{2})` with
      `$<month>-$<day>` swaps the two date parts. The preview runs
      `String.prototype.replace` with your exact pattern and flags, so it
      shows precisely what your code would produce.
  - q: What does the “stopped after 2 seconds” error mean?
    a: >-
      Your pattern hit catastrophic backtracking. Constructs like `(a+)+`, or
      two adjacent `.*` segments, force the engine to try an exponential
      number of ways to split the text before it can give up. Matching here
      runs in a background Web Worker with a two-second watchdog — if the
      engine has not finished by then, the worker is terminated so the page
      never freezes. Rewrite the pattern so each part matches something
      distinct, for example `[^"]*` instead of `.*` between quotes.
  - q: What do the m, s, u and y flags change?
    a: >-
      `m` makes `^` and `$` match at every line break rather than only the
      ends of the string; `s` lets `.` match newline characters; `u` enables
      full Unicode mode, which treats emoji and other astral characters as
      single units and adds `\p{Letter}`-style classes; `y` (sticky) only
      matches at the exact position where the previous match ended. Together
      with `i` (case-insensitive) and `g` (global) they are the six flags this
      tester exposes.
  - q: Why does a pattern like a* report a match at every position?
    a: >-
      Quantifiers that accept zero repetitions (`a*`, `\d?`) and bare
      lookarounds can succeed while consuming no characters, so with `g` on
      they match at every index — including the very end of the string. The
      tester marks these empty matches between characters and advances one
      code point after each so the scan always terminates. Empty matches
      everywhere usually mean the pattern needs an anchor, or `+` instead of
      `*`.
  - q: Does the text I paste here leave my browser?
    a: >-
      No. The pattern, flags, test string and replacement are handed to a Web
      Worker running on your own machine, and the results come straight back
      to the page — the tool makes no network requests, which you can confirm
      from the network tab in your browser's developer tools. Pasting
      production logs or customer data here is no different from opening them
      in a local editor.
---

<!-- content-pending: Phase C -->
