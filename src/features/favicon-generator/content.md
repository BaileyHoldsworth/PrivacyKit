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

## How to use

1. Drop an image onto the upload area, or click it to pick one from your device. PNG, JPEG, WebP, GIF and SVG are all accepted, and a square source needs the least trimming.
2. If the artwork has transparent regions and you want them filled, tick **Fill transparent areas with a background** and choose a colour with the picker beside it. Leave it unticked to carry the transparency through.
3. Watch the list populate — every size renders as soon as the file loads, each with a live thumbnail and its byte size. Change the background and the whole set redraws on the spot.
4. Click **Download all** to save the `favicon.ico` and all six PNGs together, or use a row's own **Download** button for a single file.
5. Copy the `<link>` markup shown under the previews and paste it inside your page's `<head>`.

## How it works

All six icons come from a single decoded copy of your source. The image is read with `createImageBitmap`, centre-cropped to a square on its shorter side, then scaled down to each target — 16, 32, 48, 180, 192 and 512 px — and encoded as PNG through `canvas.toBlob()`.

The downscale is the part that decides whether a 16 px icon is crisp or mushy. Rather than jumping straight from full size to the target, the tool halves the image repeatedly until one more halving would undershoot, then does the final resize, applying high-quality smoothing at each step.

Work it through with a 640×480 wordmark. The shorter side is 480, so 80 pixels are trimmed from the left and 80 from the right, leaving the centre 480×480 square. To reach the 32 px icon the canvas steps 480 → 240 → 120 → 60, then draws that 60 px image down to 32 — halving stops at 60 because the next half, 30, would land below the target. Each halving folds a 2×2 block of source pixels into one, so thin strokes fade gently instead of breaking into jagged stair-steps.

The three smallest PNGs, 16, 32 and 48 px, are then packed into a single `favicon.ico`, so one classic `/favicon.ico` request serves three resolutions while the standalone PNGs cover what modern browsers and mobile home screens ask for by name.

## Use cases & limitations

You reach for this at the end of a build, when a site or web app is nearly ready and needs its whole icon set — the legacy `.ico`, the sharp PNGs, the 180 px Apple touch icon and the 192/512 px manifest sizes — without opening a design tool or wiring up a build step. It suits a fresh project, a rebrand, or an internal dashboard that has run on a browser's blank default icon for far too long.

Two limitations are worth knowing. It creates the icon files and the `<head>` markup, but not the `site.webmanifest` JSON that points a mobile browser at `icon-192.png` and `icon-512.png` — you still add that small file yourself, and it does no safe-zone padding for Android maskable icons. And because the `.ico` stores PNG-compressed images, every current browser reads it, though a genuinely ancient one expecting old-style BMP data (Internet Explorer 6, say) will not. If your source is the wrong shape or format for a clean crop, prepare it first with the [image resizer](/tools/image-resizer/) or [image converter](/tools/image-converter/); to pin down the exact hex for a background fill, the [colour converter](/tools/color-converter/) will translate whatever value you already have.

## Privacy note

Everything runs against a `<canvas>` inside this tab. Your file is decoded, cropped and resized locally, each icon comes out of `canvas.toBlob()`, and the `favicon.ico` is assembled byte by byte from those PNGs in a typed array held in memory — none of it is sent anywhere, and no request reaches the network at any point in the process. The 30 MB size cap is a guard against exhausting your browser's memory, not a server limit. Close or clear the tab and every trace is gone; there is nothing on our side to delete.
