---
title: "How Two-Factor Codes (TOTP) Actually Work"
description: The mechanism behind authenticator codes — a shared secret and the current time step run through HMAC-SHA1, truncated to six digits — with a full worked example.
tools:
  - totp-generator
  - qr-code-generator
relatedGuides:
  - hibp-k-anonymity
  - password-entropy
affiliateGroup: passwords
updated: 2026-07-07
---

Turn on two-factor authentication for an account and you are usually handed a QR code, told to scan it with an authenticator app, and from then on a fresh six-digit number appears every thirty seconds. The phone shows exactly the digits the login server expects even in aeroplane mode, never talking to the account you are signing in to, and still the numbers line up. There is no hidden network call. Behind it sits a shared secret, a clock, and a keyed hash, wired together by a specification called TOTP: the Time-based One-Time Password, defined in RFC 6238. Learning the mechanism draws a sharp line between the attacks it stops cold and the ones it does nothing about.

## The shared secret that never travels

TOTP is *symmetric*: your app and the server each hold a copy of the same secret key, and after the initial setup that key is never sent across the network again. The secret is typically 160 bits of randomness, written for humans as a Base32 string — something like `MZ4WYY3Z5F2GK3TFEB4S65DFNVSW45DF`. Base32 is only a transport encoding, chosen because it survives being read aloud, retyped, or squeezed into a QR code without the ambiguity of `0`/`O` or `1`/`l`.

Here is the part that makes it a genuine second factor. When you log in, you are not transmitting the secret — you send a six-digit number derived from it. That number is a one-way function of the key and the current time, so an eavesdropper who grabs one code cannot reproduce the next, and the key never moves. Compare that with a password, which you resend in full on every login; the TOTP secret crosses the wire exactly once, at enrolment.

## From clock to code

The algorithm is built in two layers. Underneath is HOTP (RFC 4226), which computes an HMAC over a moving counter. TOTP is the thin wrapper on top: it defines that counter as a function of the wall clock, so nobody has to keep a shared tally by hand. The full derivation runs like this:

1. Take the current Unix time in seconds and divide by the period (30 by default), discarding the remainder. That integer is the counter: `C = floor(unixtime / 30)`.
2. Encode `C` as an 8-byte, big-endian value.
3. Compute `HMAC-SHA1(key, C)`, producing a 20-byte digest.
4. Read the low four bits of the *last* byte to get an offset between 0 and 15.
5. Starting at that offset, pull four bytes from the digest and clear the top bit of the first one (so the result is always read as a positive 31-bit integer). This step is called *dynamic truncation*.
6. Reduce that integer modulo 10⁶ and zero-pad to six digits. That is your code.

The offset in step 4 is the clever bit: which slice of the hash becomes your code is itself chosen by the hash, so an attacker cannot predict in advance which bytes will matter. SHA1 is the default digest; SHA256 and SHA512 are permitted, but a provider has to tell your app which one it used, or the two sides compute different numbers.

## A worked example

Let us push a single instant through the whole pipeline. Use the secret above and freeze the clock at **21:17:36 UTC on 12 March 2026**, which is Unix time `1,773,350,256`.

| Step | Value |
| --- | --- |
| Secret (Base32) | `MZ4WYY3Z5F2GK3TFEB4S65DFNVSW45DF` |
| Unix time (seconds) | 1,773,350,256 |
| Counter `⌊t / 30⌋` | 59,111,675 |
| Counter as 8 bytes (big-endian) | `00 00 00 00 03 85 F8 FB` |
| `HMAC-SHA1(key, counter)` | `BD69CB31 4EB88532 B0961D14 EECB6468 245277CE` |
| Last byte `0xCE`, low nibble | `0xE` → offset **14** |
| Four bytes at offset 14 | `64 68 24 52` |
| Masked to 31 bits | `0x64682452` = 1,684,546,642 |
| Modulo 10⁶ | **546642** |

So at that exact moment the code is `546 642`. Notice the masking step did nothing visible here — `0x64` already has its high bit clear — but it is not optional: whenever that leading byte lands at `0x80` or above, dropping the sign bit is what keeps the number from going negative across different language implementations.

Wait one tick. At 21:18:00 the counter rolls to 59,111,676, the HMAC is recomputed from scratch, and the code becomes `480 624` — no relationship at all to the previous value, because a one-step change in the counter avalanches through the hash. You can reproduce every row of this table in the [TOTP generator](/tools/totp-generator/) by pasting the same secret and setting the parameters to SHA1 / 6 digits / 30-second period.

