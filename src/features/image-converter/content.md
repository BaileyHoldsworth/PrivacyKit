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

## How to use

1. Drag your images into the drop zone, or click to open a file picker. Each file starts converting the moment it lands — there is no separate "go" button. A batch holds up to 30 files at 40 MB each, and PNG, JPG, WebP, GIF, BMP and AVIF are accepted as input.
2. Choose the target in **Convert to** — JPG, PNG or WebP. This sets what the *next* conversion produces; it does not re-run files already in the list.
3. Set the **Quality** slider (0.40 to 1.00, default 0.85). It governs JPG and WebP output only — PNG is lossless and ignores the value, so the slider greys out when PNG is selected.
4. Heading to JPG from an image with transparency? Keep **Fill transparency with white** ticked so the see-through areas come out white instead of black.
5. Press **Reconvert with current settings** to apply any changed option to every file in the batch at once.
6. Save with each row's **Download** button, grab the lot with **Download all**, or empty the list with **Clear**.

## How it works

Conversion never touches the encoded bytes of your original. The file is handed to `createImageBitmap`, which decodes it to a raw pixel grid; that grid is drawn onto an off-screen `<canvas>` sized to the image's native dimensions; then `canvas.toBlob(type, quality)` asks the browser to re-encode those pixels in the format you picked. Because a canvas stores nothing but pixels, the output carries no EXIF, timestamp or GPS tag from the source. JPEG is the one target with no alpha channel, so when **Fill transparency with white** is on the tool paints the whole canvas white *before* drawing — otherwise a blank canvas is transparent black and the gaps encode as black.

A worked run: drop a 4032 × 3024 phone photo, `harbour-morning.jpg`, weighing 6.2 MB, and pick WebP at quality 0.80. `createImageBitmap` decodes the 12.2-megapixel frame, the canvas is set to 4032 × 3024, `drawImage` copies every pixel across, and `toBlob('image/webp', 0.80)` returns roughly 1.1 MB. The row shows the sizes side by side — `JPG → WEBP · 6.2 MB → 1.1 MB` and about an 82% reduction — and the location tag your phone wrote into the JPEG is absent from the WebP because it was never on the canvas.

## Use cases & limitations

Most people arrive with a concrete mismatch: an upload form that rejects PNG and demands JPG, a website that loads faster on WebP, or a folder of screenshots too heavy to email. Batch-converting to WebP, or to JPG at a sensible quality, is usually the fastest way to cut upload size without installing anything.

Some honest limits. Animated GIFs flatten — `createImageBitmap` returns only the first frame, so the result is a single still, not an animation. Anything wider or taller than 16,384 pixels is refused, since that is the canvas ceiling in mainstream browsers; downscale an oversized panorama with the [image resizer](/tools/image-resizer/) first. And this tool changes *format*, not dimensions — if a photo is already the right format but still too large, the [image compressor](/tools/image-compressor/) trims file size while leaving it as-is. Files convert one at a time, so a batch of big photos finishes in sequence rather than all in one burst.

## Privacy note

Every step above runs inside the browser tab. The decode (`createImageBitmap`) and the encode (`canvas.toBlob`) are local browser calls, so the photos are never sent anywhere, and once the page has loaded the converter keeps working with no connection at all. Each decoded bitmap is freed from memory as soon as its file is encoded, and the only text drawn to the screen is the filename you supplied. Want to check rather than trust it? Watch the network panel in your developer tools while a batch runs — nothing leaves.
