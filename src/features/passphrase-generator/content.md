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

## How to use

1. Drag the **Words** slider to set how many words the phrase holds. It sits at five by default; the range runs from three to ten.
2. Choose a **Separator** from the dropdown — hyphen is preselected because most password fields accept it. Space, dot, or none are the alternatives.
3. Tick **Capitalise each word** or **Append a digit** if a site demands an uppercase letter or a number. Leave both off when nothing forces them.
4. Press **Generate new passphrase** to draw a fresh set of words. One appears the moment the page loads, and any change to the slider, separator, or checkboxes redraws immediately.
5. Use the **Copy** button above the output, then read the **Entropy** and **Offline crack time** stats below to confirm the phrase is strong enough for where it's going.

## How it works

The first time you generate, the browser fetches the EFF long wordlist — 7,776 words — and caches it for the rest of the page's life. For each word position, the tool asks `crypto.getRandomValues()` for a uniformly random index into that list and reads out the word there. The words are joined with your chosen separator; a capital or trailing digit is layered on afterwards if you asked for one.

Strength is pure arithmetic, not a heuristic. Because every word is an independent, uniform draw from 7,776 options, each contributes log₂(7776) ≈ 12.9 bits. A five-word phrase therefore carries 5 × 12.9 ≈ 64.6 bits, meaning the process could have produced 7776⁵ ≈ 2.8 × 10¹⁹ equally likely results.

Worked through with real output: suppose the generator hands you `marmalade-cranberry-hubcap-antler-glacier`. Five words, hyphen-separated, no digit — 64.6 bits. The crack-time stat then assumes an offline attacker grinding 10¹⁰ guesses per second and reports the *average* hit, half the keyspace: 2⁶⁴·⁶ ÷ 2 ÷ 10¹⁰ seconds, which rounds to roughly 45 years. Slide up to six words and that same figure jumps past a thousand centuries, because each word multiplies the keyspace by 7,776.

## Use cases & limitations

This is the tool to reach for when a person, not a machine, has to hold the secret: a password-manager master password, a laptop or full-disk-encryption login, a Wi-Fi key you'll read aloud to a house guest, an SSH key passphrase. A run of ordinary words is far kinder to human memory and to phone keyboards than an equivalent block of random symbols, at the same or better entropy.

Two honest limits. First, length is the cost of memorability — a 64-bit passphrase is around forty characters of typing, where a [random password](/tools/password-generator/) reaches the same strength in a dozen. For anything a password manager stores and fills for you, the shorter password wins on every axis except recall. Second, the wordlist is fetched over the network the first time you generate, so a cold page with no connection can't produce a phrase; once loaded, everything runs locally. If you only need a short numeric code rather than words, the [PIN generator](/tools/pin-generator/) is the better fit, and you can pressure-test any phrase you settle on with the [password strength checker](/tools/password-strength-checker/).

## Privacy note

Only the wordlist itself crosses the network, and only once — your browser downloads the 7,776-word file from our server the same way it downloads the page. Which words you actually draw is decided on your device by `crypto.getRandomValues()` and written straight into the output box. No passphrase, no slider position, and no copy action is ever transmitted, logged, or stored. Open your browser's network tab and generate as many phrases as you like: after that first wordlist fetch, you'll see nothing leave.
