---
name: Image Resizer
title: Image Resizer — Resize Photos in Your Browser | PrivacyKit
description: Resize JPEG, PNG and WebP images in your browser by pixel dimensions or percentage, keep the aspect ratio, and download the new file — nothing is uploaded.
category: images
keywords:
  - image resizer
  - resize image
  - resize photo
  - change image size
  - scale image
icon: photo-edit
related:
  - image-compressor
  - image-converter
  - exif-remover
  - favicon-generator
privacy: local
popular: true
updated: 2026-07-07
jsonLdCategory: UtilitiesApplication
faqs:
  - q: How do I resize an image without distorting it?
    a: >-
      Leave **Lock aspect ratio** ticked. The width and height you enter then
      act as a box: each image is scaled to fit inside it and keeps its own
      shape, so nothing is stretched. Type one dimension and the other fills in
      from the loaded image's ratio — a 4032 × 3024 photo fitted to a 1200 px
      width becomes 1200 × 900. Untick the lock only when you deliberately want
      to force an exact width and height, which can squash the picture.
  - q: Does resizing an image make the file smaller?
    a: >-
      Usually, because fewer pixels means fewer bytes to store. Halving both
      sides removes about three-quarters of the pixels — a 4000 × 3000 image at
      50% becomes 2000 × 1500, a quarter of the area — and JPEG or WebP output
      shrinks roughly in step. If you want a smaller file at the *same*
      dimensions, the [image compressor](/tools/image-compressor/) is the better
      fit: it trades quality for size without changing resolution.
  - q: Can I enlarge a small image?
    a: >-
      Yes — set a percentage above 100, or a target larger than the source — but
      know what you get. Upscaling invents pixels by interpolating between the
      ones already there; it cannot recover detail that was never captured, so a
      320 × 240 thumbnail blown up to 1280 × 960 looks soft. The Lanczos filter
      used here keeps edges cleaner than a plain browser stretch, but no
      resampler adds real detail that isn't in the original.
  - q: What resampling method does the resizer use?
    a: >-
      Every image is resized with **pica**, which runs a Lanczos3 filter in a
      Web Worker. Against the bilinear scaling a browser does when you just set
      an `<img>` width, Lanczos holds fine edges and text with far less blur and
      fewer stair-step artefacts — which is why a downsized screenshot stays
      legible here. Large images are handled in tiles so the tab keeps
      responding while they process.
  - q: Are my photos uploaded anywhere?
    a: >-
      No. Each file is decoded, resized and re-encoded entirely inside your
      browser tab — the resizing runs in a Web Worker on your own device, and
      the page makes no network request carrying image data. Open your browser's
      network tab while you drop a file to confirm it, and note the tool keeps
      working with the connection switched off once the page has loaded.
  - q: Does resizing keep transparency and photo orientation?
    a: >-
      PNG and WebP output preserve the alpha channel, so transparent backgrounds
      survive. JPEG has no transparency, so converting to JPEG fills any
      transparent areas with white rather than the black a raw canvas would
      give. Orientation is read from the EXIF flag before resizing, so a
      portrait phone shot stays upright. The round trip through a canvas drops
      all other EXIF metadata, including GPS — a side effect, not a promise; use
      the [EXIF remover](/tools/exif-remover/) when scrubbing metadata is the
      actual goal.
---

## How to use

1. Drop images onto the box, or click it to browse — JPEG, PNG, WebP, GIF or BMP, up to 20 files and 30 MB each.
2. Choose how to size them under **Resize by**: **Percentage of original** scales every image by one factor, while **Width & height** fits each to a target box.
3. In percentage mode, set the slider anywhere from 1% to 200%. In dimensions mode, type a width and/or height and keep **Lock aspect ratio** ticked so each photo holds its own shape.
4. Set the **Output format** — keep the source type, or convert to JPEG, PNG or WebP — then move the **Quality** slider, which only affects JPEG and WebP output.
5. Images resize the moment they land; after you change any setting, press **Resize with current settings** to re-run the batch, then take each file or press **Download all**.

## How it works

Every image is decoded off the main thread, with its EXIF orientation flag applied so a photo shot sideways still lands upright. The tool then computes the target size, hands the pixels to pica — a resampler running a Lanczos3 filter in a Web Worker — and writes the result back to a file through the canvas API.

What the target size comes to depends on the mode. Percentage multiplies both sides by the slider value. In Width & height mode with the ratio locked, the two numbers act as a bounding box: the image is scaled by the smaller of width ÷ original-width and height ÷ original-height, so it fits inside without stretching. Load a 4160 × 3120 phone photo (a 4:3 frame) and set the box to 1080 × 1080. The tool weighs 1080 ÷ 4160 = 0.2596 against 1080 ÷ 3120 = 0.3462, keeps the smaller, and scales everything by 0.2596 — the output is 1080 × 810, saved as `beach-1080x810.jpg`. The box was square, but the picture kept its 4:3 shape. Because JPEG carries no alpha channel, choosing it composites the image onto a white background first, and the 0.85 quality value is passed straight to the encoder.

## Use cases & limitations

Reach for this the moment an upload form rejects your photo for being too big, when a blog or CMS expects images at a fixed column width, or when a folder of screenshots needs trimming to one consistent size before you file a bug report. Enlarging is possible too, though interpolation can't reinvent detail the sensor never recorded, so blown-up images read soft.

Two limits are worth knowing. Everything is written back through a canvas, so an animated GIF collapses to its first frame — that one frame is saved as a PNG, not a moving image. And any lossy round trip recompresses: resizing a JPEG at 0.85 quality re-encodes it, so putting the same file through repeatedly will slowly soften its edges. When you want a smaller file at the *same* resolution, the [image compressor](/tools/image-compressor/) trades quality for bytes without changing dimensions; to swap only the file type, the [image converter](/tools/image-converter/) is the direct path; and for square app icons at set sizes, the [favicon generator](/tools/favicon-generator/) handles the crop-and-scale in one pass.

## Privacy note

Nothing you drop here is uploaded. Decoding, resizing and re-encoding all happen inside the tab — pica's filter runs in a Web Worker on your device, and the page never issues a request that carries pixel data, so a batch finishes just as readily with the network switched off after the page has loaded. The file you download is a fresh copy; where it goes next is entirely your call.
