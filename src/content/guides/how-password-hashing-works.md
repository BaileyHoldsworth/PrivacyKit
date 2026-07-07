---
title: "How Password Hashing Works: Bcrypt, Salts and Work Factors"
description: Why login systems store one-way hashes instead of passwords, why MD5 and SHA-256 are too fast, and how bcrypt's salt and cost factor work, read apart byte by byte.
tools:
  - bcrypt-generator
  - hash-generator
  - password-strength-checker
relatedGuides:
  - password-entropy
  - csprng-vs-math-random
  - hibp-k-anonymity
affiliateGroup: passwords
updated: 2026-07-07
---

A login system never needs to know your password. At sign-in it answers one question: does the string this person just typed match the one they registered with? That gap — checking a match versus holding the secret — is the entire reason password hashing exists, and it is why a well-built service can lose its whole user table and still not hand over a single usable password. This guide follows that idea from the top, ending with a real bcrypt string pulled apart field by field.

## Store the verifier, not the secret

Hashing runs your password through a one-way function: easy to compute forwards, computationally hopeless to reverse. Registration keeps only the result. Every later login hashes the incoming attempt the same way and compares the two; equal hashes mean the passwords matched, and the plaintext is discarded within milliseconds.

Contrast that with encryption, which many people reach for by instinct and which is the wrong tool here. Encryption is reversible by design — a key turns ciphertext back into the original — so an encrypted password store is only as safe as the key sitting beside it. A hash has no key and no inverse. When the database leaks, and databases do leak, the attacker holds a column of fingerprints rather than a column of passwords; their only move is to guess a candidate, hash it, and check for a collision. Password hashing does not stop a breach. It decides what a breach is worth.

## Speed is the enemy

The instinct after "use a hash" is to grab a familiar one: MD5, or SHA-256 from the [hash generator](/tools/hash-generator/). Those are excellent for the job they were built for — fingerprinting a file, verifying a download — and that job rewards raw speed. Speed is exactly the property you do not want under a password.

Picture the attacker holding your leaked table. No login form throttles them and no lockout applies; they run offline on their own hardware, testing guesses as fast as the hash allows. A modern GPU chews through fast hashes at a rate that turns "slow to compute" into a defence:

| Hash function | Design goal | Rough guesses/sec, one GPU |
| --- | --- | --- |
| MD5 | Fast checksum | ~10¹¹ – 10¹² |
| SHA-256 | Fast digest | ~10¹⁰ |
| bcrypt (cost 12) | Deliberately slow | a few thousand |
| Argon2id (tuned) | Slow and memory-hard | a few hundred |

Read the gap between rows one and three: seven or eight orders of magnitude, bought purely by choosing a function that is expensive to evaluate. That is the family you want for passwords — *adaptive* hashes, slow on purpose and tunable so they can be made slower as hardware improves. Three are worth knowing. bcrypt repeats the key-setup step of the Blowfish cipher many times over; scrypt and Argon2 go further and are *memory-hard*, forcing each guess to occupy a large slab of RAM so the GPU and ASIC advantage falls away. Argon2id is the first choice for new systems; bcrypt remains a sound, universally supported option where Argon2 is not on the table.

## What the salt buys you

Slowing each guess is half the design. The other half stops an attacker doing the work once and reusing it — the salt's job. A salt is a random value, unique per password, mixed in before hashing and stored in the clear beside the result. It changes nothing for the legitimate check — the salt travels with the hash, so verification reads it back — but it wrecks two attacker shortcuts at once.

The first is precomputation. Attackers historically built *rainbow tables*: enormous precomputed maps from hash back to plaintext for every common password, cracking an unsalted database in a single pass. A unique salt makes such a table worthless — the attacker would need a separate one per salt value, the same as doing no precomputation at all.

The second is the free win of reused passwords. Without a salt, two users who chose the same password produce byte-identical hashes, so cracking one cracks both, and the table itself reveals exactly who reused what. Salting severs that link. Here is one password hashed twice by bcrypt, each run drawing a fresh salt:

```
$2b$12$LkuY9p4V6DQoIcUt4RDlSeXBxw7GaB/QMatS9NGWDPoOSNOfNfkG2
$2b$12$r9RBWaKxUDzmra4iMQIsuOVXEZD/ciS5LUq1hzIFMyWDQDRlcgFui
```

Same input, two unrelated-looking outputs. bcrypt's salt is 16 bytes — 128 bits — drawn from the operating system's cryptographic random source, not a language's ordinary number generator. That distinction carries real weight, and it is unpacked in [Math.random() versus a real CSPRNG](/guides/csprng-vs-math-random/).

## The cost factor, and raising it over time

bcrypt's slowness is not fixed; it is a dial called the *cost* or *work factor*. The cost sets how many times bcrypt repeats its internal key-setup step: 2^cost iterations. Each step up the dial doubles the work.

