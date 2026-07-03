---
name: Color Converter
title: Color Converter — HEX, RGB, HSL & OKLCH | PrivacyKit
description: Convert any CSS colour between HEX, RGB(A), HSL(A) and OKLCH in the browser. Paste a value or pick from a live swatch, then copy — with WCAG contrast built in.
category: math
keywords:
  - color converter
  - hex to rgb
  - rgb to hsl
  - oklch
  - color picker
  - hex code
icon: palette
related:
  - number-base-converter
  - image-compressor
  - qr-code-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: How do I convert a HEX code to OKLCH?
    a: >-
      Paste the hex value (for example `#7c3aed`) into the input and the OKLCH
      row updates immediately — you don't press a button. The tool resolves the
      colour to sRGB, linearises each channel, maps it through the OKLab LMS
      matrix and converts to lightness, chroma and hue. `#7c3aed` comes out as
      `oklch(54.1% 0.2466 293.01)`. Use the copy button on that row to grab it.
  - q: What colour formats can I paste in?
    a: >-
      Anything the browser itself accepts as a CSS colour: 3-, 4-, 6- and
      8-digit hex (`#f00`, `#ff0000`, `#ff000080`), `rgb()`/`rgba()`,
      `hsl()`/`hsla()`, `oklch()`, and the 148 named colours like
      `rebeccapurple` or `tomato`. Parsing is done by assigning your text to a
      hidden element's `color` property, so if the browser understands it, so
      does this tool. Unrecognised input shows an inline error instead of a
      guess.
  - q: Why does my OKLCH value differ slightly from another converter?
    a: >-
      Two reasons. First, the colour is resolved through the sRGB gamut, so an
      OKLCH input with more chroma than sRGB can display gets clamped to the
      nearest visible colour before it's read back — the round-trip won't be
      bit-exact. Second, converters round L, C and H at different decimal
      places. The underlying maths here follows Björn Ottosson's original OKLab
      definition; the numbers match to within rounding.
  - q: Does 8-digit hex with alpha work?
    a: >-
      Yes. An 8-digit hex like `#3366ffcc` or an `rgba()`/`hsla()` value carries
      its alpha through every output: HEX shows the `aa` suffix, RGB and HSL gain
      their fourth argument, and OKLCH appends `/ 0.8`. The swatch sits on a
      checkerboard so partial transparency is actually visible rather than
      blended into the page background.
  - q: What do the contrast numbers against white and black mean?
    a: >-
      They're WCAG 2.1 contrast ratios: the relative luminance of your colour
      compared with a pure white and a pure black background, from 1:1 (no
      contrast) to 21:1 (black on white). The badge reads AAA at 7:1 or higher,
      AA at 4.5:1, and Fail below that for normal body text. It uses the opaque
      colour — alpha is ignored, because contrast depends on what ends up behind
      the transparency.
  - q: When should I use OKLCH instead of HSL?
    a: >-
      Reach for OKLCH when you want lightness to mean the same thing across
      hues. In HSL, `hsl(60 100% 50%)` (yellow) and `hsl(240 100% 50%)` (blue)
      share an L of 50% yet yellow looks far brighter. OKLCH is perceptually
      uniform, so equal lightness values look equally light and you can build
      colour ramps or dark-mode variants by nudging one number. HSL is still
      handy for quick hue tweaks in older codebases.
---

<!-- content-pending: Phase C -->
