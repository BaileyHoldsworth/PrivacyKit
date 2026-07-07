---
name: Bcrypt Generator & Verifier
title: Bcrypt Generator & Verifier — Hash & Check | PrivacyKit
description: Hash a string with bcrypt at an adjustable cost from 4 to 15, then verify any plaintext against an existing bcrypt hash. Everything runs in your browser.
category: crypto
keywords:
  - bcrypt
  - bcrypt generator
  - bcrypt hash
  - bcrypt verify
  - password hash
icon: lock
related:
  - hash-generator
  - hmac-generator
  - password-strength-checker
  - password-generator
privacy: local
affiliateGroup: passwords
popular: false
updated: 2026-07-07
jsonLdCategory: SecurityApplication
faqs:
  - q: What does the cost factor actually control?
    a: >-
      The cost — also called the work factor or rounds — sets how many
      key-expansion iterations bcrypt performs: 2^cost of them. Cost 10 means
      2¹⁰ = 1,024 iterations; cost 11 doubles that to 2,048, and each further
      step doubles it again. A higher cost makes every hash slower to compute,
      which is the entire point: it slows an attacker by the same factor. On a
      typical laptop cost 12 takes a few hundred milliseconds in this browser
      build, and the tool reports the real elapsed time after each hash so you
      can pick a cost your login flow can afford.
  - q: Why do I get a different hash every time for the same input?
    a: >-
      bcrypt generates a random 16-byte salt for every hash and stores it inside
      the output — the characters straight after the `$2b$<cost>$` prefix are
      that salt. Because the salt differs on each run, the 60-character result
      differs too, even for identical input. Verification still works because
      the salt travels with the hash: to check a candidate, bcrypt reads the
      salt out of the stored hash and re-runs the algorithm with it.
  - q: Can I decrypt or reverse a bcrypt hash?
    a: >-
      No. bcrypt is a one-way password hashing function, not encryption — there
      is no key that turns the hash back into the original string. The only way
      to test a guess is to hash it with the same salt and cost and compare,
      which is exactly what the Verify tab does. That one-way property is why a
      leaked bcrypt hash is far less dangerous than a leaked plaintext or a
      reversibly-encrypted secret.
  - q: Is there a length limit on what I can hash?
    a: >-
      Yes — bcrypt only uses the first 72 bytes of the input and silently
      ignores the rest. For most passwords that never matters, but a long
      passphrase, or text with multibyte characters (which take 2–4 bytes each
      in UTF-8), can hit the limit, so two different long inputs that share a
      72-byte prefix produce the same hash. The tool flags any input over 72
      bytes so the truncation is never a surprise.
  - q: Should I hash my users' passwords in the browser like this?
    a: >-
      No — do password hashing on your server. Anything running in the browser
      is visible to and controllable by the client, so a hash computed here
      could simply be replayed as-is; the server has to hash the password it
      receives itself. This tool is for learning how bcrypt behaves, measuring a
      cost's timing on your own hardware, or checking a hash you already hold —
      not for production authentication.
  - q: What do the $2a$, $2b$ and $2y$ prefixes mean?
    a: >-
      They are bcrypt version tags. `$2a$` was the original; `$2y$` came out of
      a PHP fix for a sign-extension bug; `$2b$` is the current corrected
      version that most libraries emit today, and it is what this tool produces.
      All three share the format `$<version>$<cost>$<22-char salt><31-char
      hash>`, and the Verify tab accepts any of them, so a hash your backend
      wrote as `$2a$` or `$2y$` still checks correctly here.
---

<!-- content-pending: round2 content -->
