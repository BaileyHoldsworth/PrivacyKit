---
name: Image Converter
title: Image Converter — PNG, JPG & WebP | PrivacyKit
description: Change images between PNG, JPG and WebP in your browser using canvas — nothing is uploaded. Set the output format and quality, convert in batches, drop EXIF.
category: images
keywords:
  - image converter
  - png to jpg
  - jpg to webp
  - convert image
  - webp converter
icon: transform
related:
  - image-resizer
  - image-compressor
  - exif-remover
  - base64-file
privacy: local
popular: true
updated: 2026-07-07
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Why did my transparent PNG get a black or white background as a JPEG?
    a: >-
      JPEG has no alpha channel — every pixel must be opaque. When a PNG with
      transparency is converted to JPEG, the see-through areas are flattened
      onto a background colour. A blank canvas is transparent black, so by
      default those areas turn black. Tick **Fill transparency with white** to
      composite onto white instead. PNG and WebP output keep the alpha channel,
      so the option only applies when you convert to JPEG.
  - q: Can I convert HEIC or HEIF photos from my iPhone?
    a: >-
      No. Decoding HEIC/HEIF needs libheif, which is LGPL-licensed, and this
      site ships no LGPL code — so a dropped `.heic` file is rejected with that
      reason rather than silently failing. Browsers also can't decode HEIC
      through the `createImageBitmap` API this tool relies on. On an iPhone,
      set Camera → Formats to "Most Compatible" to capture JPEG, or convert the
      HEIC on-device first, then bring the JPEG here.
  - q: Does converting to JPG or WebP reduce quality?
    a: >-
      Yes — both are lossy, so re-encoding discards some detail according to the
      quality slider (0.85 is a reasonable default). PNG is lossless, so
      converting to PNG never changes the pixels, though it usually produces a
      much larger file for photographs. Each conversion decodes the original
      once and encodes fresh output, so converting an already-lossy image again
      compounds the loss — start from the highest-quality source you have.
  - q: Does the converter remove EXIF and GPS metadata?
    a: >-
      Yes, as a side effect. The image is decoded to raw pixels on a canvas and
      encoded again from those pixels alone, and a canvas carries no EXIF, GPS
      coordinates, or camera model — so the output is metadata-free. If
      stripping metadata is the actual goal and you want to keep the original
      format and quality, the [EXIF remover](/tools/exif-remover/) is the more
      direct tool for that job.
  - q: Which format should I choose — PNG, JPG or WebP?
    a: >-
      Reach for JPG for photographs where file size matters and transparency
      isn't needed. Choose PNG for screenshots, logos, line art, and anything
      with sharp edges or transparency that must stay pixel-exact. WebP does
      both — it supports alpha and produces smaller files than JPG at
      comparable quality — and every current browser can display it, which
      makes it a strong default for images headed to the web.
  - q: Are my images uploaded to a server?
    a: >-
      No. Decoding and encoding run through `createImageBitmap` and
      `canvas.toBlob` inside your browser; the files never leave your device.
      You can confirm it by opening the network tab of your developer tools
      while you convert — there are no upload requests. Because everything is
      local, the tool also keeps working after you go offline, once the page
      has loaded.
---
<!-- content-pending: round2 content -->
