---
name: Username Generator
title: Username Generator — Random Name Ideas | PrivacyKit
description: >-
  Generate random username ideas in your browser: seed an optional keyword,
  pick a style — adjective+noun, numbers, leetspeak or two words — and click
  to copy.
category: passwords
keywords:
  - username
  - username ideas
  - random username
  - handle generator
  - gamertag
icon: user
related:
  - password-generator
  - passphrase-generator
  - uuid-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Does this check whether a username is taken?
    a: >-
      No — everything happens on your device and no site is contacted, so
      there is no availability lookup. That is a deliberate trade-off: an
      availability checker would have to send every candidate name to
      third-party platforms, which leaks the handles you are considering.
      Generate a shortlist here, then test the one you like directly on the
      platform's signup form.
  - q: How does the keyword field change the results?
    a: >-
      The keyword is folded into every name in the batch: it becomes the
      second half in adjective+noun style (keyword "wolf" gives names like
      *AtomicWolf*), the base of noun+number (*wolf2537*), and the first word
      in two-words (*wolf_nomad*). Input is sanitised to lowercase letters
      and digits — spaces, symbols and emoji are stripped — and capped at 24
      characters. If nothing survives sanitising, the generator says so and
      falls back to fully random words.
  - q: What exactly does the leetspeak-lite style substitute?
    a: >-
      It applies the classic map a→4, e→3, i→1, o→0, s→5, t→7 to a random
      selection of eligible letters — always at least one — so *silentbison*
      might come out as *sil3n7bison*. The first character is left alone
      because some platforms reject usernames that start with a digit. The
      substitutions differ on every run, so regenerate until one reads well.
  - q: How random are the generated names?
    a: >-
      Every choice — word, number, and which letters get leet-substituted —
      is drawn with `crypto.getRandomValues()` using rejection sampling, the
      same unbiased method our password generator uses. The bundled wordlists
      hold 60 adjectives and 60 nouns, so adjective+noun has 3,600 possible
      combinations and noun+number about 599,400. Plenty for picking a
      handle, but nowhere near enough for a secret: usernames are public by
      design, so never reuse one as a password.
  - q: Why not just use my real name or birth year as a username?
    a: >-
      Because a handle follows you across every site you register it on. A
      username containing your surname or birth year hands anyone who sees a
      comment, a review or a leaked account list two direct identifiers, and
      search engines make joining those dots trivial. A random handle severs
      that link — and using a *different* random handle per site stops your
      accounts being correlated with each other.
  - q: Can I use a generated username on any platform?
    a: >-
      Mostly. The output uses only letters, digits and — in two-words style —
      an underscore, which nearly every service accepts. Length is the more
      common snag: adjective+noun pairs run up to 16 characters, and a long
      keyword can push past the 15-character cap some platforms enforce. If a
      name is rejected, shorten the keyword or switch to noun+number style.
---

A handle should be disposable. The point of a generator like this is to hand you a shortlist to pick from — a dozen readable candidates in one click — rather than one "perfect" name you spend twenty minutes inventing. Feed it a word you like or leave it blank, choose a shape, and skim the batch for one that reads well.

## How to use

1. Optionally type a **keyword** — letters and digits only, anything else is stripped — and it gets woven into every name in the batch.
2. Choose a **style** from the dropdown: adjective + noun, noun + number, leetspeak-lite, or two words joined by an underscore.
3. Drag the **Names per batch** slider to ask for anywhere from 5 to 20 candidates at once.
4. Click **Generate usernames**. The list also refreshes on its own whenever you change the keyword, style, or count, so you can browse without pressing the button each time.
5. Click any name (or its **Copy** button) to copy it, or use **Copy all** to grab the whole batch, one name per line.

## How it works

Two curated wordlists ship with the tool — 60 adjectives and 60 nouns, all lowercase with no overlap — and each style assembles a name from them by a fixed recipe. Adjective + noun capitalises one word from each list (`GildedOsprey`); noun + number appends a random suffix between 10 and 9999 to a noun (`kestrel4820`); two words joins two picks with an underscore (`arctic_lagoon`); and leetspeak-lite builds an adjective + noun string, then rewrites some of its letters as digits.

Take leetspeak-lite with the keyword left empty. The generator draws two words — say **quantum** and **gecko** — and concatenates them into `quantumgecko`. It then scans left to right for letters in its substitution map (a→4, e→3, i→1, o→0, s→5, t→7), skipping position 0 so the name never starts with a digit. Here the eligible letters are the *a*, the *t*, the *e*, and the trailing *o*. A random subset — always at least one — is swapped: flip the *a* and the *e* and the result is `qu4ntumg3cko`. Run it again and a different subset changes, so the same two words can surface several distinct spellings.

Every pick — which word, which number, which letters get substituted — comes from `crypto.getRandomValues()` with rejection sampling, the same unbiased draw our [password generator](/tools/password-generator/) uses. Each batch is de-duplicated through a set, so you never see the same name twice in one list.

## Use cases & limitations

Signup forms are the obvious case — you want a handle that is not your real name or email — a gaming tag, a forum or marketplace account, a throwaway login. Using a *different* generated handle on each site also keeps those accounts from being trivially linked back to one person.

The honest limitation is the size of the pools. Adjective + noun has only 3,600 possible base combinations, so two people can easily land on the same one, and the tool has no way to tell you whether a name is already taken — treat the output as a starting point, then check it on the platform itself. If what you actually need is a guaranteed-unique machine identifier rather than a human-readable handle, generate a [UUID](/tools/uuid-generator/) instead. And if a name has to be *memorable* — spoken aloud, typed from memory — a [passphrase](/tools/passphrase-generator/) reads more naturally than a leetspeak string.
