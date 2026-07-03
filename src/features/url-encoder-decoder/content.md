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

## How to use

1. Set **Direction** to *Encode* to turn text into percent-encoding, or *Decode* to reverse it. The lower pane updates as you type — there is no button to press.
2. When encoding, choose the **Encoding function**: *encodeURIComponent* for a single value such as one query parameter, or *encodeURI* for a whole URL. The hint below the menu names exactly which characters each one leaves untouched.
3. Paste your text into the top pane. The character counts under each pane update live, which makes it easy to see when a short string has ballooned into a long run of escapes.
4. Tick **Encode each line separately** to treat every line as its own value, so a newline is not turned into `%0A`. When decoding, tick **Decode + as spaces** if the input came out of an HTML form body.
5. **Copy** or **Download** the result, or press **Swap ⇅** to move the output back into the input field and reverse the conversion — a quick check that a value survives a round trip intact.

## How it works

Percent-encoding replaces a character with a `%` followed by the two hexadecimal digits of each byte that character occupies. URLs carry text as UTF-8, so a single character can span several bytes, and every byte gets its own `%XX` escape.

Run the search value `crème brûlée` through *encodeURIComponent*. The plain ASCII letters pass straight through; the space becomes `%20`. Each accented letter is two UTF-8 bytes: `è` is `0xC3 0xA8` → `%C3%A8`, `û` is `0xC3 0xBB` → `%C3%BB`, and `é` is `0xC3 0xA9` → `%C3%A9`. Stitched together the value reads `cr%C3%A8me%20br%C3%BBl%C3%A9e`, ready to sit after `?q=`. Switch to *encodeURI* and the same text encodes identically, because it contains no URL-structural characters — the two functions only diverge once a `/`, `?`, `&`, `=` or `#` appears.

Decoding reverses that byte-by-byte, and when it cannot — a `%` without two hex digits behind it, or an escape run that is not legal UTF-8 — the tool pins down the first offending escape and names its position instead of throwing a bare exception.

## Use cases & limitations

The usual moment for this tool is building a link by hand: encoding one parameter value before you drop it into a query string, or working out why a value containing an `&` split one parameter into two. It is equally useful in reverse — pulling an encoded value out of a server log, an OAuth redirect, or a `curl` invocation and reading what it actually says.

One limitation worth stating plainly: the tool escapes characters, it does not parse URL grammar, so it cannot tell you whether the surrounding URL is otherwise valid. A related trap is double-encoding. Feeding already-encoded text back through *encode* escapes the `%` signs themselves — `%20` becomes `%2520` — so if input looks encoded already, decode it first or use **Swap**. To strip tracking parameters from a link rather than escape it, reach for the [URL cleaner](/tools/url-cleaner/); to turn a title into a hyphenated path segment, the [slug generator](/tools/slug-generator/) does the normalising for you; and for the other half of web encoding — arbitrary bytes as text — see the [Base64 encoder / decoder](/tools/base64-encoder-decoder/).

## Privacy note

Every conversion calls the JavaScript engine's own `encodeURIComponent`, `encodeURI` and `decodeURIComponent`, and writes the result straight into the page. A URL you paste — signed redirects, session tokens and all — never leaves the tab, nothing is logged, and the tool keeps working after you disconnect the network.
