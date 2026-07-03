---
name: JWT Decoder
title: JWT Decoder — Inspect JSON Web Tokens Online | PrivacyKit
description: Decode a JWT header and payload in your browser and read exp, nbf and iat as plain dates with live expiry status. Decoding only — signatures are never verified.
category: encoding
keywords:
  - jwt
  - jwt decode
  - json web token
  - jwt debugger
  - decode token
icon: id
related:
  - base64-encoder-decoder
  - hash-generator
  - hmac-generator
  - unix-timestamp-converter
privacy: local
popular: true
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Does decoding a JWT verify it?
    a: >-
      No, and the difference matters. The header and payload are just
      Base64URL-encoded JSON — anyone can decode them, and anyone can forge
      them. Verification means recomputing the signature with the issuer's
      secret (HMAC) or checking it against a public key (RSA/ECDSA), and this
      tool deliberately does neither: it has no keys and never asks for one.
      Never trust claims from a token you have only decoded.
  - q: Is it safe to paste a token into this page?
    a: >-
      Decoding runs entirely in your browser — open the network tab and paste
      away; no request is made. But a live token is a bearer credential:
      whoever holds it can use it until it expires. The safe habit is to never
      paste production tokens into any website, ours included. Reach for an
      expired token, one from a test environment, or the **Load sample**
      button, which builds a synthetic token locally.
  - q: Why isn't my JWT encrypted? Anyone can read it.
    a: >-
      A standard JWT (technically a JWS) is signed, not encrypted — Base64URL
      is an encoding, not a cipher. The signature stops tampering; it does
      nothing to stop reading. Treat everything in the payload as visible to
      whoever holds the token, so issuers should keep secrets out of claims.
      Encrypted tokens do exist (JWE, five dot-separated segments instead of
      three), but those need the decryption key, not a decoder.
  - q: What do the exp, nbf and iat claims mean?
    a: >-
      They are the registered time claims from RFC 7519, stored as NumericDate
      values — seconds since the Unix epoch. `exp` is when the token stops
      being acceptable, `nbf` means "not valid before", and `iat` records when
      it was issued. The decoder converts each into a readable local date and
      keeps a live badge on expiry, so a token that lapses while you look at it
      flips to **Expired** in real time. To convert an epoch value by hand, the
      [Unix timestamp converter](/tools/unix-timestamp-converter/) does the
      same arithmetic.
  - q: Why won't my token decode?
    a: >-
      The inline error names which segment failed. The common causes: the
      token was truncated during copy-paste (the Base64URL length no longer
      adds up), a `Bearer ` prefix or surrounding quotes came along (this tool
      strips both automatically), line breaks were inserted by an email or
      chat client (also stripped), or the input has five segments — a JWE,
      which cannot be read without its decryption key.
  - q: What does "alg":"none" in the header mean?
    a: >-
      It marks an unsecured JWT — no signature at all, just an empty third
      segment. Several older libraries accepted attacker-supplied `alg: none`
      tokens as if they were validly signed, one of the classic JWT
      vulnerabilities, so servers must reject it unless unsecured tokens are
      explicitly expected. The decoder flags an empty signature so it doesn't
      slip past you.
  - q: Why does exp show a date thousands of years away?
    a: >-
      The issuing code almost certainly wrote milliseconds. NumericDate is
      defined in seconds, but JavaScript's `Date.now()` returns milliseconds,
      so tokens minted with it directly carry values a thousand times too
      large. The decoder warns when a time claim looks like milliseconds; the
      fix is dividing by 1,000 wherever the token is issued.
---

<!-- content-pending: Phase C -->
