/**
 * Programmatic long-tail pages for /password-generator/<preset>/.
 * Each targets a specific "X character password" search with genuinely
 * different entropy math, so the pages are not thin duplicates. Body prose is
 * generated from real numbers in the route.
 */
export interface PasswordPreset {
  slug: string;
  length: number;
  /** Which pools are on by default for this preset. */
  sets: { lower: boolean; upper: boolean; numbers: boolean; symbols: boolean };
  label: string;
  /** One unique sentence of framing for this length (hand-written). */
  note: string;
}

export const PASSWORD_PRESETS: PasswordPreset[] = [
  {
    slug: '8-characters',
    length: 8,
    sets: { lower: true, upper: true, numbers: true, symbols: true },
    label: '8-character password',
    note: 'Eight characters is the old minimum many sites still enforce — fine for a throwaway account behind a rate-limited login, but short enough that you should not reuse it anywhere that matters.',
  },
  {
    slug: '12-characters',
    length: 12,
    sets: { lower: true, upper: true, numbers: true, symbols: true },
    label: '12-character password',
    note: 'Twelve characters is a reasonable floor for accounts you care about; it clears the range where offline attacks against a fast hash become practical for a well-funded attacker.',
  },
  {
    slug: '16-characters',
    length: 16,
    sets: { lower: true, upper: true, numbers: true, symbols: true },
    label: '16-character password',
    note: 'Sixteen characters is the sweet spot for anything important: comfortably beyond brute force, still short enough to type occasionally if you must.',
  },
  {
    slug: '20-characters',
    length: 20,
    sets: { lower: true, upper: true, numbers: true, symbols: true },
    label: '20-character password',
    note: 'Twenty characters is a sensible default when a password manager does the remembering — there is no memorability cost, so you may as well take the extra margin.',
  },
  {
    slug: '24-characters',
    length: 24,
    sets: { lower: true, upper: true, numbers: true, symbols: true },
    label: '24-character password',
    note: 'Twenty-four characters suits secrets that could be attacked offline for years: vault master passwords, disk-encryption keys, root credentials.',
  },
  {
    slug: '32-characters',
    length: 32,
    sets: { lower: true, upper: true, numbers: true, symbols: true },
    label: '32-character password',
    note: 'Thirty-two characters is effectively a passphrase-strength secret in symbol form — useful as an API secret or a key you paste once and store in a manager.',
  },
  {
    slug: '64-characters',
    length: 64,
    sets: { lower: true, upper: true, numbers: true, symbols: true },
    label: '64-character password',
    note: 'Sixty-four characters is far past any practical need for an account password; it exists for machine-to-machine secrets where length is free and paranoia is cheap.',
  },
  {
    slug: 'no-symbols',
    length: 20,
    sets: { lower: true, upper: true, numbers: true, symbols: false },
    label: '20-character password without symbols',
    note: 'Some legacy systems reject punctuation. Dropping symbols shrinks the per-character pool from 94 to 62, so this preset compensates by keeping the length at twenty.',
  },
];
