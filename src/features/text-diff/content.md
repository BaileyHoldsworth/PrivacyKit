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

<!-- content-pending: Phase C -->
