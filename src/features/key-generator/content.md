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
## How to use

1. Choose a key size — 128, 192, 256 or 512 bits — or pick **Custom…** and type a byte count from 1 to 1024 in the field beside it.
2. Set **Format** to whatever your library reads: hex, Base64, Base64url or alphanumeric.
3. Drag **Keys per batch** (1 to 10) if you want several at once — useful when you are rotating a set of credentials together.
4. Press **Generate keys**. A batch also appears the moment the page loads and refreshes whenever you change an option.
5. Click a key, its **Copy** button, or **Copy all** to lift the whole batch at once (one key per line).

## How it works

The bytes come straight from `crypto.getRandomValues()`, which draws on the operating system's cryptographically secure random source. The chosen key size fixes how many bytes are requested — 256 bits means 32 bytes — and the format only decides how those bytes are written down. Nothing here derives a key from a timestamp, a mouse path, or `Math.random()`.

Say you ask for a 128-bit key. The generator requests 16 random bytes and gets, for one draw:

`b3 07 5e f1 2a 9c 44 e8 01 7d bb 60 f5 3c 8a d9`

Hex writes each byte as two lowercase digits, so those 16 bytes become `b3075ef12a9c44e8017dbb60f53c8ad9` — always exactly twice the byte count. Base64 packs the bytes three at a time into four characters from a 64-symbol alphabet; 16 is not a multiple of three, so the final stray byte yields two characters plus `==` padding: `swde8SqcROgBfbtg9TyK2Q==`. Base64url uses the same packing but swaps `+` and `/` for `-` and `_` and drops the padding, giving `swde8SqcROgBfbtg9TyK2Q`.

Alphanumeric skips encoding entirely and instead picks each character directly from a 62-symbol pool, rounding the length up so you never receive fewer bits than requested — a 128-bit request lands on 22 characters. Whatever the format, the entropy figure is just the byte count times eight, because the strength lives in the random bytes, not the alphabet they are dressed in.

## Use cases & limitations

Generate a key here when something other than a person needs the secret: a symmetric cipher key for AES-GCM or ChaCha20, a signing key to pair with the [HMAC generator](/tools/hmac-generator/), an API token, a webhook secret, or a seed value a script will consume. The batch option exists for the boring-but-real job of rotating several keys in one sitting and pasting them into a secrets manager.

Two limits worth stating plainly. First, this produces *symmetric* keys and random tokens — flat sequences of bytes. It does not build asymmetric keypairs; if you need an RSA or Ed25519 private-and-public pair, `ssh-keygen` or `openssl` is the right tool. Second, a raw key is deliberately unmemorable and unsuited to anything a human types by hand — for a login or a master secret, generate a [password](/tools/password-generator/) instead. And if you only need a unique identifier rather than a secret, a [UUID](/tools/uuid-generator/) is the correct shape; a key is overkill and invites people to treat it as sensitive when it isn't.

## Privacy note

Every key is built in page JavaScript on your own device. No network request is made during generation — keep the network tab open while a batch is created and you will see it stay silent — and nothing is written to localStorage, cookies, or a server. The flip side of that guarantee: once you leave the page the keys are gone and cannot be recovered, so copy anything you mean to keep into a secrets manager before you close the tab.
