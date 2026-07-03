---
name: Browser Fingerprint Viewer
title: Browser Fingerprint Viewer — What You Reveal | PrivacyKit
description: "Reveal the signals your browser exposes to trackers — user agent, screen, timezone, canvas hash and WebGL renderer — computed on this page and never uploaded."
category: privacy
keywords:
  - browser fingerprint
  - fingerprinting test
  - what does my browser reveal
  - canvas fingerprint
  - tracking test
icon: fingerprint
related:
  - what-is-my-ip
  - url-cleaner
  - password-leak-checker
  - exif-viewer
privacy: local
affiliateGroup: vpn
ads: false
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: What is a browser fingerprint?
    a: >-
      A fingerprint is the combination of details your browser hands to every
      site it loads — user agent, screen size, timezone, language list, how the
      graphics card draws a test image, and a dozen more. No single value
      identifies you, but taken together they form a string specific enough that
      a tracker can recognise the same browser across sites without any cookie.
      This page shows each signal and rates how much it narrows you down.
  - q: What is a canvas fingerprint and how is it measured here?
    a: >-
      Canvas fingerprinting asks the browser to draw the same text and shapes to
      an off-screen `<canvas>`, then reads the pixels back. Tiny differences in
      GPU, driver, font rendering and anti-aliasing mean two machines rarely
      produce identical pixels. This tool draws a fixed scene, exports it with
      `toDataURL()`, and hashes the result with SHA-256 — the first 16 hex
      characters shown are your canvas hash. Reload and it stays the same on
      your device; it differs on someone else's.
  - q: Does this tool send my fingerprint anywhere?
    a: >-
      No. Every value is read from your own browser with JavaScript and the
      hashes are computed on this page using the built-in WebCrypto API. Nothing
      is sent to a server and nothing is written to storage — that is why the
      button says *Show my fingerprint* rather than running on load. Open your
      browser's network tab and click it; you will see zero requests leave.
  - q: Can I hide or change my browser fingerprint?
    a: >-
      Partly, and honestly less than most "anti-fingerprint" products claim.
      Blocking one signal (say, a blank user agent) often makes you *more*
      unusual, not less. The approaches that genuinely work standardise many
      users onto the same values: the Tor Browser deliberately reports a uniform
      screen size and blocks canvas reads, and Firefox's `resistFingerprinting`
      mode does similar. A VPN changes your IP address but not the signals on
      this page.
  - q: Why does the WebGL renderer show "unavailable" or a generic name?
    a: >-
      The detailed GPU string comes from the `WEBGL_debug_renderer_info`
      extension, and some browsers block or spoof it precisely because it is so
      identifying. Firefox with resistFingerprinting, the Tor Browser, and a few
      privacy extensions return a generic value or nothing at all. Seeing
      "unavailable" here means that particular leak is already closed on your
      setup.
  - q: Does private or incognito mode change my fingerprint?
    a: >-
      Barely. Incognito mode clears cookies and history when you close the
      window, but your user agent, screen resolution, timezone, hardware and
      canvas rendering are identical to a normal window — so the fingerprint
      shown here is effectively the same. Fingerprinting exists specifically to
      track browsers that block or clear cookies.
---
## How to use

1. Press **Show my fingerprint**. The button sits idle until you click it, so the page never profiles you just for visiting — the read happens on your command.
2. Work down the four groups — *Software & locale*, *Display*, *Hardware*, *Rendering & time* — and check the badge beside each row. Green **Low** signals barely narrow you down; red **High** ones (user agent, canvas hash, WebGL renderer) do most of the identifying.
3. Look at the two stats up top: the **Combined fingerprint** folds every row into one SHA-256 value, and the **Canvas hash** isolates how your GPU draws text.
4. Hit **Refresh fingerprint** to run it again. On the same device the values come back identical — that repeatability is exactly what a tracker relies on.
5. Use **Copy report** to grab the full list as text (handy for comparing two browsers side by side), or **Clear** to wipe the panel.

## How it works

Each row is pulled from a browser API you can't easily turn off: `navigator` for the user agent, languages, CPU cores and platform; `screen` for resolution and colour depth; `Intl.DateTimeFormat().resolvedOptions()` for your timezone; `matchMedia` for your dark-mode and reduced-motion preferences. Two rows are hashed rather than read directly — the canvas hash and the combined fingerprint — both using the browser's WebCrypto `SHA-256` digest, truncated to the first 16 hex characters.

The combined value is built by writing every signal as `id=value`, joining those pairs with a unit-separator control character, and hashing the whole string. The join is what makes it sensitive to change. Take a machine reporting `tz=Australia/Brisbane␟cores=8␟dpr=2` — that string digests to `eb94d4c0254e2dc4`. Move the same laptop to Perth so timezone alone flips, and the input becomes `tz=Australia/Perth␟cores=8␟dpr=2`, which digests to `25ba1e3aca93aacc`. One field changed; not a single character of the hash survived. That avalanche is why a fingerprint is fragile as a long-term ID, and also why any signal you can vary genuinely moves the needle.

Sixteen hex characters give 64 bits of hash space, far more than needed to keep browsers apart. The real identifying power was never in the hash length, though — it lives in the underlying signals. If your combination of user agent, screen size and GPU is already rare, the hash just packages that rarity into a tidy label.

## Use cases & limitations

The honest use for this page is auditing your own exposure. Harden a browser — switch on Firefox's `resistFingerprinting`, install an extension, run the Tor Browser — then run this before and after and watch which red badges drop to grey. It also shows what any embedded widget or "log in with" button can read the moment it loads, which pairs well with checking what your network reveals on [what is my IP](/tools/what-is-my-ip/) and stripping tracking parameters off links with the [URL cleaner](/tools/url-cleaner/).

The limitation worth stating plainly: this is a snapshot of one browser, not a rarity score. It cannot tell you how many other people in the world share your exact combination — that needs a large measurement panel like the EFF's Cover Your Tracks. A hash of `eb94d4c0254e2dc4` looks unique because hashes always do; whether the *inputs* behind it are common or one-in-a-million is a question this tool doesn't answer. Fingerprinting is also only half the picture — files you share carry their own identifiers, which the [EXIF viewer](/tools/exif-viewer/) surfaces.
