---
name: EXIF Metadata Viewer
title: EXIF Viewer — See Photo Metadata & GPS Online | PrivacyKit
description: Inspect the EXIF metadata inside a photo — camera model, exposure settings, timestamps and embedded GPS coordinates — parsed locally in your browser.
category: images
keywords:
  - exif viewer
  - photo metadata
  - exif data
  - image metadata
  - gps photo
icon: photo-search
related:
  - exif-remover
  - image-compressor
  - browser-fingerprint
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: How can I tell if a photo contains GPS location data?
    a: >-
      Drop the photo on the viewer and check the GPS section. If the camera or
      phone recorded a position, you'll see decimal latitude and longitude, a
      warning badge, and a link that opens the exact point on OpenStreetMap.
      If the section reports none found, the file carries no readable GPS tags
      — either location services were off at capture time or a later export
      stripped them.
  - q: Why does my photo show no EXIF data at all?
    a: >-
      Most large platforms remove metadata on upload — photos saved from
      WhatsApp, Facebook, Instagram or X arrive with EXIF already gone.
      Screenshots never had camera metadata to begin with, and many editors
      discard it on export unless told otherwise. An empty result here is
      usually good news for privacy: the data was removed before the file
      reached you.
  - q: Which image formats can this viewer read?
    a: >-
      JPEG and TIFF are the classic EXIF carriers and parse most reliably.
      HEIC/HEIF (the iPhone default since iOS 11) and AVIF are supported too,
      and PNGs are checked for the optional `eXIf` chunk some tools write.
      Formats with no EXIF container — GIF, BMP, SVG — report that
      no metadata was found.
  - q: How precise are the GPS coordinates stored in a photo?
    a: >-
      Phones store the fix straight from the GPS chip, typically accurate to
      within 5–10 metres outdoors. EXIF keeps latitude as degrees, minutes and
      seconds in three rational numbers; the viewer converts these to decimal
      degrees (for example 33.868800° S, 151.209300° E). That's precise enough
      to identify a specific building — which is exactly why it's worth
      checking before sharing a photo.
  - q: Does the photo I drop here get uploaded anywhere?
    a: >-
      No. The file is opened with your browser's File API and parsed in-page
      by the open-source exifr library, which reads only the header regions
      where metadata lives — the pixel data mostly isn't touched. You can
      verify this yourself: open the network tab in your browser's developer
      tools and load a photo; no request is made.
  - q: Can I remove the metadata this viewer finds?
    a: >-
      This page only reads. To strip tags, use the
      [EXIF remover](/tools/exif-remover/), which re-encodes the image without
      its metadata block. One honest trade-off: re-encoding a JPEG
      recompresses the pixels slightly. Your file system's "date modified" is
      separate from EXIF dates and isn't affected by either tool.
---

## How to use

1. Drag a photo onto the drop area, or click it to browse — JPEG, TIFF, HEIC/HEIF, AVIF and PNG are all accepted.
2. Selecting several files at once opens the first straight away and parks the rest under **Queued files**; press **View** beside any of them to inspect it next.
3. Read the five panels — Camera, Capture settings, GPS location, Dates, and Software & authorship. The badge on the GPS panel says **Location embedded** or **No location** so you can judge exposure at a glance.
4. Grab the results with **Copy as text** for a readable summary, or **Download .json** for the raw tag dump exactly as it was parsed.
5. Hit **Clear** to release the file and blank every panel before loading the next one.

## How it works

Metadata lives in a small header block at the front of an image file, separate from the pixels. When a file arrives, the viewer hands it to [exifr](https://github.com/MikeKovarik/exifr), an open-source parser that walks the TIFF, EXIF and GPS segments of that header, then maps each raw tag key onto a labelled, formatted row. Raw EXIF values are rarely display-ready, so the tool reformats them on the way out.

Take a frame from a Fujifilm X-T5. Its EXIF might store `ExposureTime` as `0.008`, `FNumber` as `5.6`, `ISO` as `400` and `FocalLength` as `35`. The Capture panel never prints those bare numbers: since `0.008` is below one second, the shutter formatter reports `1/125 s` — because `round(1 ÷ 0.008) = 125` — while aperture becomes `f/5.6` and focal length picks up its unit as `35 mm`. A `DateTimeOriginal` field arrives as a date object and is rendered as `2026-05-18 07:42:10`.

GPS is the tag worth watching. exifr resolves the degrees-minutes-seconds rationals into a single signed decimal per axis; the viewer then reads the sign to pick a hemisphere letter. A latitude of `-37.813611` and longitude of `144.963056` display as **37.813611° S, 144.963056° E**, alongside a link that drops a pin on that exact point in OpenStreetMap. Miss either coordinate and the panel falls back to **No location** — no fabricated position.

## Use cases & limitations

Photographers lean on this to confirm what a camera actually recorded — the ISO a shot was pushed to, the lens that was mounted, whether flash fired. Editors and researchers use it to sanity-check a photo's claimed origin: a timestamp and a body serial number are hard evidence, and an embedded GPS fix can place a picture to within a building. Most people, though, open it for one reason — to see what a photo would tell a stranger before they post it.

The honest limits are worth stating. An empty result is not proof a file was never tagged; it usually means a platform or editor stripped the block earlier, so absence of evidence isn't evidence the original lacked location. This page reads only — it cannot delete anything. When you want the tags gone, the [EXIF remover](/tools/exif-remover/) re-encodes the image without its metadata block, and the [image compressor](/tools/image-compressor/) shrinks a file while dropping most of it as a side effect. One more quirk: HEIC and TIFF thumbnails don't preview in every browser, but their metadata still parses even when the little image stays blank.

## Privacy note

The photo never leaves your device. It's opened through the browser's File API and parsed in the page; the exifr library itself (about 50 KB gzipped) is only fetched the moment a file is dropped, and no image data is sent anywhere before, during or after parsing. Copies and JSON downloads are generated locally too. If you'd rather check than trust, open your developer tools, watch the network tab, and load a dozen photos — you won't see a single upload. For a wider look at what your browser alone reveals, the [browser fingerprint](/tools/browser-fingerprint/) tool shows the other half of the picture.
