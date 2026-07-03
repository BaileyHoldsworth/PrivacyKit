---
title: "Diceware Passphrases: Four Random Words Beat P@ssw0rd1"
description: The xkcd 936 argument checked with real numbers — how diceware turns dice into memorable passphrases, the EFF wordlist maths, and how many words you actually need.
tools:
  - passphrase-generator
relatedGuides:
  - password-entropy
  - how-password-managers-work
  - csprng-vs-math-random
updated: 2026-07-03
---

Randall Munroe's xkcd comic 936 made one claim that has aged extremely well: `correct horse battery staple` — four random common words — is both easier for a human to remember and harder for a computer to guess than a mangled single word like `Tr0ub4dor&3`. That is not a slogan. It is an arithmetic result, and once you can do the arithmetic yourself you can size a passphrase for exactly the threat you care about.

## Why the comic is right

The intuition most people carry is backwards. We assume `P@ssw0rd1` looks strong because it is "complex" — mixed case, a symbol, a digit. But an attacker does not admire your character set; they run a wordlist and apply the obvious substitutions (`a`→`@`, `o`→`0`, `s`→`$`, capitalise the first letter, append a year). Every one of those rules is public. A leaked-password cracker like Hashcat ships with them built in. So `P@ssw0rd1` is not one guess deeper than `password` — it is maybe a few hundred guesses deeper, which against a machine testing billions per second is nothing.

Randomness is the only thing that costs an attacker work, and it only costs them work if *you* did not choose it. A word you picked because it feels random ("banana", your dog's name) is drawn from a tiny, biased distribution the attacker can model. A word a die picked for you is drawn uniformly from a fixed list, and there is no cleverer strategy than trying the list in some order. That distinction — human-chosen versus machine-chosen — is the whole game.

## How diceware turns dice into words

Diceware, published by Arnold Reinhold in 1995, is a procedure for borrowing randomness from physical dice. You roll five ordinary six-sided dice, read them left to right as a five-digit number, and look that number up in a wordlist. Five dice give 6⁵ = 7,776 outcomes, so the list has exactly 7,776 entries — one per possible roll. Repeat the roll once per word.

Because every entry is equally likely, one word carries:

```
log₂(7,776) = 12.925 bits of entropy
```

The [passphrase generator on this site](/tools/passphrase-generator/) keeps that structure but swaps the dice for your browser's `crypto.getRandomValues()` — a cryptographically secure generator that produces a uniform index into the list far faster than rolling thirty-plus dice by hand. (Why the browser's CSPRNG and not `Math.random()`? Because `Math.random()` is predictable enough to reconstruct; that trap is worth [its own guide](/guides/csprng-vs-math-random/).) The list itself is the EFF long wordlist, the Electronic Frontier Foundation's 2016 rewrite of Reinhold's original: same 7,776 words, but no profanity, no obscure vocabulary, and each entry carries a distinct three-letter prefix so autocomplete can finish it after you type a few keystrokes.

## A worked example

Take the two extreme rolls so you can check the mapping yourself. Roll five ones — `1-1-1-1-1` — and you land on the first entry of the EFF list, `abacus`. Roll five sixes — `6-6-6-6-6` — and you land on the last, `zoom`. Every roll in between selects exactly one of the 7,776 words with equal probability.

Now do it five times, one word per roll. A generator following this procedure might hand you:

```
cactus-napkin-kettle-gumbo-driftwood
```

Five independent draws, each worth 12.925 bits, so the phrase is worth 5 × 12.925 ≈ **64.6 bits**. Put concretely, the process could have produced 7,776⁵ ≈ 2.8 × 10¹⁹ equally likely results. Nothing about the phrase looking friendly reduces that number — the attacker still has to grind through that space, and knowing the list, the word count and the hyphens does not help them, because the only secret is which words the draws returned.

Compare `Tr0ub4dor&3`. Once you model it as "a dictionary word plus a small, rule-based mangling", its realistic search space is a few million to a few billion — call it 30-ish bits on a good day. The five-word phrase is roughly 2¹⁵ times larger and you did not have to invent, or remember, a single substitution.

## How many words you actually need

Entropy scales linearly with word count, so sizing a passphrase is just multiplication. The crack times below assume 10¹² guesses per second — an aggressive rate for a GPU rig against a *fast* hash — and take the average case (half the search space). Against a deliberately slow hash like bcrypt or Argon2, which caps attackers at thousands of guesses per second, every figure grows by many orders of magnitude.

| Words | Entropy | Combinations | Avg. crack @ 10¹²/s |
|------:|--------:|-------------|---------------------|
| 3 | 38.8 bits | 4.7 × 10¹¹ | under a second |
| 4 | 51.7 bits | 3.7 × 10¹⁵ | ~30 minutes |
| 5 | 64.6 bits | 2.8 × 10¹⁹ | ~160 days |
| 6 | 77.5 bits | 2.2 × 10²³ | ~3,500 years |
| 7 | 90.5 bits | 1.7 × 10²⁷ | ~27 million years |

The practical reading:

- **Four words** is a floor, and only a safe one behind rate limiting. An online login that locks out after a handful of tries never lets an attacker approach 3.7 × 10¹⁵ guesses. But if that same phrase protects something an attacker can grind offline — a stolen password database, an encrypted disk image — four words against a fast hash falls in half an hour. That is the honest gap the comic's "four words" version glosses over.
- **Five words** (~64 bits) is a sensible default for most human-typed secrets.
- **Six or seven words** is the range for anything guarding everything else: a password manager's master password, full-disk encryption, an SSH key passphrase. These are the secrets you type, not store, and they deserve the headroom.

Note what does *not* help much. Capitalising every word adds zero bits — it is a fixed transformation the attacker applies for free. Appending a random digit adds only log₂(10) ≈ 3.3 bits. Adding one more word adds 12.9 bits, worth about four such digits. When you want strength, add a word; the capital and digit are there only to appease "must include an uppercase letter and a number" form rules.

## Making one you will actually keep

The reason to reach for a passphrase over a random string is memory. `cactus-napkin-kettle-gumbo-driftwood` fits in your head after a few reads; twelve characters of `crypto`-grade line noise does not. So use passphrases exactly where a human is the interface: your device login, your Wi-Fi key, the master password that guards everything else. For the hundreds of site logins a manager stores and fills for you, a shorter [random password](/tools/password-generator/) hits identical strength using a dozen characters and wins outright — recall is irrelevant when software does the typing. If you have not settled on a manager, the open-source options are genuinely good: Bitwarden and KeePassXC both store whatever you generate, and choosing between styles is covered in [how password managers work](/guides/how-password-managers-work/).

Two habits keep the maths honest. Type the phrase the generator gives you rather than "fixing" a word you dislike — swapping words toward ones you find memorable quietly reintroduces the human bias the dice removed. And accept the separator the destination allows: spaces are classic diceware but some fields strip them, while hyphens and dots work nearly everywhere and cost no entropy, since the separator is visible format, not secret.

## What to do next

Open the [passphrase generator](/tools/passphrase-generator/), set the slider to five words for a login or six for a master password, and watch the entropy and crack-time figures move as you change the count — the numbers there are the same log₂ arithmetic laid out above, computed live. If you want to understand *why* those bits translate into crack times the way they do, [how password entropy actually works](/guides/password-entropy/) takes the formula apart against a real cracking rig. Then commit exactly one passphrase to memory — the one that opens your manager — and let random passwords handle the rest.
