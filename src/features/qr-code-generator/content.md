---
name: QR Code Generator
title: QR Code Generator — Free, No Signup, PNG & SVG | PrivacyKit
description: Create QR codes for URLs, text, Wi-Fi logins and contact cards entirely in your browser. Set size, colours and error correction, then download PNG or SVG.
category: images
keywords:
  - qr code
  - qr generator
  - free qr code
  - wifi qr
  - qr code maker
icon: qrcode
related:
  - url-cleaner
  - slug-generator
  - base64-file
  - image-compressor
privacy: local
popular: true
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Why won't my QR code scan after I changed the colours?
    a: >-
      Scanners binarise the image and expect dark modules on a light
      background. Invert that — light squares on a dark background — and many
      readers fail outright; colour pairs with less than about 3:1 contrast
      fail in dim lighting even when they preview fine on screen. The tool
      warns you when your chosen colours are inverted or too close. Keeping
      the foreground dark and the background light is the reliable fix.
  - q: How much data fits in a QR code?
    a: >-
      The largest QR symbol (version 40, 177×177 modules) holds 2,953 bytes at
      error correction level L, dropping to 2,331 at M, 1,663 at Q and 1,273
      at H. Content is counted in UTF-8 bytes, so accented letters and CJK
      characters cost more than one byte each. The status line under the
      preview shows your live byte count against the limit for the level you
      picked.
  - q: What do the error correction levels L, M, Q and H mean?
    a: >-
      Every QR code carries Reed–Solomon error correction so a scuffed or
      partly obscured print still scans. Level L can recover roughly 7% of
      the code, M about 15%, Q 25% and H 30%. Higher levels make the code
      denser for the same content, so pick L or M for long URLs and Q or H
      for codes that will be printed small, laminated, or overlaid with a
      logo.
  - q: How does a Wi-Fi QR code actually work?
    a: >-
      It encodes a plain string in the de facto `WIFI:` format — for example
      `WIFI:T:WPA;S:HomeNet;P:hunter2;;` — which iOS and Android camera apps
      parse to offer one-tap joining. This tool backslash-escapes special
      characters in the SSID and password (`\` `;` `,` `"` `:`) so networks
      with punctuation in their names still work. One caveat: the password
      sits in the code as readable text, so anyone who scans it can also read
      it.
  - q: Is my Wi-Fi password or contact info uploaded when I generate a code?
    a: >-
      No. The encoder is a JavaScript library bundled with this page, and the
      code is drawn onto a canvas element on your device — generating makes no
      network requests, which you can confirm from the network tab of your
      browser's developer tools. Nothing you type is stored once you close
      the tab.
  - q: Should I download the PNG or the SVG?
    a: >-
      SVG is vector, so it scales from a business card to a poster without
      blurring and can be recoloured in design software. PNG is a
      fixed-resolution raster at whatever the size slider is set to (128 to
      1,024 pixels), which suits documents, slides and web pages. Anything
      headed to a commercial printer should be the SVG.
  - q: What is the quiet zone, and can I set the margin to zero?
    a: >-
      The quiet zone is the blank border around the code. The QR specification
      calls for four modules of it, which is this tool's default margin
      setting. You can reduce it to zero for a tight layout, but on a busy or
      dark background scanners struggle to find the code's edges — keep the
      default unless the code will sit on generous empty space.
---

<!-- content-pending: Phase C -->
