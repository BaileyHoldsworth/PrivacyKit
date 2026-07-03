# Tool module contract

A tool is one folder: `src/features/<slug>/`. The slug is the URL:
`/tools/<slug>/`. Nothing outside the folder is edited to add a tool.

```
src/features/<slug>/
├─ content.md   # frontmatter (zod schema in src/content.config.ts) + prose body
├─ Ui.astro     # the interactive block ONLY — no page chrome, no <h1>
└─ client.ts    # all behavior; loaded via <script src="./client.ts"> in Ui.astro
```

## Ui.astro rules

- Root element: `<div class="tool" data-tool="<slug>">`.
- Element ids use the tool's unique 2-4 letter prefix (`pg-`, `jwt-`, `b64-`…).
- Use ONLY shared component classes from `src/styles/components.css`:
  `.pane`, `.pane-mono`, `.pane-toolbar`, `.field`, `.field-row`, `.btn`,
  `.btn-primary`, `.btn-ghost`, `.checkbox-row`, `.range-row`, `.select`,
  `.dropzone`, `.result-list`, `.stat-row`, `.badge`. No per-tool CSS unless
  genuinely unavoidable (then a scoped `<style>` in Ui.astro, tokens only).
- Layout: inputs/options first, primary action, then output pane. For
  converters, input pane above/left and output pane below/right with the
  toolbar (copy/download/clear) on the output.
- Every output has a copy button (`data-copy-target="#id"` wires automatically
  via src/lib/clipboard.ts).
- The tool must be fully usable with keyboard only and carry proper labels
  (`<label for>`, `aria-live="polite"` on async/derived outputs).
- Include `<script src="./client.ts"></script>` at the end (Astro bundles,
  hashes and dedupes it).
- The static HTML must render something meaningful before JS loads (panes,
  labels, options visible; buttons may be disabled until hydrated). No
  "Loading…" placeholder as initial state.

## client.ts rules

- No frameworks. Vanilla TS against the DOM. Imports allowed: `../../lib/*`
  and the npm packages already in package.json (MIT/Apache/BSD only — adding a
  dependency requires updating /licenses/ content and lockfile; never add
  GPL/AGPL/LGPL code).
- Idempotent init: query elements by prefix under `[data-tool="<slug>"]`,
  bail silently if absent.
- Live computation on `input` events where cost is trivial; debounce ≥150ms
  for heavy work (zxcvbn, regex over big text, image processing). Keep any
  single task under ~50ms for INP; chunk or Web-Worker anything heavier.
- **Randomness:** ONLY via `src/lib/random.ts` (`randomInt`, `randomItem`,
  `randomChars` — rejection-sampled over `crypto.getRandomValues`). Never
  `Math.random()`, never raw modulo on random bytes.
- Errors: never throw to console as the UX. Show the message inline near the
  output (`.field-error`) or as a toast (`src/lib/toast.ts`).
- External calls: ONLY if the tool's frontmatter declares
  `privacy: 'external-api'`. Fail gracefully (offline/blocked → clear inline
  message). Never send more than the documented minimum (e.g. HIBP gets the
  first 5 SHA-1 hex chars, nothing else).
- File handling: everything stays in-memory client-side; downloads via
  `src/lib/download.ts`.

## content.md rules

See `docs/voice.md` for the body. Frontmatter is validated by
`src/content.config.ts` — build fails on violations. `related` slugs must
exist (checked post-build). `updated` is the truthful date of the last
substantive change to the tool or its copy — it feeds the sitemap; bumping it
without a real change is lying to Google and CI can't catch it, so don't.

## Shared lib surface (src/lib)

| Module | Exports (stable interface) |
|---|---|
| `random.ts` | `randomInt(maxExclusive)`, `randomItem(arr)`, `randomChars(charset, n)`, `randomBytes(n)` |
| `clipboard.ts` | auto-wires `[data-copy-target]`; `copyText(text): Promise<boolean>` (fires toast) |
| `toast.ts` | `showToast(message, kind?: 'ok'|'error')` |
| `download.ts` | `downloadBlob(blob, filename)`, `downloadText(text, filename)`, `downloadDataUrl(url, filename)` |
| `dom.ts` | `$(sel, root?)`, `$$(sel, root?)`, `onInput(el, fn, debounceMs?)`, `wireDropzone(el, onFiles)` |
| `bytes.ts` | `formatBytes(n)`, `hexToBytes`, `bytesToHex`, `bytesToBase64`, `base64ToBytes` (UTF-8-safe) |
| `theme.ts` | applied by BaseLayout; tools never touch theming |

## Definition of done for a tool module

1. `npm run build` passes (schema + TS strict).
2. The tool works end-to-end in a browser (verified via preview, not assumed).
3. Handles: empty input, pathological input (10MB text, invalid JSON, broken
   JWT, 0-byte file), and produces helpful inline errors.
4. Keyboard operable; copy buttons work; dark AND light theme look right.
5. content.md body still placeholder in Phase B (Phase C fills it) — but
   frontmatter must be final and truthful.
