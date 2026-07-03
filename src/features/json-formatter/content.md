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

## How to use

1. Paste or type JSON into the input pane at the top. The counter beneath it tracks character count and byte size as you edit.
2. Set the **Indentation** dropdown to 2 or 4 spaces. This choice only affects Format.
3. Tick **Sort keys A→Z (recursive)** if you want object members reordered at every nesting level. Arrays keep their original order.
4. Press **Format** to pretty-print, **Minify** to strip whitespace, or **Validate** to check syntax without producing output. Ctrl/Cmd+Enter is a shortcut for Format.
5. Read the Object keys, Max depth and Size stats, then **Copy** the result or **Download** it as `formatted.json` or `minified.json`.

## How it works

All three buttons run the same short pipeline. Your text is handed to the browser's native `JSON.parse`, which either returns a JavaScript value or throws at the first character that breaks the RFC 8259 grammar. When it throws, the tool reads the line, column or byte offset out of the error message, selects that line in the input, and scrolls to it. When it succeeds, the value is optionally passed through a recursive key sort, then serialised again with `JSON.stringify` — using your indent for Format, no spacing for Minify, and skipped entirely for Validate, which stops the moment the parse succeeds.

Take this input with **Sort keys** on and Format set to 2 spaces:

`{"sku":"TT-90","tags":["b","a"],"stock":{"qty":12,"bin":"D4"}}`

The parse yields an object. The recursive sort reorders the top-level keys to `sku`, `stock`, `tags`, and reorders `stock`'s members to `bin`, `qty` — but leaves the `tags` array as `["b","a"]`, because element order there is meaningful. Serialising with two-space indent gives:

```json
{
  "sku": "TT-90",
  "stock": {
    "bin": "D4",
    "qty": 12
  },
  "tags": [
    "b",
    "a"
  ]
}
```

The stats reflect the parsed value, not the text: Object keys reads 5 (three at the top level plus two inside `stock`), Max depth reads 2 (the `stock` object and the `tags` array both sit one level down), and Size is the UTF-8 byte length of the output. The walk that computes depth is iterative, so a file nested tens of thousands of levels deep reports its stats instead of overflowing the call stack.

## Use cases & limitations

A minified webhook payload printed on one endless line is unreadable; Format turns it back into something you can scan and diff. Reach for this when you are debugging an API response, tidying a hand-edited config file, normalising a test fixture so its key order is stable, or shrinking a document before you paste it somewhere size-constrained. Pairing it with [Text Diff](/tools/text-diff/) is a common move: format two responses the same way, then compare them line by line so only the real changes stand out. If the JSON is a token payload rather than plain data, the [JWT Decoder](/tools/jwt-decoder/) splits and decodes it for you.

The honest limitation is that this is a strict parser, not a repair tool. It will not guess your intent, close a missing bracket, or strip a stray trailing comma — it reports the first grammar error and stops, so genuinely broken input is fixed one error at a time by hand. It formats valid JSON; it does not rescue invalid JSON.

## Privacy note

JSON routinely carries access tokens, personal details and internal identifiers, so where it goes matters. Every step here — parse, sort, serialise, byte counting — runs through native browser functions inside your tab. No request is made at any point, nothing is stored, and the download is generated locally from the text already on screen. Open your browser's network tab and format the most sensitive document you have: it stays empty.
