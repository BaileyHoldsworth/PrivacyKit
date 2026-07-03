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

<!-- content-pending: Phase C -->
