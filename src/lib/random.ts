/**
 * Cryptographically secure randomness helpers.
 *
 * All site randomness goes through these. Rejection sampling removes the
 * modulo bias that `randomValue % n` introduces when n does not divide 2^32.
 */

/** Uniform random integer in [0, maxExclusive). Throws on invalid bounds. */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0x100000000) {
    throw new RangeError(`randomInt: invalid bound ${maxExclusive}`);
  }
  // Largest multiple of maxExclusive that fits in 32 bits; values at or above
  // it are rejected so every residue class is equally likely.
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0]!;
  } while (v >= limit);
  return v % maxExclusive;
}

/** Uniformly chosen element of a non-empty array or string. */
export function randomItem<T>(items: readonly T[]): T;
export function randomItem(items: string): string;
export function randomItem(items: readonly unknown[] | string): unknown {
  if (items.length === 0) throw new RangeError('randomItem: empty input');
  return items[randomInt(items.length)];
}

/** n uniformly random characters drawn from charset. */
export function randomChars(charset: string, n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += charset[randomInt(charset.length)];
  return out;
}

/** n cryptographically random bytes. */
export function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  // getRandomValues caps at 65536 bytes per call.
  for (let i = 0; i < n; i += 65536) {
    crypto.getRandomValues(buf.subarray(i, Math.min(i + 65536, n)));
  }
  return buf;
}

/** In-place Fisher-Yates shuffle using unbiased randomness. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
