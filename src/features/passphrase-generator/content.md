---
name: Passphrase Generator
title: Passphrase Generator — EFF Diceware Words | PrivacyKit
description: Generate memorable diceware passphrases from the EFF long wordlist, locally in your browser. Pick 3-10 random words and see the exact entropy and crack time.
category: passwords
keywords:
  - passphrase
  - diceware
  - random words
  - memorable password
  - xkcd password
icon: vocabulary
related:
  - password-generator
  - password-strength-checker
  - pin-generator
  - username-generator
privacy: local
affiliateGroup: passwords
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: How many words should my passphrase have?
    a: >-
      Each word drawn from the 7,776-word list contributes log₂(7776) ≈ 12.9
      bits of entropy. Four words (~51.7 bits) is a reasonable floor for
      rate-limited online logins; five (~64.6 bits) is a comfortable default.
      For secrets an attacker could grind through offline — a password manager
      master password, disk encryption, an SSH key passphrase — use six or
      seven words (77.5–90.5 bits). The entropy and crack-time stats update
      as you move the slider, so you can watch what each extra word buys.
  - q: What is diceware?
    a: >-
      A method Arnold Reinhold published in 1995: roll five dice, read them as
      a five-digit number, and look up the matching word in a 7,776-entry list
      (6⁵ = 7,776). Repeat once per word. This tool keeps the same list size
      and per-word entropy but replaces the physical dice with your browser's
      `crypto.getRandomValues()`, which is just as uniformly random and
      considerably faster than rolling dice thirty times.
  - q: Aren't dictionary words easy to guess?
    a: >-
      Human-chosen words are; randomly drawn ones are not. An attacker who
      knows the exact wordlist, the word count and the separator still faces
      7776⁵ ≈ 2.8 × 10¹⁹ equally likely five-word combinations. The entropy
      figure this tool shows assumes the attacker knows everything about the
      method except the random draws themselves — that worst-case assumption
      (Kerckhoffs's principle) is what makes the number trustworthy.
  - q: Do capitalising words or appending a digit make it stronger?
    a: >-
      The digit does, a little — it is randomly chosen, so it adds log₂(10) ≈
      3.3 bits. Capitalising every word adds nothing, because it is a fixed
      transformation an attacker applies for free. Both options exist mainly
      to satisfy "must contain an uppercase letter and a number" composition
      rules. When you want real strength, add a word: each one is worth 12.9
      bits, roughly four appended digits.
  - q: Which wordlist does this tool use?
    a: >-
      The [EFF long wordlist](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases)
      (CC-BY 3.0), published by the Electronic Frontier Foundation in 2016 as
      a friendlier replacement for the original diceware list — 7,776 words
      with no profanity or obscure vocabulary, and a unique three-character
      prefix per word so autocomplete can finish your typing. We bundle it
      with the site; your browser fetches the list once from our server, and
      which words you actually draw never leaves your device.
  - q: Which separator should I pick?
    a: >-
      Whichever the destination accepts. Spaces are the classic diceware
      choice, but some password fields trim or reject them; hyphens and dots
      work nearly everywhere. The separator does not change the entropy — it
      is a fixed, visible part of the format, not a secret. If you choose
      "none", turn on capitalisation so the word boundaries stay readable.
  - q: When is a passphrase better than a random password?
    a: >-
      When a human has to remember it or type it by hand — a master password,
      an operating-system login, a Wi-Fi key you read out to guests.
      Something like `arming-economist-oblivion-seclusion-undated` is far
      easier to memorise and type than 20 characters of line noise, at
      comparable strength. For credentials a password manager stores and
      fills, a [random password](/tools/password-generator/) packs more
      entropy per character.
---

<!-- content-pending: Phase C -->
