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

<!-- content-pending: Phase C -->
