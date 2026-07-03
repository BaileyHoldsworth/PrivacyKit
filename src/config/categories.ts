/** The 9 tool categories. Order controls sidebar + homepage section order. */
export const CATEGORIES = [
  {
    slug: 'passwords',
    name: 'Passwords & Secrets',
    shortName: 'Passwords',
    description:
      'Generate and evaluate passwords, passphrases, PINs and other secrets — all created locally in your browser with cryptographically secure randomness.',
    icon: 'key',
  },
  {
    slug: 'privacy',
    name: 'Privacy Tools',
    shortName: 'Privacy',
    description:
      'See what your browser reveals, check whether a password has appeared in a breach, strip trackers from links and clean hidden metadata from files.',
    icon: 'shield-lock',
  },
  {
    slug: 'encoding',
    name: 'Encoding & Decoding',
    shortName: 'Encoding',
    description:
      'Convert between text encodings: Base64, URL encoding, HTML entities, JWTs and more — instantly and entirely offline.',
    icon: 'binary',
  },
  {
    slug: 'crypto',
    name: 'Crypto & Keys',
    shortName: 'Crypto',
    description:
      'Hashes, HMACs, UUIDs and encryption keys computed with the Web Crypto API built into your browser.',
    icon: 'lock-square',
  },
  {
    slug: 'text',
    name: 'Text & Data',
    shortName: 'Text',
    description:
      'Format, validate, compare and transform text and data: JSON, regular expressions, Markdown, diffs and everyday text utilities.',
    icon: 'file-text',
  },
  {
    slug: 'datetime',
    name: 'Date & Time',
    shortName: 'Date & Time',
    description:
      'Unix timestamps, cron expressions and timezone conversions, computed live without sending anything anywhere.',
    icon: 'clock',
  },
  {
    slug: 'images',
    name: 'Images & Files',
    shortName: 'Images',
    description:
      'QR codes, EXIF metadata, image compression and file conversions processed on your device — files never upload to a server.',
    icon: 'photo',
  },
  {
    slug: 'network',
    name: 'Network & Web',
    shortName: 'Network',
    description:
      'IP, DNS and subnet utilities for network debugging. Tools that must call an external service say so clearly on the page.',
    icon: 'world',
  },
  {
    slug: 'math',
    name: 'Math & Color',
    shortName: 'Math & Color',
    description:
      'Number base conversions, color format conversions and quick calculators for developers and designers.',
    icon: 'calculator',
  },
] as const;

export const CATEGORY_SLUGS = [
  'passwords',
  'privacy',
  'encoding',
  'crypto',
  'text',
  'datetime',
  'images',
  'network',
  'math',
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export function getCategory(slug: CategorySlug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) throw new Error(`Unknown category: ${slug}`);
  return cat;
}
