---
name: EXIF / Metadata Remover
title: EXIF Remover — Strip Photo Metadata Online | PrivacyKit
description: Remove EXIF metadata — GPS position, camera model, timestamps — from JPEG, PNG and WebP photos in your browser, with the cleaned output verified by exifr.
category: images
keywords:
  - remove exif
  - strip metadata
  - clean photo
  - remove gps from photo
  - metadata remover
icon: photo-x
related:
  - exif-viewer
  - image-compressor
  - url-cleaner
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: SecurityApplication
faqs:
  - q: What metadata does this actually remove?
    a: >-
      Everything, because nothing is copied selectively. Each photo is decoded
      to raw pixels and redrawn onto a blank canvas, so EXIF (camera, lens,
      GPS coordinates, capture time), XMP, IPTC captions, embedded thumbnails
      and maker notes are all left behind in the discarded original. The ICC
      colour profile is dropped too — the output is written as plain sRGB.
  - q: Does stripping EXIF data reduce image quality?
    a: >-
      For JPEG and WebP, slightly: the pixels are re-encoded at quality 0.95,
      a recompression that is normally invisible but does mean the output is
      not bit-identical to the original. PNG stays lossless. If you need the
      compressed image data untouched, a byte-level editor like `exiftool`
      rewrites only the metadata segments — this tool trades that precision
      for a guarantee that no hidden segment survives.
  - q: How do I know the metadata is really gone?
    a: >-
      The tool does not ask you to take its word for it. After re-encoding,
      each output file is parsed again with exifr — checking the EXIF, GPS,
      XMP, ICC and IPTC segments — and only an empty result earns the green
      "no metadata found" badge. You can cross-check any cleaned file in the
      [EXIF viewer](/tools/exif-viewer/) or with `exiftool -a photo-clean.jpg`
      on your own machine.
  - q: Can anyone see my photos when I clean them here?
    a: >-
      No. Decoding, canvas re-encoding and the exifr verification all run
      inside your browser tab; the image bytes are never sent anywhere. You
      can load the page, go offline, and clean photos with the network cable
      unplugged — the tool behaves identically.
  - q: Don't Instagram and Facebook strip EXIF anyway?
    a: >-
      The copies those platforms *display* have location data removed, but the
      platform itself still receives the original file, metadata included, and
      may retain it. Files you share directly — email attachments, cloud-drive
      links, messaging apps, marketplace listings — usually keep every field
      intact. Stripping metadata before the file leaves your device is the
      only version of this you control.
  - q: Why do colours look slightly different after cleaning?
    a: >-
      The ICC colour profile is itself metadata, so it is removed along with
      everything else and the output is assumed to be sRGB. Photos taken on
      wide-gamut screens or cameras (Display P3 on recent iPhones, for
      instance) can lose a touch of saturation as a result. On most monitors
      the shift is imperceptible, but it is a real trade-off of the
      strip-everything approach.
  - q: Can it clean HEIC, RAW or GIF files?
    a: >-
      Not at the moment. The tool accepts JPEG, PNG and WebP — the formats
      browsers can both decode and re-encode natively. For HEIC photos from an
      iPhone, export as JPEG first (Settings → Camera → Formats → Most
      Compatible, or share from the Photos app). RAW files carry some of the
      heaviest metadata of all but need dedicated software to convert.
---

## How to use

1. Drop your photos into the upload box, or click to pick them from disk. JPEG, PNG and WebP are accepted, and you can queue a whole folder at once.
2. Watch each row as it processes. A yellow badge reports how many metadata fields were found in the original (and flags GPS separately); a green **Output verified — no metadata found** badge confirms the cleaned copy came back empty.
3. Check the before/after size for each file — the re-encode usually shrinks JPEGs slightly and can grow PNGs.
4. Press **Download** on any row, or **Download all** to save every cleaned copy in sequence. Your original files are never touched.

## How it works

Stripping happens by throwing the metadata away rather than editing it out. Each photo is handed to `createImageBitmap()`, which decodes the compressed file into raw pixels. Those pixels are painted onto a fresh, blank `<canvas>`, and the canvas is re-encoded with `canvas.toBlob()`. Because a canvas holds only a grid of colour values — no EXIF block, no XMP packet, no embedded thumbnail — everything that was wrapped around the original pixels is left behind in the file you dropped, which is then discarded.

Take a marketplace photo called `couch-for-sale.jpg`, 3.8 MB, 4000 × 3000 pixels, shot on a phone. Parsing it with exifr returns 27 populated fields: the camera make and model, the exposure settings, the capture timestamp, and a GPS pair at latitude −37.8136, longitude 144.9631 — the exact spot in Melbourne where the shot was taken. After the canvas round-trip, JPEG output is re-encoded at quality 0.95, giving a 2.7 MB file. The tool then parses that output with exifr a second time; the result is empty, so 0 fields remain and the green badge appears. The 27 fields, GPS included, are gone because nothing copied them across.

PNG follows the same path but encodes losslessly, so its pixels are bit-identical to the decoded original — only the metadata differs.

## Use cases & limitations

The moment this matters is just before a file leaves your control: listing furniture, posting a rental photo, emailing an attachment, or handing images to a client. Any of those can carry the coordinates of your home. Cleaning first, then confirming with the green badge, means the coordinates never travel. To inspect exactly what a photo is carrying before you strip it, open the [EXIF viewer](/tools/exif-viewer/); to trim the tracking parameters off any link you paste alongside the image, the [URL cleaner](/tools/url-cleaner/) does the same job for URLs.

The honest limitations: everything is discarded indiscriminately, so genuinely useful metadata — copyright tags, colour profiles — goes with the rest, and a JPEG re-encoded at 0.95 is not byte-identical to the source. Very large photos are also rejected, because browsers cap a canvas at 16384 pixels per side, so a stitched panorama wider than that must be resized before cleaning. If you only want smaller files rather than metadata removal, reach for the [image compressor](/tools/image-compressor/) instead.

## Privacy note

Decoding, the canvas redraw, the re-encode, and both exifr verification passes all run inside your browser tab. The image bytes are never uploaded — you can disconnect from the network after the page loads and clean photos exactly as before. Nothing is stored and no copy reaches us, which is the whole point: metadata about where and when a photo was taken is only truly removed if the removal happens on your own device.
