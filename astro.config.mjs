// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Markdown tables with column alignment render as the deprecated `align`
 * attribute on <td>/<th>. Rewrite it to inline `text-align` (valid HTML5)
 * so guide tables stay clean without giving up alignment.
 */
function rehypeTableAlign() {
  return (tree) => {
    const visit = (node) => {
      if (node.tagName === 'td' || node.tagName === 'th') {
        const align = node.properties?.align;
        if (align) {
          delete node.properties.align;
          const prev = node.properties.style ? `${node.properties.style};` : '';
          node.properties.style = `${prev}text-align:${align}`;
        }
      }
      (node.children ?? []).forEach(visit);
    };
    visit(tree);
  };
}

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
  markdown: {
    rehypePlugins: [rehypeTableAlign],
  },
});
