---
name: Image Compressor
title: Image Compressor — Shrink JPG, PNG & WebP | PrivacyKit
description: Compress JPEG, PNG and WebP images in your browser. Set a max dimension and quality, convert formats, and see the exact bytes saved — files never upload.
category: images
keywords:
  - image compressor
  - compress jpg
  - compress png
  - reduce image size
  - image optimizer
icon: photo-down
related:
  - exif-remover
  - exif-viewer
  - base64-file
  - qr-code-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Why does my PNG barely shrink?
    a: >-
      PNG is a lossless format, so the quality slider has no effect on it —
      the encoder stores the pixels exactly or not at all. The two ways to
      make a PNG meaningfully smaller here are lowering the max dimension
      (a 4000 px screenshot resized to 1920 px keeps under a quarter of the
      pixels) or converting to WebP or JPEG, which are lossy. For photographs
      saved as PNG, converting to WebP at quality 0.8 routinely removes 80–90%
      of the size.
  - q: Does compressing an image remove its EXIF metadata?
    a: >-
      Yes. Each image is decoded to raw pixels and re-encoded through a
      canvas, and metadata — camera model, capture time, GPS coordinates —
      does not survive that round trip. Treat this as a side effect, not a
      guarantee you have verified: if stripping metadata is the actual goal,
      use the [EXIF remover](/tools/exif-remover/), which is built for exactly
      that, and confirm the result in the [EXIF viewer](/tools/exif-viewer/).
  - q: What quality setting should I use?
    a: >-
      For photos going on the web, 0.75–0.85. At 0.8 most people cannot pick
      the compressed version from the original, and a 4.8 MB phone photo with
      the 1920 px limit typically lands between 300 and 600 KB. Below about
      0.7, artefacts start to show in fine detail like hair, foliage and text;
      above 0.9, the file size climbs steeply for differences you will not see.
  - q: Are my photos uploaded to a server?
    a: >-
      No. Files are read into memory inside your tab and compressed by a Web
      Worker running on your own device — the page makes no network request
      containing image data, which you can confirm in your browser's network
      tab while compressing. Once the page has loaded, the tool keeps working
      with the connection switched off.
  - q: Should I convert to WebP or JPEG?
    a: >-
      WebP is typically 25–35% smaller than JPEG at comparable visual quality
      and supports transparency, and every current browser displays it. Choose
      JPEG when the file has to open in older software — some desktop mail
      clients and image editors still refuse WebP. Keep the original format
      when you don't control where the file ends up.
  - q: Why did a file come out larger than the original?
    a: >-
      Because it was already efficiently compressed — re-encoding an
      optimised JPEG can add bytes rather than remove them. When the output
      format is set to "keep", this tool detects that case and returns your
      original file untouched (the row reads "kept the original bytes").
      Format conversions are always returned converted, even when slightly
      larger, since the point of those was the format change.
  - q: Does the max dimension setting stretch small images?
    a: >-
      No — it only ever shrinks. An image whose longest side already fits
      under the limit keeps its exact pixel dimensions; scaling happens only
      when the width or height exceeds the setting, and the aspect ratio is
      always preserved. Upscaling would add pixels without adding detail, so
      the tool never does it.
---

## How to use

1. Drag one or more images into the box, or click to open a file picker — up to 20 files per batch, JPEG, PNG or WebP, 30 MB each.
2. Set **Max dimension (longest side)** to cap resolution. 1920 px suits most web use; pick **Keep original size** to compress without resizing.
3. Choose an **Output format**: keep each file's own format, or convert the whole batch to JPEG or WebP.
4. Slide **Quality** (0.50–0.95). It changes JPEG and WebP output only; 0.80 is a sound starting point.
5. Files compress as they arrive, each row showing before → after bytes. Change any setting and press **Recompress with current settings** to redo the batch, then grab files individually or with **Download all**.

## How it works

Each file is handed to a Web Worker running the `browser-image-compression` library, so the encoding never blocks the page or leaves your device. The worker decodes the file to raw pixels, draws them onto a canvas, and — if you set a max dimension and the longest side is above it — scales the canvas down, keeping the aspect ratio. It only ever shrinks: an image already under the limit is left at its native size. The canvas is then re-encoded to your chosen format at the quality you set, and JPEG/WebP quality is passed straight through as the encoder's `initialQuality`. When the format is left on "keep", the tool compares the re-encoded bytes against the original and returns whichever is smaller, so an already-optimised file is never made larger.

Take a 7.1 MB JPEG straight off a camera at 4608 × 3456 pixels, with **Max dimension** set to 2560 and **Quality** at 0.85. The longest side, 4608, is above 2560, so the canvas is scaled by 2560 ÷ 4608 ≈ 0.556, giving 2560 × 1920 — about 0.556², or 31%, of the original pixel count. Re-encoding those fewer pixels at quality 0.85 typically lands the file near 700 KB: roughly a 90% reduction, most of it from the resize rather than the quality drop, with no visible difference at screen size.

## Use cases & limitations

This is the tool for getting a photo under an upload cap — a 5 MB form limit, an email attachment ceiling — or for trimming page-weight before publishing images to a site. Batch mode handles a folder of gallery shots in one pass, and because everything runs locally, it keeps working with the network switched off once the page has loaded.

The honest limits: re-encoding JPEG and WebP is lossy, and running the same file through repeatedly compounds that loss, so compress from an original rather than a previous output. Resizing throws pixels away permanently — there is no upscale and no undo, so keep your originals. And as the FAQ on PNGs explains, the quality slider does nothing to a PNG, since PNG is lossless; shrink those by lowering the dimension or converting to WebP.

## Privacy note

Your images never leave the browser. Each file is read into memory in your tab and compressed by a Web Worker on your own machine, and even the compression library is served from this site's own domain rather than a third-party CDN, so no image data is sent anywhere. Because the round trip through a canvas discards metadata, EXIF fields like GPS coordinates and capture time are dropped as a side effect — but if scrubbing metadata is the real goal, reach for the purpose-built [EXIF remover](/tools/exif-remover/) and confirm the result in the [EXIF viewer](/tools/exif-viewer/).
