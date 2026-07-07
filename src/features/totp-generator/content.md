---
name: TOTP Code Generator
title: TOTP Generator — 2FA Authenticator Codes | PrivacyKit
description: Generate time-based one-time passwords from a Base32 secret or otpauth:// link in your browser. Set digits, period and algorithm and copy the live 2FA code.
category: passwords
keywords:
  - totp
  - 2fa
  - authenticator
  - otp
  - two factor code
  - google authenticator
icon: device-mobile-code
related:
  - password-generator
  - qr-code-generator
  - hmac-generator
  - key-generator
  - password-leak-checker
privacy: local
affiliateGroup: passwords
popular: true
updated: 2026-07-07
jsonLdCategory: SecurityApplication
faqs:
  - q: Is it safe to type a 2FA secret into this page?
    a: >-
      The secret never leaves your device. Codes are computed in your browser by
      the `otpauth` library using the Web Crypto HMAC — no request is made and
      nothing is stored. Open your browser's network tab and generate a few
      codes to confirm. Still, treat any 2FA secret like a password: only paste
      one for an account you control, and clear the field when you finish on a
      shared computer.
  - q: Why does the website reject the code I generated?
    a: >-
      Almost always a clock or parameter mismatch. TOTP folds the current time
      into every code, so if your computer's clock is off by more than the
      server's tolerance (usually one 30-second step either way) each code looks
      wrong — check your system time is syncing automatically. Otherwise the
      digits, period or algorithm set here don't match what the provider used;
      re-enter the original secret and its parameters.
  - q: What is the difference between the secret and the code?
    a: >-
      The secret is the shared key — a Base32 string like `JBSWY3DPEHPK3PXP` —
      that you and the server each store once. The code is derived from that key
      plus the current time step, so it changes every period (30 seconds by
      default). You enter the secret here a single time; the six- or eight-digit
      code it produces is what you type at login.
  - q: Where do I find the Base32 secret for my account?
    a: >-
      When a site turns on two-factor authentication it shows a QR code. Look
      for a link beside it such as "enter this text instead" or "can't scan the
      code" — that reveals the Base32 key. You can also paste the whole
      `otpauth://` URI from the QR straight into the secret field above and every
      parameter fills in for you.
  - q: Does the SHA1, SHA256 or SHA512 choice matter?
    a: >-
      It has to match whatever the provider used when it enrolled the secret, or
      the codes won't line up. In practice most services use SHA1 with six
      digits and a 30-second period — the defaults here — and several popular
      authenticator apps ignore the other settings altogether. Change the
      algorithm only when the setup page or the otpauth:// link explicitly names
      a different one.
  - q: Can this replace my authenticator app?
    a: >-
      It generates the same codes, which makes it useful for testing an
      enrolment or getting in when your phone isn't nearby. It is not a safe
      long-term home for the secret, though: a browser tab keeps nothing
      encrypted and remembers nothing between visits. For daily use, store the
      secret in a dedicated authenticator or a password manager that guards it
      behind a master key.
---

## How to use

1. Paste your Base32 secret into the top field — the key a provider tucks behind a "can't scan the QR?" link — or drop the whole `otpauth://` URI in and every field below fills itself from it.
2. For a bare secret, match the parameters your provider used: **Digits** (6 or 8), **Period** in seconds (30 is standard), and **Algorithm** (SHA1, SHA256 or SHA512). Issuer and account are labels only and never change the code.
3. Read the live code from the large display. The bar underneath drains as the current window closes, and the digits roll over on their own when it reaches zero.
4. Hit **Copy** above the code to grab it, or copy the generated `otpauth://` URI to carry the same secret to another app.
5. Starting from scratch? Press **Random secret** for a fresh 160-bit key, then scan the QR into an authenticator or keep it with **Download PNG**.

## How it works

A TOTP code is an HMAC of the clock, truncated to a handful of digits — RFC 6238 layered on the HOTP construction of RFC 4226. The current Unix time is divided by the period to get a counter, so a code stays fixed for one 30-second window and changes at the next.

Take the secret `MFRGGZDFMZTWQ2LKNNWG33Q` with the defaults (SHA1, six digits, 30-second period). At 09:41:30 UTC on 7 July 2026 the Unix time is 1,783,417,290; dividing by 30 and flooring gives counter 59,447,243 (hex `38B17CB`). Packed into eight big-endian bytes, that counter is run through HMAC-SHA1 keyed with the decoded secret, yielding `4f36…93df`. Dynamic truncation reads the low nibble of the final byte (`0xdf` → 15) as an offset, pulls the four bytes starting there (`26 72 4f 93`), clears the top bit to stay positive (`0x26724F93` = 645,025,683), and takes it modulo 10⁶. The answer is `025683`, which the display groups as `025 683`. Thirty seconds on, the counter ticks to 59,447,244 and the whole calculation reruns. That keyed hash is the same primitive you can drive by hand in the [HMAC generator](/tools/hmac-generator/).

## Use cases & limitations

This earns its place when you want to confirm an enrolment worked before trusting it, read a code with your phone across the room, or check that a provider's digit count and algorithm actually match what you configured. It works the other direction too: mint a secret with **Random secret**, wire it into a login you are building, and use the codes here to test the round trip.

Two limits worth stating plainly. First, only time-based codes are handled — paste a counter-based (`HOTP`) link and it is turned away, because those hinge on a shared counter this page has no way to track. Second, the `otpauth://` URI and the QR both carry the secret in plain text; whoever photographs that QR holds your second factor outright, so guard both exactly as you would the password.

## Privacy note

Codes are computed on your device by the `otpauth` library over the Web Crypto HMAC — no request is sent and nothing is retained between visits. The QR renderer, the same library behind the [QR code generator](/tools/qr-code-generator/), is a static script fetched once from this site when a secret first validates; it never transmits the secret, and when you are offline it fails quietly while the codes keep updating. **Random secret** pulls a 160-bit key from the browser's cryptographic RNG — the source the [key generator](/tools/key-generator/) relies on, and the reason [`Math.random()` has no business making secrets](/guides/csprng-vs-math-random/). On a shared computer, clear the secret field before you step away.
