---
name: PIN Generator
title: PIN Generator — Secure Random PIN Codes | PrivacyKit
description: Generate random PIN codes of 4 to 12 digits locally in your browser. Optional filters reject repeats and sequences, and the exact entropy cost is shown.
category: passwords
keywords:
  - pin
  - pin code
  - random pin
  - 4 digit pin
  - 6 digit pin
icon: dialpad
related:
  - password-generator
  - passphrase-generator
  - uuid-generator
privacy: local
affiliateGroup: passwords
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: Is there such a thing as the most secure PIN?
    a: >-
      Not once the PIN is chosen randomly — every 6-digit code is exactly one
      of 1,000,000 equally likely options, so no particular code is stronger
      than another. Real-world PINs are weak because people don't choose
      randomly: a widely cited analysis of 3.4 million leaked 4-digit PINs
      found `1234` alone made up about 11% of them, and the twenty most common
      codes covered more than a quarter. A random draw sidesteps that entire
      problem.
  - q: Should I use a 4-digit or 6-digit PIN?
    a: >-
      Six, wherever the device allows it. Four digits give 10,000 combinations
      (about 13.3 bits of entropy); six give 1,000,000 (about 19.9 bits) — a
      hundred times more to search for two extra keystrokes. Modern iOS and
      Android default to six digits for exactly this reason. Go longer still
      (8-12) for anything without a strict lockout, such as a door keypad that
      accepts unlimited tries.
  - q: Do the avoid-repeats and avoid-sequences filters weaken the PIN?
    a: >-
      Slightly, and the entropy stat shows exactly how much. With both filters
      on, a 4-digit PIN is drawn from 9,796 valid codes instead of 10,000
      (13.26 bits instead of 13.29), and a 6-digit PIN from 959,158 instead of
      1,000,000. In exchange the output can never be `1111`, `1234` or another
      pattern from the top of every guessing list — the codes an attacker
      tries first. Trading a few hundredths of a bit against pattern-guessers
      is usually worth it.
  - q: Which PINs should I avoid picking myself?
    a: >-
      The patterns that dominate leaked-PIN datasets: repeated digits (`0000`,
      `8888`), ascending runs (`1234`, `123456`), keypad columns like `2580`,
      and — the biggest group — dates. Birth years (`19xx`, `20xx`) and
      MMDD-style dates are so overrepresented that thousands of 4-digit codes
      are far likelier than chance, and anyone who knows your birthday gets a
      head start. A random draw carries none of that structure, and this
      tool's filters reject the repeat and sequence patterns outright.
  - q: Where does the randomness come from?
    a: >-
      From `crypto.getRandomValues()`, the browser's cryptographically secure
      generator — the same source our password generator uses. Digits are
      drawn with rejection sampling, so each of the ten digits is exactly
      equally likely (no modulo bias), and when a filter rejects a candidate
      the whole PIN is redrawn rather than patched, which keeps every
      surviving code equally probable. Nothing leaves your device: the page
      makes no network requests while generating, which you can confirm from
      your browser's network tab.
  - q: A password this short would be useless — why is a random PIN enough?
    a: >-
      Because a PIN is never exposed to offline guessing the way a leaked
      password hash is. Twenty bits of entropy would fall in milliseconds to
      an offline attack, but PIN verification happens inside hardware that
      enforces a lockout policy — bank cards block after three wrong tries,
      and phone secure elements add growing delays and can wipe after ten.
      Against an attacker limited to a handful of attempts, a random 6-digit
      PIN holds up: the lockout does the heavy lifting, not the entropy. Never
      reuse the same digits somewhere that lacks that protection.
---

<!-- content-pending: Phase C -->
