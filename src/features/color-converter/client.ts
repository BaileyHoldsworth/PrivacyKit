import { $, onInput } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="color-converter"]');

if (root) {
  const input = $<HTMLInputElement>('#col-input', root)!;
  const picker = $<HTMLInputElement>('#col-picker', root)!;
  const error = $('#col-error', root)!;
  const swatch = $('#col-swatch', root)!;
  const hexEl = $('#col-hex', root)!;
  const rgbEl = $('#col-rgb', root)!;
  const hslEl = $('#col-hsl', root)!;
  const oklchEl = $('#col-oklch', root)!;
  const cwEl = $('#col-cw', root)!;
  const cbEl = $('#col-cb', root)!;
  const cwBadge = $('#col-cw-badge', root)!;
  const cbBadge = $('#col-cb-badge', root)!;

  const outputs = [hexEl, rgbEl, hslEl, oklchEl];

  // A single hidden probe: the CSSOM rejects invalid colour strings (leaving
  // style.color === ''), and getComputedStyle resolves valid ones to rgb(a).
  const probe = document.createElement('span');
  probe.style.display = 'none';
  root.appendChild(probe);

  interface Rgba { r: number; g: number; b: number; a: number; }

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

  function parseAlpha(tok: string): number {
    return tok.endsWith('%') ? clamp(parseFloat(tok) / 100, 0, 1) : clamp(parseFloat(tok), 0, 1);
  }

  /** Parse a *computed* colour string (rgb/rgba, or color(srgb …) fallback). */
  function parseComputed(str: string): Rgba | null {
    let m = str.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      const p = m[1].split(/[,/\s]+/).filter(Boolean);
      const r = Number(p[0]), g = Number(p[1]), b = Number(p[2]);
      if ([r, g, b].every(Number.isFinite)) {
        return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: p[3] !== undefined ? parseAlpha(p[3]) : 1 };
      }
    }
    // Wide-gamut serialisation, e.g. "color(srgb 0.48 0.22 0.93 / 0.8)".
    m = str.match(/color\(srgb\s+([^)]+)\)/i);
    if (m) {
      const raw = m[1].split('/');
      const p = raw[0].trim().split(/\s+/).filter(Boolean);
      const r = Number(p[0]), g = Number(p[1]), b = Number(p[2]);
      if ([r, g, b].every(Number.isFinite)) {
        return {
          r: Math.round(clamp(r, 0, 1) * 255),
          g: Math.round(clamp(g, 0, 1) * 255),
          b: Math.round(clamp(b, 0, 1) * 255),
          a: raw[1] !== undefined ? parseAlpha(raw[1].trim()) : 1,
        };
      }
    }
    return null;
  }

  function parse(text: string): Rgba | null {
    const s = text.trim();
    if (!s || s.length > 128) return null;
    probe.style.color = '';
    probe.style.color = s; // rejected values leave this empty
    if (probe.style.color === '') return null;
    return parseComputed(getComputedStyle(probe).color);
  }

  // --- Formatting helpers ------------------------------------------------

  const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase();

  /** Trim a float to <=3 dp without trailing zeros (0.5 not 0.500). */
  const trim = (n: number) => parseFloat(n.toFixed(3)).toString();

  function toHex({ r, g, b, a }: Rgba): string {
    const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
    return a < 1 ? base + hex2(a * 255) : base;
  }

  function toRgb({ r, g, b, a }: Rgba): string {
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${trim(a)})` : `rgb(${r}, ${g}, ${b})`;
  }

  function toHsl({ r, g, b, a }: Rgba): string {
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
    const H = +(h * 360).toFixed(1), S = +(s * 100).toFixed(1), L = +(l * 100).toFixed(1);
    return a < 1 ? `hsla(${H}, ${S}%, ${L}%, ${trim(a)})` : `hsl(${H}, ${S}%, ${L}%)`;
  }

  // sRGB → OKLCH. Björn Ottosson, "A perceptual colour space for image
  // processing" (2020): sRGB→linear→LMS matrix→cube root→OKLab→polar (LCH).
  const srgbToLinear = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  function toOklch({ r, g, b, a }: Rgba): string {
    const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
    const C = Math.hypot(A, B);
    let H = (Math.atan2(B, A) * 180) / Math.PI;
    if (H < 0) H += 360;
    const Lp = +(L * 100).toFixed(1), Cp = +C.toFixed(4), Hp = C < 1e-4 ? 0 : +H.toFixed(2);
    const core = `oklch(${Lp}% ${Cp} ${Hp})`;
    return a < 1 ? core.replace(/\)$/, ` / ${trim(a)})`) : core;
  }

  // WCAG 2.1 relative luminance and contrast ratio (alpha ignored).
  function contrast({ r, g, b }: Rgba): { white: number; black: number } {
    const L = 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
    return { white: 1.05 / (L + 0.05), black: (L + 0.05) / 0.05 };
  }

  function setBadge(el: HTMLElement, ratio: number): void {
    let text: string, cls: string;
    if (ratio >= 7) { text = 'AAA'; cls = 'badge-ok'; }
    else if (ratio >= 4.5) { text = 'AA'; cls = 'badge-ok'; }
    else if (ratio >= 3) { text = 'AA Large'; cls = 'badge-warn'; }
    else { text = 'Fail'; cls = 'badge-danger'; }
    el.textContent = text;
    el.className = `badge ${cls}`;
  }

  // --- Render ------------------------------------------------------------

  function clearOutputs(msg: string): void {
    error.textContent = msg;
    swatch.style.background = 'transparent';
    outputs.forEach((el) => { el.textContent = '–'; });
    cwEl.textContent = '–';
    cbEl.textContent = '–';
    cwBadge.textContent = '';
    cwBadge.className = 'badge';
    cbBadge.textContent = '';
    cbBadge.className = 'badge';
  }

  function render(syncPicker: boolean): void {
    const text = input.value;
    if (!text.trim()) { clearOutputs(''); return; }
    const c = parse(text);
    if (!c) { clearOutputs('Not a recognised CSS colour value.'); return; }

    error.textContent = '';
    swatch.style.background = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
    hexEl.textContent = toHex(c);
    rgbEl.textContent = toRgb(c);
    hslEl.textContent = toHsl(c);
    oklchEl.textContent = toOklch(c);

    const { white, black } = contrast(c);
    cwEl.textContent = white.toFixed(2);
    cbEl.textContent = black.toFixed(2);
    setBadge(cwBadge, white);
    setBadge(cbBadge, black);

    // The native picker is opaque-only: mirror the RGB, drop alpha.
    if (syncPicker) picker.value = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`.toLowerCase();
  }

  onInput(input, () => render(true), 60);
  picker.addEventListener('input', () => {
    input.value = picker.value;
    render(false);
  });

  render(true);
}
