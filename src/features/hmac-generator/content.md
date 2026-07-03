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

## How to use

1. Type or paste the exact text you need to authenticate into the **Message** box. Trailing newlines and CRLF line endings are part of the bytes, so match whatever the other side signs, character for character.
2. Enter your shared secret in **Secret key**.
3. Set **Key encoding** to Text (UTF-8) for a string secret like `whsec_…`, or to Hex bytes if the key was given to you as hex digits that should decode to raw bytes.
4. Choose the **Algorithm**. HMAC-SHA-256 is selected by default; switch to SHA-1, SHA-384 or SHA-512 only to match the system you are talking to.
5. The tag appears live in both **hex** and **Base64** as you type — copy whichever format the receiver expects with the button above each field.

## How it works

Take the message `ledger|acct=8842|amount=305.00`, the key `wombat-secret-42`, and HMAC-SHA-256. Both strings become their UTF-8 bytes, the key is imported into `crypto.subtle` as a raw HMAC key, and the browser runs the two-pass construction: it hashes the key XORed with an inner pad concatenated with the message, then hashes the key XORed with an outer pad concatenated with that first digest. The 32-byte result is:

```
hex     5b8ab63d0065ac1d949d3d7b3fed67e6805b30986363c774417c6124edabae48
base64  W4q2PQBlrB2UnT17P+1n5oBbMJhjY8d0QXxhJO2rrkg=
```

Both outputs are the same 256 bits — hex spends two characters per byte, Base64 packs three bytes into four characters, which is why the strings look nothing alike. Change one character of the message or key and about half of the tag's bits invert — there is no partial credit: a tag either matches to the bit or it does not. SHA-256 works on 64-byte blocks, so a key shorter than that is zero-padded and a key longer than 64 bytes is hashed down to 32 first — extra key length past the block size buys you nothing.

## Use cases & limitations

The everyday reason to compute an HMAC is verifying an inbound webhook. Stripe, GitHub and most providers sign each payload with a shared secret and send the tag in a header; you recompute it over the raw body and compare. The same construction signs outbound API requests, stamps tamper-evident session cookies, and protects expiring download URLs. HS256-signed JWTs are HMAC-SHA-256 under the hood — if you are working with those, pair this with the [JWT decoder](/tools/jwt-decoder/) to read the header and claims. When you only need to fingerprint data for integrity and there is no secret involved, a keyless digest from the [hash generator](/tools/hash-generator/) is the right tool instead.

Two honest limits. HMAC is *symmetric*: every party that can verify a tag can also forge one, so it proves a message came from someone holding the key — not which specific person — and gives you no non-repudiation the way an asymmetric signature would. And comparing tags safely is its own problem; a production verifier should use a constant-time comparison, not the `==` your eye does here, to avoid leaking timing. Treat this page as the place to compute and eyeball a tag, not as the verification path in a live service.

## Privacy note

Signing runs entirely in your browser through `crypto.subtle`, and the page makes no network requests — you can watch the network tab while you type and see nothing leave. Your message and key are never stored or transmitted. That said, a secret key is exactly the sort of thing worth guarding: prefer a test-mode secret, or mint a throwaway one with the [key generator](/tools/key-generator/) rather than pasting a live production credential into any website, including this one.
