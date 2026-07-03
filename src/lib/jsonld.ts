/**
 * JSON-LD builders (build-time only). 2026 policy: SoftwareApplication,
 * BreadcrumbList, Organization, WebSite and Article are worth emitting;
 * FAQPage and HowTo are NOT (rich results removed) — FAQs stay visible text.
 */
import { SITE } from '../config/site';

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icons/icon-512.png`,
  };
}

export function webSiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

export function softwareApplicationLd(tool: {
  name: string;
  description: string;
  slug: string;
  jsonLdCategory: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    url: `${SITE.url}/tools/${tool.slug}/`,
    description: tool.description,
    applicationCategory: tool.jsonLdCategory,
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

export function breadcrumbLd(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE.url}${c.path}`,
    })),
  };
}

export function articleLd(guide: {
  title: string;
  description: string;
  slug: string;
  updated: Date;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: `${SITE.url}/guides/${guide.slug}/`,
    dateModified: guide.updated.toISOString().slice(0, 10),
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

export function collectionPageLd(page: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.name,
    description: page.description,
    url: `${SITE.url}${page.path}`,
  };
}
