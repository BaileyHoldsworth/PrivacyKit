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

<!-- content-pending: Phase C -->
