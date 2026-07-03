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

## How to use

1. Type or paste a colour into the **CSS colour** field. The sample loads on `#7c3aed`; replace it with any format your browser understands — hex, `rgb()`, `hsl()`, `oklch()`, or a name like `tomato`.
2. Prefer clicking? Use the small swatch button beside the field to open your system colour picker and drag to a shade.
3. Watch the four rows — HEX, RGB, HSL, OKLCH — rewrite on every keystroke. There is no convert button; the conversion is live.
4. Glance at the two contrast figures underneath when the colour is headed for text, since they tell you whether it will read against white or black.
5. Press **Copy** on the row whose format you need.

## How it works

Your text never gets parsed by hand. It is assigned to a hidden element's `color` property, and the browser's own CSS engine resolves it to an `rgb()` triple that the tool reads back — which is why the accepted input set is exactly the browser's accepted input set. From that one canonical RGB, each output row is computed independently.

Take `#E8622C`. The hex splits into the channel bytes `E8`, `62`, `2C`, giving RGB `232, 98, 44`. HSL comes from the largest and smallest normalised channels: max is 232/255 ≈ 0.910, min is 44/255 ≈ 0.173, so lightness is their midpoint, (0.910 + 0.173) / 2 ≈ 0.541, i.e. **54.1%**. Feeding the same channels through the hue and saturation formulas yields `hsl(17.2, 80.3%, 54.1%)`.

OKLCH takes a longer road. Each channel is linearised (undoing the sRGB gamma curve), mixed through Björn Ottosson's OKLab LMS matrix, cube-rooted, then converted from the resulting `L`, `a`, `b` coordinates to polar form: chroma is `hypot(a, b)` and hue is `atan2(b, a)` in degrees. For `#E8622C` that lands on `oklch(65.7% 0.1789 40.45)` — a lightness of 65.7%, moderate chroma, and a hue sitting in the orange arc near 40°.

The contrast figures use WCAG 2.1 relative luminance on the same linearised channels. This orange scores **3.38:1** on white (an *AA Large* pass, fine for headings but short of the 4.5:1 body-text bar) and **6.21:1** on black (a comfortable *AA*). One colour, five answers, all from that single resolved RGB.

## Use cases & limitations

The everyday job is translation: you have a hex out of Figma and need it as an `rgb()` for a canvas call, or you are migrating a palette to OKLCH so that dark-mode variants become one-number tweaks. The built-in contrast check saves a round-trip to a separate accessibility tool when you are choosing text colours. Because it reads hex bytes, it pairs naturally with the [number base converter](/tools/number-base-converter/) when you want the decimal value behind an `FF` or `2C` pair, and the swatches you settle on can go straight into a themed [QR code](/tools/qr-code-generator/).

The honest limitation is the gamut. Every input is resolved through the browser's sRGB path, so a wide-gamut Display P3 or Rec. 2020 colour is clamped to the nearest colour sRGB can show before it is measured. If you are authoring for HDR or P3 displays, treat the OKLCH output here as the sRGB-mapped version, not the full-gamut original. The native colour picker is opaque-only too, so dragging it discards any alpha you had typed.

