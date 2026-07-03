// @ts-check
import { defineConfig } from 'astro/config';

// Static-output config for Cloudflare Pages.
// The sitemap is a hand-rolled endpoint (src/pages/sitemap.xml.ts) so that
// <lastmod> comes only from truthful per-entry `updated` frontmatter.
export default defineConfig({
  site: 'https://privacykit.dev',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
});
