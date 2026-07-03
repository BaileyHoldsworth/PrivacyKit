---
name: Markdown Preview
title: Markdown Preview — Live Markdown Editor | PrivacyKit
description: Type Markdown on the left and watch the rendered result appear on the right — GFM tables, task lists and code blocks, with sanitised HTML you can copy.
category: text
keywords:
  - markdown
  - markdown preview
  - markdown editor
  - md to html
  - markdown viewer
icon: markdown
related:
  - html-entities
  - json-formatter
  - word-counter
  - lorem-ipsum-generator
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Does the preview support GitHub Flavored Markdown?
    a: >-
      Yes — rendering runs with the GFM ruleset enabled, so pipe tables, task
      lists (`- [x] done`), strikethrough (`~~old~~`) and bare autolinked URLs
      all work. GitHub *platform* extras that are not part of the GFM spec —
      alert blocks like `> [!NOTE]`, Mermaid diagrams, emoji shortcodes such
      as `:tada:` — will not render here, because they need GitHub's own
      post-processing.
  - q: Why did the HTML I typed disappear from the preview?
    a: >-
      Markdown permits raw HTML, but every render on this page passes through
      DOMPurify before it touches the preview. `<script>` tags, `<iframe>`s
      and event-handler attributes like `onclick` are stripped, so a pasted
      document cannot run code in your browser. Harmless inline tags —
      `<sup>`, `<kbd>`, `<abbr>` — survive sanitisation and render normally.
  - q: Why doesn't a single line break start a new line?
    a: >-
      Standard Markdown folds a lone newline into a space — the same way
      GitHub renders a README file. To force a line break inside a paragraph,
      end the line with two trailing spaces or a backslash; to start a new
      paragraph, leave a blank line between the two blocks of text.
  - q: What exactly does "Copy HTML" give me?
    a: >-
      The sanitised HTML fragment for your document — the same markup shown in
      the preview, with no `<html>` or `<head>` wrapper and none of this
      page's CSS. Paste it into a CMS, an email template or a static page and
      it inherits whatever styles the destination applies.
  - q: How do I write a table in Markdown?
    a: |-
      Pipe-separated cells with a divider row after the header. `---` cells
      accept alignment colons: `:--` left, `--:` right, `:-:` centred.

      ```
      | Crew  | Hours |
      | :---- | ----: |
      | Dana  |   7.5 |
      | Marco |   6.0 |
      ```

      The outer pipes are optional, and column widths don't have to line up —
      the divider row is what makes it a table.
  - q: Why does the preview stop updating while I type in a very large document?
    a: >-
      Live rendering pauses once the input passes 200,000 characters, because
      re-parsing a document that size on every keystroke would make typing
      stutter. Press **Render preview** (or Ctrl+Enter in the editor) to
      render on demand; the hard ceiling is 5,000,000 characters.
  - q: Is anything I type sent to a server?
    a: >-
      No. The parser (marked) and sanitiser (DOMPurify) are JavaScript bundles
      served from this site and executed locally, fetched once when you first
      use the tool. After that, editing triggers no network requests at all —
      open your browser's developer tools and watch the network tab while you
      type to confirm it.
---

<!-- content-pending: Phase C -->
