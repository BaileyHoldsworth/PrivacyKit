---
name: QR Code Reader
title: QR Code Reader — Scan or Upload a QR Code | PrivacyKit
description: "Read a QR code in your browser: upload or drop an image, or scan live with your camera. jsQR decodes the pixels locally and nothing is ever uploaded."
category: images
keywords:
  - qr code reader
  - qr scanner
  - scan qr code
  - read qr code
  - qr decoder
icon: scan
related:
  - qr-code-generator
  - url-cleaner
  - exif-viewer
  - base64-file
privacy: local
popular: false
updated: 2026-07-07
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Does the image or camera feed get uploaded anywhere?
    a: >-
      No. Decoding runs entirely inside the page: the file — or a single frame
      grabbed from your camera — is drawn to an in-memory canvas, and jsQR reads
      that pixel data locally. No network request is made, so you can open the
      browser's network tab and scan as much as you like to confirm nothing is
      sent. The camera stream is stopped the moment a code is found or you press
      Stop, and the video is never recorded.
  - q: It says "No QR code found" — what went wrong?
    a: >-
      jsQR needs the whole symbol in the frame with a little white border (the
      "quiet zone"), reasonably in focus, and not too small — roughly 100 pixels
      across at a minimum. Blur, strong glare, a steep angle, or a partly
      cropped code are the usual causes. Move closer, straighten up, and even
      out the lighting; for a code on a glossy screen, tilt slightly to kill the
      reflection.
  - q: Can it read a code straight from my phone or webcam?
    a: >-
      Yes, on an https page (or localhost). The **Scan with camera** button
      requests camera permission and prefers the rear camera on phones
      (facingMode `environment`). If permission is denied or no camera is
      present, you get a plain message and the upload path keeps working. Some
      browsers and managed-device policies block camera access outright — in
      that case the tool falls back to reading uploaded images.
  - q: A code decoded to a link — is it safe to open?
    a: >-
      Treat it like a link from a stranger. This reader shows the decoded URL as
      plain text and names the destination host instead of opening it, because
      QR codes are a common phishing vector ("quishing") — a sticker slapped
      over a real one can point anywhere. Read the host first, and if you are
      unsure, run the address through the [URL cleaner](/tools/url-cleaner/)
      before you visit it.
  - q: Which kinds of QR content can it decode?
    a: >-
      Any standard QR symbol, whatever it carries — a URL, a Wi-Fi join string
      (`WIFI:...`), a vCard contact, an email (`mailto:`), a phone number
      (`tel:`), a `geo:` location, or arbitrary text. The reader shows the raw
      text and labels the likely type. It does not decode other 2D barcodes such
      as Data Matrix, Aztec, or PDF417, and it reads one code per image.
  - q: Does it work offline?
    a: >-
      After the page has loaded, yes — decoding needs no server. The jsQR
      decoder is a small script fetched on first use; once your browser has
      cached it, uploading and camera scanning run with no connection at all. If
      the decoder cannot load because you went offline before it was cached, a
      message tells you to reconnect and try again rather than failing silently.
  - q: Can it pull a QR code out of a screenshot or PDF?
    a: >-
      A screenshot is just an image, so drop the PNG or JPEG straight in. A PDF
      is not an image file — export or screenshot the page holding the code
      first, then upload that. Very large images are scaled down before scanning
      to keep it fast, which can occasionally soften a tiny code; if that
      happens, crop tightly to the code and upload again.
---

## How to use

1. To read a code in front of you, press **Scan with camera** and accept the permission prompt; on a phone the rear camera is preferred, and scanning stops the instant a code is recognised — or whenever you press **Stop camera**.
2. To read a code you already have as a picture, drop a PNG, JPEG, WebP, GIF or BMP file onto the dropzone, or click it to pick one from disk.
3. Watch the **Decoded content** box: the raw text lands there and a badge names the likely type — URL, Wi-Fi, contact card, and so on.
4. If the badge turns orange for a link, read the destination host printed beneath it before acting; the reader will not open the address for you.
5. Press **Copy** to send the decoded text to your clipboard.

## How it works

Both paths converge on the same trick. Whatever the source — an uploaded file, or a single frame plucked from the live camera feed — it is painted onto an off-screen `<canvas>`, and `getImageData` hands back the raw RGBA pixels. Those pixels go to jsQR, a pure-JavaScript decoder that hunts for the three large square finder patterns that anchor every QR symbol, reconstructs the module grid, and reads it back into bytes. Big uploads are first scaled so their longest side is at most 2000 pixels (camera frames, 720) to keep each decode pass fast.

Suppose you drop in a screenshot of a café's Wi-Fi sticker. jsQR locates the finder patterns, reports a version-3 symbol, and returns the string `WIFI:S:Rosella-Guest;T:WPA;P:mango-wombat-1987;;`. A small regular-expression classifier reads that text, matches the `WIFI:` prefix, and labels it **Wi-Fi network**; the status line then says "Read a Wi-Fi network (version 3)." The whole string sits in the output box, so you can copy the password `mango-wombat-1987` straight out of it. Had the same code instead begun with `https://`, it would be flagged as a link, its host extracted and shown, and the badge shifted to a caution colour.

One detail worth knowing: uploads are decoded with jsQR's `attemptBoth` inversion mode, so a light-on-dark code reads just as reliably as a dark-on-light one. Camera frames skip that second attempt to keep the per-frame scan loop smooth.

## Use cases & limitations

The moment a QR turns up somewhere you do not fully trust — a flyer taped to a lamppost, a sticker on a parking meter, an image in an unexpected email — you want to see precisely where it leads before your phone's camera app opens it. It also earns its keep when you need the raw contents of a QR someone sent as a picture, or when you want to confirm that a code you just built with the [QR code generator](/tools/qr-code-generator/) actually encodes what you meant.

The limits are worth naming. The camera path samples frames with no torch or zoom control, so in dim light or at a distance you will often do better photographing the code with your normal camera app and dropping that photo in. And because each decode is a single JavaScript pass rather than the continuous, autofocusing scan a native app performs, a small or low-contrast symbol your phone locks onto instantly may need a tighter crop before it reads here.

## Privacy note

Nothing you scan leaves your device. The uploaded file — or the one camera frame under examination — is drawn to an in-memory canvas and read by jsQR right there in the page; no request carries the image, its pixels, or the decoded text anywhere. The camera stream is live only while you are actively scanning and is released the moment a code is found, you press Stop, or you switch away from the tab, and the video is never recorded. The single thing that touches the network is the decoder script itself, fetched once on first use and cached thereafter. Decoded links deserve their own caution: because a fresh sticker can be pasted over a real code, the tool prints the address as plain text instead of opening it, and you can run anything doubtful through the [URL cleaner](/tools/url-cleaner/) before you visit.

