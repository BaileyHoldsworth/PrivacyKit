import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site';
import { CATEGORIES } from '../config/categories';
import { CRON_PRESETS } from '../data/cron-presets';
import { PASSWORD_PRESETS } from '../data/password-presets';

/**
 * Hand-rolled sitemap so <lastmod> only ever comes from truthful per-entry
 * `updated` frontmatter. Static pages carry no lastmod at all — we don't
 * track their edit dates, and an invented date is worse than none.
 * No changefreq/priority: Google ignores both.
 */

const STATIC_PAGES = [
  '/',
  '/tools/',
  '/guides/',
  '/about/',
  '/contact/',
  '/privacy-policy/',
  '/terms/',
  '/affiliate-disclosure/',
  '/licenses/',
];

interface SitemapEntry {
  path: string;
  lastmod?: string;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');
}

export const GET: APIRoute = async () => {
  const tools = await getCollection('tools');
  const guides = await getCollection('guides');

  const entries: SitemapEntry[] = [
    ...STATIC_PAGES.map((path) => ({ path })),
    ...CATEGORIES.map((c) => ({ path: `/category/${c.slug}/` })),
    ...tools.map((t) => ({
      path: `/tools/${t.id}/`,
      lastmod: toIsoDate(t.data.updated),
    })),
    ...guides.map((g) => ({
      path: `/guides/${g.id}/`,
      lastmod: toIsoDate(g.data.updated),
    })),
    ...CRON_PRESETS.map((p) => ({ path: `/cron/${p.slug}/` })),
    ...PASSWORD_PRESETS.map((p) => ({ path: `/password-generator/${p.slug}/` })),
  ];

  const urls = entries
    .map((e) => {
      const loc = `<loc>${escapeXml(`${SITE.url}${e.path}`)}</loc>`;
      const lastmod = e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : '';
      return `  <url>${loc}${lastmod}</url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
