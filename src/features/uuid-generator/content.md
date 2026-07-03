---
name: UUID Generator
title: UUID Generator — Random v4 UUIDs in Bulk | PrivacyKit
description: Generate random v4 UUIDs or time-ordered v7 UUIDs (RFC 9562) in your browser — up to 100 at a time, uppercase or hyphen-free, with copy and .txt download.
category: crypto
keywords:
  - uuid
  - guid
  - uuid v4
  - uuid generator
  - unique id
icon: fingerprint
related:
  - key-generator
  - pin-generator
  - hash-generator
  - lorem-ipsum-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: What is the difference between UUID v4 and UUID v7?
    a: >-
      Both are 128-bit identifiers in the same 36-character format; they differ
      in how the bits are filled. A v4 UUID is 122 random bits with no internal
      structure — nothing in it hints at when or where it was made. A v7 UUID
      spends its first 48 bits on a Unix millisecond timestamp and the
      remaining 74 on randomness, so v7 values sort by creation time. You can
      tell them apart by the 13th hex digit, which is the version number.
  - q: When should I pick v7 instead of v4?
    a: >-
      When the UUID is a database primary key. Random v4 keys land at random
      positions in a B-tree index, so inserts scatter across pages and cause
      splits and cache misses; v7 keys are time-ordered, so new rows append
      near the end of the index. Pick v4 when the identifier must not reveal
      its creation time — a v7 UUID hands its timestamp to anyone who sees it.
  - q: Can two generated UUIDs collide?
    a: >-
      In theory yes, in practice no. A v4 UUID has 2¹²² ≈ 5.3 × 10³⁶ possible
      values, and by the birthday bound you would need roughly 2.7 × 10¹⁸ of
      them before the odds of a single duplicate reach 50% — generating a
      billion per second, that takes about 86 years. v7 narrows the random
      part to 74 bits, but a collision still requires two UUIDs in the same
      millisecond, which keeps duplicates out of practical reach.
  - q: Is a UUID safe to use as a secret token, like a password-reset link?
    a: >-
      A v4 UUID from this page is drawn from `crypto.getRandomValues()`, so
      its 122 bits are unguessable — comparable to a strong random token. Two
      cautions. First, not every UUID source elsewhere is cryptographically
      random (v1 famously embeds a MAC address and clock). Second, never use
      v7 as a secret: it leaks its creation time and carries only 74 random
      bits. For keys meant to stay secret, a dedicated key generator states
      the intent more clearly.
  - q: Are UUID and GUID the same thing?
    a: >-
      Yes. GUID is Microsoft's name for the same 128-bit structure that RFC
      9562 calls a UUID. Windows tooling often prints GUIDs in uppercase
      (sometimes wrapped in braces), while the RFC canonical form is
      lowercase; the uppercase toggle here covers the former, and parsers are
      required to accept either case.
  - q: Does removing hyphens or switching to uppercase change the UUID?
    a: >-
      No — the underlying 128-bit value is identical; both toggles only change
      how the text is rendered, and they reformat the batch already on screen
      rather than generating new IDs. The 36-character lowercase hyphenated
      form is the canonical one, while the 32-character bare-hex form is
      common for compact database columns. Just confirm the consuming system
      parses the variant you choose.
---

## How to use

1. Choose a version with the two buttons above the slider: **v4 — random** for an identifier with no internal structure, or **v7 — time-ordered** when you want IDs that sort by creation time.
2. Drag the **How many** slider to set the batch size, anywhere from 1 to 100. The list regenerates the moment you move it.
3. Tick **Uppercase** or **Remove hyphens** if the system consuming the IDs expects that form — both reformat the batch already on screen rather than drawing new values.
4. Press **Generate new UUIDs** for a fresh batch (one appears automatically on load, and every version or count change also refreshes it).
5. Use **Copy all** to grab the whole list, or **Download .txt** to save it one per line.

## How it works

A UUID is 128 bits — sixteen bytes — printed as 32 hexadecimal digits in an 8-4-4-4-12 grouping. This page fills those bytes from `crypto.getRandomValues()`, the browser's cryptographically secure random source, then stamps two fixed fields: a 4-bit version (the 13th hex digit) and a 2-bit variant (the top bits of the 17th). Everything outside those fields is what separates the two versions.

A **v4** value is random across all 122 remaining bits, so it carries no timestamp, counter, or machine identifier. A **v7** value spends its first 48 bits on the current Unix time in milliseconds, then fills the leftover 74 bits randomly — which is why a column of v7 IDs sorts chronologically.

Worked example, v7. Suppose the generator fires at 2026-07-04 02:43:00.123 UTC. That instant is 1,783,132,980,123 milliseconds since the epoch, which in 48-bit hex is `019f2b02039b` — those twelve digits become the first two groups. Next comes the version nibble `7`, padded out with random bits to `73c1`; the variant nibble `8` opens the fourth group, and the rest is pure randomness:

`019f2b02-039b-73c1-8f42-d90e6b2a77c4`

Read the leading `019f2b02039b` back as an integer and you recover the exact creation instant — useful for sorting, and a giveaway if you meant the ID to be private.

## Use cases & limitations

Two systems often need to agree on an identifier without a central authority handing out numbers: primary keys minted on the client before an insert, idempotency keys on an API request, correlation IDs threaded through logs, or upload filenames that must never collide. v7 is the stronger default for database keys because time-ordered values keep B-tree inserts local instead of scattering them across index pages; v4 is right when the identifier must give nothing away about when it was made.

The honest limitation is length and legibility: 36 characters is bulky in a URL and hopeless to read down a phone line. When a person has to retype the value, a short [PIN](/tools/pin-generator/) suits far better, and for filler records while testing a schema, a [lorem ipsum generator](/tools/lorem-ipsum-generator/) beats a wall of hex.

## Privacy note

Every UUID here is built in your browser from `crypto.getRandomValues()`; no batch is transmitted, logged, or stored, and the .txt download is assembled locally from what is already on the page. A v4 UUID's 122 random bits make it usable as an unguessable token — but when a value's entire job is to stay secret, a dedicated [key generator](/tools/key-generator/) states that intent more plainly, and you should never use v7 for the purpose, since it publishes its own creation time and holds only 74 random bits.
