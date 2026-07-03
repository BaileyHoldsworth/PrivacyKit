# Post-build checks

Three scripts run against `dist/` after `astro build`. None of them touch the
source tree; rerun `npx astro build` before rerunning a check.

| Script | Mode | Command |
|---|---|---|
| `scripts/check-content.mjs` | report-only by default, `--strict` exits 1 on any violation | `npm run check:content` (strict) |
| `scripts/check-html.mjs` | always strict | part of `npm run check` |
| `scripts/check-links.mjs` | strict; `--allow-missing` downgrades to report-only | part of `npm run check` |

`npm run build` chains `astro build → generate-og → check-content` (report
mode, never fails the build). `npm run check` runs all three strictly.

## check-content.mjs

Reads every `dist/**/index.html` (so `404.html` is naturally excluded) and the
generated `dist/sitemap.xml`. Violations are grouped by check letter.

- **(a) exactly one `<h1>`** per page.
- **(b) sitewide-unique `<title>` and meta description.** Duplicates are
  reported against the first page that used the text.
- **(c) canonical** — `<link rel="canonical">` present and exactly
  `https://privacykit.dev` + the route path derived from the file location.
- **(d) JSON-LD** — every `<script type="application/ld+json">` parses as JSON.
- **(e) word count** — tool pages (`/tools/<slug>/`, not the `/tools/` index)
  and guide pages (`/guides/<slug>/`) must have ≥ 300 words inside `<main>`.
  FAQ answers count; `nav`, `code`, `pre`, `script`, `style` content does not.
  Applies only to tool/guide pages — the homepage and hubs are exempt.
- **(f) duplicate prose** — no normalised (lowercased, punctuation-stripped)
  8-word sequence may appear in two different tool pages'
  `<article class="prose">` bodies (code/pre excluded — the gate is about
  prose, per docs/voice.md). One violation is reported per page pair, with the
  first shared sequence found.
- **(g) related tools resolve** — every `/tools/<slug>/` link inside a
  `.related-tools` section must point at a built page.
- **(h) sitemap ↔ dist coverage** — every sitemap URL must exist as a built
  page, and every indexable built page (404 and `noindex` pages excluded) must
  be in the sitemap.
- **(i) sitemap lastmod sane** — every `<lastmod>` is `YYYY-MM-DD` and not in
  the future. (`updated` frontmatter must be truthful; a future date is a lie
  the check can catch, a falsely-bumped past date is not.)

**Known mid-rebuild state:** the sitemap deliberately lists all planned routes
(`/about/`, `/guides/`, category hubs, …) before they are built, so check (h)
currently reports those as missing. In default (report-only) mode this never
fails; under `--strict` — and therefore in `npm run check` and CI — it fails
until the remaining pages land. That is intentional: the failure list is the
remaining work, and nothing may ship while sitemap and dist disagree.

## check-html.mjs

`html-validate` with the `html-validate:recommended` preset over every
`dist/**/*.html`, always strict — invalid HTML fails from day one. Deliberate,
minimal tuning:

- `no-inline-style` off — provisional pages use inline styles.
- `element-name` / `no-unknown-elements` off — custom elements allowed.
- `long-title` maxlength raised to 75 because the rule measures
  entity-encoded text (`&amp;` counts as 5 chars); the real 65-char cap is
  enforced by the content schema.
- `prefer-native-element` excludes `role="listbox"` — the command palette's
  filtered result list is the standard ARIA combobox pattern and has no native
  equivalent.

## check-links.mjs

`linkinator` crawls `dist/` recursively and verifies internal links only
(external `http(s)` links are skipped — they belong to a page's copy, not the
build). Broken internal links exit 1. `--allow-missing` prints the same report
but exits 0; use it mid-rebuild while footer/nav targets like `/about/` are
not built yet.

## generate-og.mjs (not a check, runs in `npm run build`)

Scans every built page for its `<title>` and `og:image` URL and renders one
1200×630 PNG per unique `/og/*.png` path with sharp (SVG composited: #16171b
background, 1px inset border, teal PrivacyKit wordmark, page title minus the
" | PrivacyKit" suffix wrapped to ≤ 2 lines with font-size clamping, and a
"runs in your browser" chip). `/og/default.png` is always written using the
site tagline. Idempotent; every file written is logged.
