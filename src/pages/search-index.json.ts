import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCategory } from '../config/categories';

/**
 * Compact tool index consumed by the command palette (src/lib/palette.ts).
 * Emitted at build time; fetched lazily on first palette open.
 */
export const GET: APIRoute = async () => {
  const tools = await getCollection('tools');
  const index = tools
    .map((t) => ({
      slug: t.id,
      name: t.data.name,
      description: t.data.description,
      keywords: t.data.keywords,
      cat: getCategory(t.data.category).shortName,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
