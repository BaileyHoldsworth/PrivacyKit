---
title: "Why Math.random() Can't Make Passwords: CSPRNGs Explained"
description: "Math.random() is fast but predictable, so it must never generate secrets. Here is how a CSPRNG differs, plus the modulo-bias trap and how to avoid it."
tools:
  - password-generator
  - key-generator
  - uuid-generator
relatedGuides:
  - password-entropy
  - how-password-managers-work
  - diceware-passphrases
updated: 2026-07-03
---

Two functions in your browser both hand back "random" numbers, and only one of
them is safe to build a password on. `Math.random()` returns a float that looks
scrambled to a human. `crypto.getRandomValues()` returns bytes that no observer
can predict, even after watching thousands of earlier outputs. The gap between
those two guarantees is the whole subject of this guide, and getting it wrong
has shipped guessable session tokens, reset links and vault keys into
production.

## What "random" has to mean for a secret

Randomness for a card-shuffle animation and randomness for a password are
different requirements wearing the same word. An animation needs values that
*look* varied. A secret needs values that stay *unpredictable to an attacker
who has already seen related outputs*. That second property has a name:
cryptographic security.

A pseudo-random number generator (PRNG) is a deterministic function. It holds
an internal state, applies a fixed transformation, and emits a number derived
from that state. Feed it the same starting state and it replays the identical
sequence forever. A PRNG is judged on speed and statistical evenness — does the
output spread flatly across the range, pass the usual distribution tests, avoid
obvious cycles.

A cryptographically secure PRNG (CSPRNG) adds a harder promise on top: given
any run of outputs, an attacker still cannot compute the next output or recover
the state with less work than brute force. That promise is what a secret leans
on, and an ordinary PRNG was never designed to keep it.

## Why Math.random() fails the test

Every major JavaScript engine backs `Math.random()` with a variant of
**xorshift128+**. Its state is two 64-bit integers. Each call shifts and XORs
them together, updates the pair, and returns a double built from the top bits.
The algorithm is excellent at what it is for: it is fast, has a long period,
and passes standard randomness test suites.

It is also completely reversible. The output leaks the state bits rather than
hiding them, so an attacker who collects a modest run of consecutive
`Math.random()` values can solve for the internal 128-bit state — this has been
demonstrated with off-the-shelf constraint solvers that recover the state from
a handful of outputs. Once the state is known, every past and future value in
that sequence falls out by running the same arithmetic forward. There is no
secret key involved and nothing to break; the design never promised
unpredictability in the first place. That is why a token minted from `Math.random()` can be
replayed by anyone who watched enough of its siblings.

## Where the browser gets real entropy

`crypto.getRandomValues()` does not run in JavaScript arithmetic at all. The
browser asks the operating system's CSPRNG — `getrandom()` on Linux,
`BCryptGenRandom` on Windows, the arc4random family on macOS. That pool is
seeded from hardware and system noise: interrupt timings, the CPU's `RDRAND`
instruction, device jitter. It is periodically reseeded, and its whole job is
to resist state recovery. This is the same source OpenSSL and your password
manager draw on, which is why generating a key in a tab is not the weak link
people assume it is.

## The trap that catches careful code: modulo bias

Having good bytes is necessary but not sufficient. The moment you map random
bytes onto a character set, a subtle flaw can creep back in.

Say you want to pick one of **6** symbols and you take a random byte, which is a
value from 0 to 255, then reduce it with `byte % 6`. A byte has 256 possible
values. Divide 256 by 6: you get 42 remainder 4. So four of the six results
land in *43* of the 256 bytes, and the other two land in only *42*.

| Result | Bytes mapping to it | Probability |
| ------ | ------------------- | ----------- |
| 0      | 43                  | 16.80%      |
| 1      | 43                  | 16.80%      |
| 2      | 43                  | 16.80%      |
| 3      | 43                  | 16.80%      |
| 4      | 42                  | 16.41%      |
| 5      | 42                  | 16.41%      |

The first four outcomes are about 2.4% likelier than the last two. On a
6-symbol toy that is small, but scale it to a real alphabet and the skew
becomes structural knowledge an attacker can exploit. A password generator
drawing from the 94 printable ASCII characters has the same problem: 256 ÷ 94
is 2 remainder 68, so the first 68 characters of the pool appear with
probability 3/256 while the rest appear with 2/256 — the low-index characters
are 50% more common. That is real entropy quietly removed from every character.

### The fix: rejection sampling

The cure is to throw away the bytes that cause the imbalance. Find the largest
multiple of your range that fits under 256, and reject any byte at or above it.
For the 6-symbol case, the largest multiple of 6 below 256 is **252**. So:

```js
function pick(n) {                    // n = size of the character set
  const limit = 256 - (256 % n);      // 252 when n = 6
  const buf = new Uint8Array(1);
  let b;
  do {
    crypto.getRandomValues(buf);
    b = buf[0];
  } while (b >= limit);               // discard 252–255, ~1.6% of draws
  return b % n;                       // now perfectly uniform over 0..n-1
}
```

Bytes 252 through 255 are discarded and redrawn. You waste roughly 1.6% of
draws, and in exchange every one of the six results is exactly equally likely.
No character is cheaper to guess than any other.

## How these generators apply it

Every generator on this site uses `crypto.getRandomValues()` and rejection
sampling, never `Math.random()`. The [password generator](/tools/password-generator/)
draws each character uniformly from the pool you select, so the entropy it
reports — for a 16-character mixed-charset password, about 104 bits, or
log₂(94¹⁶) — is honest rather than optimistic. The
[encryption key generator](/tools/key-generator/) requests raw bytes straight
from the OS pool and only *encodes* them as hex or Base64, so no reduction step
exists to bias. The [UUID generator](/tools/uuid-generator/) fills a v4 UUID's
122 random bits the same way, which is what makes such an identifier safe to
use as an unguessable reset token.

## What to do next

Three rules carry almost all of this:

- **Never** call `Math.random()` for anything a person is not allowed to guess:
  passwords, tokens, salts, keys, coupon codes, reset links.
- Reach for `crypto.getRandomValues()` (or `crypto.randomUUID()`, or your
  language's `secrets`/`os.urandom` equivalent) whenever the value is a secret.
- If you map bytes onto a set whose size does not divide 256, reject the
  overflow bytes rather than reducing with a bare `%`.

Randomness is only half of a strong secret; the other half is having enough of
it. If you want to see how bit counts translate into real crack times, read
[how password entropy actually works](/guides/password-entropy/), and if you
would rather never handle these strings by hand, [how password managers
work](/guides/how-password-managers-work/) covers the tools that generate and
store them for you.
