---
title: PIN Security — What Four Digits Can and Can't Do
description: A four-digit PIN holds just 13.3 bits of entropy, yet PINs protect phones and cards fine. Here is why, which PINs to avoid, and when to use more digits.
tools:
  - pin-generator
  - password-generator
relatedGuides:
  - password-entropy
  - diceware-passphrases
updated: 2026-07-03
---

A four-digit PIN feels reassuringly secret, but the maths is humbling: there are exactly 10,000 combinations from 0000 to 9999. Compared with even a short password that is almost nothing, and yet PINs guard the phone in your pocket and the card in your wallet perfectly well. Understanding why that works — and where it stops working — is the difference between a PIN that protects you and one that only looks like it does.

## The entropy of a PIN

Entropy measures how many equally likely possibilities a secret is drawn from, in bits. A random four-digit PIN is one of 10,000 options, and log₂(10,000) ≈ **13.3 bits**. Set that against the 78 bits of a twelve-character generated password (covered in [how password entropy works](/guides/password-entropy/)) and the gap is enormous: 2⁷⁸ is a septillion times larger than 2¹³·³. Adding digits helps linearly in a way that feels slow — a six-digit PIN reaches 19.9 bits (a million combinations), eight digits reaches 26.6 bits (a hundred million) — but never approaches password territory.

| PIN length | Combinations | Bits of entropy |
| --- | --- | --- |
| 4 digits | 10,000 | 13.3 |
| 6 digits | 1,000,000 | 19.9 |
| 8 digits | 100,000,000 | 26.6 |

By password standards these numbers are terrible. So why do PINs work at all?

## Why 13 bits is enough — sometimes

A PIN's security does not come from its entropy. It comes from **rate limiting** and a **secure element**. Try the wrong PIN on a modern phone and it counts the attempt, enforces escalating delays, and after a handful of failures either wipes the device or locks it for good. The bank card in a terminal blocks after three wrong tries. When an attacker gets only a few guesses per hour rather than billions per second, 10,000 possibilities is a strong wall: at three attempts before lockout, the chance of guessing a random four-digit PIN is 3 in 10,000, or 0.03%.

The hardware matters as much as the counter. Phone PINs unlock a key stored in a dedicated secure chip that itself enforces the delays, so an attacker cannot copy the encrypted storage and grind guesses against it on their own hardware — the exact offline attack that makes short secrets fatal for passwords. Take those protections away and a PIN collapses instantly: a bare 4-digit hash with no rate limit falls in well under a second.

## The PINs everyone picks

Randomness is the other half of the story, and here humans are predictable. Analyses of leaked PIN datasets have found that a small handful of codes cover a startling share of all PINs in use. `1234` alone accounts for something like one in nine. The rest of the top offenders are just as guessable: `1111`, `0000`, `1212`, `7777`, and `2000`. Dates are the deepest trap — a PIN like `1987` or `0304` looks personal and random, but birth years cluster in the 19xx range and day-month pairs only span `0101` to `3112`, so an attacker who tries dates first covers a huge fraction of real PINs with very few guesses. If someone knows your birthday, a date-based PIN is barely a secret at all.

This is exactly why a [PIN generator](/tools/pin-generator/) draws from a cryptographically secure random source rather than letting you type something memorable. Its avoid-repeats and avoid-sequences options exist to skip the codes an attacker tries first — the `1111`s and `1234`s — so the PIN you get is somewhere in the boring middle of the keyspace where guessing has no shortcut.

## When four digits isn't enough

The rate-limit-plus-secure-element model holds only where those protections exist. Reach for six or more digits when they don't, or when the stakes rise:

- **Phones and SIMs.** Six digits is now the sensible default for a device unlock; it costs you two extra taps and multiplies the keyspace a hundredfold.
- **Anything without hardware lockout.** A PIN protecting a file, an app with no server-side attempt limit, or a document is exposed to offline guessing. Treat those like passwords, not PINs — use a full [password generator](/tools/password-generator/) instead.
- **Shared or observed contexts.** If a PIN is typed in public, shoulder-surfing beats entropy entirely; length won't save a code someone watched you enter.

## What to do next

Match the secret to the threat. Where a secure element rate-limits attempts — your phone, your cards — a random six-digit PIN from the [PIN generator](/tools/pin-generator/) is plenty, provided it isn't a date or a repeat. Where nothing limits the guessing, a PIN is the wrong tool and a generated password is the right one. And wherever you do use a PIN, the single most important rule is that a machine, not your memory, should choose the digits — because the moment a human picks, the attacker's guessing list starts with your choice.
