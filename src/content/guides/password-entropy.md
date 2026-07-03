---
title: How Password Entropy Actually Works
description: Entropy measures the process that produced a password, not the string itself. Here is the log₂ maths, a worked example, and realistic GPU crack rates.
tools:
  - password-generator
  - password-strength-checker
relatedGuides:
  - diceware-passphrases
  - csprng-vs-math-random
  - how-password-managers-work
updated: 2026-07-03
---

Entropy is the single most misunderstood word in password advice. People treat it as a score baked into the characters — as if `X` somehow carries more of it than `a`. It doesn't. Entropy is a property of the *process* that produced the password, measured in bits, and it only means something once you know how the string was chosen. A password picked by rolling dice and one typed by a human trying to look random can print the same characters yet have wildly different entropy, because the quantity being measured is how many equally likely outcomes the generator could have produced.

## What a bit of entropy actually counts

One bit doubles the number of possibilities an attacker has to work through. Two bits quadruple it. Formally, if a process picks uniformly at random from `N` equally likely options, its entropy is log₂(N) bits. Flip that around: `H` bits means 2ᴴ possible outcomes, each equally probable.

For a password built by choosing every character independently and uniformly from a pool of `P` symbols, across a length of `L` characters, the total works out to:

```
H = L × log₂(P)
```

The per-character term log₂(P) is fixed by the pool you draw from. That is where the common character sets land:

| Character pool | Size (P) | Bits per character log₂(P) |
| --- | --- | --- |
| Digits only | 10 | 3.32 |
| Lowercase letters | 26 | 4.70 |
| Lower + digits | 36 | 5.17 |
| Mixed-case letters | 52 | 5.70 |
| Alphanumeric | 62 | 5.95 |
| All printable ASCII | 94 | 6.55 |

Multiply the right-hand column by the length and you have the entropy of the whole password — *provided* every character really was chosen at random. That proviso is the entire game, and it is where the [password strength checker](/tools/password-strength-checker/) earns its keep: it estimates guessability for passwords a human chose, where the naive `L × log₂(P)` formula badly overstates the real figure.

## A worked example

Take a password the [password generator](/tools/password-generator/) might hand you: `q7#Kp2wRmZ9x`. Twelve characters, drawn from all four sets — a 94-symbol pool. Its entropy is:

```
H = 12 × log₂(94)
  = 12 × 6.5546
  ≈ 78.7 bits
```

So the generator could have produced roughly 2⁷⁸·⁷ ≈ 4.9 × 10²³ different passwords, each equally likely. Notice what we did *not* do: we never inspected the string for repeated letters or judged how messy it looks. The 78.7 figure describes the generator, and it applies to `q7#Kp2wRmZ9x` only because we know that string came out of a uniform 94-way draw. Type those same twelve characters by hand while "trying to be random" and the number becomes fiction — human choices cluster, and attackers model the clustering.

Compare a five-word [Diceware passphrase](/guides/diceware-passphrases/) built from the 7,776-word EFF list. Each word contributes log₂(7776) = 12.9 bits, so five words give 64.6 bits — fewer than our twelve-character string, but far kinder to type and recall. Length is the lever on both sides.

## Why Tr0ub4dor loses to length

The famous `Tr0ub4dor&3` pattern — take a dictionary word, capitalise the first letter, swap a couple of letters for lookalike digits, and bolt a symbol and a number onto the end — *looks* like it ought to score well. Eleven characters, all four sets present. But entropy tracks the process, and this process reads: pick one common word (a few thousand realistic options), apply substitutions every cracking ruleset already knows, append a predictable suffix. XKCD's estimate for that construction is roughly 28 bits.

At 28 bits there are only 2²⁸ ≈ 2.7 × 10⁸ possibilities. Four genuinely random common words — the punchline of that same comic — sit near 44 bits, and our generated twelve-character string reaches 78.7. The lesson isn't that symbols are useless. It is that a symbol added by a rule an attacker can predict adds almost nothing, whereas each extra *randomly chosen* character adds its full log₂(P) bits. Real randomness spread across more length beats decoration bolted onto a memorable base word, every time.

## Bits only matter against a guess rate

Entropy tells you the size of the haystack. Turning that into a time depends entirely on how fast the attacker can test guesses, and that splits into two very different worlds.

**Online attacks** run against a live login form. The server rate-limits, locks accounts and inserts delays, so a realistic ceiling sits between 10 and a few hundred guesses per hour. Against that, even a middling 40-bit password is untouchable: 2⁴⁰ guesses at 100 per hour runs past a billion years.

**Offline attacks** are what entropy budgets are really sized for. Here the attacker has stolen a database of password hashes and cracks it on their own hardware, with no rate limit at all. The rate then hinges on the hash function:

| Hash function | Rough guesses/sec (single high-end GPU) |
| --- | --- |
| MD5 / NTLM (unsalted, fast) | ~10¹¹ – 10¹² |
| SHA-256 (unsalted) | ~10¹⁰ |
| bcrypt (cost 12) | ~few thousand |
| Argon2id (tuned) | ~hundreds |

A rack of GPUs pushes the fast-hash figures higher again. Put our 78.7-bit password against a rig managing 10¹⁰ guesses per second on a fast hash. On average the attacker succeeds after searching half the keyspace:

```
(2^78.7 / 2) ÷ 10^10 guesses/sec
  ≈ 2.45 × 10^23 ÷ 10^10
  ≈ 2.45 × 10^13 seconds
  ≈ 780,000 years
```

Run the identical sum on the 28-bit `Tr0ub4dor` construction: (2²⁸ / 2) ÷ 10¹⁰ ≈ 0.013 seconds. It falls before you have finished reading its entropy estimate. Same attacker, same hardware — the only variable that moved was bits. This is also why the hash matters as much as the password: a slow function like Argon2id drops that 10¹⁰ rate to a few hundred, buying weak passwords orders of magnitude they didn't earn.

## The complexity-rule myth

"Must contain an uppercase letter, a number and a symbol" is a rule about which character *types* appear, not about how unpredictable the result is. It cannot tell `P@ssw0rd1` — which every cracking wordlist tries inside its first million guesses — apart from a truly random string of the same shape. NIST's current guidance discourages mandatory composition rules for exactly this reason and points to length plus blocklists of known-breached passwords instead. A policy that rejects `correcthorsebatterystaple` for lacking a symbol while waving through `Summer2026!` is measuring the wrong thing.

Two habits fall out of all this. First, budget in bits rather than character classes: aim for 70 or more on anything that could be attacked offline — vault master passwords, disk encryption, Wi-Fi — and length gets you there cheaply. Second, only trust an entropy number when the randomness behind it is real, which means a machine made the choices, not your imagination. That guarantee comes down to the random source, covered in [why Math.random() can't make passwords](/guides/csprng-vs-math-random/).

## What to do next

Generate a fresh password with the [password generator](/tools/password-generator/) and watch its entropy figure climb as you add length — one extra character buys more than one extra character class. Then paste something you already use into the [password strength checker](/tools/password-strength-checker/) to see the gap between the theoretical `L × log₂(P)` and what a pattern-aware attacker really faces. Once you are producing 70-bit-plus passwords you have no hope of memorising, the remembering becomes a solved problem — see [how password managers work](/guides/how-password-managers-work/), including free, open-source options like Bitwarden and KeePassXC.
