---
name: Hash Generator
title: Hash Generator — SHA-256, SHA-512, MD5, SHA-3 | PrivacyKit
description: Compute MD5, SHA-1, SHA-256, SHA-512, SHA-3 and CRC32 digests of text or files in your browser. Streams large files locally — nothing is uploaded.
category: crypto
keywords:
  - hash
  - sha256
  - sha512
  - md5
  - sha3
  - checksum
  - hash calculator
icon: hash
related:
  - hmac-generator
  - key-generator
  - uuid-generator
  - password-leak-checker
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: Why is my hash different from the one published on the download page?
    a: >-
      Usually one of three mismatches: a different algorithm (an MD5 sum
      compared against a SHA-256 line), a modified file (a partial download, or
      an archive you already unpacked), or hashing the wrong thing — the
      checksum *file* instead of the download it describes. Letter case never
      matters: `A3F0…` and `a3f0…` are the same hash, and this tool's
      uppercase toggle only changes how the hex is displayed.
  - q: Is MD5 (or SHA-1) still safe to use?
    a: >-
      Not for anything security-related. Both have practical collision
      attacks — MD5 since 2004, SHA-1 since the 2017 SHAttered attack —
      meaning an attacker can craft two different files with the same hash.
      They remain fine for spotting accidental corruption and for
      interoperating with older systems that still publish MD5 sums, which is
      the only reason this tool includes them.
  - q: Can I get the original text back from a hash?
    a: >-
      No — hashing is one-way and discards information; a SHA-256 digest is
      always 32 bytes whether the input was 5 characters or 5 GB. Short or
      common inputs can still be *guessed*, though: hash every dictionary word
      and compare. That is why a plain hash is the wrong way to store
      passwords — that job needs a slow, salted function like bcrypt or
      Argon2.
  - q: How does this tool hash large files without uploading them?
    a: >-
      The file is read in chunks with the browser's `File.stream()` API and
      each chunk is fed to an incremental hasher compiled to WebAssembly
      (hash-wasm). Only one chunk sits in memory at a time, so multi-gigabyte
      files work, and no byte of the file leaves your machine. A progress
      percentage appears for files over 50 MB.
  - q: What is the difference between SHA-256 and SHA3-256?
    a: >-
      Both produce 256-bit digests, but from unrelated internal designs:
      SHA-256 (2001) uses the Merkle–Damgård construction, while SHA-3 (2015)
      uses the Keccak sponge. SHA-3 was standardised as a fallback in case
      SHA-2 was ever broken — that has not happened, so SHA-256 remains the
      default choice and SHA3-256 mostly appears where a protocol specifically
      requires it.
  - q: When is CRC32 the right choice?
    a: >-
      Only for detecting accidental corruption where speed matters and no
      attacker exists — it is the 32-bit checksum built into ZIP archives and
      PNG files. It is not cryptographic: producing a file with any chosen
      CRC32 value takes microseconds, and with only 4 bytes of output, random
      collisions are expected after roughly 77,000 items.
---

## How to use

1. Choose **Text** to type or paste content, or **File** to hash something on disk. Text digests recompute as you type; a file is hashed the moment you drop it on the target or pick it through the browser dialog.
2. Tick the algorithms you need. MD5, SHA-1, SHA-256 and SHA-512 are on by default; SHA-384, SHA3-256, SHA3-512 and CRC32 are one click away. Each ticked algorithm gets its own row.
3. Read the result from the row you want and press **Copy** beside it. Rows for unticked algorithms stay hidden, so you are never copying the wrong line.
4. Turn on **Uppercase hex** if the checksum you are matching is printed in capitals — this only restyles the display, never the underlying value.
5. Use **Clear** to wipe the input and every digest at once before hashing something new.

## How it works

A hash function maps input of any size onto a fixed-length fingerprint. Change a single bit of input and roughly half the output bits flip, so two files that differ anywhere produce wildly different digests — which is exactly what makes a hash useful for spotting a corrupted or tampered download.

Text is first encoded to UTF-8 bytes, and those bytes are what get hashed. For the SHA-1/256/384/512 family this tool hands the bytes to the browser's native `crypto.subtle.digest`; MD5, SHA-3 and CRC32 have no WebCrypto equivalent, so they run through the WebAssembly hasher instead. Both paths produce identical hex to any command-line tool.

Take the twelve ASCII characters `invoice-4471` — 12 bytes of UTF-8. Its SHA-256 digest is:

```
7987dee37df3584f3e14ad6a753a24e1732d7f949021998660a6f6b9b99e42cc
```

That is 64 hex characters, because SHA-256 always emits 256 bits = 32 bytes, regardless of input length. The same 12 bytes through MD5 give `1ee43bee4b5c70e034674a0247a095b1` — 128 bits, 32 hex characters. Retype the input exactly and you will get these strings back every time; append even a trailing space and both change completely.

## Use cases & limitations

The everyday job is integrity checking: hash an ISO or installer you just downloaded and compare it against the digest the publisher lists. Developers also use hashes for content addressing (naming a cache entry or asset by its SHA-256), for deduplicating files that share the same fingerprint, and for generating stable identifiers where a random [UUID](/tools/uuid-generator/) would not be reproducible.

The honest limitation is what a match actually proves. A digest confirms the bytes in front of you are unchanged — it says nothing about whether the source was trustworthy in the first place. If an attacker controls a download mirror, they can serve a malicious file and publish its matching hash right beside it; the comparison passes and you are none the wiser. A hash verifies integrity, not authenticity. When you need to prove a message came from a party holding a shared secret, reach for the [HMAC generator](/tools/hmac-generator/) instead, and note that a bare hash is never the right way to store a password — check exposure with the [password leak checker](/tools/password-leak-checker/) rather than rolling your own.

## Privacy note

Nothing you hash is uploaded. Text is processed in place, and files are read locally in streaming chunks through `File.stream()` — even a multi-gigabyte disk image never leaves the tab, because only one chunk sits in memory at a time. The native `crypto.subtle` calls and the WebAssembly hasher both execute entirely inside your browser; there is no request that carries your input off the device. You can confirm this by opening the network tab and hashing a large file: you will see no upload, only the local read.
