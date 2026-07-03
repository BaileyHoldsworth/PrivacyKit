---
name: Lorem Ipsum Generator
title: Lorem Ipsum Generator — Placeholder Text | PrivacyKit
description: "Generate lorem ipsum placeholder text in your browser: set paragraphs, sentences or words, keep the classic opening, output plain text or HTML paragraphs."
category: text
keywords:
  - lorem ipsum
  - placeholder text
  - dummy text
  - filler text
icon: blockquote
related:
  - word-counter
  - markdown-preview
  - uuid-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: What does "lorem ipsum" actually mean?
    a: >-
      Nothing readable — and that is the point. The words are scrambled
      fragments of Cicero's *De finibus bonorum et malorum* (sections 1.10.32
      and 1.10.33, written around 45 BC), with letters dropped and words
      truncated until the Latin stopped parsing. "Lorem" itself is the tail
      end of "dolorem" (pain), chopped mid-word.
  - q: Why use lorem ipsum instead of real text or repeated words?
    a: >-
      Its letter and word-length distribution is close to natural language, so
      a layout filled with it looks realistically "text-shaped" — unlike
      "text text text", which forms visible stripes. At the same time it is
      unreadable, so reviewers judge the typography and spacing instead of
      getting caught up editing draft copy.
  - q: Why does generated text usually start with "Lorem ipsum dolor sit amet"?
    a: >-
      Convention. Printers' specimen sheets have opened with that phrase since
      long before Letraset's 1960s transfer sheets popularised it, and many
      people (and some automated tests) use it to recognise placeholder text
      on sight. The **Start with "Lorem ipsum…"** toggle pins those five words
      to the front of the first sentence; switch it off for a fully random
      opening.
  - q: How does this generator build sentences and paragraphs?
    a: >-
      It draws from the classic 63-word lorem vocabulary using your browser's
      cryptographic random source. Each sentence takes 6–14 words, capitalises
      the first and ends with a full stop; each paragraph strings together 4–8
      sentences. In words mode you get exactly the number of words you asked
      for, unpunctuated.
  - q: What does the HTML output option change?
    a: >-
      Each paragraph is wrapped in `<p>…</p>` tags, ready to paste into a
      template, CMS body field or email markup without reformatting. In
      sentence and word modes the whole output goes inside a single `<p>`
      element. Plain-text mode separates paragraphs with a blank line instead.
  - q: Will two runs ever produce the same text?
    a: >-
      Only the pinned opening repeats. Everything after it is assembled at
      random on your device each time you press regenerate, so any two runs
      diverge within a few words — useful when adjacent mockup blocks need to
      look like different content rather than copies of one block.
---

## How to use

1. Choose what to count from the **Generate** menu — Paragraphs, Sentences or Words. The hint beside the count box updates to match the new ceiling (100 paragraphs, 500 sentences or 2,000 words).
2. Type how many you want in **How many**. A blank box, a fraction or a number outside the range replaces the output with an inline message rather than producing anything.
3. Keep **Start with "Lorem ipsum dolor sit amet"** ticked for the familiar opening, or clear it so the first line is drawn at random like the rest.
4. Tick **HTML output** when you want each block wrapped in `<p>` tags instead of plain paragraphs separated by blank lines.
5. Press **Regenerate** for a fresh draw and use **Copy** above the box. The Words and Characters counters underneath refresh on every change you make.

## How it works

Behind the controls sits a fixed vocabulary of 63 Latin-looking words — the standard passage, from *lorem* and *ipsum* through to *laborum*. Each word is drawn with your browser's cryptographic random source, and every pick is compared against the word before it and redrawn once if they match, so you never get an accidental "dolor dolor". A sentence gathers between 6 and 14 of these words, capitalises the first letter and closes with a full stop; a paragraph joins 4 to 8 such sentences. When the opening is pinned, only the very first sentence of the very first block carries the five fixed words — everything after is random.

Take a concrete run in **Words** mode: count set to 12, opening pinned. The tool lays down the five guaranteed words — lorem, ipsum, dolor, sit, amet — then draws seven more at random, capitalises the leading letter and adds no punctuation, since word mode is deliberately unpunctuated. One draw produced:

> Lorem ipsum dolor sit amet nostrud veniam officia tempor aliqua deserunt cillum

That is 12 words and 79 characters, both reported live in the counters below the box. Tick **HTML output** and the identical line comes back as `<p>Lorem ipsum dolor sit amet … cillum</p>` — a single wrapping element, because only paragraph mode emits one `<p>` per block.

## Use cases & limitations

Placeholder text earns its keep whenever the layout matters more than the words: a page template waiting on real copy, a CMS body field you are styling, an email design under review, or a component you want to see wrap across several lines. Because the letter and word-length spread mimics real prose, the block looks convincingly text-shaped while staying unreadable, so a reviewer critiques spacing and hierarchy instead of editing your draft. Paste a few paragraphs into the [markdown preview](/tools/markdown-preview/) to check heading rhythm, or run the result through the [word counter](/tools/word-counter/) when a field has a character budget. For placeholder record IDs to sit beside the text, the [UUID generator](/tools/uuid-generator/) pairs well.

The honest limit is that this is Latin-flavoured nonsense with a fairly even texture. It will not stress-test how a layout copes with a very long German compound, a right-to-left script, an emoji run, or the awkward reality of genuine content, so treat a lorem-filled mockup as a typography check rather than proof the design survives real data. And apart from the pinned opening, every run is freshly randomised on your device — handy for making adjacent blocks look distinct, but it means the output is never reproducible, so don't wire it into a snapshot test that expects the same text twice.
