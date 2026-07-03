#!/usr/bin/env node
/**
 * Post-build content quality gate. Reads dist/ and reports violations
 * grouped by check. See docs/checks.md for what each check enforces.
 *
 * Default mode: report-only, always exits 0 (safe to chain after builds).
 * --strict: exits 1 if any violation is found.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'node-html-parser';

const SITE_URL = 'https://privacykit.dev';
const DIST = join(process.cwd(), 'dist');
const STRICT = process.argv.includes('--strict');
const MIN_WORDS = 300;
const SHINGLE_SIZE = 8;

if (!existsSync(DIST)) {
  console.error('check-content: dist/ not found — run `npx astro build` first.');
  process.exit(1);
}

/** @type {Map<string, string[]>} check name -> violation messages */
const violations = new Map();
function report(check, message) {
  if (!violations.has(check)) violations.set(check, []);
  violations.get(check).push(message);
}

/** Recursively collect dist/**\/index.html files. */
function findIndexHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findIndexHtml(full));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

/** dist/tools/foo/index.html -> "/tools/foo/" ; dist/index.html -> "/" */
function routeOf(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  const dir = rel.slice(0, -'index.html'.length);
  return `/${dir}`;
}

/** Text content with block boundaries preserved as whitespace. */
function textOf(node) {
  return node.structuredText.replace(/\s+/g, ' ').trim();
}

function countWords(text) {
  return text === '' ? 0 : text.split(/\s+/).length;
}

/** Lowercase, punctuation stripped, for the duplicate-prose shingle check. */
function normaliseWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const pages = findIndexHtml(DIST).map((file) => {
  const route = routeOf(file);
  const root = parse(readFileSync(file, 'utf8'));
  return { file, route, root };
});

const isToolPage = (r) => /^\/tools\/[^/]+\/$/.test(r.route);
const isGuidePage = (r) => /^\/guides\/[^/]+\/$/.test(r.route);
const is404 = (r) => r.route === '/404/';
const isNoindex = (r) =>
  r.root
    .querySelectorAll('meta[name="robots"]')
    .some((m) => (m.getAttribute('content') ?? '').includes('noindex'));

// ---------------------------------------------------------------- (a) one h1
for (const p of pages) {
  const n = p.root.querySelectorAll('h1').length;
  if (n !== 1) report('a: exactly one <h1>', `${p.route} has ${n} <h1> elements`);
}

// ------------------------------------------ (b) unique title + description
const titles = new Map();
const descriptions = new Map();
for (const p of pages) {
  const title = p.root.querySelector('title')?.text.trim() ?? '';
  const desc =
    p.root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
  if (!title) report('b: unique title/description', `${p.route} has no <title>`);
  else if (titles.has(title))
    report(
      'b: unique title/description',
      `${p.route} duplicates the <title> of ${titles.get(title)}: "${title}"`,
    );
  else titles.set(title, p.route);
  if (!desc) report('b: unique title/description', `${p.route} has no meta description`);
  else if (descriptions.has(desc))
    report(
      'b: unique title/description',
      `${p.route} duplicates the meta description of ${descriptions.get(desc)}`,
    );
  else descriptions.set(desc, p.route);
}

// ------------------------------------------------------------ (c) canonical
for (const p of pages) {
  const href = p.root.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const expected = `${SITE_URL}${p.route}`;
  if (!href) report('c: canonical', `${p.route} has no canonical link`);
  else if (href !== expected)
    report('c: canonical', `${p.route} canonical is "${href}", expected "${expected}"`);
}

// ------------------------------------------------------- (d) JSON-LD parses
for (const p of pages) {
  for (const script of p.root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      JSON.parse(script.text);
    } catch (e) {
      report('d: JSON-LD parses', `${p.route}: ${e.message}`);
    }
  }
}

// -------------------------------- (e) word count on tool/guide pages only
// Words inside <main>, FAQ answers included, code/pre/script/style/nav excluded.
for (const p of pages.filter((x) => isToolPage(x) || isGuidePage(x))) {
  const main = p.root.querySelector('main');
  if (!main) {
    report('e: word count', `${p.route} has no <main>`);
    continue;
  }
  const clone = parse(main.outerHTML);
  for (const el of clone.querySelectorAll('nav, code, pre, script, style')) el.remove();
  const words = countWords(textOf(clone));
  if (words < MIN_WORDS)
    report('e: word count', `${p.route} has ${words} words in <main> (minimum ${MIN_WORDS})`);
}

