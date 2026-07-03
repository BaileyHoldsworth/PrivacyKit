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
<!-- content-pending: Phase C -->
