---
name: Word & Character Counter
title: Word Counter — Words, Characters & Reading Time | PrivacyKit
description: Count words, characters, sentences, paragraphs, reading and speaking time as you type. Unicode-aware counting that runs entirely in your browser.
category: text
keywords:
  - word count
  - character count
  - letter counter
  - reading time
  - sentence counter
icon: abc
related:
  - case-converter
  - lorem-ipsum-generator
  - text-diff
  - slug-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Why does my word count differ from Microsoft Word or Google Docs?
    a: >-
      Every counter draws word boundaries differently. This tool uses the
      browser's `Intl.Segmenter`, which applies the Unicode text-segmentation
      rules: *don't* is one word, *3.14* is one word, but *well-known* is two.
      Word and Docs mostly split on spaces, so a hyphenated compound counts as
      one word there. On ordinary prose the results land within a fraction of
      a percent of each other — if you're writing to a strict limit, check
      with the counter the recipient will actually use.
  - q: How is the reading time estimate calculated?
    a: >-
      Reading time is the word count divided by 215 words per minute, a
      mid-range figure from published studies of adult silent reading;
      speaking time uses 130 words per minute, a typical presentation pace.
      A 645-word article therefore shows 3 min to read and 5 min to say
      aloud. Both are averages — dense technical material reads slower, and
      a nervous speaker often runs faster than 130 wpm.
  - q: Do emoji and accented letters count as one character?
    a: >-
      Characters are counted as Unicode code points, not bytes. So *é* is one
      character, *ü* is one, and most single emoji are one — but joined emoji
      like the family 👨‍👩‍👧‍👦 are several code points stitched together with
      invisible joiners, so they count as more. Platforms with character
      limits apply their own rules (X, for instance, weights some scripts as
      two), so treat the figure here as the Unicode count, not a platform
      quota.
  - q: Does it count words in Chinese, Japanese or Korean text?
    a: >-
      Yes. Splitting on spaces fails for languages written without them — a
      whole Japanese sentence would count as one "word". The segmenter built
      into your browser uses dictionary-based rules instead, so 日本語のテキスト
      counts as three words (日本語 / の / テキスト). Counts for CJK text are a
      linguistic judgement call, but they track how native word counters
      behave.
  - q: How are sentences and paragraphs counted?
    a: >-
      Sentences come from the browser's Unicode sentence segmenter, which
      looks for terminators like `.`, `!` and `?` in context. It handles most
      prose well but abbreviations can split a sentence early — "Dr. Smith
      arrived." counts as two. Paragraphs are blocks of text separated by at
      least one blank line, so a single soft line break inside a paragraph
      doesn't start a new one.
  - q: Which words does the top-10 frequency table leave out?
    a: >-
      Anything shorter than three letters, standalone numbers, and about a
      hundred common English function words — *the*, *and*, *would*,
      *doesn't* and the like — so the table surfaces the vocabulary that's
      actually distinctive in your text. Matching is case-insensitive, so
      *The* and *the* merge. The table is only computed while its panel is
      open, which keeps typing responsive on long documents.
  - q: Is my text uploaded anywhere while it's being counted?
    a: >-
      No. Counting runs as JavaScript inside the page and the tool makes no
      network requests — open your browser's developer tools and watch the
      network tab while you paste to confirm. Nothing is stored either;
      close the tab and the text is gone. Very large pastes stay local too:
      past roughly two million characters the tool switches to a faster
      approximate counting mode rather than sending anything to a server.
---

<!-- content-pending: Phase C -->
