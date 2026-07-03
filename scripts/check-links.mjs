#!/usr/bin/env node
/**
 * Internal link checker: linkinator serves dist/ on a local static server
 * and crawls it. External (http/https) links are skipped — only links within
 * the built site are verified.
 *
 * Exit 1 on broken internal links. --allow-missing downgrades to report-only
 * (used mid-rebuild while pages like /about/ are not built yet).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LinkChecker } from 'linkinator';

const DIST = join(process.cwd(), 'dist');
const ALLOW_MISSING = process.argv.includes('--allow-missing');

if (!existsSync(DIST)) {
  console.error('check-links: dist/ not found — run `npx astro build` first.');
  process.exit(1);
}

const checker = new LinkChecker();

const result = await checker.check({
  path: DIST,
  recurse: true,
  concurrency: 50,
  // Internal links resolve to the local server; anything else is external.
  linksToSkip: (link) =>
    Promise.resolve(/^https?:\/\//i.test(link) && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/i.test(link)),
});

const broken = result.links.filter((l) => l.state === 'BROKEN');

// linkinator reports absolute dist paths; show them as site routes.
const asRoute = (u) => (u?.startsWith(DIST) ? u.slice(DIST.length) || '/' : (u ?? '?'));

for (const link of broken) {
  console.log(`  ✗ ${link.status ?? '???'} ${asRoute(link.url)} (linked from ${asRoute(link.parent)})`);
}

const checked = result.links.filter((l) => l.state !== 'SKIPPED').length;
console.log(
  `check-links: ${checked} internal link(s) checked — ${broken.length} broken` +
    (ALLOW_MISSING && broken.length > 0 ? ' (--allow-missing: report-only)' : '') +
    '.',
);
process.exit(broken.length > 0 && !ALLOW_MISSING ? 1 : 0);
