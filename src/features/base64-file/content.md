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

<!-- content-pending: Phase C -->
