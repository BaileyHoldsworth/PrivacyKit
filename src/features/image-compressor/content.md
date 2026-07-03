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

<!-- content-pending: Phase C -->
