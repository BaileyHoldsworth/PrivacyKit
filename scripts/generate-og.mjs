#!/usr/bin/env node
/**
 * Generates the OG card PNGs referenced by built pages. Scans every
 * dist/**\/index.html for its <title> and og:image URL, then renders one
 * 1200x630 PNG per unique /og/*.png path via sharp SVG compositing.
 * /og/default.png is always written (BaseLayout's fallback card).
 * Idempotent: rerunning overwrites the same outputs.
 */
import { readFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse } from 'node-html-parser';
import sharp from 'sharp';

const DIST = join(process.cwd(), 'dist');
const SITE_URL = 'https://privacykit.dev';
const TITLE_SUFFIX = ' | PrivacyKit';
const DEFAULT_TITLE = 'Free privacy & developer tools that run in your browser';

const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 64;
const BG = '#16171b';
const BORDER = '#2c2e36';
const TEAL = '#35d0b0';
const FONTS = "'Inter', 'InterVariable', 'Helvetica Neue', Helvetica, Arial, sans-serif";

if (!existsSync(DIST)) {
  console.error('generate-og: dist/ not found — run `npx astro build` first.');
  process.exit(1);
}

function findIndexHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findIndexHtml(full));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

function escapeXml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');
}

/**
 * Greedy word wrap into at most 2 lines, shrinking the font until it fits.
 * Width estimate: average glyph ≈ 0.54em for a UI sans at these sizes.
 */
function layoutTitle(text) {
  const maxWidth = WIDTH - MARGIN * 2;
  for (let fontSize = 72; ; fontSize -= 4) {
    const maxChars = Math.floor(maxWidth / (fontSize * 0.54));
    const lines = [];
    let current = '';
    for (const word of text.split(/\s+/)) {
      const candidate = current === '' ? word : `${current} ${word}`;
      if (candidate.length <= maxChars || current === '') current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current !== '') lines.push(current);
    if (lines.length <= 2 && fontSize > 40) return { fontSize, lines };
    if (fontSize <= 40) {
      // Clamp reached: keep two lines, ellipsise the overflow.
      const clamped = lines.slice(0, 2);
      if (lines.length > 2) clamped[1] = `${clamped[1].slice(0, maxChars - 1)}…`;
      return { fontSize, lines: clamped };
    }
  }
}

function cardSvg(title) {
  const { fontSize, lines } = layoutTitle(title);
  const lineHeight = Math.round(fontSize * 1.2);
  // Vertically centre the title block between wordmark and chip.
  const blockCentre = 330;
  const firstBaseline = blockCentre - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
  const titleText = lines
    .map(
      (line, i) =>
        `<text x="${MARGIN}" y="${firstBaseline + i * lineHeight}" font-family="${FONTS}" font-size="${fontSize}" font-weight="650" fill="#f4f5f7">${escapeXml(line)}</text>`,
    )
    .join('\n  ');

  const chipText = 'runs in your browser';
  const chipFont = 26;
  const chipH = 54;
  const chipW = Math.round(chipText.length * chipFont * 0.54 + 56);
  const chipY = HEIGHT - MARGIN - chipH;

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <rect x="12.5" y="12.5" width="${WIDTH - 25}" height="${HEIGHT - 25}" fill="none" stroke="${BORDER}" stroke-width="1"/>
  <text x="${MARGIN}" y="108" font-family="${FONTS}" font-size="40" font-weight="700" fill="${TEAL}">PrivacyKit</text>
  ${titleText}
  <rect x="${MARGIN}" y="${chipY}" width="${chipW}" height="${chipH}" rx="${chipH / 2}" fill="rgba(53,208,176,0.08)" stroke="rgba(53,208,176,0.45)" stroke-width="1.5"/>
  <text x="${MARGIN + chipW / 2}" y="${chipY + chipH / 2}" font-family="${FONTS}" font-size="${chipFont}" font-weight="500" fill="${TEAL}" text-anchor="middle" dominant-baseline="central">${escapeXml(chipText)}</text>
</svg>`;
}

// Collect unique og paths -> card title text.
const cards = new Map([['/og/default.png', DEFAULT_TITLE]]);
for (const file of findIndexHtml(DIST)) {
  const root = parse(readFileSync(file, 'utf8'));
  const og = root.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (!og) {
    console.warn(`og: WARNING ${file} has no og:image meta tag`);
    continue;
  }
  const path = og.startsWith(SITE_URL) ? og.slice(SITE_URL.length) : og;
  if (!path.startsWith('/og/') || !path.endsWith('.png')) {
    console.warn(`og: WARNING ${file} references non-/og/ image "${og}" — not generated here`);
    continue;
  }
  if (cards.has(path)) continue; // default.png (or an already-claimed path)
  const rawTitle = root.querySelector('title')?.text.trim() ?? '';
  cards.set(path, rawTitle.endsWith(TITLE_SUFFIX) ? rawTitle.slice(0, -TITLE_SUFFIX.length) : rawTitle);
}

const started = Date.now();
for (const [path, title] of cards) {
  const out = join(DIST, ...path.split('/').filter(Boolean));
  mkdirSync(dirname(out), { recursive: true });
  await sharp(Buffer.from(cardSvg(title))).png().toFile(out);
  console.log(`og: wrote ${path} — "${title}"`);
}
console.log(`og: ${cards.size} card(s) in ${Date.now() - started}ms`);
