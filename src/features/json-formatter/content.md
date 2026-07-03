---
name: JSON Formatter & Validator
title: JSON Formatter & Validator — Beautify JSON | PrivacyKit
description: Format, validate and minify JSON in your browser. Pick 2- or 4-space indentation, sort keys recursively, and jump straight to the line of any syntax error.
category: text
keywords:
  - json formatter
  - json validator
  - json beautifier
  - json minify
  - pretty print json
icon: braces
related:
  - markdown-preview
  - text-diff
  - jwt-decoder
  - regex-tester
privacy: local
popular: true
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Why is my JSON invalid when it works fine as a JavaScript object?
    a: >-
      JavaScript object literals accept unquoted keys, single-quoted strings,
      trailing commas and comments; JSON (RFC 8259) allows none of them.
      `{name: 'x',}` is legal JavaScript and invalid JSON three times over.
      The validator applies the strict grammar because that is what
      `JSON.parse` — and every API you send the data to — enforces.
  - q: How does the validator find the line and column of an error?
    a: >-
      `JSON.parse` stops at the first character that breaks the grammar. The
      tool reads the offset out of the browser's native error message,
      converts it to a line and column number, then selects that line in the
      input so the problem is visible in context. In browsers that report no
      offset at all (some Safari versions), you still get the parser's
      message, just without the jump.
  - q: What is the difference between Format and Minify?
    a: >-
      Only whitespace. Format re-serialises with your chosen indentation (2 or
      4 spaces), one value per line; Minify strips every inter-token space and
      newline. The data is identical either way. On a typical API response,
      minifying a pretty-printed document cuts roughly 25–40% of its size —
      worth it for storage or transfer, pointless for a config file a human
      has to edit.
  - q: Does the sort-keys option change what my JSON means?
    a: >-
      No — the JSON spec says object member order carries no meaning, so
      sorting keys A→Z at every nesting level produces an equivalent document.
      Arrays are left untouched, because element order there *does* matter.
      One practical caveat: anything that hashes or signs the raw bytes
      (ETags, JWS payloads, checksums) will see a different document after
      sorting, since the bytes themselves change.
  - q: Can it handle large files without uploading them?
    a: >-
      Yes. Parsing and re-serialising use the browser's native `JSON.parse`
      and `JSON.stringify`, which get through a 10 MB document in well under
      a second on ordinary hardware, and no network request is made at any
      point — the network tab stays empty. The slowest step is usually the
      browser painting the result into the textarea, not the JSON work.
  - q: Why did some numbers change after formatting?
    a: >-
      JSON numbers are parsed into IEEE-754 doubles before being written back
      out, so equivalent spellings collapse to one canonical form: `1e2`
      becomes `100`, `2.50` becomes `2.5`, and integers above 2⁵³ — 64-bit
      database or Snowflake IDs are the classic case — silently lose
      precision. If exact digits matter, transmit those values as strings
      upstream; no client-side formatter can recover precision the parse step
      already discarded.
---

<!-- content-pending: Phase C -->
