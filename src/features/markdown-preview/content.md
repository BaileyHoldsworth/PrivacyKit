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

## How to use

1. Type or paste Markdown into the left pane — it opens with a sample job sheet so you can see the syntax in action; select all and delete to start clean.
2. Read the result in the right pane. It re-renders about 150 ms after you stop typing, so there is no button to press for an ordinary document.
3. Past 200,000 characters the live update steps aside to keep typing smooth. Hit **Render preview**, or press Ctrl+Enter (Cmd+Enter on a Mac) from inside the editor, to render on demand.
4. Use **Copy HTML** to put the rendered markup on your clipboard, or **Download .html** to save it as `markdown.html`.
5. Press **Clear** to empty both panes and start over.

## How it works

Two libraries run back to back on every render. First [marked](https://marked.js.org/) parses your text with its GFM ruleset switched on, turning Markdown into an HTML string. That string is then handed to DOMPurify, which walks the parsed nodes and drops anything that could execute — `<script>`, `<iframe>`, inline `onclick` handlers — before the markup is ever assigned to the preview's `innerHTML`. The order is deliberate: parse untrusted text, sanitise, *then* display. A small extra hook rewrites every surviving link so it opens in a new tab with `rel="noopener noreferrer"`, which stops a linked page from reaching back into this one.

Take a one-line source with a link and a bit of smuggled script:

```
**Due:** 14 days — [pay invoice](https://acme.test/4471)<script>steal()</script>
```

marked emits `<p><strong>Due:</strong> 14 days — <a href="https://acme.test/4471">pay invoice</a><script>steal()</script></p>`. DOMPurify then deletes the `<script>` element outright and the link hook adds the safety attributes, leaving exactly this in the preview and in whatever you copy:

```
<p><strong>Due:</strong> 14 days — <a target="_blank" rel="noopener noreferrer" href="https://acme.test/4471">pay invoice</a></p>
```

The bold and the link survive untouched; the script never had a chance to run.

## Use cases & limitations

This is the quick pane to reach for when you are drafting a README, a GitHub issue, or release notes and want to confirm a table lines up or a nested list nests before you commit it. It is equally handy for turning a plain-text note into clean HTML you can drop into a CMS or an email — copy the fragment and paste. If you are pasting prose in from elsewhere and want a running total of words as you trim, keep the [word counter](/tools/word-counter/) open alongside it; for a wall of placeholder body text to test a layout, the [lorem ipsum generator](/tools/lorem-ipsum-generator/) fills the editor in seconds.

Two honest limits. Code fences render as plain monospaced blocks — there is no syntax highlighting, so a JavaScript sample will not be colourised the way it is on GitHub. And the tool renders standard GFM only: LaTeX maths, footnotes and diagram blocks pass through as literal text rather than being drawn. If you need to hand-escape angle brackets or ampersands so they show as characters instead of being read as tags, the [HTML entities](/tools/html-entities/) converter is the companion for that.