## Why the clock has to agree

Nothing in that calculation is sent between the two machines — the phone and the server each run it locally and compare only the six digits at the end. That comparison works solely if both agree on what time it is. Each side floors its own clock into the same 30-second bucket; if your device's clock has drifted more than the server's tolerance, you land in a different bucket and produce a code the server never expects.

Rotation is the other consequence of folding the clock in. A code is valid for one window only, which caps the replay opportunity at roughly thirty seconds instead of forever. To absorb a little drift, most servers also accept the immediately previous and next steps — a ±1 tolerance. When an authenticator's numbers get rejected outright, a skewed system clock is the first thing to check, well before you suspect the secret.

## The otpauth:// URI and QR enrolment

The QR code you scan during setup is not itself the secret — it is a picture of a short text string in the `otpauth://` format, which packs the key together with every parameter needed to reproduce the codes:

```
otpauth://totp/PrivacyKit:ada@example.com?secret=MZ4WYY3Z5F2GK3TFEB4S65DFNVSW45DF&issuer=PrivacyKit&algorithm=SHA1&digits=6&period=30
```

Everything after the `?` is configuration: the `issuer` and account label are cosmetic and never touch the maths, while `algorithm`, `digits` and `period` must match on both ends. A QR code is just this line drawn as a scannable grid by the same static encoder our [QR code generator](/tools/qr-code-generator/) uses, which means the picture carries the plaintext key. Anyone who photographs that QR, or reads it out of a screenshot, holds your second factor outright. Treat the image with the same care as the password it protects, and if a service lets you print backup codes, store those somewhere a camera in a café cannot reach.

## TOTP versus SMS versus passkeys

All three are marketed as "two-factor", but they fail in very different ways.

| Factor | Secret model | Works offline | Phishable in real time? | Main weakness |
| --- | --- | --- | --- | --- |
| SMS one-time code | Sent per login over the phone network | No | Yes | SIM-swap and SS7 interception |
| TOTP authenticator | Shared secret, held on both sides | Yes | Yes | No binding to the real site |
| Passkey / FIDO2 | Public-private key pair | Yes | No | Requires a compatible device |

SMS is the weakest of the three. The code travels over a network you do not control, and an attacker who convinces your carrier to move your number to their SIM — a SIM-swap — receives it directly. TOTP removes that channel entirely: the secret lives on your device and the code is computed locally, so there is nothing to intercept in transit and no carrier to social-engineer.

## What a real-time phisher can still do

TOTP closes the door on stolen-password reuse and on SMS interception, but it leaves one door open, and it is worth being blunt about it. A TOTP code is not tied to the website you are looking at. If a phishing page fools you into typing your password and your current six digits, an attacker running a reverse-proxy in the background can relay both to the genuine site within the same thirty-second window, complete the login, and walk away with your session cookie. Your code was valid; it was just spent on the wrong site. This is the same lesson as a leaked-but-unbroken password hash in [how a leak check stays private](/guides/hibp-k-anonymity/): a mechanism can be sound and still be defeated at a different layer.

Passkeys — the consumer face of WebAuthn/FIDO2 — are what shut that door. Instead of a shared secret, your device holds a private key and the site holds only the matching public key. Signing in means signing a challenge that is cryptographically bound to the real origin, so a signature produced on `paypa1-login.com` is meaningless to `paypal.com`. There is no transferable code to phish, because there is no code at all. A hardware security key (a YubiKey and its kin) is the same idea in a dedicated dongle. If an account supports passkeys or a hardware key, prefer it; keep TOTP as the strong fallback, and let SMS be the option of last resort.

## What to do next

Practise on the [TOTP generator](/tools/totp-generator/): paste the worked-example secret, watch the countdown drain and the digits roll, then open your browser's network tab and confirm nothing is sent — the whole calculation runs on your device. For daily use, park your secrets in a dedicated app rather than a browser tab. Free, open-source options are the easy call here: **Aegis** on Android and **Ente Auth** across platforms both keep an encrypted, exportable vault, and password managers such as **Bitwarden** or **KeePassXC** can hold TOTP seeds beside the logins they belong to. Whatever you choose, the strength of the second factor still rests on the first — a unique, high-entropy password underneath it, which is exactly [what entropy measures](/guides/password-entropy/). Two-factor authentication buys you a great deal; it is not a licence to reuse `Summer2026!`.
