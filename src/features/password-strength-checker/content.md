---
name: Password Strength Checker
title: Password Strength Checker — Test Your Password | PrivacyKit
description: Rate any password with zxcvbn pattern analysis — a 0–4 score, realistic crack-time estimates and concrete fixes, computed entirely in your browser.
category: passwords
keywords:
  - password strength
  - how strong is my password
  - password test
  - password checker
icon: shield-check
related:
  - password-generator
  - passphrase-generator
  - password-leak-checker
privacy: local
affiliateGroup: passwords
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: Is it safe to type a real password into a strength checker?
    a: >-
      On this page the analysis is local: the zxcvbn library is bundled with
      the site, loads into your browser on your first keystroke, and no network
      request carries what you type — the network tab in your browser's
      developer tools stays quiet while you test. Nothing is stored, either.
      If a checker you can't inspect makes you uneasy, test a stand-in with
      the same structure (same length, same mix of words, digits and symbols)
      rather than the real thing.
  - q: How is the score calculated?
    a: >-
      The checker runs zxcvbn, which tries to *reconstruct* your password from
      known patterns instead of just counting character sets. It searches a
      ranked list of about 49,000 leaked passwords plus English words, names
      and Wikipedia terms (roughly 236,000 dictionary entries in total), and
      looks for keyboard walks, dates, sequences, repeats, reversed words and
      l33t substitutions. The score reflects how many guesses the cheapest
      reconstruction of your password would need.
  - q: Why does the meter disagree with the password rules on signup forms?
    a: >-
      Composition rules check which character types are present; zxcvbn
      estimates guessability. `P@ssw0rd2024` ticks every composition box —
      upper, lower, digit, symbol, 12 characters — yet needs only about 10⁴
      guesses, because it is one substitution away from a top-ranked leaked
      password. The reverse happens too: four random lowercase words fail a
      "must contain a symbol" rule while being far harder to guess.
  - q: Why did my long password score lower than a shorter one?
    a: >-
      Length only counts when it adds unpredictability. `Wollongong2019!` runs
      15 characters, but a place name, a recent year and a trailing exclamation
      mark are exactly what cracking rules try first — zxcvbn puts it near 10⁸
      guesses, which an offline rig clears in under a second. Unrelated random
      words do better at similar length: `grevillea-tram-mango-quilt` sits
      around 10²⁰ guesses.
  - q: What do the two crack-time estimates mean?
    a: >-
      They bracket the realistic attack range. *Online attack* models guessing
      against a rate-limited login form at 100 attempts per hour. *Offline
      attack* models an attacker who stole a password database hashed with a
      fast algorithm like MD5 or SHA-1 and tests 10 billion guesses per second
      on GPUs. You rarely know how a service stores your password, so for
      anything important, judge by the offline number.
  - q: What score should I aim for?
    a: >-
      The bands are logarithmic: score 3 means 10⁸ to 10¹⁰ guesses — enough to
      survive online attacks, but an offline rig at 10 billion guesses per
      second still clears that band within a second. Score 4 (above 10¹⁰) is
      the only band with real headroom, and the guesses stat shows how far
      above the line you are. Aim for 4 on anything you'd mind losing; if
      you're short, adding one unrelated word beats swapping in another symbol.
  - q: Does a strong score mean the password hasn't been leaked?
    a: >-
      No. Strength and exposure are different questions — this tool estimates
      how hard your password is to guess, and knows nothing about whether it
      already sits in a breach dump because it was reused or stolen somewhere.
      Check that separately with the
      [password leak checker](/tools/password-leak-checker/), which queries
      Have I Been Pwned using k-anonymity so the password itself never leaves
      your browser.
---

A password can satisfy every composition rule a signup form throws at it and still fall in milliseconds. This checker rates what you type by how *guessable* it is rather than by how many character types it contains — the same distinction the software an attacker runs actually makes.

## How to use

1. Type or paste into the **Password to test** field. Analysis starts on your first keystroke, after the zxcvbn dictionaries (~800 KB) finish loading — they are fetched once, then cached.
2. Read the segmented meter and the label beside it, which runs from *Very weak* through to *Strong*.
3. Compare the three stats below: guesses needed, the online-attack estimate (100 tries an hour), and the offline-attack estimate (10 billion tries a second).
4. Work through the warning and suggestions pane — it names the specific pattern pulling the score down.
5. Press **Show** to reveal the characters when you are checking a paste. Very long inputs are truncated to their first 72 characters before analysis, and a note tells you when that happens.

## How it works

zxcvbn does not count character sets. It tries to *rebuild* your password from the cheapest sequence of recognisable pieces — entries from about 236,000 dictionary words, names and leaked passwords, plus keyboard walks, dates, repeats, sequences and l33t substitutions. Each piece gets a guess count (roughly its rank in the relevant list), the counts multiply across the sequence, and small multipliers are added for tricks like capitalising the first letter or reversing a word. The cheapest decomposition wins, and its total guess count maps to a 0–4 score and to the two crack-time figures.

Take `dragonfly1qaz`. Counting characters, that is thirteen mixed-case-and-digit symbols and looks respectable. zxcvbn instead splits it into two pieces: `dragonfly`, an English dictionary word sitting a few thousand entries deep, worth roughly 7 × 10³ guesses; and `1qaz`, a diagonal walk down the left edge of a QWERTY keyboard, which its spatial matcher scores at around 10⁴ guesses. Multiply the pieces — 7 × 10³ × 10⁴ — and the whole password lands near 10⁸ guesses. The online stat still reads centuries, because 100 tries an hour is glacial; the offline stat clears 10⁸ in well under a second, which is why the meter refuses to glow green.

## Use cases & limitations

Reach for this when you want an honest read on a password you already have — one you invented and memorised, one a form is about to accept, or one you are teaching someone why to abandon. It is also a fast way to *see* why four random words beat a capitalised word with a digit stapled on.

Two limitations worth stating. The dictionaries are English-first: a word from another language may score higher here than its real-world resistance deserves, because zxcvbn does not hold that wordlist. And strength is not exposure — a password can be genuinely hard to guess yet already sit in a breach dump because it was reused. This tool knows nothing about that; check it with the [password leak checker](/tools/password-leak-checker/). If the verdict here is grim, the fastest fix is not a cleverer substitution but real randomness from the [password generator](/tools/password-generator/), or a memorable [passphrase](/tools/passphrase-generator/) for the few secrets you must keep in your head.

## Privacy note

The analysis runs entirely on your device. The zxcvbn library is bundled with the site and loaded into your browser; from your first keystroke onward, no network request carries what you type. Nothing is stored and there is no history — reload the page and the field is empty. If you would rather verify than trust, open the network tab inside your browser's developer tools and type a throwaway password: it stays silent.
