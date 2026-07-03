---
name: URL Encoder / Decoder
title: URL Encoder & Decoder — Percent Encoding | PrivacyKit
description: Percent-encode text with encodeURIComponent or encodeURI, or decode it back — locally in your browser, with the exact position of any broken % escape.
category: encoding
keywords:
  - url encode
  - url decode
  - percent encoding
  - encodeURIComponent
  - uri escape
icon: link
related:
  - base64-encoder-decoder
  - html-entities
  - url-cleaner
  - slug-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: What is the difference between encodeURI and encodeURIComponent?
    a: >-
      `encodeURIComponent` escapes every character with a reserved meaning in a
      URL — including `/`, `?`, `&`, `=` and `#` — so the result is safe to use
      as a single value inside a query string. `encodeURI` leaves those
      structural characters alone and only escapes characters a URL cannot
      contain at all, such as spaces and non-ASCII letters. Running
      `https://example.com/a b?x=1` through `encodeURI` gives
      `https://example.com/a%20b?x=1`, still a working URL, while
      `encodeURIComponent` would also escape the `://`, `?` and `=` and break
      the structure. Rule of thumb: values get `encodeURIComponent`, complete
      URLs get `encodeURI`.
  - q: Why do I get a "malformed URI" error when decoding?
    a: >-
      `decodeURIComponent` requires every `%` to start a valid escape — two hex
      digits that together form well-formed UTF-8. Two inputs commonly break
      that rule. A literal percent sign, as in `100% cotton`, fails because
      `% c` is not a hex pair. And escapes produced by legacy systems that
      encoded Latin-1 instead of UTF-8 fail because, say, `é` was written as
      `%E9` rather than UTF-8's `%C3%A9`. Instead of a bare exception, this
      tool reports the position (line and character) of the first broken
      escape so you can find and fix it.
  - q: Why are spaces sometimes %20 and sometimes +?
    a: >-
      Two different standards. RFC 3986, which governs URLs, encodes a space
      as `%20`. The older `application/x-www-form-urlencoded` format used by
      HTML forms writes `+` instead — but only in query strings and form
      bodies. `decodeURIComponent` deliberately leaves `+` untouched, so
      pasted form data can look half-decoded; tick **Decode + as spaces** and
      the tool converts each `+` to a space before decoding. When encoding,
      output always uses `%20`, which every parser accepts.
  - q: Should I encode the whole URL or just the parameter values?
    a: >-
      Encode the parts, then assemble. Pass each parameter value through
      `encodeURIComponent`, then join the pieces with literal `?`, `&` and `=`
      yourself. If you push an already-assembled URL through
      `encodeURIComponent`, the separators get escaped too and the server sees
      one giant, meaningless parameter. The `encodeURI` mode covers the
      narrower case where a finished URL merely contains spaces or non-ASCII
      characters and needs to be made valid without touching its structure.
  - q: Why does one accented character turn into several %XX escapes?
    a: >-
      Percent-encoding operates on bytes, and URLs use UTF-8, where most
      non-ASCII characters take more than one byte. `ñ` is two bytes, so it
      encodes to `%C3%B1`; `€` is three (`%E2%82%AC`); most emoji are four.
      When decoding, the tool reassembles the byte sequence back into the
      original character — and if the bytes do not form valid UTF-8, it points
      at the offending escape rather than printing mojibake.
  - q: Can I paste URLs containing tokens or API keys into this tool?
    a: >-
      Yes — encoding and decoding run entirely in your browser using the
      JavaScript engine's built-in `encodeURIComponent`, `encodeURI` and
      `decodeURIComponent` functions, and the result is written straight into
      the page. No request carries your input anywhere, nothing is logged or
      stored, and the tool keeps working offline once loaded. You can confirm
      this from the network tab of your browser's developer tools while you
      type.
---

<!-- content-pending: Phase C -->
