---
name: Text Diff Checker
title: Text Diff Checker — Compare Two Texts Online | PrivacyKit
description: Compare two texts side by side and see additions and removals highlighted by line, word, or character. The diff runs in your browser — nothing is uploaded.
category: text
keywords:
  - diff
  - text compare
  - diff checker
  - compare files
  - text difference
icon: file-diff
related:
  - json-formatter
  - word-counter
  - regex-tester
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Should I compare by lines, words, or characters?
    a: >-
      Line mode suits code, config files and anything structured one statement
      per line. Word mode is better for prose — a reworded sentence shows as a
      few changed words instead of one long changed line. Character mode is for
      short strings like URLs, keys or IDs, where a single transposed digit
      needs to stand out. For large inputs, line mode is also by far the
      fastest, because it compares thousands of line tokens rather than
      millions of character tokens.
  - q: How does the tool decide what counts as a change?
    a: >-
      It runs the Myers diff algorithm (via the open-source `jsdiff` library)
      to find the shortest edit script — the smallest set of insertions and
      deletions that turns the first text into the second. Everything the two
      texts share is left unmarked; what you see is that minimal script
      rendered inline, with each deletion shown before the insertion that
      replaces it.
  - q: What exactly do the ignore-whitespace and ignore-case options do?
    a: >-
      They normalise both texts before comparing. Ignore whitespace collapses
      every run of spaces and tabs to a single space and trims line ends, so
      re-indented code compares as unchanged; ignore case lowercases both
      sides. Because normalisation happens first, the result shows the
      normalised text rather than the original spacing or capitalisation.
      Windows-style CRLF line endings are always converted to LF, so the same
      file saved on Windows and on Linux compares as identical.
  - q: Does my text leave the browser when I compare?
    a: >-
      No. Comparison happens locally: the first time you run a diff, the page
      fetches its own bundled copy of the diff engine (a small script from
      this site, cached afterwards), and every comparison after that executes
      entirely on your device. Your text is never part of any request — open
      your browser's network tab and compare something to confirm nothing is
      sent.
  - q: Why did I get a message instead of a result on a big paste?
    a: >-
      Two guards protect the page. Above 200,000 characters combined, the
      as-you-type comparison pauses and you run it with the **Compare** button
      instead — recomputing a large diff on every keystroke would freeze
      typing. Separately, if the algorithm has not finished within 1.5
      seconds — typical when two big texts share almost nothing — it stops and
      suggests line mode, which uses far fewer tokens than word or character
      mode.
  - q: What format do Copy and Download produce?
    a: >-
      Plain text with markers. In line mode each line is prefixed with `+ `
      (added), `- ` (removed) or two spaces (unchanged), like a unified patch
      without the headers. In word and character mode, insertions are wrapped
      in `{+…+}` and deletions in `[-…-]` — the convention GNU wdiff uses. The
      result stays legible in a ticket, an email or a commit message where
      colour is not available.
---

## How to use

1. Paste the earlier version into **Original text** on the left and the newer version into **Changed text** on the right. If you pasted them the wrong way round, **Swap sides** flips the two panes.
2. Choose a granularity under **Compare by** — Lines, Words or Characters — and the result redraws the moment you switch.
3. Tick **Ignore whitespace** or **Ignore case** when re-indentation or a change in capitalisation is noise you don't want flagged as a real edit.
4. Under 200,000 combined characters the comparison runs as you type; past that the live update pauses, and you press **Compare** (or Ctrl/Cmd+Enter) to run it on demand.
5. Check the Added, Removed and Similarity stats below the result, then **Copy** or **Download** the marked-up text to drop into a commit message, ticket or email.

## How it works

Before anything is compared, both sides are normalised: CRLF line endings become LF, and — if you asked for it — case is folded and runs of whitespace are collapsed. The cleaned text is then split into tokens according to the mode you picked (whole lines, whitespace-separated words, or single characters) and handed to the Myers algorithm, which finds the *shortest edit script*: the fewest deletions and insertions that rewrite the first token sequence into the second.

Take three lines — `alpha`, `beta`, `gamma` — edited to `alpha`, `gamma`, `delta`. In line mode the shortest script keeps `alpha`, deletes `beta`, keeps `gamma`, and inserts `delta`. The output renders as:

```
  alpha
- beta
  gamma
+ delta
```

The stat row is arithmetic over those same tokens. Here one line was added and one removed, with two lines shared. Similarity is `round(200 × common ÷ (added + removed + 2 × common))`, so `round(200 × 2 ÷ 6)` gives **67%**. That formula counts each shared token twice — once on each side — which keeps a symmetric percentage that doesn't change when you swap the panes.

## Use cases & limitations

Line mode carries most of the load: reviewing an edit before you commit it, spotting config drift between two `.env` files, or checking which lines a colleague touched in a document. Word mode reads far better for prose — a reworded sentence surfaces as a handful of changed words rather than one long red-then-green line. Character mode earns its place on short strings, catching a single transposed digit in a URL or an ID. Diffing two structured payloads is easier if you tidy them first: run each through the [JSON formatter](/tools/json-formatter/) so keys line up predictably, then paste both here. For measuring the size of a rewrite rather than its shape, the [word counter](/tools/word-counter/) is the better companion, and the [regex tester](/tools/regex-tester/) helps when you want to strip volatile fields before comparing.

The honest limitation is that a shortest edit script has no concept of *moved* text. Shift a paragraph from the top of a file to the bottom and the tool reports it as one deletion plus one insertion, not a relocation — the two versions are still equivalent, but the diff won't say so. It is also a comparison, not a merge: there is no three-way reconciliation and no way to accept individual changes. Very large, very dissimilar inputs can hit the 1.5-second search cap in word or character mode, at which point the tool stops and points you to line mode, which tokenises far more coarsely.

## Privacy note

Your text never leaves the device. The comparison runs in your browser, and the only network request the tool ever makes is a one-time fetch of its own diff engine — a small script bundled with this site, cached after the first run and carrying none of your input. **Copy** and **Download** build their output locally too, so even the exported patch stays on your machine. Watch the network tab while you compare a paragraph if you'd rather confirm that than take our word for it.
