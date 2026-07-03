---
name: HTML Entity Encoder / Decoder
title: HTML Entity Encoder & Decoder | PrivacyKit
description: Escape and unescape HTML entities in your browser. Encode only the five unsafe characters or all non-ASCII text, as named or numeric references.
category: encoding
keywords:
  - html entities
  - html encode
  - html escape
  - ampersand escape
  - unescape html
icon: code
related:
  - url-encoder-decoder
  - base64-encoder-decoder
  - markdown-preview
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: "Which characters do I actually have to escape in HTML?"
    a: >-
      Two are non-negotiable: `&` (which starts every character reference) and
      `<` (which starts every tag) must be escaped anywhere in text content.
      Inside attribute values you also need whichever quote delimits the
      attribute — `"` or `'`. The default "special characters only" mode
      escapes all five, which is exactly the set needed to place arbitrary
      text safely between tags or in a quoted attribute.
  - q: "What is the difference between &amp;, &#38; and &#x26;?"
    a: >-
      All three decode to the same ampersand. `&amp;` is a named character
      reference, `&#38;` is a decimal numeric reference (U+0026 is 38 in
      decimal) and `&#x26;` is the hexadecimal form. Browsers treat them
      identically. Named references are easier to read; numeric references
      cover every character, including the thousands that have no name. The
      decoder here accepts all three, and the checkbox switches the encoder
      between named and decimal output.
  - q: "Should I encode accented letters like é and ü?"
    a: >-
      Not for a normal web page — with a UTF-8 charset declaration (the
      default everywhere now) the raw characters are valid and far easier to
      read in source. The "everything non-ASCII" mode exists for the leftover
      cases: HTML email, feeds consumed by unknown parsers, or files that a
      legacy system might re-encode as Latin-1 or Windows-1252. A reference
      like `&eacute;` survives any of that because it is plain ASCII.
  - q: "Why did an entity without a semicolon still decode?"
    a: >-
      The HTML standard keeps a list of legacy named references that browsers
      must recognise even without the trailing semicolon — `&amp`, `&lt`,
      `&copy` and a few dozen others. The `he` library this tool uses follows
      that parsing spec, so `Fish &amp Chips` decodes to `Fish & Chips`,
      matching what a browser would render. Newer names such as `&hellip;`
      only decode with the semicolon present.
  - q: "Why is &bogus; still in my output after decoding?"
    a: >-
      A reference only decodes if its name is on the HTML standard's list of
      roughly 2,200 named character references. Anything unrecognised — a typo
      like `&accute;`, or an ampersand that never started an entity — passes
      through unchanged rather than being guessed at. If you expected a
      character there, check the spelling or use the numeric form, which
      always works: `&#233;` is é regardless of naming.
  - q: "Is escaping these five characters enough to prevent XSS?"
    a: >-
      Only in the two contexts it is designed for: text between tags and
      values inside quoted attributes. It does nothing for other contexts — a
      URL in `href` (where a `javascript:` scheme needs no angle brackets at
      all), unquoted attributes, inline event handlers, or text inside a
      `<script>` block. Escape for the specific context you are inserting
      into, and treat entity encoding as one layer of defence, not the whole
      of it.
  - q: "Does the HTML I paste here get uploaded anywhere?"
    a: >-
      No. Conversion runs entirely in your tab: the `he` library's entity
      tables arrive as one static JavaScript file, fetched on first use, and
      after that no request carries any of your input. You can keep the
      network panel open while converting — the only request you will see is
      that library file, and it is downloaded before your text is processed,
      not because of it.
---
Paste a line of user-typed text straight into a page and the first stray `<`
swallows the rest of your paragraph into a broken tag; a lone `&` can mangle the
character that follows it. Escaping rewrites those characters as references the
browser draws as literal symbols, so the text shows up exactly as written
instead of being parsed as markup.

## How to use

1. Leave **Direction** on *Encode* to turn text into entities, or switch it to
   *Decode* to read entities back as plain characters.
2. Under **Characters to encode**, keep *Special characters only* for ordinary
   page text, or pick *Everything non-ASCII too* when the result has to be pure
   ASCII (accents, dashes and emoji become references as well).
3. Tick or clear **Prefer named references** to choose between readable names
   like `&eacute;` and numeric forms like `&#233;`.
4. Type or paste into the input box — the output updates as you type. **Swap ⇅**
   moves the result into the input and flips the direction in one press.
5. **Copy** the output, or **Download** it as a `.txt` file. When decoding, the
   scope and named-reference controls switch off, since decoding accepts every
   form at once.

## How it works

The five characters HTML treats specially — `&`, `<`, `>`, `"` and `'` — never
need the full entity tables, so encoding them runs off a small built-in lookup:
each match is swapped for its named reference (`&amp;`, `&lt;`, and so on) or its
decimal reference (`&#38;`, `&#60;`) depending on the checkbox. The heavier work
— encoding every non-ASCII character, and all decoding — is handed to the `he`
library, whose reference tables load once on first use rather than with the page.
Very large pastes are processed in 256k-character slices so a big block never
freezes the tab.

Take `Beyoncé & Jay — 2 < 3`. In *special characters only* mode the output is
`Beyoncé &amp; Jay — 2 &lt; 3` — only the ampersand and the less-than sign are
touched; the accent and em dash stay as raw characters, which is correct on any
UTF-8 page. Switch to *everything non-ASCII too* with named references on and it
becomes `Beyonc&eacute; &amp; Jay &mdash; 2 &lt; 3`, now valid plain ASCII. Turn
named references off and the same input yields `Beyonc&#233; &#38; Jay &#8212; 2
&#60; 3`. Decoding any of those three reverses cleanly to the original line.

## Use cases & limitations

You reach for encoding when you are building HTML by hand — a templating layer
without automatic escaping, an email body, an RSS or Atom feed, or a value going
into a CMS field that renders raw. The *everything non-ASCII* mode earns its keep
for content that a legacy system might re-encode as Latin-1, where a bare `é`
could break but `&eacute;` never will. Decoding is the everyday companion: pasting
a log line, an API response, or scraped markup and wanting to read what it
actually says.

The honest limit is that this escapes for two contexts only — text between tags
and values inside quoted attributes. It is not a general sanitiser: a
`javascript:` URL in an `href`, an unquoted attribute, or anything inside a
`<script>` block needs context-specific handling that entity encoding does not
provide. For encoding data destined for a query string or path segment, the
[URL encoder / decoder](/tools/url-encoder-decoder/) is the right tool instead,
and if you are round-tripping text through binary-safe transport, the
[Base64 encoder / decoder](/tools/base64-encoder-decoder/) covers that. To see
how encoded snippets render, drop them into the
[Markdown preview](/tools/markdown-preview/).
