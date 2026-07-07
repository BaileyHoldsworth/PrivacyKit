---
name: Favicon Generator
title: Favicon Generator — Make a Favicon from an Image | PrivacyKit
description: 'Turn any image into a favicon: PNG icons at 16, 32, 48, 180, 192 and 512 px plus a multi-size favicon.ico, generated in your browser with the HTML to paste.'
category: images
keywords:
  - favicon generator
  - favicon
  - ico generator
  - make favicon
  - favicon from image
icon: browser
related:
  - image-resizer
  - image-converter
  - qr-code-generator
  - color-converter
privacy: local
affiliateGroup: dev
popular: false
updated: 2026-07-07
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Which files does this generate, and do I need all of them?
    a: >-
      You get a `favicon.ico` (containing 16, 32 and 48 px images), separate
      `favicon-16x16.png`, `favicon-32x32.png` and `favicon-48x48.png`, an
      `apple-touch-icon.png` at 180 px, and `icon-192.png` / `icon-512.png` for
      a web app manifest. A small site can ship just the `.ico` plus the two
      PNG icons; add the Apple and 192/512 files when you want a clean home-screen
      icon on iOS and Android.
  - q: Why produce a favicon.ico as well as PNG files?
    a: >-
      `.ico` is the one format every browser has read since the 1990s, and a
      bare request for `/favicon.ico` is still what many crawlers and older
      browsers ask for. Modern browsers prefer the PNGs you point them at with
      `<link>` tags because a single PNG is smaller and sharper. Shipping both
      means the fallback works and current browsers still get the crisp version.
  - q: My logo is not square — what happens to it?
    a: >-
      Every icon is square, so a non-square image is centre-cropped to its
      shorter side before scaling. A 1200×800 banner becomes an 800×800 crop
      taken from the middle, then resized down. If the important part of your
      artwork sits off-centre or near an edge, crop it to a square yourself
      first so nothing you care about gets trimmed.
  - q: How do I actually add these to my website?
    a: >-
      Put the files in your site root (the same folder as `index.html`) and
      paste the generated `<link>` block into your page `<head>`. The tags name
      each file and its size so the browser picks the right one. If your files
      live in a subfolder, change the `href` paths to match — the copy button
      gives you the exact markup for root-level files.
  - q: Does the favicon.ico really hold several sizes in one file?
    a: >-
      Yes. The ICO container starts with a 6-byte directory header, followed by
      one 16-byte entry per image recording its width, height and byte offset,
      then the image payloads themselves. This tool embeds the 16, 32 and 48 px
      PNGs as those payloads — PNG-compressed data inside an ICO is understood by
      every current browser — so one `favicon.ico` serves three resolutions.
  - q: Why does my icon look muddy at 16×16?
    a: >-
      Sixteen pixels square is roughly the size of a single character of text,
      so fine detail, thin strokes and small lettering cannot survive the
      downscale. A favicon that reads well is usually one bold shape or a single
      letter with high contrast against its background. If the 16 px preview is
      unclear, simplify the source art rather than expecting the resizer to
      rescue detail that no longer fits.
  - q: Can I use a transparent PNG?
    a: >-
      You can, and the browser favicons keep the transparency. The catch is the
      Apple touch icon: iOS ignores transparency and composites it onto black,
      which can leave a dark box around a logo meant for light backgrounds. Tick
      the background option to fill transparent areas with a colour of your
      choice before the icons are drawn, and the 180 px Apple icon will match.
  - q: Is my image uploaded to a server?
    a: >-
      No. The picture is decoded, cropped and resized on a `<canvas>` in your
      own browser, and each icon is created with `canvas.toBlob()`. No file
      leaves your device and nothing is stored — you can confirm it by opening
      the network tab and watching it stay silent while you generate.
---

<!-- content-pending: round2 content -->
