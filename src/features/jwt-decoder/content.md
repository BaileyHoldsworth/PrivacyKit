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

## How to use

1. Paste your token into the **Encoded token** box. A full `Authorization: Bearer …` header, or a token wrapped in quotes copied from a log line, works too — the prefix, the quotes and any line breaks are stripped before decoding.
2. Read the header, payload and signature panes below, which fill in as you type; the decode fires about 150 ms after you stop typing.
3. Glance at the three stat tiles: the detected **Algorithm**, a live **Token status** badge, and the **Signature** size in bytes.
4. Scan the time-claims list, where `exp`, `nbf` and `iat` show up as local dates with badges that refresh every second.
5. No token handy? Press **Load sample** for a synthetic one built inside the page, or **Clear** to empty every field.

## How it works

A signed JWT (technically a JWS) is three Base64URL strings joined by dots: `header.payload.signature`. The decoder splits on those dots, insists on exactly three parts, then decodes the first two from Base64URL to UTF-8 bytes and parses each as JSON. Base64URL is ordinary Base64 with two swaps — `+` becomes `-`, `/` becomes `_` — and the `=` padding dropped, so a token survives inside a URL untouched.

Worked example: take the payload segment `eyJpc3MiOiJrZXN0cmVsLWFwaSIsInN1YiI6ImFjY3RfNTU2NyIsImV4cCI6MTc4MzcyODAwMH0`. Decoding those characters yields the JSON `{"iss":"kestrel-api","sub":"acct_5567","exp":1783728000}`. The `exp` value is a NumericDate — seconds since 1 January 1970 UTC — so the tool multiplies by 1000 and formats it as 11 July 2026. Because that moment is still ahead of now, the status badge reads **Not expired** and counts down live; let the clock pass it and the badge flips to **Expired** with no reload. The signature is shown with its byte length, but nothing is ever computed against it — no key is applied.

## Use cases & limitations

You reach for a decoder when a login returns a token and you want to see what the server actually put inside it — which scopes it granted, which audience it names, when it lapses — or when an API keeps rejecting a request and you suspect the token expired or isn't valid yet. It also settles the argument about whether a millisecond value slipped into a time claim.

The limitation is the whole point of the tool: decoding is not verification. Anyone can read a JWT and anyone can forge one, because the signature — the only thing binding those claims to their issuer — is never checked here. A decoded token proves nothing about who minted it. To recompute an HS256 signature yourself, the [HMAC generator](/tools/hmac-generator/) does that arithmetic; to convert a raw epoch claim on its own, the [Unix timestamp converter](/tools/unix-timestamp-converter/) handles it.

## Privacy note

Every segment is decoded on your device using the browser's own Base64 and JSON facilities; the page issues no network request, which you can confirm by watching your browser's network tab while you paste. Even so, a valid token is a live credential — whoever holds it can act as you until it expires — so treat production tokens as secrets and decode expired, test, or **Load sample** tokens instead. The underlying Base64URL step is the same operation the [Base64 encoder/decoder](/tools/base64-encoder-decoder/) exposes on its own.
