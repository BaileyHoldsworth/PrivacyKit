# Asset licenses & attribution

Bundled static assets, their origins and licence obligations. Update this file
whenever anything under `public/` gains third-party content.

## Inter Variable font — `public/fonts/InterVariable.woff2`

- **Source:** Google Fonts CDN, latin subset of the variable build
  (`https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2`,
  referenced by the css2 API for `Inter:wght@100..900`), fetched 2026-07-03.
  48,256 bytes; `file` reports Web Open Font Format 2.
- **Author:** Rasmus Andersson (rsms.me/inter).
- **Licence:** SIL Open Font License 1.1. Free to bundle and self-host; the
  OFL requires the font not be sold on its own and derivative fonts carry the
  same licence — neither applies to plain self-hosting. No attribution page is
  legally required, but we note it on /licenses/.

## EFF large wordlist — `public/data/eff-wordlist.json`

- **Source:** `https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt`,
  fetched 2026-07-03 and converted from `<dice>\t<word>` lines to a compact
  JSON array of exactly 7,776 unique words (dice order preserved).
- **Author:** Joseph Bonneau / Electronic Frontier Foundation,
  "Deep Dive: EFF's New Wordlists for Random Passphrases" (2016).
- **Licence:** CC-BY 3.0 US. **Attribution is required** — the passphrase
  generator page and /licenses/ must credit the EFF and link the source.

## Icons — `public/icons/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`

- **Source:** original work created for PrivacyKit (rounded hexagon outline
  containing a keyhole silhouette, accent teal `#35d0b0` ≈
  `oklch(0.78 0.13 175)`). PNGs rasterised from the SVG with the repo's
  `sharp`; the apple-touch-icon uses an opaque `#1a1b1f` background with the
  mark padded to 124px inside 180×180.
- **Licence:** site-owned; no third-party obligations.
