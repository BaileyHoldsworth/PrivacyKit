---
name: Unix Timestamp Converter
title: Unix Timestamp Converter — Epoch to Date | PrivacyKit
description: Convert Unix timestamps to local, UTC and ISO 8601 dates — and dates back to epoch seconds — in your browser. Auto-detects seconds, milliseconds, microseconds.
category: datetime
keywords:
  - unix timestamp
  - epoch converter
  - timestamp to date
  - epoch time
  - unix time
icon: clock
related:
  - timezone-converter
  - cron-parser
  - jwt-decoder
privacy: local
popular: true
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: What exactly is a Unix timestamp?
    a: >-
      A Unix timestamp counts the seconds elapsed since 00:00:00 UTC on
      1 January 1970 — the Unix epoch — ignoring leap seconds. `2147483647`,
      for example, is 03:14:07 UTC on 19 January 2038. Because it is a single
      number anchored to UTC, the same timestamp names the same instant
      everywhere on Earth; only the rendering into local time differs.
  - q: How does the converter know whether I pasted seconds or milliseconds?
    a: >-
      By magnitude. Values below 100,000,000,000 are read as seconds, which
      covers every date up to the year 5138; 12–14 digit values are read as
      milliseconds; anything longer as microseconds. The tool always states
      which unit it assumed, and the selector next to the input lets you
      override it — necessary for millisecond values from early 1970, which
      are small enough to look like seconds.
  - q: Do Unix timestamps have a timezone?
    a: >-
      No. A timestamp identifies an instant, not a wall-clock reading, so it
      carries no timezone at all. When this tool shows "local time" it asks
      your browser for its IANA timezone via `Intl.DateTimeFormat` and renders
      the instant in that zone; the UTC and ISO 8601 rows show the same
      instant with no offset applied.
  - q: What is the year 2038 problem?
    a: >-
      Systems that store Unix time in a signed 32-bit integer overflow one
      second after `2147483647` — 03:14:07 UTC on 19 January 2038 — wrapping
      around to December 1901. This converter is not affected. JavaScript
      holds times as 64-bit floating-point milliseconds, valid for roughly
      275,760 years either side of 1970, and the tool reports an inline error
      when a value falls outside that range.
  - q: Can I convert dates before 1970?
    a: >-
      Yes — timestamps before the epoch are negative. `-86400` is
      00:00:00 UTC on 31 December 1969, exactly one day before the epoch.
      Type a negative number into the timestamp field, or pick any pre-1970
      date in the date picker, and the conversion works the same way in both
      directions.
  - q: Why does my timestamp convert to a date in 1970 or thousands of years in the future?
    a: >-
      Almost always a unit mismatch. A millisecond value interpreted as
      seconds lands tens of thousands of years ahead, while a second value
      treated as milliseconds collapses into January 1970. Check the
      "interpreted as" note under the input, then force the correct unit with
      the selector. Timestamps from JavaScript's `Date.now()` are
      milliseconds; most Unix APIs and databases use seconds.
---

## How to use

1. Type or paste a number into the **Unix timestamp** field. The local, UTC, ISO 8601 and relative rows update on every keystroke — no button to press. If you just want the current instant, hit **Use current time** instead.
2. Leave **Unit** on Auto-detect for almost everything. Switch it to Seconds, Milliseconds or Microseconds only to override a value the tool would otherwise misread — a small millisecond value from early 1970, say.
3. Read the four output rows and copy whichever you need with its **Copy** button; each is independent.
4. To go the other way, drop into the **Date → timestamp** pane, choose a date and time (read in your browser's local zone) or press **Set to now**, and read back the epoch in seconds and milliseconds.
5. The **Current Unix time** panel at the top ticks once a second — a live seconds and milliseconds clock you can copy from directly.

## How it works

A Unix timestamp is a single integer, so converting it is arithmetic followed by formatting. The input first passes a numeric check — digits, an optional leading minus, an optional decimal point — and anything past 32 characters is rejected before the regex runs, so a stray paste can't stall the page. The value is then scaled to milliseconds according to the chosen unit: seconds multiply by 1,000, milliseconds pass through, microseconds divide by 1,000. That figure is handed to JavaScript's `Date`, and four `Intl` formatters render it — a local formatter keyed to your browser's IANA zone, a fixed-UTC formatter, `toISOString()` for the ISO 8601 row, and `RelativeTimeFormat` for the "3 years ago" style label, which re-renders each second.

Take `1699999999`. Auto-detect sees ten integer digits, below the 100-billion threshold, and reads it as seconds. Multiplying gives `1699999999000` milliseconds; `new Date()` of that lands on **2023-11-14T22:13:19.000Z**, which is what the ISO 8601 row shows verbatim. The UTC row states the same instant as `Tue, 14 Nov 2023 22:13:19 UTC`, and the local row shifts it by your machine's current offset — the underlying moment never moves, only its wall-clock rendering does.

## Use cases & limitations

Epoch numbers turn up wherever a machine records *when*: server logs, database `created_at` columns, API responses, the `iat` and `exp` claims inside a token. This converter is the quick bridge from that raw integer to something a human can read, and back again when you need to hand-craft a value for a query or a test fixture. If your timestamp came out of a JSON Web Token, the [JWT decoder](/tools/jwt-decoder/) pulls those claims apart for you; for schedule expressions rather than instants, the [cron parser](/tools/cron-parser/) does the equivalent job.

The honest limitation is timezone reach. The local row always uses *your* browser's zone and clock, so it answers "what was this for me" — not "what was this for a user in Berlin". To read one instant across several zones at once, reach for the [timezone converter](/tools/timezone-converter/). The reverse pane shares that constraint: the date you enter is interpreted in your local zone only, with no field for typing a UTC wall-clock time directly. And like Unix time itself, the tool ignores leap seconds — it counts elapsed seconds since the epoch, not astronomical time.
