---
title: How Password Managers Work — and How to Choose One
description: A password manager is an encrypted vault unlocked by one master password. Here is the key-derivation maths behind it and how to pick one.
tools:
  - password-generator
  - password-strength-checker
relatedGuides:
  - password-entropy
  - diceware-passphrases
  - hibp-k-anonymity
affiliateGroup: passwords
updated: 2026-07-03
---

Most people picture a password manager as a fancy notebook: somewhere convenient to keep logins. Mechanically it is closer to a safe with one very specific lock. Everything you store goes inside an encrypted blob, and the only thing that opens it is a key derived from your master password. Nobody at the vendor holds that key. Understanding how that blob is protected — and how it fails — tells you exactly what to look for when choosing one.

## One master password, one derived key

A manager never stores your master password. When you type it, the app runs it through a *key-derivation function* (KDF) to produce the encryption key that unlocks the vault. That is the entire trust model, and it is deliberately one-directional: the KDF is expensive to run and impossible to reverse, so the key exists only for as long as the vault is open, and the master password itself is never written down anywhere.

This is what "zero-knowledge" means in practice. The vendor's servers hold an encrypted vault they cannot read, because deriving the key requires a secret they never receive. Sync a vault across your phone and laptop and the ciphertext travels; the master password does not. A subpoena, a rogue employee, or a server breach all hit the same wall — an opaque blob and no key.

The catch is that the whole scheme leans on two things you control: how unguessable your master password is, and how slow the KDF makes each guess. Neither is optional.

## What a vendor breach actually exposes

Assume the worst realistic case: an attacker steals the entire encrypted vault database. They now run an *offline* attack — no login form, no rate limit, just their own hardware chewing through master-password guesses. For each candidate they run the KDF, try to decrypt, and check whether the result is valid. The KDF's job is to make that loop punishingly slow.

Here is the arithmetic that decides the outcome. Suppose your master password is a four-word [Diceware passphrase](/guides/diceware-passphrases/) from the EFF long wordlist: 4 × 12.9 ≈ 51.6 bits, or about 3.3 × 10¹⁵ equally likely possibilities. The vault uses PBKDF2-HMAC-SHA256 at 600,000 iterations — the current OWASP recommendation. Each master-password guess therefore costs roughly 1.2 million SHA-256 compressions.

A high-end GPU manages on the order of 10 billion raw SHA-256 operations per second. Divide by the KDF cost:

```
guesses/sec per GPU = 10,000,000,000 / 1,200,000 ≈ 8,300
100-GPU rig         ≈ 830,000 master-password guesses/sec
half the keyspace   = 1.65 × 10¹⁵ guesses
time                = 1.65e15 / 8.3e5 ≈ 2.0 × 10⁹ sec ≈ 63 years
```

Sixty-three years of average effort on a serious rig to crack one vault. Now change one variable at a time and watch it collapse:

| Master password | KDF | Guesses to search half | Time on the 100-GPU rig |
| --- | --- | --- | --- |
| 4 Diceware words (~51.6 bits) | PBKDF2, 600k iters | 1.65 × 10¹⁵ | ~63 years |
| 4 Diceware words (~51.6 bits) | PBKDF2, 5,000 iters (legacy) | 1.65 × 10¹⁵ | ~5 days |
| 4 Diceware words (~51.6 bits) | Argon2id, 64 MiB | 1.65 × 10¹⁵ | centuries (GPUs lose their edge) |
| One common word + year (`Summer2024`) | PBKDF2, 600k iters | ~10⁴ | milliseconds |

Two lessons fall straight out of the table. A slow KDF buys you enormous margin — but only if the master password has real entropy behind it; against `Summer2024` the iteration count is irrelevant, because the attacker finds it in the first few thousand guesses. And the *type* of KDF matters: Argon2id is memory-hard, forcing each guess to touch tens of megabytes of RAM, which strips GPUs and custom ASICs of the parallelism that makes them cheap. PBKDF2 is fine at a high iteration count; Argon2id is better.

## Autofill is also a phishing check

The second thing a good manager does is refuse to type your password into the wrong place. Browser-integrated managers bind each saved login to a domain and will only offer to fill it on that exact origin. Land on `paypa1-secure.com` and the manager stays silent — not because it spotted the scam, but because the domain does not match `paypal.com`, so it has nothing to offer.

That silence is a genuine security signal. A human reading a convincing lookalike URL under time pressure often misses the swapped character; the string comparison behind autofill never does. It is one of the few phishing defences that works precisely *because* it is dumb and literal. The corollary: be suspicious whenever a manager that normally fills a site suddenly won't.

## How to choose one

The features that matter are unglamorous. In rough priority:

- **Published, independent security audits.** You want a recent third-party review of the actual cryptography and clients, not a "bank-grade security" banner. Reputable vendors link their audit reports directly.
- **KDF you can inspect and tune.** Check the defaults and confirm you can raise the iteration count or switch to Argon2id. Older accounts sometimes carry weak legacy parameters — re-save your master password after upgrading so new settings apply.
- **Open source, if you value verifiability.** Open clients let researchers confirm that the crypto matches the marketing. This is where the free, credible options live: **Bitwarden** (open source, audited, generous free tier and cross-platform sync) and **KeePassXC** (open source, fully offline, you own the vault file and sync it however you like) both cost nothing and hold up technically. Any paid manager should clear the bar these set, not just match their price.
- **Platform fit.** The best manager is the one you will actually use on every device, so browser extensions, mobile autofill, and biometric unlock on your hardware matter more than a long feature list.

Whatever you pick, the manager should be *generating* your other passwords, not just storing them. Let it produce a long random string per account so a single breach never spreads — and reserve one strong, memorable passphrase for the master password itself, since that is the one secret it cannot store for you.

## What to do next

If you are setting up a vault today, start with the master password. Build it from unrelated random words and pressure-test it in the [password strength checker](/tools/password-strength-checker/) before you commit it to memory — aim for the top band, since this is the one password an offline attacker gets to hammer. For every other login, hand the work to the [password generator](/tools/password-generator/) and let length do the heavy lifting; the [entropy maths](/guides/password-entropy/) explains why 20 random characters is effectively uncrackable. Once your accounts are migrated, run the important ones through a [breach check](/guides/hibp-k-anonymity/) to catch anything a reused old password already exposed.
