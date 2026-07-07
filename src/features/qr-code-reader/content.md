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
<!-- content-pending: round2 content -->
