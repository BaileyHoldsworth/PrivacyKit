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
      Yes — timestamps before the epoch are simply negative. `-86400` is
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

<!-- content-pending: Phase C -->
