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

<!-- content-pending: Phase C -->
