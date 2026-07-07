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
## How to use

1. Paste or type your data into the input pane. The tool opens in **JSON → CSV** mode and converts as you type, so the CSV lands in the lower pane straight away.
2. Choose comma, semicolon or tab from the **CSV delimiter** dropdown to set the output separator.
3. Leave **Include header row** ticked to write the column names as the first line, or untick it to emit data rows only.
4. To go the other way, press **Swap direction**. The current output is fed back into the input so you can round-trip a result, and **Parse numbers and booleans** becomes active for the CSV → JSON pass.
5. Take the result with **Copy**, or **Download** it as `data.csv` or `data.json`. The **Rows**, **Columns** and **Output size** counters under the panes refresh on every change.

## How it works

Turning JSON into CSV is a flattening job: JSON is a tree, CSV is a rectangle. The tool runs `JSON.parse` on your input, then normalises the result into a list of rows — an array of objects is taken as-is, and a single object becomes a one-row table. It walks the rows once to collect the columns (every distinct key, kept in the order it first shows up), then hands the grid to Papa Parse's `unparse`, which writes each field with your chosen delimiter and wraps any value that contains that delimiter, a double quote or a line break in quotes.

Take this input:

```json
[
  {"suburb":"Fitzroy","median":1150000,"note":"terrace, north-facing"},
  {"suburb":"Coburg","median":890000,"note":"unit"}
]
```

With the comma delimiter and a header row, the output is:

```
suburb,median,note
Fitzroy,1150000,"terrace, north-facing"
Coburg,890000,unit
```

The `note` for Fitzroy holds a comma, so it is wrapped in quotes to keep it inside one column; `unit`, with no comma, is left bare. Swap the direction and Papa Parse reads that grid back the other way — the first line becomes the object keys, and with **Parse numbers and booleans** on, `1150000` is decoded as the number `1150000` rather than the string `"1150000"`.

## Use cases & limitations

The everyday case is shifting data between a program and a spreadsheet: a REST endpoint hands you JSON and you want it in Excel or Google Sheets, or a colleague sends a CSV export that your script needs as JSON. It also earns its keep for eyeballing an API response as a table, or reshaping a small dataset without writing a throwaway parser.

The real limit is size. Both directions parse on the browser's main thread, so input is capped at 5 MB — beyond that a big file can freeze the tab while it grinds, and you're better off splitting it and converting the parts. If your JSON won't parse, tidy it in the [JSON formatter](/tools/json-formatter/) first, which pinpoints the line of a syntax error. And when the destination wants YAML instead of a grid, the [JSON to YAML converter](/tools/json-to-yaml/) preserves the nesting that CSV has to collapse.

## Privacy note

The conversion runs entirely in your browser. Your JSON or CSV is never uploaded — the Papa Parse library that does the parsing is bundled with the page and loaded from the same origin on first use, so after the page has loaded the tool needs no network at all. Nothing you paste is stored or sent anywhere, which matters when these files carry customer records, financial exports and other data you would not want handed to a server.
