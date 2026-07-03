---
name: Encryption Key Generator
title: Encryption Key Generator — Hex & Base64 Keys | PrivacyKit
description: Generate cryptographically random encryption keys in your browser — 128 to 512 bits or a custom byte length, output as hex, Base64, Base64url or alphanumeric.
category: crypto
keywords:
  - encryption key
  - random key
  - 256 bit key
  - aes key
  - secret key generator
  - api key
icon: lock-square
related:
  - password-generator
  - hash-generator
  - hmac-generator
  - uuid-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: How do I generate a 256-bit AES key?
    a: >-
      Leave the key size on 256 bits, pick hex or Base64, and press generate.
      AES-256 wants exactly 32 random bytes: encoded as hex that is 64
      characters, as Base64 it is 44 (including one `=` pad). Check whether
      your library expects raw bytes, hex, or Base64 before pasting — most
      accept a hex string and decode it themselves.
  - q: What is the difference between Base64 and Base64url output?
    a: >-
      Same bytes, different alphabet. Standard Base64 uses `+`, `/` and `=`
      padding, all of which break inside URLs, filenames and some config
      formats. Base64url swaps `+` for `-`, `/` for `_` and drops the padding —
      it is the encoding JWT libraries and many API frameworks expect for
      shared secrets.
  - q: Is a key generated in a browser random enough for real encryption?
    a: >-
      The bytes come from `crypto.getRandomValues()`, which the browser feeds
      from the operating system's CSPRNG — the same entropy source OpenSSL
      draws on. Nothing here is derived from timestamps or `Math.random()`.
      Randomness is not the weak point of a browser-generated key; storage is.
      Put it in a secrets manager, not a chat message or a `.env` file in git.
  - q: How does the alphanumeric format affect entropy?
    a: >-
      Instead of encoding random bytes, it draws each character uniformly from
      a 62-character pool (A–Z, a–z, 0–9), so each contributes log₂(62) ≈ 5.95
      bits. The tool rounds the length up so you never get fewer bits than you
      asked for — a 256-bit alphanumeric key is 43 characters, since
      43 × 5.95 ≈ 256. Use this format where symbols are rejected, such as API
      keys or database passwords.
  - q: Which key size should I choose?
    a: >-
      256 bits is the sensible default and what AES-256, ChaCha20 and
      HMAC-SHA256 setups expect. 128 bits remains beyond brute-force reach and
      is fine where a spec calls for it; 192 exists mainly for AES-192
      compatibility. Pick 512 bits for HMAC-SHA512 signing keys, where matching
      the hash output size is conventional, and use a custom byte length for
      anything unusual, like a 24-byte legacy cipher slot.
  - q: Does a generated key leave my device or get saved anywhere?
    a: >-
      No. Generation runs entirely in page JavaScript with no network request —
      watch your browser's network tab while generating to confirm. Nothing is
      written to localStorage or cookies either, so the keys vanish when you
      leave the page. That cuts both ways: we cannot recover a key for you, so
      copy it somewhere safe before closing the tab.
---
<!-- content-pending: Phase C -->
