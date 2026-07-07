---
name: JSON to YAML Converter
title: JSON to YAML Converter (and YAML to JSON) | PrivacyKit
description: Convert JSON to YAML and YAML to JSON entirely in your browser. Pick 2- or 4-space indentation, minify JSON output, and swap direction with one button.
category: text
keywords:
  - json to yaml
  - yaml to json
  - yaml converter
  - convert yaml
  - yaml formatter
icon: file-code
related:
  - json-formatter
  - json-to-csv
  - markdown-preview
  - url-encoder-decoder
privacy: local
popular: false
updated: 2026-07-07
jsonLdCategory: DeveloperApplication
faqs:
  - q: What happens to comments in my YAML when I convert it to JSON?
    a: >-
      They disappear. A YAML comment — anything after an unquoted `#` — is text
      for humans, not part of the data, so the parser drops it while building
      the object, and JSON has no comment syntax to put it back. Converting the
      result to YAML again gives you the same structure with no comments. If a
      comment holds something you need, move it into a real field before
      converting.
  - q: Why did `.inf` or `.nan` in my YAML turn into `null` in the JSON?
    a: >-
      YAML's core schema has literals for infinity and not-a-number (`.inf`,
      `-.inf`, `.nan`); JSON can write neither, so serialising them produces
      `null`. The same rounding hits integers past 2⁵³ (about 9.0 × 10¹⁵) — a
      64-bit database ID loses its exact digits once it is read as a double. If
      those values matter, quote them as strings in the source so they survive
      the round trip unchanged.
  - q: Does converting reorder my keys or rewrite my numbers?
    a: >-
      Key order is kept: both directions write members in the order they were
      parsed, so a mapping stays in the sequence you typed it. Numbers are
      normalised, though — every number is read into a 64-bit float before it
      is written back, so `2.50` becomes `2.5`, `1e3` becomes `1000`, and any
      trailing-zero or exponent formatting is lost. The value is identical;
      only its spelling changes.
  - q: How does the converter tell me where invalid YAML is?
    a: >-
      The parser stops at the first line that breaks the grammar and reports a
      reason with a line and column, which the tool shows inline — a stray tab
      used for indentation, for instance, reads "tab characters must not be
      used in indentation" at the exact row and column. Invalid JSON is handled
      the same way, using the browser's native parser message and position.
  - q: Can it convert a YAML file with multiple `---` documents?
    a: >-
      No — it reads a single document, so a stream with more than one `---`
      section raises "expected a single document in the stream". YAML lets you
      pack several documents into one file (Kubernetes manifests often do), but
      JSON has no equivalent container, so there is no single value to produce.
      Split the file and convert each document on its own.
  - q: Should I use 2-space or 4-space indentation for the YAML?
    a: >-
      Two spaces is the near-universal convention: GitHub Actions workflows,
      Kubernetes manifests, Docker Compose files and Ansible playbooks are
      almost always written that way, and it keeps deeply nested trees from
      marching off the right edge. Pick four only if a house style asks for it.
      YAML cares that indentation is consistent, not that it is any particular
      width, so either output parses correctly.
  - q: Is the JSON or YAML I paste sent to a server?
    a: >-
      No. The conversion runs on the js-yaml library bundled into this page plus
      the browser's built-in `JSON.parse` and `JSON.stringify`, all inside your
      tab. No request is made while you type, swap direction, copy, or download —
      open your browser's network tab and paste your most sensitive document to
      confirm it stays empty.
---

## How to use

1. Paste JSON into the input pane. Conversion starts in the **JSON → YAML** direction (shown in the badge), and the output pane fills in as you type — no button press needed.
2. Choose 2 or 4 spaces from the **Indentation** dropdown. Two is the default and the width nearly every YAML ecosystem expects.
3. Hit **Swap** to flip to **YAML → JSON**. Whatever sits in the output pane carries back into the input, so you can convert, edit, and send it the other way without retyping.
4. In the YAML → JSON direction, tick **Minify JSON output** to collapse the result onto one line; the indentation setting is ignored while minify is on.
5. **Copy** the output, or **Download** it as `converted.yaml` or `converted.json`. **Sample** loads an example to poke at, and **Clear** empties both panes.

## How it works

The converter never does a text find-and-replace between the two formats. It parses your input into a real in-memory value, then re-serialises that value into the target format. Going JSON → YAML, `JSON.parse` turns the text into a JavaScript object and the js-yaml library's `dump` writes it out as YAML at your chosen indent (with `lineWidth: -1`, so a long URL or token stays on a single line instead of folding). Going the other way, js-yaml's `load` reads the YAML into a value and `JSON.stringify` prints it — indented to match your setting, or as one compact line when Minify is ticked.

A short example. This JSON:

```json
{"queue":"emails","workers":4,"durable":true,"routes":["signup","reset"],"limits":{"rate":100,"burst":150}}
```

converts, at 2-space indent, to:

```yaml
queue: emails
workers: 4
durable: true
routes:
  - signup
  - reset
limits:
  rate: 100
  burst: 150
```

Each array element becomes a `-` line indented beneath its key, and the nested `limits` object becomes its own indented block. Because the pipeline runs through an actual value rather than your keystrokes, it is the *structure* that survives the trip, not the exact spacing you typed.

## Use cases & limitations

Open this when an API hands you JSON but the file you are editing — a Kubernetes manifest, a GitHub Actions workflow, a Docker Compose service — wants YAML, or when you need the reverse. It doubles as a quick validity check: if either side refuses to parse, the input has a syntax error worth catching before you commit it. When you only need to tidy or verify JSON, the [JSON formatter](/tools/json-formatter/) is the better fit, and the [JSON to CSV converter](/tools/json-to-csv/) handles the case where the destination is a spreadsheet rather than a config file.

The main limitation is schema coverage. js-yaml reads the default YAML schema, so custom tags — CloudFormation's `!Ref` and `!GetAtt`, or `!!python/...` types — are not recognised, and the parse stops with an unknown-tag error. Anchors and aliases (`&anchor` / `*anchor`) are resolved as the document loads, which means the JSON output repeats the shared value inline instead of preserving the reference. For plain configuration data neither matters; for a hand-authored template that leans on those features, it will.

## Privacy note

Both directions run inside your tab: js-yaml plus the browser's own `JSON.parse` and `JSON.stringify`, with no server in the loop. The library is fetched once from this site's own files the first time you convert, and it carries none of your document with it; from then on, typing, swapping, copying, and downloading reach no network at all. Configuration files routinely hold secrets — API keys, database URLs, access tokens — so it matters that nothing you paste here is transmitted, logged, or kept.