| Cost | Iterations (2^cost) | Illustrative time, native library |
| --- | --- | --- |
| 8 | 256 | ~15 ms |
| 10 | 1,024 | ~60 ms |
| 12 | 4,096 | ~230 ms |
| 14 | 16,384 | ~940 ms |

Those timings come from one machine and a native library; your own numbers will differ, and a pure-JavaScript browser build runs several times slower again. The shape is what matters: each cost point roughly doubles the time, for you *and* the attacker in lockstep. Pick the highest cost your login flow can absorb, measured on the hardware that will do the real hashing — a common target is around 250 ms per hash, slow enough to punish bulk guessing, fast enough that a real sign-in feels instant.

Because the cost lives inside every hash, you are never locked in — which is the point of the word *adaptive*. Raise the default for all new and changed passwords, and for existing users, transparently re-hash at the higher cost the next time they sign in successfully (you hold their plaintext for that instant anyway). The stored work factor then drifts upward to track hardware gains without ever forcing a reset.

## Anatomy of a $2b$ string

A bcrypt hash is not an opaque blob. It is a structured record, always 60 characters, packing four fields into one line so verification needs nothing stored on the side:

```
$2b$12$T5Ny94eaMCnbyPUdadoBXO8VqNUjBG1072SaZS/8Bg1l95gjRbB2G
└┬┘ └┬┘ └──────────┬──────────┘└───────────────┬─────────────┘
 │   │             │                            │
 │   │             │                            └ digest, 31 chars
 │   │             └ salt, 22 chars
 │   └ cost factor
 └ version tag
```

The dollar signs are delimiters. The leading `2b` is a version tag: `2a` was the original scheme, `2y` came out of a PHP fix for a sign-extension bug, and `2b` is the corrected version most libraries emit today. The two digits after it are the cost. The remaining 53 characters split into the salt and the digest, both written in bcrypt's own base64 alphabet — not the standard one, so an ordinary base64 tool will misread it. The 22-character salt encodes those 16 random bytes; the 31-character digest encodes the 23-byte output bcrypt derives from the salt, the cost and your password together.

## Reading a real hash apart

Take the password `winter-tandem-Reef-58`, hashed by bcrypt at cost 12. The output is the line above; here is every field it contains:

| Field | Value | Meaning |
| --- | --- | --- |
| Version | `2b` | Current bcrypt variant |
| Cost | `12` | 2¹² = 4,096 key-setup iterations |
| Salt (22 chars) | `T5Ny94eaMCnbyPUdadoBXO` | The 16 random bytes, encoded |
| Digest (31 chars) | `8VqNUjBG1072SaZS/8Bg1l95gjRbB2G` | Hash of password + salt + cost |

To verify a login attempt, bcrypt needs no separate salt column and no stored note of the cost. It reads `12` and `T5Ny94eaMCnbyPUdadoBXO` out of the record, hashes the candidate with exactly those parameters, and checks the result against `8VqNUjBG1072SaZS/8Bg1l95gjRbB2G`. The right password makes the digests match; `winter-tandem-Reef-59` lands somewhere unrelated through the hash's avalanche effect, so the check fails. Salt and cost are ingredients, not secrets — they sit in plain view because knowing them buys an attacker nothing without also guessing the password.

## Putting it into practice

Three things follow, all server-side. Reach for a maintained library — bcrypt, or better yet Argon2id — rather than assembling primitives yourself; the failure modes here are quiet and expensive. Set the cost by timing it on production hardware, and revisit that choice every couple of years. And mind bcrypt's quirks: it hashes only the first 72 bytes of input and ignores the rest, a real trap for long passphrases and multibyte text, so pre-hash the input or move to Argon2 if that bites.

What hashing cannot do is rescue a bad password. A slow, salted hash buys enormous time against a *strong* one, but the attacker still tries the obvious candidates first, and `Summer!23` falls in the opening moments whatever function guards it. Hashing protects the database; password choice protects the account. Rate a candidate honestly with the [password strength checker](/tools/password-strength-checker/), and see why length beats decoration in [how password entropy actually works](/guides/password-entropy/). The surest fix on the user side is to stop choosing passwords by hand — a manager such as the open-source Bitwarden or KeePassXC emits a long random string per account, exactly the input where a strong hash earns its keep.

## What to do next

You can watch every part of this in the [bcrypt generator and verifier](/tools/bcrypt-generator/): hash a string, drag the cost slider and read the real elapsed time climb as you double it, then split the 60-character output into version, cost, salt and digest yourself. Run one password through twice and confirm the salt makes each result differ. Treat it as a learning and testing bench, though — real authentication belongs on your server, because anything computed in the browser can be inspected and replayed by whoever holds the page. The tool makes the mechanism legible; a login system is where you put it to work.
