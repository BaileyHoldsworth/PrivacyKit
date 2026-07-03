---
name: Password Leak Checker
title: Password Leak Checker — Breach Exposure Test | PrivacyKit
description: Check whether a password has appeared in a known data breach. Only the first five characters of its SHA-1 hash reach Have I Been Pwned — k-anonymity.
category: privacy
keywords:
  - password leak
  - pwned password
  - password breach check
  - hibp
  - is my password leaked
icon: shield-search
related:
  - password-generator
  - password-strength-checker
  - hash-generator
  - browser-fingerprint
privacy: external-api
apiNote: >-
  Only the first 5 characters of your password's SHA-1 hash are sent to the
  Have I Been Pwned API (k-anonymity). The password itself never leaves your
  browser.
affiliateGroup: passwords
popular: true
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: Is it safe to type my real password into this checker?
    a: >-
      Yes, and the mechanism is worth understanding. Your password is hashed
      with SHA-1 inside your browser, and only the first five characters of
      that hash — a prefix shared by hundreds of thousands of other hashes —
      are sent to the Have I Been Pwned range API. The full password and full
      hash never leave the page. You can confirm it in your browser's network
      tab: the only request carries five hex characters.
  - q: How can it find my password in a breach without ever seeing it?
    a: >-
      It relies on a technique called k-anonymity. The API returns every
      leaked-hash suffix that begins with your five-character prefix — usually
      several hundred candidates — and the comparison against your actual hash
      happens locally in your browser. The server learns only that someone
      queried a hash in that bucket, never which one, and never the password.
  - q: My password was found in a breach — what should I do now?
    a: >-
      Treat it as burned. Change it on every account where you have reused it,
      starting with email and banking, and give each account its own unique
      password instead of one shared secret. A
      [password generator](/tools/password-generator/) makes a strong random
      one in a click. Breached passwords are dangerous because attackers feed
      exactly these lists into credential-stuffing tools.
  - q: The checker says my password wasn't found — does that mean it's safe?
    a: >-
      Not on its own. It means the password does not appear in the roughly one
      billion cracked hashes Have I Been Pwned has indexed. A brand-new weak
      password — a pet's name plus a year — can be absent from every breach
      list and still be guessed in seconds. Absence from known breaches is
      necessary but not sufficient; length and randomness are what actually
      make a password hard to crack.
  - q: What does the number next to a leaked password mean?
    a: >-
      It is the count of separate times that exact password has appeared across
      the breach corpora Have I Been Pwned aggregates. A password seen 40,000
      times sits in every attacker's first wave of guesses; even a count of one
      means it has leaked at least once, in plaintext or as a cracked hash.
  - q: Does this check whether my email address or account was breached?
    a: >-
      No. This tool checks the password value itself against known-leaked
      passwords — it never looks up an email, username, or account, and it is
      strictly for checking your own passwords. To see which breaches an email
      address turned up in, use Have I Been Pwned's separate email search on
      their own site.
---
<!-- content-pending: Phase C -->
