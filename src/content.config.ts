import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_SLUGS } from './config/categories';

/**
 * THE TOOL CONTRACT.
 *
 * One folder per tool under src/features/<slug>/ containing:
 *   content.md  — this frontmatter + the page's prose body (## How to use,
 *                 ## How it works, ## Use cases & limitations, optional ## Privacy note)
 *   Ui.astro    — the interactive block only (no page chrome), ids prefixed
 *                 with the tool's short prefix, includes <script src="./client.ts">
 *   client.ts   — all DOM behavior; imports from src/lib and npm libs only
 *
 * Everything else (routes, sitemap, search index, category hubs, related
 * links, homepage grids) derives from this collection. Never hand-edit a
 * central registry.
 */
const tools = defineCollection({
  loader: glob({
    pattern: '*/content.md',
    base: './src/features',
    // The tool's id (and URL slug) is its folder name.
    generateId: ({ entry }) => entry.split('/')[0]!,
  }),
  schema: z.object({
    /** Display name, e.g. "Password Generator" */
    name: z.string().min(3),
    /** Full <title>: unique, keyword-first, <= 65 chars incl. suffix */
    title: z.string().min(15).max(65),
    /** Meta description: unique, 120-165 chars */
    description: z.string().min(120).max(165),
    category: z.enum(CATEGORY_SLUGS),
    /** Aliases for the command palette / fuzzy search ("b64", "jwt decode") */
    keywords: z.array(z.string()).min(2).max(12),
    /** Tabler icon name (outline set), e.g. "key", "qrcode" */
    icon: z.string(),
    /** Slugs of 3-8 related tools; validated post-build by check-content */
    related: z.array(z.string()).min(3).max(8),
    /** 'local' = never leaves the browser; 'external-api' requires apiNote */
    privacy: z.enum(['local', 'external-api']),
    /** Exact inline disclosure shown in the badge when privacy='external-api' */
    apiNote: z.string().optional(),
    /** Which affiliate offer group fits this tool, if any */
    affiliateGroup: z.enum(['passwords', 'vpn', 'dev']).optional(),
    /** Per-tool ad opt-out (e.g. fingerprint/WebRTC pages) */
    ads: z.boolean().default(true),
    /** 4-8 visible FAQs; answers are markdown, rendered at build time */
    faqs: z
      .array(z.object({ q: z.string().min(8), a: z.string().min(40) }))
      .min(4)
      .max(8),
    /** Truthful last-substantive-update date; drives sitemap <lastmod> */
    updated: z.coerce.date(),
    /** JSON-LD applicationCategory */
    jsonLdCategory: z.enum([
      'SecurityApplication',
      'DeveloperApplication',
      'UtilitiesApplication',
    ]),
    /** Featured on the homepage "Popular tools" row */
    popular: z.boolean().default(false),
  })
  .refine((t) => t.privacy !== 'external-api' || !!t.apiNote, {
    message: "apiNote is required when privacy is 'external-api'",
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string().min(15).max(70),
    description: z.string().min(120).max(165),
    /** Slugs of tools this guide pairs with (for "Try the tool" callouts) */
    tools: z.array(z.string()).min(1).max(4),
    relatedGuides: z.array(z.string()).max(4).default([]),
    affiliateGroup: z.enum(['passwords', 'vpn', 'dev']).optional(),
    updated: z.coerce.date(),
  }),
});

export const collections = { tools, guides };
