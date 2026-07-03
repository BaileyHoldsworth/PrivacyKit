---
name: HMAC Generator
title: HMAC Generator — SHA-256 Signatures Online | PrivacyKit
description: Compute HMAC-SHA-256, SHA-1, SHA-384 or SHA-512 signatures in your browser with WebCrypto. Text or hex keys, hex and Base64 output — nothing is uploaded.
category: crypto
keywords:
  - hmac
  - hmac sha256
  - hmac generator
  - message authentication
  - sign payload
icon: signature
related:
  - hash-generator
  - jwt-decoder
  - key-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: How is an HMAC different from a plain SHA-256 hash?
    a: >-
      A plain hash is keyless: anyone who can read the message can recompute
      its SHA-256 and forge a "valid" digest. An HMAC mixes a secret key into
      the hash (HMAC(K, m) = H((K ⊕ opad) ‖ H((K ⊕ ipad) ‖ m))), so only
      parties holding the key can produce or verify the tag. That makes it
      proof of *authenticity*, not just integrity — which is why webhook
      signatures and API request signing use HMAC rather than a bare hash.
  - q: Which hash algorithm should I pick for HMAC?
    a: >-
      HMAC-SHA-256 is the default for a reason: it is what Stripe, GitHub and
      most webhook providers specify, and its 32-byte tag is more than strong
      enough. Choose SHA-384 or SHA-512 only if the system you're matching
      requires them. HMAC-SHA-1 is here for legacy interop (older AWS and
      OAuth 1.0 signatures) — the collision attacks on SHA-1 don't break
      HMAC-SHA-1, but don't design anything new around it.
  - q: Should I enter my key as text or hex?
    a: >-
      It depends on how the other side treats the key. If the shared secret is
      a string like `whsec_9f2a…` that the server feeds in as-is, use **Text**
      — the key is the UTF-8 bytes of what you typed. If the key was generated
      as raw random bytes and handed to you hex-encoded, use **Hex** so
      `4a656665` becomes the 4 bytes it encodes rather than the 8 characters
      "4a656665". Mixing these up is the single most common cause of
      mismatched signatures.
  - q: Why doesn't my HMAC match the one my server computes?
    a: >-
      HMAC is bitwise-exact, so hunt for byte-level differences. The usual
      suspects: a trailing newline the server includes but your paste lost (or
      vice versa), CRLF vs LF line endings, the key interpreted in the wrong
      encoding (text vs hex vs Base64), or comparing a hex tag against a
      Base64 one — `5bdc…` and `W9zB…` can be the same signature. Fix the
      bytes on both sides and the tags will agree.
  - q: How long should an HMAC key be?
    a: >-
      RFC 2104 recommends a key at least as long as the hash output — 32
      random bytes for HMAC-SHA-256. Shorter keys weaken the tag to roughly
      the key's own entropy, so a 6-character key is brute-forceable no matter
      the algorithm. Keys longer than the hash block size (64 bytes for
      SHA-256) are hashed down first, so extra length past that adds nothing.
  - q: Is it safe to paste a real signing key into this page?
    a: >-
      The computation runs locally in `crypto.subtle` and this page makes no
      network requests — you can watch the network tab while you type. Even
      so, treat pasting production secrets into *any* website, including this
      one, as bad practice: browser extensions, shoulder surfers and clipboard
      history all exist. Use it with test-mode or throwaway keys, and rotate
      any credential you suspect has been exposed.
---

<!-- content-pending: Phase C -->
