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

## How to use

1. The tool opens on the **Hash** tab. Type or paste your string into **String to hash** — if it runs past 72 bytes a note appears, because bcrypt only reads that far.
2. Set the **Cost factor** slider anywhere from 4 to 15. The label recalculates live, so cost 13 reads as 8,192 rounds.
3. Press **Generate hash**. A percentage ticks upward while it runs, then the status line reports the cost and the real elapsed time — for instance "Hashed at cost 13 in 640 ms".
4. Use **Copy** above the output to grab the 60-character result.
5. To check an existing hash, switch to the **Verify** tab, paste the plaintext and the hash, and press **Verify**. A badge shows Match or No match alongside the cost it read out of the hash.

## How it works

bcrypt is an adaptive hash built on the key schedule of the Blowfish cipher. The expensive part is deliberate: setting up a Blowfish key normally happens once, but bcrypt repeats that setup 2^cost times, folding the salt and your string back in on every pass. Doubling the cost therefore doubles the work — and a routine that is instant to run once becomes punishing to run a few billion times.

Here is one pass. Take the string `violet-otter-Cove-9` at cost 12. The tool draws 16 random bytes from the browser's CSPRNG through a single audited helper — the same source explained in our [CSPRNG vs Math.random guide](/guides/csprng-vs-math-random/) — encodes them into a 22-character salt, and hands both to bcryptjs. Because the salt is random, the 60-character output differs on every run, such as:

```
$2b$12$Qw8Zl3Rk9fBxY0uVsC2aOe7pM1nD4hT6gJ5kL0rS3vU8wX2yZ1bCk
```

Split it into four parts: `$2b$` is the version tag, `12` is the cost, the next 22 characters (`Qw8Zl3Rk9fBxY0uVsC2aOe`) are the salt, and the final 31 (`7pM1nD4hT6gJ5kL0rS3vU8wX2yZ1bCk`) are the digest. Salt and digest are carried together, which is how the Verify tab re-runs the algorithm without you supplying either by hand.

## Use cases & limitations

You'll want this while learning how bcrypt behaves, timing a cost factor on your own hardware before you commit to it in a login flow, or checking a hash you already hold — one lifted from a database export or a seed file — against a plaintext you suspect produced it. If instead you want a fast, unsalted digest of a file or message (the opposite design goal), use the [hash generator](/tools/hash-generator/); to score a candidate before you hash it, the [password strength checker](/tools/password-strength-checker/) rates it, and the [password generator](/tools/password-generator/) makes a fresh secret worth hashing.

Two limitations are worth stating plainly. This build runs bcryptjs, a pure-JavaScript implementation slower than the native bcrypt on a server, so read the reported timings as a feel for how cost scales rather than the exact figures you will meet in production — measure your final cost on the machine that will do the real hashing. And bcrypt is showing its age: it is heavy on CPU but light on memory, which leaves it cheaper to attack with GPUs and ASICs than a memory-hard design. For new systems, Argon2id or scrypt hold up better against that hardware; bcrypt stays a sensible, widely-supported choice where they are not on the table.

## Privacy note

Everything you type stays on your device. Hashing and verifying run in your browser through bcryptjs, which ships as part of PrivacyKit itself — on your first hash or verify the browser fetches that code file (not your input) from our own origin, and after that nothing you enter is transmitted anywhere. The salt is generated by your browser's secure random source, no hash is written to storage, and no server ever receives the string or the digest. One caveat: a bcrypt hash is not an encrypted vault. Hand someone the hash and they can run offline guesses against it, so treat the output as sensitive even though it cannot be reversed directly.
