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

## How to use

1. Paste or type your content into the **Your text** box. There is no "count" button — every figure recalculates as you write, a fifth of a second after you stop typing.
2. Read the stat row underneath: words, characters, characters without spaces, sentences, paragraphs, and the estimated reading and speaking times.
3. Expand **Top 10 words** to see the terms you lean on most. This panel only does its work while it is open, so long documents stay responsive when it is closed.
4. Press **Copy stats** to put the whole summary on your clipboard as plain text, or **Clear** to empty the box and start again.

## How it works

Rather than splitting on spaces, the counter hands your text to your browser's `Intl.Segmenter` — the same Unicode segmentation engine that decides where a cursor lands when you double-click a word. It walks the text once at word granularity, tallying every segment the standard marks as word-like, and once more at sentence granularity to find real sentence breaks. Characters are counted as Unicode code points (so an accented letter is one, not two), and the characters-without-spaces figure subtracts every run of whitespace. Paragraphs are runs of text fenced off by a blank line. Reading time divides the word total by 215 words per minute; speaking time uses 130.

Take the line **Cyclones spin clockwise here. That fact surprises 4 in 5 first-time visitors, oddly.** The segmenter reports 14 words — the bare digits *4* and *5* each count, and *first-time* splits into *first* and *time* because a hyphen is a word boundary in the Unicode rules. It finds 2 sentences from the two full stops, 84 characters, and 72 once the eleven spaces are removed. At 215 wpm those 14 words round to a 4-second read and, at 130 wpm, a 6-second read aloud. Every number on the page is arithmetic on the text in front of you, not an estimate.

One engineering trade-off is worth naming: past roughly two million characters the segmenter would stall the page for a noticeable beat, so above that threshold counting switches to a faster regular-expression pass and a banner tells you the totals are now approximate.

## Use cases & limitations

The obvious readers are people writing to a ceiling — a 650-word college essay, a 155-character meta description, an abstract capped at 250 words, a conference talk that has to fit a 20-minute slot. Watching the count tick while you trim is faster than pasting into a word processor and hunting through a menu. The top-words panel doubles as a quick self-edit: if *actually* shows up nine times, you know what to cut. Compare two drafts side by side with the [text diff tool](/tools/text-diff/), reshape casing for a headline with the [case converter](/tools/case-converter/), or generate filler to test a layout with [lorem ipsum](/tools/lorem-ipsum-generator/).

The honest limits are in the judgement calls. Reading and speaking times are population averages, so a dense legal clause or a fast presenter will diverge from them. And the frequency table's stopword list is English only — run German or Spanish prose through it and everyday connective words will crowd the top ten, because the filter does not know them. For plain English writing against a word limit, though, the counts are exact and instant.
