---
name: JSON to CSV Converter
title: JSON to CSV Converter (and CSV to JSON) | PrivacyKit
description: Convert JSON to CSV and CSV back to JSON in your browser. Handles arrays of objects, mismatched keys and nested values, with comma, semicolon or tab delimiters.
category: text
keywords:
  - json to csv
  - csv to json
  - json csv converter
  - convert json to csv
  - csv converter
icon: table
related:
  - json-formatter
  - json-to-yaml
  - case-converter
  - word-counter
privacy: local
popular: true
updated: 2026-07-07
jsonLdCategory: DeveloperApplication
faqs:
  - q: How does it handle nested objects or arrays inside my JSON?
    a: >-
      CSV is a flat grid, so a value that is itself an object or array can't sit
      in one cell unchanged. When a cell holds a nested value the converter
      serialises it back to a compact JSON string — `{"name":"Drill","specs":{"volts":18}}`
      becomes a `specs` column containing `{"volts":18}`. The data stays intact
      and reversible, but nested keys are not spread into their own columns. If
      you need `specs.volts` as a separate column, flatten the JSON first.
  - q: What happens if my objects don't all have the same keys?
    a: >-
      The column list is the union of every key seen across all rows, in
      first-seen order, and a row missing a key gets an empty cell for it. So
      `[{"sku":"A1"},{"sku":"A2","price":9}]` produces two columns — `sku` and
      `price` — with the first row's `price` cell left blank. No row is dropped
      and no key is silently lost.
  - q: Comma, semicolon or tab — which delimiter do I want?
    a: >-
      Comma is standard CSV and the safe default. Pick semicolon when the file
      is headed for Excel on a machine set to a European locale, where Excel
      reads semicolons as the column separator and would otherwise pack a whole
      row into one cell. Tab produces TSV, useful when your values contain
      commas of their own and you'd rather avoid the quoting.
  - q: Why did my postcode 0800 turn into 800 in the JSON?
    a: >-
      Converting CSV to JSON with "Parse numbers and booleans" on reads `0800`
      as the number `800` and `true` as a boolean rather than as text. That is
      usually what you want, but it drops leading zeros from anything that only
      looks numeric — postcodes, phone numbers, ABNs, SKUs. Switch the option
      off to keep every field as a string exactly as written.
  - q: What does "Too many fields" or "Too few fields" mean?
    a: >-
      It flags a ragged CSV: a data row has a different column count than the
      header row. The usual cause is a stray or missing delimiter — an unquoted
      comma inside a value, or a trailing separator. The converter still returns
      JSON for what it could read and names the row number, but the flagged rows
      are worth a look before you trust the result.
  - q: Can I convert a single JSON object instead of an array?
    a: >-
      Yes. A lone object such as `{"city":"Bendigo","active":true}` is treated
      as a one-row table: its keys become the header and its values become the
      single data row. An array of objects is the usual input, but you don't
      have to wrap a single record yourself.
---
<!-- content-pending: round2 content -->
