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
A password can be long, mixed-case, and studded with symbols and still be worthless the moment it turns up on a breach list, because attackers no longer have to guess it — they already have it. This tool answers one narrow question: has the exact password you type ever been seen in a known breach? It does that without the password, or even its full hash, ever leaving your browser.

## How to use

1. Type the password you want to test into the field. Nothing is transmitted while you type.
2. Press **Show** if you want to read it back and confirm you entered it correctly — the toggle flips the field between hidden and plain text.
3. Press **Check this password** (or hit Enter in the field). Each check is a deliberate action, so casual typing never fires a network call.
4. Read the result: a green **Not found** badge, or a red **Found in known breaches** badge with the number of times that password has appeared across the indexed corpora.

## How it works

The tool leans on the *range* endpoint of the Have I Been Pwned Pwned Passwords service and a technique called k-anonymity, so the server can confirm a match while learning almost nothing.

The moment you press Check, your browser computes the SHA-1 hash of the password locally via `crypto.subtle.digest`, then splits the 40-character hex digest into a 5-character prefix and a 35-character suffix. Only the prefix travels over the network, to `api.pwnedpasswords.com/range/<prefix>`. The response is a list of every leaked-hash suffix that shares that prefix — typically several hundred to a thousand of them — each followed by a colon and a breach count. Your browser scans that list for your suffix and reads off the count. A request header of `Add-Padding: true` mixes in zero-count decoy lines, so an eavesdropper cannot infer a hit from the response size.

Take the password `Tandem-Otter-59`. Its SHA-1 digest is `9E3171288BC0333A2E68D1A7536D9447C8385282`. The tool sends only the prefix `9E317`; the suffix `1288BC0333A2E68D1A7536D9447C8385282` stays in the page and is matched against the returned bucket. The server sees a five-hex-character query that belongs to hundreds of thousands of unrelated hashes and never learns which one you asked about. If you want to watch the digest itself get built, the [hash generator](/tools/hash-generator/) runs the same SHA-1 in the open.

## Use cases & limitations

The obvious moment to reach for this is right after a breach headline, or when auditing a password you have quietly reused for years and half-suspect is compromised. It is also a fast sanity check on a candidate password before you commit to it: a string that already sits in the corpus is a string attackers will try first.

The result is a floor, not a verdict. A **Not found** badge means only that the password is absent from the roughly one billion cracked hashes the service has indexed — a freshly invented weak password (a street name plus a birth year) can pass this check and still fall to a dictionary attack in seconds. For that judgement, run it through the [password strength checker](/tools/password-strength-checker/), which scores length and predictability rather than breach history. And note the scope: this looks up the password *value* only, never an email address or account.

If a password comes back **Found**, retire it everywhere and mint a unique replacement with the [password generator](/tools/password-generator/).

## Privacy note

Your password and its complete SHA-1 hash never leave your device. The single thing sent over the network is the first five hexadecimal characters of that hash — a prefix so broad it maps to a vast crowd of unrelated passwords — and it goes only to the Have I Been Pwned range API. The full-hash comparison happens locally, so the match is decided in your browser, not on their server. You can prove all of this yourself: open your browser's network tab, run a check, and confirm the only outbound request carries five characters.
