# PrivacyKit voice & content rules

Every word on this site is read by three audiences at once: a person who needs
the tool right now, a Google quality reviewer deciding if the site is "low
value content", and an LLM deciding whether to recommend the tool. Write for
the first one; the other two follow.

## Tone

- Plain, technically precise, quietly confident. A capable engineer explaining
  something to a colleague — not a landing page selling to them.
- Say what a thing *does* and *how*, with real numbers and worked examples.
  Claims must be checkable: "a 16-character mixed-charset password has about
  104 bits of entropy (log₂(94¹⁶))", not "extremely secure".
- Honesty is the brand. If a tool calls an external API, say so in the first
  screen of copy. If a technique has limits (canvas re-encoding strips EXIF but
  recompresses the image), state the limit where the reader decides.
- First person plural ("we") sparingly — only for actual decisions we made
  ("we bundle the EFF long wordlist"). Never "we believe", "we're passionate".
- Australian-neutral English: no -ize/-ise inconsistency (use -ize? No: use
  **-ise** consistently — organise, customise — matching the owner's locale),
  no "gotten".

## Banned phrases (mechanical check may enforce some of these)

"in today's digital age/world" · "look no further" · "our powerful tool" ·
"simply" as filler · "seamless(ly)" · "cutting-edge" · "state-of-the-art" ·
"robust" (as praise) · "best-in-class" · "game-changer" · "unlock" (metaphor) ·
"elevate" · "empower" · "whether you're a X or a Y" · "it's important to note" ·
"in conclusion" · "welcome to" · "dive in/into" · "explore the world of" ·
"say goodbye to" · "hassle-free" · "peace of mind" · rhetorical questions as
section openers ("Ever wondered…?").

## Structural variance (the n-gram gate will catch violations)

- No two tool pages may open their intro, "How to use", or "How it works"
  sections with the same first eight words. Vary sentence patterns: start from
  the user's situation, from a concrete example, from a definition, from a
  common mistake — rotate.
- FAQs answer *that tool's* real questions (the ones people type into Google),
  not generic restatements ("Is this tool free?" is allowed at most once per
  category; "Is my data safe?" must be answered with tool-specific mechanics,
  not boilerplate).
- Worked examples must use *different* example values on every page. Never
  reuse "hello world", "password123", or the same JWT across pages.
- Section lengths should differ page to page. If every page has exactly three
  paragraphs of near-equal length, it reads as generated filler.

## Page body requirements (tool pages)

- 400–700 words in the markdown body (hard CI floor: 300).
- `## How to use` — numbered steps, specific to this UI, 3–6 steps.
- `## How it works` — the actual mechanism: algorithm, formula, encoding table,
  or protocol, with one fully worked example using real values.
- `## Use cases & limitations` — who reaches for this and when; at least one
  honest limitation.
- Optional `## Privacy note` — required for tools handling sensitive input
  (passwords, personal files, tokens): state exactly what stays local and what
  (if anything) leaves the browser.
- Link 1–3 related tools and at most 1 guide *in prose*, where the mention is
  natural — not a "check out our other tools!" paragraph.

## Guides

800–1,500 words. One idea per guide, taught properly: background → mechanism →
worked example → practical advice → tool link(s). Code blocks and tables where
they genuinely clarify. Same banned-phrases list applies.
