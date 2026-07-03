---
title: How a Password Leak Check Works Without Seeing Your Password
description: The k-anonymity range protocol behind Have I Been Pwned, walked through with a real SHA-1 hash — why five hex characters keep your password private.
tools:
  - password-leak-checker
  - hash-generator
relatedGuides:
  - how-password-managers-work
  - password-entropy
updated: 2026-07-03
---

Typing your real password into a website to ask "has this leaked?" sounds like exactly the thing security people tell you never to do. Yet a well-built breach checker does precisely that, and it is safe — because the password, and even its full fingerprint, never actually reach the server being queried. The trick is a protocol called *k-anonymity*, and once you see the mechanism it is obvious why it works. This guide walks through it byte by byte.

## The problem with the naive approach

Have I Been Pwned (HIBP) maintains a corpus of roughly a billion passwords pulled from real breaches. The obvious way to check yours against that list is to send it and let the server look it up. That is a terrible idea: you would be handing your live password to a third party in plaintext, trusting their logs, their TLS termination, and everyone with access to either.

The next idea most developers reach for is: hash the password first, send the hash. Better, but still broken. A hash of a specific password is a stable identifier. The server can log it, and because breach lists are essentially giant precomputed hash-to-password tables, a logged hash of a common password is trivially reversed. Sending the full hash tells the server exactly which password you asked about.

What you actually want is a way to ask the question while giving the server too little information to know *what* you asked. That is the k-anonymity model: your query is deliberately ambiguous between k different possible inputs, so the server cannot single yours out.

## The range protocol, step by step

HIBP's Pwned Passwords range API implements this with SHA-1 hashes and a five-character prefix. The flow is:

1. Your browser computes the SHA-1 hash of the password locally.
2. It splits the 40-character hex hash into a **5-character prefix** and a **35-character suffix**.
3. It sends only the prefix to the API endpoint `range/<prefix>`.
4. The server responds with every leaked-hash suffix that shares that prefix — typically several hundred lines, each with a breach count.
5. Your browser scans that list for your suffix. A match means the password is in the corpus; no match means it is not.

The comparison happens on your machine. The server sees a five-character prefix and nothing else — not the suffix, not the password, not which of the returned candidates (if any) was yours.

## A worked example

Take the password `sunshine-42`. Its SHA-1 digest is:

```
SHA1("sunshine-42") = 8F448BBDCF884F65A2687AED04C3A06BA2D9005B
```

Split at character five:

| Part      | Value                                  | Sent to server? |
|-----------|----------------------------------------|-----------------|
| Prefix    | `8F448`                                | Yes             |
| Suffix    | `BBDCF884F65A2687AED04C3A06BA2D9005B`  | No              |

Your browser requests:

```
GET https://api.pwnedpasswords.com/range/8F448
```

The server streams back a block of suffix:count pairs, all beginning (implicitly) with `8F448`:

```
BBDCF884F65A2687AED04C3A06BA2D9005B:5
BC1E4F9A0C7D3E2B1A6F8091827364554AA:2
BD00A17E4429B9C6E0F1D2C3B4A59687012:41
... (several hundred more lines) ...
```

Your client walks the list looking for `BBDCF884F65A2687AED04C3A06BA2D9005B`. It is there, with a count of 5 — so `sunshine-42` has appeared in five separate breach records, and the checker flags it. Change one character to `sunshine-43` and the entire SHA-1 changes (avalanche effect), landing in a completely different prefix bucket with, most likely, no match at all.

## Why five characters is the right size

A SHA-1 hash is 160 bits, written as 40 hexadecimal characters. Each hex character encodes 4 bits, so a 5-character prefix pins down 20 bits — one bucket out of 2²⁰:

```
16^5 = 1,048,576 possible prefixes
```

Spread a corpus of roughly 900 million leaked hashes across those ~1.05 million buckets and each bucket holds, on average:

```
900,000,000 / 1,048,576 ≈ 858 candidate hashes
```

That is the *k* in k-anonymity: your query is indistinguishable from a query for any of the ~500 to ~1,000 other passwords whose hashes land in the same bucket. The server genuinely cannot tell which one you hold. That number is a deliberate balance:

| Prefix length | Buckets | Avg. candidates | Trade-off |
|---------------|---------|-----------------|-----------|
| 4 chars       | 65,536  | ~13,700         | More private, huge responses |
| **5 chars**   | **1,048,576** | **~858**  | The sweet spot HIBP uses |
| 6 chars       | 16.7M   | ~54             | Small responses, weak anonymity |

Five characters keeps the anonymity set in the hundreds while keeping each response small enough to fetch in a single request.

## What the server can and cannot infer

It helps to be precise about the residual information leak, because "anonymous" is not "invisible":

- **Can infer:** that someone queried bucket `8F448`, the requester's IP address, and rough timing.
- **Cannot infer:** your password, your full hash, your suffix, or which of the ~858 candidates you were checking — including whether your hash was even in the returned list.

HIBP hardens this further with **response padding**: when enabled, the API adds random dummy suffixes to every response so that all buckets return a similar-sized payload. Without padding, an eavesdropper watching encrypted traffic could sometimes guess the bucket from the response length; padding flattens that signal. The dummy entries carry an obviously fake count and your client ignores them.

## Practical advice

A few things follow directly from how this works:

- **Verify it yourself.** Open your browser's network tab while running the [password leak checker](/tools/password-leak-checker/). You will see a single request carrying five hex characters and nothing more. Honest tools survive that inspection.
- **Not found is not the same as safe.** The corpus only contains passwords that have *already* leaked. A freshly invented weak password — a street name plus a birth year — can be absent from every breach list and still fall in seconds to a targeted guess. Breach absence is necessary, not sufficient; length and randomness are what make a password hard to crack. See [how password entropy actually works](/guides/password-entropy/) for the maths behind that.
- **Found means burned.** If your password appears even once, retire it everywhere you reused it. The same lists that power this check power the credential-stuffing tools attackers run.
- **You can reproduce the hash.** Paste any string into the [hash generator](/tools/hash-generator/), select SHA-1, and you will get the same 40-character digest the checker computes internally — handy for understanding the prefix/suffix split with your own values.

## What to do next

The check tells you which passwords are compromised; the fix is to stop having reusable secrets at all. A password manager generates a unique random string per account, so a leak in one place cannot cascade, and a single breached entry is a five-minute rotation rather than a weekend of damage control. If you are choosing one, [how password managers work](/guides/how-password-managers-work/) covers the trade-offs. Run your current passwords through the leak checker first — the ones that come back with a count next to them are the ones to change today.
