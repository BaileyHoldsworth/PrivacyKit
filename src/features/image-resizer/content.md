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

<!-- content-pending: round2 content -->
