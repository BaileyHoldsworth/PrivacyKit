---
title: "Browser Fingerprinting Explained: Tracking Without Cookies"
description: How trackers recognise your browser with no cookie at all — the entropy budget behind canvas, fonts and WebGL, and which defences actually reduce it.
tools:
  - browser-fingerprint
  - url-cleaner
relatedGuides:
  - url-tracking-parameters
  - what-your-ip-reveals
updated: 2026-07-03
---

Clear your cookies, switch to a private window, and a well-built tracker still
knows you are the same visitor who read three articles yesterday. That trick has
a name — browser fingerprinting — and it works because your browser volunteers
dozens of small facts to every site it loads. None of those facts is a name or
an ID. Combined, they add up to a string specific enough to pick your browser
out of millions.

## Why cookies were never the whole story

A cookie is a value a site asks your browser to store and hand back on the next
visit. Delete it and the link is broken. Fingerprinting takes the opposite
approach: instead of storing something on your machine, it reads what is already
there. Your operating system, screen geometry, timezone, language preferences,
the exact list of installed fonts, and the way your graphics card renders a line
of text are all readable from ordinary JavaScript. There is nothing to clear,
because the tracker never wrote anything down.

This is why "delete cookies" and incognito mode do so little against it. Those
actions wipe stored state. A fingerprint is *derived* state — recomputed fresh
every time, identical each time, on the same device.

## Entropy: how small facts become a unique label

The right way to measure a signal is in bits of entropy. If a value is shared by
1 in N browsers, it carries log₂(N) bits of identifying information. A timezone
of `Australia/Sydney` held by roughly 0.4% of visitors is worth about
log₂(1/0.004) ≈ 8 bits. The more unusual your value, the more bits it spends
narrowing the field.

Bits add up (for signals that vary independently), and each bit halves the pool
of candidates. To single out one browser among the world's ~5 billion, a tracker
needs about log₂(5×10⁹) ≈ 33 bits. Here is a plausible budget for one real
machine:

| Signal | Example value | Share of browsers | Entropy |
|---|---|---|---|
| Timezone | Australia/Sydney | ~0.4% | 8.0 bits |
| Screen + DPR | 2560×1440 @ 2× | ~2% | 5.6 bits |
| Language list | en-AU, en | ~1% | 6.6 bits |
| Canvas hash | (device-specific) | ~0.02% | 12.3 bits |
| WebGL renderer | Apple M2, ANGLE Metal | ~0.5% | 7.6 bits |

The [Browser Fingerprint Viewer](/tools/browser-fingerprint/) reads exactly
these categories and rates each one, so you can see which signals leak the most
from your own setup.

## A worked example

Take the browser above. Treating those five signals as roughly independent and
summing the bits:

```
8.0 + 5.6 + 6.6 + 12.3 + 7.6 = 40.1 bits
```

40 bits means 1 in 2⁴⁰ ≈ 1.1 *trillion*. That comfortably exceeds the ~33 bits
needed to be unique on the whole internet — so this browser is almost certainly
one of a kind, cookies or not. Even if a tracker only ever saw three of these
signals — timezone, canvas, and WebGL: 8.0 + 12.3 + 7.6 = 27.9 bits, or 1 in
~250 million — it would still narrow 5 billion browsers to roughly twenty
candidates, and the next page load resolves the tie.

Two honest caveats sit under that arithmetic. First, real signals *correlate* —
your user agent already implies much of your WebGL renderer, so you cannot
naively add every bit; the true total is lower than a straight sum. Second, and
crucially, the canvas hash does the heavy lifting. It asks the browser to draw a
fixed scene to an off-screen `<canvas>`, exports the pixels with `toDataURL()`,
and hashes them. Sub-pixel differences in GPU, driver and font anti-aliasing
mean two machines rarely produce the same pixels — which is why one signal can
be worth 12 bits on its own.

## What actually reduces your fingerprint

The instinct is to block or fake individual signals. Mostly this backfires. A
blank user agent, a spoofed screen size, or a randomised canvas makes you
*rarer*, not more common — you have just handed the tracker a new, distinctive
value to key on. Rarity is the enemy; the goal is to look like everyone else.

Two approaches get that right by standardising many users onto identical values:

- **Tor Browser** reports a uniform window size for all users and uses
  letterboxing (grey margins that round your viewport to a common step, such as
  1000×1000) so window dimensions stop leaking. It blocks canvas reads by
  default and normalises the user agent, timezone and fonts. Everyone in the
  herd looks the same, so no one's bits are unusual.
- **Firefox's `privacy.resistFingerprinting`** (RFP) applies the same idea in a
  mainstream browser: a spoofed common user agent, a normalised timezone (UTC),
  canvas prompts, and a generic WebGL renderer. It breaks some sites, which is
  why it is off by default, but it is the strongest built-in option in a browser
  most people already run.

And the snake oil: extensions that add "random noise" to your canvas or rotate
your user agent on every request. Randomness is not uniformity. A value that
changes each visit is itself a signal, and a fingerprint that is different every
time is trivially flagged as a spoofer. Likewise, a VPN changes your IP address —
which matters for the network-level story in [what your IP reveals](/guides/what-your-ip-reveals/) —
but it touches none of the JavaScript-readable signals in the table above.

## What to do next

Be realistic about the threat you actually face. If you want to *understand*
your exposure, run the [Browser Fingerprint Viewer](/tools/browser-fingerprint/)
and note which rows are flagged high — usually canvas, WebGL and user agent.
That tells you where your bits are spent.

If you want to genuinely *shrink* the fingerprint, pick one of the herd-based
tools above and accept the site breakage that comes with it — half-measures
mostly add entropy. And for the separate, easier win of not carrying a tracking
label around in the links you share, strip the query junk with the
[URL Tracker Cleaner](/tools/url-cleaner/); the [guide to tracking
parameters](/guides/url-tracking-parameters/) explains what `utm_` and `fbclid`
were doing there in the first place. Fingerprinting and link tracking are
different mechanisms, and closing one does nothing for the other.
