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

## How to use

1. Set the **Direction** menu to *Encode — text to Base64* or *Decode — Base64 to text*. The pane labels and placeholders change to match.
2. When encoding, tick **URL-safe alphabet** if the output goes into a URL or token, and **Wrap at 76 characters** if it feeds an email or other MIME consumer. Both options are ignored while decoding, which accepts either alphabet and skips whitespace.
3. Type or paste into the input pane. Conversion runs as you type; the line under each pane reports character and byte counts so you can watch the size change.
4. Grab the result with **Copy**, or use **Download** to save it as a `.txt` file.
5. Hit **Swap ⇅** to push the output back into the input and flip direction — handy for confirming a value round-trips cleanly. **Clear** empties the input.

## How it works

The scheme reads your input three bytes at a time — 24 bits — and re-slices those 24 bits into four groups of 6. Each 6-bit group (a value from 0 to 63) indexes one character in a fixed 64-entry table, so 3 bytes always become 4 printable characters. Text is first run through the browser's `TextEncoder`, turning it into UTF-8 bytes before any of this begins.

Take the word `Café`. It is four characters but five bytes, because `é` is a single character that UTF-8 stores as two bytes: the full sequence is `[67, 97, 102, 195, 169]`. The first triple `67 97 102` becomes `Q2Fm`. That leaves two bytes over, `195 169`, which fill three of the four output slots as `w6k`; a single `=` pads the empty fourth slot, marking that the final block carried two bytes rather than three. The complete encoding is `Q2Fmw6k=`. Decoding runs the mapping in reverse, then hands the recovered bytes to `TextDecoder` in strict mode — so anything that is not valid UTF-8 is reported as binary instead of printed as garbled characters.

## Use cases & limitations

You reach for Base64 whenever raw bytes have to travel through a channel that only tolerates text: inlining a small icon as a `data:` URI, dropping a binary blob into a JSON field, matching the `Content-Transfer-Encoding` a mail library produced, or eyeballing the payload segment of a token before feeding the whole thing to the [JWT decoder](/tools/jwt-decoder/). If you are wrangling percent-encoding for query strings instead, that is a different transform handled by the [URL encoder / decoder](/tools/url-encoder-decoder/).

The honest limit: this page is built for *text*. It decodes only to UTF-8 and refuses byte sequences that are not valid text, because printing mojibake helps nobody. An image, PDF, font or compressed archive should go through the [Base64 file converter](/tools/base64-file/), which decodes to a downloadable file. Also worth remembering — encoding inflates size by roughly a third, so Base64 is a transport wrapper, not a way to shrink or protect data.

## Privacy note

Every conversion happens on your device. `TextEncoder`, the Base64 mapping and `TextDecoder` all run in the page, and no input is ever sent over the network — you can confirm that in your browser's network tab. Because it is local, pasting a token or key to inspect its bytes is fine here. Just remember Base64 is reversible by anyone: use it to move data, never to hide it.
