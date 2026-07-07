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

<!-- content-pending: round2 content -->
