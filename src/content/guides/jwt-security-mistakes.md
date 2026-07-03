---
title: JWT Security Mistakes Developers Still Make
description: The recurring JWT bugs — decode treated as verify, alg:none, HS/RS confusion, secrets in the payload, no revocation — shown with real token values and fixes.
tools:
  - jwt-decoder
relatedGuides:
  - base64-is-not-encryption
  - csprng-vs-math-random
updated: 2026-07-03
---

A JSON Web Token looks reassuringly cryptographic: three chunks of gibberish
separated by dots, one of them a signature. That appearance hides how little a
token proves on its own. Most JWT vulnerabilities are not clever cryptographic
breaks — they are the server trusting data it never actually checked. Here is
where that goes wrong, and what a correct implementation does instead.

## Anatomy of a token

A signed JWT (formally a JWS) has three Base64URL segments:
`header.payload.signature`. Take a concrete one issued for user 1042:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDQyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTE1OTY0MDAsImV4cCI6MTc1MTYwMDAwMH0.3AJhiOUiDG6DYD4WVx0Gsu1l5mUDkTVPfN2VT7ZI66w
```

Decoding the first two segments — which anyone can do, no key required — gives:

```json
// header
{ "alg": "HS256", "typ": "JWT" }
// payload
{ "sub": "1042", "role": "user", "iat": 1751596400, "exp": 1751600000 }
```

The signature is an HMAC-SHA256 over the string `header.payload`, keyed with the
issuer's secret. That is the only part that carries any authority. Everything
before it is plaintext wearing a costume; paste the token into the
[JWT decoder](/tools/jwt-decoder/) and every claim is right there in readable
JSON. If that surprises you, the reason is worth its own read:
[Base64 is not encryption](/guides/base64-is-not-encryption/).

## Mistake 1: treating decode as verify

The single most expensive JWT bug is calling a `decode()` function and acting on
its output. Decoding parses the Base64URL and hands back the claims. It does not
touch the signature. An attacker copies the token above, flips `"role":"user"`
to `"role":"admin"`, re-encodes the payload, and leaves the old signature in
place. If your endpoint reads `role` from the decoded payload without a
verification step, that forged admin is now authenticated.

The fix is a one-word discipline: **verify**, don't decode, on any code path that
grants access. `jwt.verify(token, key, { algorithms: [...] })` recomputes the
signature and throws if it does not match. Reserve bare decoding for debugging
and display — never for authorisation.

## Mistake 2: honouring `alg: none`

The JWT spec defines an "unsecured" token whose header says `alg: none` and
whose third segment is empty. It exists for cases where transport already
guarantees integrity. The trouble began when libraries accepted these tokens
during normal verification. An attacker takes our token, rewrites the header to
`{"alg":"none","typ":"JWT"}`, sets `role` to `admin`, and deletes the signature
entirely:

```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMDQyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUxNTk2NDAwLCJleHAiOjE3NTE2MDAwMDB9.
```

A vulnerable verifier reads `alg: none`, concludes no signature is needed,
and waves it through. The defence is an allow-list: pass the exact algorithms
you expect (`algorithms: ['HS256']`) so the library never consults the
attacker-controlled header to decide how — or whether — to check the signature.
The decoder flags that empty third segment so a `none` token cannot slip past
you unnoticed.

## Mistake 3: HS/RS algorithm confusion

This one is subtler and catches careful teams. RS256 signs with a **private**
key and verifies with a **public** key — the public key is, by design, not
secret. HS256 signs and verifies with the **same** shared secret. Now suppose a
server expects RS256 and calls `verify(token, publicKey)`, but derives the
algorithm from the header instead of pinning it. An attacker forges a token with
`alg: HS256` and computes the HMAC using the server's *public* RSA key as the
HMAC secret. The server, told it is doing HMAC, keys the check with the very key
it published, the signatures match, and the forgery verifies.

| Mode | Signs with | Verifies with | Confusion risk |
|------|-----------|---------------|----------------|
| HS256 | shared secret | shared secret | secret leaks if verify code is public |
| RS256 | private key | public key | public key becomes an HMAC "secret" |

The prevention is identical to Mistake 2: pin the algorithm explicitly and never
let a single key object be usable under two families. Pass only `['RS256']`; the
attacker's `HS256` token is rejected before the key is ever consulted.

## Mistake 4: secrets in the payload

Because the payload is readable by anyone holding the token, anything you put
there is public to the bearer. Session identifiers, an email address, a coarse
role — fine, they were going to know those anyway. A password, an API key, a
national ID number, or a feature flag that reveals unreleased plans — not fine.
A JWS is signed, not encrypted; the signature stops tampering and does nothing
to stop reading. If a claim genuinely must be confidential, you need JWE
(encrypted tokens), not a bigger secret in a JWS.

## Mistake 5: long expiry with no way back

Stateless verification is the selling point of JWTs and also their sharpest
edge: a valid signature is accepted until `exp`, and there is no built-in "log
this token out". Our example expires at `exp: 1751600000` — an hour after it was
issued at `1751596400`. That hour is deliberate. Teams that set `exp` weeks out
to avoid re-login are handing every stolen token a long, unrevocable life.

The workable pattern is two tokens: a short-lived access token (5–15 minutes)
carried on each request, and a long-lived refresh token, stored server-side and
revocable, that mints new access tokens. Revoking the refresh token caps the
damage window at one access-token lifetime. A common precision bug feeds this
directly — writing `exp` in milliseconds. NumericDate is defined in seconds, so
a token minted with JavaScript's `Date.now()` carries a value a thousand times
too large and effectively never expires.

## Where you store the token matters

On the client, the choice is usually `localStorage` versus an `HttpOnly` cookie,
and it is a genuine trade-off rather than a winner:

| Storage | Exposed to XSS? | Sent automatically? | CSRF exposure |
|---------|-----------------|---------------------|---------------|
| `localStorage` | Yes — any injected script can read it | No, you attach it manually | Low |
| `HttpOnly` cookie | No — JavaScript cannot read it | Yes, on every matching request | Needs SameSite / CSRF token |

`HttpOnly` cookies keep the token away from injected scripts but reintroduce
CSRF, so pair them with `SameSite=Lax` or `Strict` and a CSRF token on state
changing requests. `localStorage` sidesteps CSRF but hands the token to any XSS,
so it lives or dies on your content-security policy. There is no storage location
that survives arbitrary script execution on your own origin.

## A sensible-defaults checklist

- Verify, never decode, on authorisation paths.
- Pass an explicit `algorithms` allow-list; never read `alg` from the header to
  choose the check.
- Generate HMAC secrets from a CSPRNG at full length, not a memorable string —
  see [why Math.random() can't make secrets](/guides/csprng-vs-math-random/).
- Keep confidential data out of the payload; it is readable, not hidden.
- Short access tokens plus a revocable refresh token; write `exp` in seconds.
- Set `iss` and `aud`, and check them, so a token minted for one service can't
  be replayed at another.

None of this needs exotic tooling — most breaks trace back to trusting a claim
the server never verified. When you are inspecting a token by hand, the
[JWT decoder](/tools/jwt-decoder/) shows the header algorithm, decodes each
claim, and converts `exp`, `nbf` and `iat` to real dates so a millisecond
mistake or a `none` header is obvious at a glance. Just remember what it is: a
reader, not a verifier. Paste test tokens, never live production ones — a valid
token is a bearer credential for as long as it lasts.
