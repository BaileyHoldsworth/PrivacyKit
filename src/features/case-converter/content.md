---
name: Case Converter
title: Case Converter — camelCase, snake_case & More | PrivacyKit
description: Convert text between camelCase, PascalCase, snake_case, kebab-case, UPPERCASE, Title Case and more — all ten formats generated at once in your browser.
category: text
keywords:
  - case converter
  - uppercase
  - camelcase
  - snake case
  - kebab case
  - title case
icon: letter-case
related:
  - slug-generator
  - word-counter
  - regex-tester
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: How does the converter split camelCase or PascalCase input into words?
    a: >-
      It tokenises on three signals at once: whitespace, punctuation
      (underscores, hyphens, dots), and case boundaries inside a word. A
      lowercase-to-uppercase transition starts a new word, and a run of
      capitals followed by a capitalised word is kept together as an acronym —
      `XMLHttpRequest` splits into XML, Http, Request, so its snake_case is
      `xml_http_request` rather than `x_m_l_http_request`.
  - q: What is the difference between camelCase and PascalCase?
    a: >-
      Both join words with no separator and capitalise each word's first
      letter; the only difference is the first word. camelCase lowercases it
      (`invoiceLineItem`), PascalCase capitalises it (`InvoiceLineItem`). By
      convention camelCase names variables and functions in JavaScript and
      Java, while PascalCase names classes, types and React components.
  - q: Which words stay lowercase in Title Case?
    a: >-
      This tool follows the common editorial rule: articles (a, an, the),
      coordinating conjunctions (and, but, or, nor, for, so, yet) and
      prepositions of three letters or fewer (at, by, in, of, on, to, up,
      via…) stay lowercase — unless they are the first or last word, which
      are always capitalised. So `the lord of the rings` becomes "The Lord of
      the Rings", not "The Lord Of The Rings".
  - q: When should I use snake_case, kebab-case or dot.case?
    a: >-
      snake_case suits Python identifiers, database columns and JSON keys;
      SCREAMING_SNAKE marks constants and environment variables. kebab-case
      is the norm for URLs, file names and CSS classes — hyphens read as word
      separators to search engines but are not legal inside most programming
      identifiers. dot.case appears in configuration keys and package paths
      (`logging.level.root`).
  - q: What happens to numbers, accents and punctuation?
    a: >-
      Digits stay attached to their word when there is no case change
      (`utf8Decoder` → `utf8_decoder`), while a capital after a digit starts a
      new word. Accented letters follow Unicode casing rules (é ↔ É). In the
      joined formats punctuation acts as a separator and is dropped; the
      UPPERCASE, lowercase, Title Case and Sentence case outputs keep your
      original spacing and punctuation intact.
  - q: Is the text I paste sent anywhere?
    a: >-
      No. Every conversion is a handful of string operations run by the page
      itself — no request is made, so the tool keeps working offline once
      loaded, and you can confirm in your browser's network tab. One local
      limit applies: inputs beyond 1,000,000 characters are truncated for
      conversion, with a notice shown, to keep the page responsive.
---

## How to use

1. Paste or type your string into the **Text to convert** box — the ten formats below refresh as you type, about a sixth of a second after you stop.
2. Read the counter above the field: it reports how many words the tokeniser found alongside the raw character total.
3. Scan the **Converted** list for the row you want — UPPERCASE and lowercase sit at the top, the programming formats (camelCase down to dot.case) below them.
4. Press **Copy** on that row. Even when a long result is trimmed to an on-screen preview, Copy places the full string on your clipboard.
5. Hit **Clear** to empty the field and start over.

## How it works

The ten outputs fall into two families. UPPERCASE, lowercase, Title Case and Sentence case run straight across your text and preserve every space and mark of punctuation. The six joined formats — camelCase, PascalCase, snake_case, SCREAMING_SNAKE, kebab-case and dot.case — first break the text into words, then reassemble them with a chosen separator and capitalisation.

Word-splitting is where the real work sits. A regular expression grabs each run of letters or digits, then inserts a boundary in two places: where a lowercase letter or digit meets a capital, and where a block of capitals meets a capitalised word — the second rule keeps acronyms intact instead of exploding them letter by letter.

Take a concrete input: `readXMLConfig2File`. There is no whitespace or punctuation here, so the tokeniser works purely from case and digit changes. The `d→X` transition splits `read` off; the acronym rule holds `XML` together and starts a fresh word at the capital C of `Config`; the `2→F` transition separates `File` from `Config2`. The resulting words are read, XML, Config2, File. From those, snake_case becomes `read_xml_config2_file`, kebab-case becomes `read-xml-config2-file`, SCREAMING_SNAKE becomes `READ_XML_CONFIG2_FILE`, and camelCase becomes `readXmlConfig2File`. UPPERCASE, which ignores the split entirely, returns one unbroken run: `READXMLCONFIG2FILE`.

One detail worth catching there: `XML` came out as `Xml` in camelCase. The joined formats lowercase each word before recapitalising its first letter, so an all-caps acronym does not survive as caps once it lands mid-name.

## Use cases & limitations

Renaming a variable to match a codebase's convention, turning a heading into a URL slug, deriving an environment-variable name from a config label, or normalising a column list before a database import — these are the moments this tool saves a minute of fiddly retyping. Because it emits all ten formats simultaneously, you never have to decide up front which one you need; copy whichever row fits.

Two honest limits. First, that acronym flattening: camelCase and PascalCase will render `IPAddress` as `ipAddress` and `IpAddress`, not preserving the initialism — if a name's casing carries meaning your team relies on, eyeball the joined output before committing it. Second, Title Case applies one general editorial ruleset for minor words and cannot know your proper nouns or house style, so a product name or a domain term may need a manual capital afterwards.

For the kebab-case row specifically, if your goal is a clean web address rather than a rename, the [slug generator](/tools/slug-generator/) strips accents and collapses stray punctuation the way URLs want. The word tally shown above the box is a quick tokeniser count; for sentence, line and reading-time figures reach for the [word counter](/tools/word-counter/). And if you are curious how the splitting boundaries are drawn, the same pattern style is easy to prototype in the [regex tester](/tools/regex-tester/).
