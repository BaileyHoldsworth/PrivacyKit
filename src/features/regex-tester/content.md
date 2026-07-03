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

## How to use

1. Enter your expression in the **Pattern** field — no surrounding slashes, just the pattern itself. It loads with an email pattern to show the layout; clear it and type your own.
2. Set the **flags**. `g` and `i` start ticked; add `m`, `s`, `u` or `y` as the pattern needs them.
3. Replace the **Test string** with the text you want to search — paste a log, a spreadsheet column, a paragraph, whatever you are matching against.
4. Read the results as you go: every hit is highlighted in the mirror pane, the **Matches** and **Match time** stats update, and each match is listed below with its offsets and any capture groups.
5. To rewrite matched text, type a template into **Replacement** — a preview pane appears with the result and a copy button.

## How it works

Every keystroke hands the pattern, flags, test string and replacement to a Web Worker — a separate thread — which builds a `RegExp` and runs it against your text. Doing the matching off the main thread is what lets the two-second watchdog terminate a runaway pattern without freezing the tab.

For a global or sticky pattern the worker calls `exec()` in a loop, collecting each match — its text, its start and end offsets, and every capture group — until the string is exhausted or a 5,000-match ceiling is reached. Group names are read straight from the pattern source, so a numbered group and its `(?<name>…)` label show up together in the details list.

Take the pattern `(?<key>\w+)=(?<val>\d+)` with `g` on, run against `width=1280 height=720 fps=60`. The loop finds three matches: `width=1280` at offsets 0–10, `height=720` at 11–21 and `fps=60` at 22–28. Each row shows `key` and `val` beside the whole match. Put `$<key>:$<val>` in the Replacement field and the preview reads `width:1280 height:720 fps:60` — the tool calls `String.prototype.replace` with your exact pattern and flags, so the output is byte-for-byte what the same call produces in your own code.

The highlighted pane rebuilds by walking the match list, escaping the text between hits and wrapping each match in a `<mark>`. Past 200,000 characters that mirror is skipped to keep rendering cheap, though the count, timing and match details still cover the whole string.

## Use cases & limitations

A regex is easiest to trust once you have watched it match. Reach for this when you are drafting a validation rule, pulling fields out of a log line, or working out a find-and-replace before committing it to a script. When the target is structured data, matching inside the [JSON formatter](/tools/json-formatter/) first makes the shape obvious, and the tester sits naturally alongside tidying steps like the [case converter](/tools/case-converter/) or turning a heading into a [slug](/tools/slug-generator/).

The engine is the limitation worth stating plainly: this is JavaScript's `RegExp`, so a pattern copied from a Python, PCRE or .NET codebase may behave differently or throw outright. Test it here against real sample text before you rely on it elsewhere.

## Privacy note

Nothing you type is transmitted. The pattern, flags, sample text and replacement stay inside the background worker on your own device, and no results are logged or kept — matching a file of production logs here is as contained as grepping them in a local terminal.
