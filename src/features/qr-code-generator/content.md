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

A café menu, a wireless login taped inside a cupboard door, a contact you want someone to save without thumbing it in by hand — all three collapse into the same black-and-white grid here. Point the tool at a URL, a block of text, a Wi-Fi network or a contact card, and it draws the matching QR code on your device, ready to export as PNG or SVG.

## How to use

1. Pick a **content type**: Text or URL, Wi-Fi network, or Contact card (vCard). The input fields swap to match — a single box for text, named fields for the other two.
2. Fill in the content. The code redraws as you type, so there is no generate button to press.
3. Set the **PNG size** slider (128 to 1,024 px) and the **quiet-zone margin**, then choose an **error correction** level from L to H.
4. Optionally change the **code colour** and **background colour**. A warning appears if the pair is inverted or falls below roughly 3:1 contrast.
5. Download the **PNG** for screens and documents, or the **SVG** for print. The exact string being encoded is shown in the payload box below the preview.

## How it works

Whichever content type you pick, the tool first assembles one plain string. Text passes through untouched; a Wi-Fi network becomes a `WIFI:` string; a contact becomes a vCard 3.0 record. Fields that could break the format are backslash-escaped first — for vCards, a literal backslash, newline, semicolon or comma inside any value is escaped so it stays data rather than structure.

That string is measured in UTF-8 bytes with `TextEncoder` and checked against the capacity of the largest QR symbol for your chosen level — 2,953 bytes at L down to 1,273 at H. If it fits, the bundled `qrcode` library encodes it: the bytes are wrapped with Reed–Solomon error-correction codewords, laid out as a square matrix of dark and light modules, and painted onto a `<canvas>` in your two chosen colours.

Take a contact card with first name Priya, last name Nkemelu, phone +61 401 222 333, email priya@ferngully.studio, organisation Ferngully Studio. The tool builds this exact payload, lines joined by CRLF:

```
BEGIN:VCARD
VERSION:3.0
N:Nkemelu;Priya;;;
FN:Priya Nkemelu
ORG:Ferngully Studio
TEL;TYPE=CELL:+61 401 222 333
EMAIL:priya@ferngully.studio
END:VCARD
```

That is 156 bytes of ASCII. At the default level M (capacity 2,331) the status line reads "156 of 2,331 bytes used" — comfortably within range, so a scan drops all five fields straight into the phone's contacts app.

## Use cases & limitations

This suits printed and physical placements: table tents, event badges, packaging, a network code for house guests, a business card that adds itself. If your payload is a link, strip the tracking cruft with the [URL cleaner](/tools/url-cleaner/) first — a shorter URL means a less dense, more forgiving code — and consider a readable path from the [slug generator](/tools/slug-generator/) for the destination. Exporting a large PNG for a flyer? Shrink it afterwards with the [image compressor](/tools/image-compressor/).

The honest limitation is density. A QR code is not a shortener: every extra byte adds modules, and a long URL at level H can print as a fine mesh that phones struggle to lock onto from a distance or in poor light. For big content, favour a short link and a lower error-correction level, or size the print up.

## Privacy note

Wi-Fi passwords and contact details count as sensitive, so nothing you type leaves the browser. The encoder is a JavaScript file bundled with the page, and the code is drawn on a canvas locally — generating and downloading make no network requests, which you can confirm in your browser's network tab. Once you close the tab, nothing you entered is kept. Do remember that the data is readable to anyone who scans the finished code: a Wi-Fi QR carries the password in plain text.
