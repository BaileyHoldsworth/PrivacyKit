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
<!-- content-pending: Phase C -->
