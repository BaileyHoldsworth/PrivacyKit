---
name: Base64 File Encoder
title: Base64 File Encoder — File to Data URI | PrivacyKit
description: Turn any file up to 10 MB into raw Base64 or a ready-to-paste data URI in your browser, or decode a data URI back into a downloadable file.
category: encoding
keywords:
  - file to base64
  - data uri
  - base64 image
  - data url generator
icon: file-code
related:
  - base64-encoder-decoder
  - image-compressor
  - hash-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Why is the Base64 output about a third bigger than my file?
    a: >-
      Base64 represents every 3 bytes of the file as 4 characters from a
      64-symbol alphabet, so each output character carries only 6 bits of the
      original data. That fixed 4:3 ratio means a 9 MB file becomes roughly
      12 MB of text, plus up to two `=` padding characters at the end. The
      overhead stat on this page reports the exact figure for your file — for
      anything beyond a few dozen bytes it settles at +33.3%.
  - q: When is a data URI better than linking to a file?
    a: >-
      When the asset is small and inseparable from the document using it — an
      icon inlined into a CSS `background-image`, a logo in a self-contained
      HTML report, a small font in a single-file demo. Inlining removes an
      HTTP request but also disables caching: the encoded bytes travel with
      every copy of the page. Past a few kilobytes, a plain linked file is
      usually the faster choice.
  - q: Why does the tool refuse files over 10 MB?
    a: >-
      Because the output is text you are expected to paste somewhere. A 10 MB
      file already produces about 13.7 MB of Base64, which is near the
      practical limit of what textareas, clipboards and code editors handle
      comfortably — and some browsers refuse to render very long data URIs at
      all. Beyond that size you almost certainly want the file itself, not a
      string version of it.
  - q: How does the tool decide the MIME type in the data URI?
    a: >-
      It uses the type your browser reports for the file, which comes from the
      filename extension as mapped by your operating system — a `.png` becomes
      `image/png`, a `.pdf` becomes `application/pdf`. The file's contents are
      never inspected to guess. If the extension is missing or unknown, the
      type falls back to `application/octet-stream`; you can edit the header
      of the copied data URI by hand if you need something more specific.
  - q: Can I turn a data URI back into the original file?
    a: >-
      Yes — paste it into the decode pane. The tool splits the URI at the
      first comma, reads the MIME type from the header, Base64-decodes the
      payload and hands the bytes back as a download. URL-safe Base64 (`-` and
      `_` in place of `+` and `/`), stripped padding and stray whitespace are
      normalised first, and percent-encoded data URIs (the kind without a
      `;base64` flag) are handled too. A filename is suggested from the MIME
      type unless you set your own.
  - q: Is the file uploaded anywhere while it's being encoded?
    a: >-
      No. The file is read into memory with the browser's FileReader API,
      converted to Base64 by script running on this page, and written into
      the output panes — no request carrying the file or the result is sent.
      The page keeps working if you go offline before dropping the file, and
      your browser's network tab will confirm nothing leaves.
  - q: Why won't the file open after I decode a data URI?
    a: >-
      The usual causes are truncation and misnamed extensions. Payloads copied
      out of logs or chat apps often lose their tail, and a Base64 string
      whose length no longer lines up will either fail to decode or produce a
      corrupt file. Decoding here validates characters and padding and reports
      the decoded byte count, so compare that against the expected file size.
      Also check the extension matches the real content — a PNG saved as
      `.jpg` confuses some viewers.
---

## How to use

1. Drop a file onto the box at the top, or click it to browse. Any type is accepted, up to 10 MB.
2. Check the three stats that appear — original size, Base64 size, and the exact overhead for this file.
3. Copy the **Raw Base64** pane when you want a plain string, or the **Data URI** pane for a `data:` value you can drop straight into an `<img src>` or a CSS `url()`. **Download .txt** saves the raw string to a file instead.
4. Going the other way? Paste a data URI or bare Base64 into the decode pane, optionally set a filename, and press **Decode & download** to get the original bytes back.

## How it works

Base64 exists because plenty of channels — a JSON field, an email header, a URL, a source file — only carry text safely, yet the thing you want to move is raw bytes. The encoding maps those bytes onto 64 printable characters (`A`–`Z`, `a`–`z`, `0`–`9`, `+` and `/`) by regrouping bits: three input bytes are 24 bits, which slice cleanly into four 6-bit groups, and each 6-bit value picks one character from that 64-symbol alphabet.

Take the three ASCII bytes of the word **Fox**. `F`, `o` and `x` are `0x46`, `0x6F` and `0x78`, or `01000110 01101111 01111000` in binary. Regrouped into six-bit chunks that becomes `010001 100110 111101 111000` — the values 17, 38, 61 and 56. Looking those up in the alphabet gives `R`, `m`, `9` and `4`, so `Fox` encodes to `Rm94`. This tool then wraps the string with the MIME type your browser reports for the dropped file, producing the data URI `data:text/plain;base64,Rm94`. When the input length is not a multiple of three, the last group is filled out with one or two `=` characters so the output always divides evenly into fours — that is why encoded text often ends in padding.

Decoding runs the map backwards. The tool splits a data URI at its first comma, reads the MIME type from the header, then Base64-decodes the payload — normalising url-safe variants (`-` and `_`) and stray whitespace first — and hands the bytes back as a download.

## Use cases & limitations

Reach for file-to-Base64 when an asset has to travel as text: inlining a small icon into a stylesheet, embedding a logo in a self-contained HTML report, dropping a font into a single-file demo, or pushing a binary through a JSON API that has no field for raw uploads. For plain strings rather than files, the [Base64 encoder/decoder](/tools/base64-encoder-decoder/) is the better fit.

The honest cost is size. Because every 3 bytes become 4 characters, the output is about 33% larger than the source, and inlined bytes cannot be cached separately from the document that holds them — past a few kilobytes, a linked file usually loads faster. That is also why encoding is capped at 10 MB here: the resulting ~13.7 MB of text is near the edge of what clipboards and editors handle. If your goal is a smaller inlined image, shrink it with the [image compressor](/tools/image-compressor/) before encoding, and use the [hash generator](/tools/hash-generator/) if you need to confirm a decoded file matches the original byte for byte.

## Privacy note

Your file is read into memory with the browser's `FileReader` API and converted on this page by script running in your tab — no request carrying the file or its Base64 result is ever sent. Encoding and decoding both keep working if you go offline after the page loads, and nothing is stored between sessions. To check this for yourself rather than take our word for it, open your browser's network tab and watch it stay silent while you drop a file.
