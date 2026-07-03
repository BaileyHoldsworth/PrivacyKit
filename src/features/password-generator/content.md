---
name: Password Generator
title: Password Generator — Strong Random Passwords | PrivacyKit
description: Generate strong random passwords in your browser with a cryptographically secure generator. Choose length and character sets, see the entropy, copy in one click.
category: passwords
keywords:
  - password
  - random password
  - strong password
  - pw gen
  - secure password generator
icon: key
related:
  - passphrase-generator
  - password-strength-checker
  - password-leak-checker
  - pin-generator
  - encryption-key-generator
privacy: local
affiliateGroup: passwords
ads: true
popular: true
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: Is it safe to generate passwords in a browser?
    a: >-
      Here, yes — because of *where* the randomness comes from and *where* the
      password goes. This generator calls your browser's built-in
      `crypto.getRandomValues()`, the same cryptographically secure source
      password managers use, and the result is written straight into the page.
      No network request is made; you can open your browser's network tab and
      generate as many passwords as you like to confirm nothing is sent.
  - q: What length should I pick?
    a: >-
      For accounts protected by a rate-limited login form, 16 characters with
      all four character sets is already far beyond brute-force reach. For
      anything that could be attacked offline — password manager vaults, disk
      encryption, Wi-Fi passphrases — use 20 or more. Length costs you nothing
      when a password manager does the remembering.
  - q: Why does the generator always include one character from each set I tick?
    a: >-
      Many sites enforce composition rules ("at least one uppercase letter and
      one digit"). Guaranteeing one character per selected set means the output
      always passes those checks, at a negligible entropy cost — the guaranteed
      characters are still chosen randomly and their positions are shuffled.
  - q: What does the "exclude look-alikes" option do?
    a: >-
      It removes O, 0, I, l and 1 from the character pools. Use it when a
      password will be read aloud, typed from paper, or printed — like a Wi-Fi
      password on a whiteboard. Leave it off otherwise; a bigger pool means
      more entropy per character.
  - q: What do the entropy and crack-time numbers actually mean?
    a: >-
      Entropy measures how many equally likely possibilities the generation
      process could have produced, in bits. The crack-time figure assumes an
      offline attacker testing 10 billion guesses per second — roughly what a
      rig of modern GPUs achieves against a fast hash — and reports the
      *average* time to hit your password (half the total keyspace). Real
      logins are far slower to attack because servers rate-limit attempts.
  - q: Should I use a password or a passphrase?
    a: >-
      If a machine stores it, use a random password like the ones made here.
      If a human has to remember or type it — a master password, a laptop
      login — a multi-word passphrase from our passphrase generator is easier
      to memorise at comparable strength.
---

## How to use

1. Pick a length with the slider — it starts at 20 characters, a sensible default for anything important.
2. Tick the character sets the target site accepts. All four stay on unless you have a reason to drop one.
3. Turn on **Exclude look-alikes** only if someone will read or retype the password manually.
4. Press **Generate new password** (a password also appears as soon as the page loads, and regenerates whenever you change an option).
5. Copy it with the button above the output and store it in a password manager — not a text file.

## How it works

Every character is drawn with `crypto.getRandomValues()`, the browser's cryptographically secure random number generator, using rejection sampling so each character in the pool is exactly equally likely. That last detail matters: the naive approach of taking a random 32-bit number modulo the pool size skews the odds towards the start of the pool. The skew is small, but "small bias" is not a phrase you want anywhere near your passwords, so this tool discards and redraws instead.

The entropy figure is the arithmetic of the process, not a guess about the output. With all four sets ticked the pool holds 94 characters, so each position contributes log₂(94) ≈ 6.55 bits. A 20-character password therefore carries about 131 bits of entropy: there are 94²⁰ ≈ 2.9 × 10³⁹ equally likely possibilities. At ten billion guesses per second, an attacker working through half of them needs around 4.6 × 10²¹ years — the crack-time stat runs this exact calculation live as you move the slider.

One structural note: because one character from each ticked set is guaranteed (so the output passes "must contain a digit" rules), the true keyspace is fractionally smaller than the headline number. For any length you'd actually use, the difference is far below one bit.

## Use cases & limitations

Reach for this tool when a signup form is in front of you and your password manager's built-in generator isn't — or when you need a shared secret that isn't tied to any account, like a Wi-Fi password, a database credential, or a temporary access code. Since generation is instant and local, it also works offline once the page is loaded.

Two honest limitations. First, a generator cannot fix password *reuse* — a perfect 131-bit password pasted into five sites is still one breach away from being five breaches; check exposure with the [password leak checker](/tools/password-leak-checker/). Second, randomness makes passwords unmemorable by design. For the handful of secrets that must live in your head, generate a [passphrase](/tools/passphrase-generator/) instead, and let a password manager hold the rest.

## Privacy note

Generation happens entirely on your device. The page makes no network requests during generation, nothing is stored, and there is no way for us — or anyone else — to see what was produced. If you want to verify that claim rather than trust it, open your browser's developer tools, watch the network tab, and generate away.
