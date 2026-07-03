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

A new phone, a fresh SIM, a door keypad at the office — the moment something asks you to "choose a PIN," most people reach for a birthday or a keypad shape. This tool draws the digits for you instead, so the code carries no story an attacker can guess.

## How to use

1. Pick a length: tap **4**, **6** or **8** digits, or choose **Custom** and type any whole number from 4 to 12. Six is selected to start with.
2. Drag **How many PINs** if you want a batch — the slider goes up to ten codes in one draw.
3. Keep **Avoid repeated digits** and **Avoid sequences** ticked to throw out patterns like `7777` or `1234`; untick either one to widen the pool.
4. Check the **Entropy per PIN** and **Possible PINs** stats to see the exact price of those filters before you commit.
5. Press **Generate new PINs**, then copy a single code with its **Copy** button, or grab the entire batch at once with **Copy all**. A PIN also appears the moment the page opens, and it redraws each time you adjust a setting.

## How it works

Each digit comes from `crypto.getRandomValues()`, the browser's cryptographically secure generator, sampled with rejection so all ten digits are exactly equally likely rather than skewed by a modulo shortcut. When a filter rejects a candidate, the whole PIN is redrawn — not patched — which keeps every surviving code equally probable.

The stats are the honest arithmetic of the *filtered* keyspace, not the raw `10ⁿ`. A dynamic program counts how many codes of your chosen length actually survive both filters, then reports log₂ of that count.

Say you ask for one 6-digit PIN with both filters on. The generator draws `188802`, spots that `8` repeats three times in a row, and discards it. It draws `345612`, catches the ascending run `3456`, and discards that too. Its third draw, `407295`, has no triple and no four-in-a-row run, so it is accepted. Behind the scenes the counter finds 959,158 valid 6-digit codes out of the plain 1,000,000 — the filters exclude 4.1% of the space — giving log₂(959,158) ≈ **19.9 bits** of entropy. Turn both filters off and you get the full 1,000,000 codes at 19.93 bits: a difference of six hundredths of a bit, in exchange for never handing an attacker the patterns they try first.

## Use cases & limitations

The everyday jobs are setting a phone or SIM unlock code, a bank card, a smart-lock keypad, or a voicemail box — anywhere a short numeric secret is all the field accepts. The batch mode helps when you are provisioning several devices or handing temporary codes to a team and want them all drawn independently.

The honest limitation is that a random PIN is still only about 20 bits of entropy, and no filter changes that. That is fine where hardware enforces a lockout — a wrong-guess counter that blocks or wipes after a handful of tries — and dangerously weak anywhere a code can be attacked offline at speed. If you need a secret that must withstand offline guessing, generate a full [password](/tools/password-generator/) instead, or a memorable [passphrase](/tools/passphrase-generator/) for something you have to recall. For a random identifier rather than a login secret, a [UUID](/tools/uuid-generator/) is the better shape.

## Privacy note

Every digit is generated on your own device. The page makes no network request while drawing PINs, nothing is written to a server, and no code you produce is logged or recoverable by anyone — including us. If you would rather check than trust, open your browser's developer tools, keep an eye on the network tab, and generate as many PINs as you like: it stays silent.