// -------------------------- (f) no shared 8-word sequence across tool pages
// Compared over each tool page's <article class="prose"> body, code excluded
// (worked examples in prose must still differ; identical code is caught too
// only when it appears as plain text).
const shingleOwners = new Map(); // normalized 8-gram -> first route
const reportedPairs = new Set();
for (const p of pages.filter(isToolPage)) {
  const article = p.root.querySelector('article.prose');
  if (!article) {
    report('f: duplicate prose', `${p.route} has no <article class="prose">`);
    continue;
  }
  const clone = parse(article.outerHTML);
  for (const el of clone.querySelectorAll('code, pre, script, style')) el.remove();
  const words = normaliseWords(textOf(clone));
  const seen = new Set(); // dedupe within the same page
  for (let i = 0; i + SHINGLE_SIZE <= words.length; i++) {
    const gram = words.slice(i, i + SHINGLE_SIZE).join(' ');
    if (seen.has(gram)) continue;
    seen.add(gram);
    const owner = shingleOwners.get(gram);
    if (owner && owner !== p.route) {
      const pairKey = `${owner}|${p.route}`;
      if (!reportedPairs.has(pairKey)) {
        reportedPairs.add(pairKey);
        report('f: duplicate prose', `${owner} and ${p.route} share the 8-word sequence "${gram}"`);
      }
    } else if (!owner) {
      shingleOwners.set(gram, p.route);
    }
  }
}

// --------------------------------------- (g) RelatedTools links resolve
const builtRoutes = new Set(pages.map((p) => p.route));
for (const p of pages) {
  for (const section of p.root.querySelectorAll('.related-tools')) {
    for (const a of section.querySelectorAll('a[href^="/tools/"]')) {
      const href = a.getAttribute('href');
      if (!builtRoutes.has(href))
        report('g: related tools resolve', `${p.route} links to unbuilt page ${href}`);
    }
  }
}

// ------------------------------------------- (h) sitemap <-> dist coverage
// NOTE: while the rebuild is in progress the sitemap intentionally lists
// pages that are not built yet (about, guides, category hubs…). Those are
// reported here and fail only under --strict. See docs/checks.md.
const sitemapPath = join(DIST, 'sitemap.xml');
let sitemapEntries = [];
if (!existsSync(sitemapPath)) {
  report('h: sitemap coverage', 'dist/sitemap.xml is missing');
} else {
  const xml = readFileSync(sitemapPath, 'utf8');
  sitemapEntries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>(.*?)<\/loc>/)?.[1] ?? '',
    lastmod: block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));

  const sitemapRoutes = new Set();
  for (const { loc } of sitemapEntries) {
    if (!loc.startsWith(SITE_URL)) {
      report('h: sitemap coverage', `sitemap URL "${loc}" is not under ${SITE_URL}`);
      continue;
    }
    const route = loc.slice(SITE_URL.length);
    sitemapRoutes.add(route);
    if (!builtRoutes.has(route))
      report('h: sitemap coverage', `sitemap lists ${route} but dist has no such page`);
  }
  for (const p of pages) {
    if (is404(p) || isNoindex(p)) continue;
    if (!sitemapRoutes.has(p.route))
      report('h: sitemap coverage', `indexable page ${p.route} is missing from the sitemap`);
  }
}

// ------------------------------------------------- (i) lastmod not in future
const today = new Date().toISOString().slice(0, 10);
for (const { loc, lastmod } of sitemapEntries) {
  if (!lastmod) continue;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod))
    report('i: lastmod sane', `${loc} lastmod "${lastmod}" is not YYYY-MM-DD`);
  else if (lastmod > today)
    report('i: lastmod sane', `${loc} lastmod ${lastmod} is in the future (today: ${today})`);
}

// -------------------------------------------------------------------- report
const total = [...violations.values()].reduce((n, v) => n + v.length, 0);
console.log(`check-content: ${pages.length} pages checked (${STRICT ? 'strict' : 'report-only'} mode)`);
if (total === 0) {
  console.log('check-content: all checks passed.');
} else {
  for (const [check, messages] of [...violations.entries()].sort()) {
    console.log(`\nCheck ${check} — ${messages.length} violation(s):`);
    for (const m of messages) console.log(`  ✗ ${m}`);
  }
  console.log(`\ncheck-content: ${total} violation(s) across ${violations.size} check(s).`);
}
process.exit(STRICT && total > 0 ? 1 : 0);
