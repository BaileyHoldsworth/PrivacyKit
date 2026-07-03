---
name: Base64 Encoder / Decoder
title: Base64 Encode & Decode Online (UTF-8 Safe) | PrivacyKit
description: Encode text to Base64 or decode it back to UTF-8 text, entirely in your browser. URL-safe alphabet option, 76-column MIME wrapping and live byte counts.
category: encoding
keywords:
  - base64
  - base64 encode
  - base64 decode
  - b64
  - base64 converter
icon: binary
related:
  - base64-file
  - url-encoder-decoder
  - html-entities
  - jwt-decoder
privacy: local
popular: true
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Why does my decoded Base64 come out garbled or fail to decode?
    a: >-
      Two common causes. If the data was originally encoded from a different
      character set (say Latin-1) and is decoded as UTF-8, accented characters
      break — this tool always encodes and decodes as UTF-8, which is what
      nearly every modern system expects. If the Base64 wraps binary data (an
      image, a PDF, a compressed blob), it is not text at all: the decoder here
      detects invalid UTF-8 byte sequences and tells you so instead of printing
      mojibake. For binary payloads, the [Base64 file
      converter](/tools/base64-file/) is the right tool.
  - q: What is the difference between standard and URL-safe Base64?
    a: >-
      Standard Base64 uses `+` and `/` as its 63rd and 64th alphabet
      characters, and both have reserved meanings inside URLs. The URL-safe
      variant (RFC 4648 §5) swaps them for `-` and `_` and usually drops the
      `=` padding — it is what JWTs and most web tokens use. Ticking
      **URL-safe alphabet** applies exactly that when encoding; when decoding,
      both alphabets are accepted automatically, so pasted input never needs
      normalising first.
  - q: Is Base64 a form of encryption?
    a: >-
      No — it is an encoding, not encryption. Base64 maps every 3 bytes to 4
      characters from a public 64-character table, and anyone can reverse it
      instantly with no key. Never use it to hide passwords, API keys or
      personal data. Its actual job is making arbitrary bytes safe to carry
      through text-only channels such as JSON, XML, email bodies and data URIs.
  - q: Why is the Base64 output about 33% longer than my input?
    a: >-
      The encoding spends 4 output characters on every 3 input bytes, so
      output length is input × 4⁄3, rounded up to a whole 4-character block.
      Encoding the 5 bytes of `koala` gives the 8 characters `a29hbGE=`. Note
      it is *bytes* that count, not characters: `€` is one character but three
      UTF-8 bytes. The counters under each pane show both figures so you can
      see the ratio for your own data.
  - q: What do the `=` signs at the end of Base64 mean?
    a: >-
      They are padding. Output is emitted in 4-character blocks, but the final
      block may carry only 1 or 2 input bytes, so `=` fills the leftover
      positions — one `=` means the last block encodes 2 bytes, two means it
      encodes 1. The decoder here tolerates missing padding (a bare URL-safe
      token still decodes), but stricter parsers elsewhere may reject unpadded
      input, so keep the padding unless you know the consumer strips it.
  - q: Why does the tool report an invalid character when I paste Base64?
    a: >-
      The usual culprits ride along with the copy: smart quotes from a chat
      app, a trailing full stop from the end of a sentence, or the
      `data:image/png;base64,` prefix of a data URI — delete everything up to
      and including the comma. The error names the offending character and its
      position (line and column for wrapped input) so it is quick to find.
      Spaces and line breaks are fine; they are ignored during decoding.
  - q: What is the 76-character line wrap for?
    a: >-
      MIME (RFC 2045) caps encoded lines in email bodies at 76 characters, so
      mail libraries emit wrapped Base64. Tick **Wrap at 76 characters** when
      you need output that matches such a library byte-for-byte, or when
      pasting into an email template. The wrap only inserts line breaks —
      decoders, including this one, strip whitespace before decoding, so
      wrapped and unwrapped output decode to identical bytes.
---

<!-- content-pending: Phase C -->
