/**
 * Pure colour conversions usable at build time (the /colors/ programmatic
 * pages) and on the client. sRGB → HSL and sRGB → OKLCH follow Björn
 * Ottosson's OKLab derivation; WCAG 2.1 relative luminance for contrast.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();
}

export function rgbToCss({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHsl({ r, g, b }: Rgb): string {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return `hsl(${+(h * 360).toFixed(1)}, ${+(s * 100).toFixed(1)}%, ${+(l * 100).toFixed(1)}%)`;
}

const srgbToLinear = (c: number) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export function rgbToOklch({ r, g, b }: Rgb): string {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return `oklch(${+(L * 100).toFixed(1)}% ${+C.toFixed(4)} ${C < 1e-4 ? 0 : +H.toFixed(2)})`;
}

/** WCAG contrast ratio of a colour against white and black. */
export function contrastRatios({ r, g, b }: Rgb): { white: number; black: number } {
  const L = 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
  return { white: +(1.05 / (L + 0.05)).toFixed(2), black: +((L + 0.05) / 0.05).toFixed(2) };
}

/** Lighten/darken by mixing toward white/black in sRGB (approximate shades). */
export function shade({ r, g, b }: Rgb, amount: number): Rgb {
  const t = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  return { r: r + (t - r) * k, g: g + (t - g) * k, b: b + (t - b) * k };
}
