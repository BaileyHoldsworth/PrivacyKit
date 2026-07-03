---
title: "Base64 Is Not Encryption: Encoding vs Encryption vs Hashing"
description: Base64 looks scrambled, so people treat it as security. Here is how encoding, encryption and hashing actually differ, with worked examples you can check.
tools:
  - base64-encoder-decoder
  - hash-generator
relatedGuides:
  - jwt-security-mistakes
  - hibp-k-anonymity
updated: 2026-07-03
---

Open a config file, a JWT, or an HTTP header and you will often find a run of
letters, digits and the odd `=` that plainly is not English. It looks
protected. Someone, somewhere, decided that because they could not read it at a
glance, neither could an attacker. That assumption has leaked more credentials
than most zero-days. The string is almost always Base64, and Base64 hides
nothing.

## Three words people use as if they meant the same thing

Encoding, encryption and hashing all turn readable input into something that
looks unreadable, which is exactly why they get confused. They solve completely
different problems.

| Property            | Encoding (Base64)        | Encryption (AES)              | Hashing (SHA-256)          |
| ------------------- | ------------------------ | ----------------------------- | -------------------------- |
| Purpose             | Move bytes through text  | Keep bytes secret             | Fingerprint bytes          |
| Needs a key?        | No                       | Yes                           | No                         |
| Reversible?         | Yes, by anyone           | Yes, only with the key        | No, ever                   |
| Output size         | ~⁴⁄₃ of input            | Roughly input size            | Fixed (256 bits)           |
| Right question      | "Can this travel safely?"| "Can someone read this?"      | "Has this changed?"        |

The single distinction that matters: **encoding has no secret**. The Base64
alphabet is public and printed in RFC 4648. Anyone with the encoded string can
recover the original bytes with no password, no key, and no cleverness. Calling
it security is like locking a door and taping the key to the front of it.

## Why Base64 exists at all

Base64 was never meant to protect anything. It solves a transport problem.
Plenty of channels only reliably carry printable text: the body of an email,
a value inside JSON, an XML attribute, a URL, an SVG `data:` URI. Push raw
binary — an image, a compiled key, a gzip blob — through one of those and a
stray control byte or a `<` can corrupt the payload or break the parser.

The fix is to re-express arbitrary bytes using only a safe 64-character set:
`A–Z`, `a–z`, `0–9`, plus two extras (`+` and `/`, or `-` and `_` in the
URL-safe variant). Every byte value survives the round trip. That is the whole
job. The [Base64 encoder / decoder](/tools/base64-encoder-decoder/) does exactly
this in the browser, and its decode direction will happily turn any Base64 back
into text — which is the point being made here.

## The ⁴⁄₃ size tax

Base64 takes input three bytes at a time. Those 24 bits get carved into four
chunks of six bits each, and every chunk — a number somewhere between 0 and 63 —
selects one entry from the table. So **3 bytes in, 4 characters out** — the
output is always about 4/3, or 33%, larger than the input.

When the input length is not a clean multiple of 3, the last group is padded
with `=` so the output still lands on a 4-character boundary. The exact output
length is:

```
output_chars = ceil(input_bytes / 3) * 4
```

That expansion is why Base64 is a wrapper, never a compressor. Encoding a
2&nbsp;MB image to inline it in a stylesheet produces roughly 2.7&nbsp;MB of
text.

## A worked example: "encoding" a credential

Say an app stores an HTTP Basic Auth credential — username `admin`, password
`hunter2` — as the 13-byte string `admin:hunter2`, and Base64s it before dropping
it into an `Authorization` header. Watch the first three bytes.

The characters `adm` are the byte values `[97, 100, 109]`. In binary:

```
a = 97  = 01100001
d = 100 = 01100100
m = 109 = 01101101
```

Concatenate to 24 bits, then cut into four 6-bit groups:

```
011000 010110 010001 101101
  24     22     17     45
   Y      W      R      t
```

So `adm` becomes `YWRt`. Continue through the rest and the full 13 bytes encode
to:

```
YWRtaW46aHVudGVyMg==
```

The two trailing `=` say the final block carried only one leftover byte (`2`,
value 50). Now the crucial part: recovering the password takes no key and no
effort. Paste that string into the decoder, or run it through any Base64 library
on earth, and out comes `admin:hunter2` instantly. The header did not protect
the credential; it only made it survive transport as text. Anyone reading a log,
a proxy dump, or a browser network tab reads the password.

This is the recurring incident pattern, and it is generic rather than exotic:
credentials Base64ed into config files, API keys "obfuscated" in mobile apps,
tokens tucked into cookies. Reviewers who see `YWRtaW46aHVudGVyMg==` and assume
it is safe are the reason the pattern persists. The [JWT security mistakes
guide](/guides/jwt-security-mistakes/) covers a close cousin — a JWT's header and
payload are just URL-safe Base64, fully readable, and the signature is the only
part doing security work.

## Encryption and hashing — and when each is right

If the goal is genuine secrecy, you need **encryption**: a keyed, reversible
transform. Feed `admin:hunter2` and a secret key into AES-256-GCM and you get
ciphertext plus an authentication tag. Without the key, recovering the plaintext
means brute-forcing a 256-bit space — 2²⁵⁶ possibilities, more than the atoms in
the observable universe. With the key, decryption is instant. The secret lives
in the key, not the algorithm.

If the goal is to verify something without storing it, you need **hashing**: a
one-way transform. Run `letmein` through SHA-256 and you always get:

```
1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032
```

That is 256 bits — 64 hex characters — no matter how long the input was. Add a
single trailing space and the digest changes completely:

```
5a638437a68fea8fa387576367604cfdd4098069d60a9d42dbe3fd3a65b39728
```

You cannot run SHA-256 backwards; the function discards information. You can
confirm all of this in the [hash generator](/tools/hash-generator/) by hashing
the same input twice and then nudging one character. One honest caveat: a bare
hash is fine for detecting whether bytes changed, but it is the wrong tool for
storing passwords. Short or common inputs get cracked by hashing every dictionary
word and comparing — which is why password storage uses slow, salted functions
like bcrypt or Argon2, and why real leak checks lean on clever protocols instead
of naked hashes (see [how a leak check works without seeing your
password](/guides/hibp-k-anonymity/)).

## What to do next

- If you see a scrambled string and want to know what it holds, **decode it** —
  do not assume it is protected. The [Base64
  decoder](/tools/base64-encoder-decoder/) reverses it in the browser, with
  nothing uploaded.
- If you need something to stay **secret in transit or at rest**, encrypt it with
  a vetted library (AES-GCM, libsodium, age) and manage the key properly — the
  key is the security, so guard it accordingly.
- If you need to **verify integrity** — that a download or a record has not been
  tampered with — hash it and compare digests in the [hash
  generator](/tools/hash-generator/).

Base64 earns its place as plumbing: reliable, reversible, everywhere. Just never
mistake plumbing for a lock.
