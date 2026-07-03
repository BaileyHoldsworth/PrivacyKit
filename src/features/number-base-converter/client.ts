import { $ } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="number-base-converter"]');

if (root) {
  const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
  // BigInt multiplication is ~O(n²); 10k digits parses + reformats in well
  // under 50ms, so cap there rather than let a giant paste freeze the tab.
  const MAX_LEN = 10000;

  interface Field {
    el: HTMLInputElement;
    err: HTMLElement;
    /** Fixed radix, or null for the base that comes from the base selector. */
    base: number | null;
    /** Digits per group when grouping is on. */
    groupSize: number;
    /** Emitted prefix (with the "Show base prefixes" option), if any. */
    prefix: string;
  }

  const baseInput = $<HTMLInputElement>('#nb-base', root)!;
  const baseLabel = $('#nb-base-label', root)!;
  const groupToggle = $<HTMLInputElement>('#nb-group', root)!;
  const prefixToggle = $<HTMLInputElement>('#nb-prefix', root)!;
  const clearBtn = $('#nb-clear', root)!;

  const fields: Field[] = [
    { el: $<HTMLInputElement>('#nb-bin', root)!, err: $('#nb-bin-err', root)!, base: 2, groupSize: 4, prefix: '0b' },
    { el: $<HTMLInputElement>('#nb-oct', root)!, err: $('#nb-oct-err', root)!, base: 8, groupSize: 3, prefix: '0o' },
    { el: $<HTMLInputElement>('#nb-dec', root)!, err: $('#nb-dec-err', root)!, base: 10, groupSize: 3, prefix: '' },
    { el: $<HTMLInputElement>('#nb-hex', root)!, err: $('#nb-hex-err', root)!, base: 16, groupSize: 4, prefix: '0x' },
    { el: $<HTMLInputElement>('#nb-custom', root)!, err: $('#nb-custom-err', root)!, base: null, groupSize: 4, prefix: '' },
  ];

  /** Current canonical value shared across every field; null = all empty. */
  let value: bigint | null = null;

  /** Resolve the selected custom base, or null if it's out of the 2–36 range. */
  function customBase(): number | null {
    const n = parseInt(baseInput.value, 10);
    if (!Number.isInteger(n) || n < 2 || n > 36) return null;
    return n;
  }

  function radixOf(f: Field): number | null {
    return f.base ?? customBase();
  }

  function digitValue(ch: string): number {
    return DIGITS.indexOf(ch.toLowerCase());
  }

  function group(magnitude: string, size: number): string {
    const parts: string[] = [];
    for (let i = magnitude.length; i > 0; i -= size) {
      parts.unshift(magnitude.slice(Math.max(0, i - size), i));
    }
    return parts.join(' ');
  }

  /** Parse a field's text in its radix. Returns a value, an error, or empty. */
  function parse(raw: string, base: number): { value?: bigint; error?: string; empty?: boolean } {
    let s = raw.trim();
    if (s === '') return { empty: true };
    if (s.length > MAX_LEN) return { error: `Too long — keep it under ${MAX_LEN.toLocaleString()} characters.` };

    let negative = false;
    if (s[0] === '-') { negative = true; s = s.slice(1); }
    else if (s[0] === '+') { s = s.slice(1); }

    // Accept optional base prefixes regardless of which field they land in.
    if (base === 2) s = s.replace(/^0b/i, '');
    else if (base === 8) s = s.replace(/^0o/i, '');
    else if (base === 16) s = s.replace(/^0x/i, '');

    // Grouping separators are display sugar — ignore them on the way back in.
    s = s.replace(/[\s_,]/g, '');
    if (s === '') return { error: 'Enter at least one digit.' };

    let acc = 0n;
    const B = BigInt(base);
    for (const ch of s) {
      const d = digitValue(ch);
      if (d < 0 || d >= base) {
        return { error: `"${ch}" is not a valid base-${base} digit.` };
      }
      acc = acc * B + BigInt(d);
    }
    return { value: negative ? -acc : acc };
  }

  /** Format the canonical value for a field, honouring group/prefix toggles. */
  function format(v: bigint, base: number, f: Field): string {
    const raw = v.toString(base);
    const negative = raw.startsWith('-');
    let magnitude = negative ? raw.slice(1) : raw;
    if (groupToggle.checked) magnitude = group(magnitude, f.groupSize);
    const prefix = prefixToggle.checked && f.prefix ? f.prefix : '';
    return (negative ? '-' : '') + prefix + magnitude;
  }

  /** Repaint every field from the canonical value, skipping `except`. */
  function renderAll(except?: HTMLInputElement): void {
    for (const f of fields) {
      if (f.el === except) continue;
      const base = radixOf(f);
      if (value === null || base === null) {
        f.el.value = '';
      } else {
        f.el.value = format(value, base, f);
      }
      f.err.textContent = '';
    }
  }

  function clearAll(): void {
    value = null;
    for (const f of fields) {
      f.el.value = '';
      f.err.textContent = '';
    }
  }

  function onEdit(f: Field): void {
    const base = radixOf(f);
    if (base === null) {
      f.err.textContent = 'Set a base between 2 and 36 first.';
      return;
    }
    const result = parse(f.el.value, base);
    if (result.empty) {
      // Emptying a field resets everything to a clean, error-free state.
      value = null;
      f.err.textContent = '';
      renderAll(f.el);
      return;
    }
    if (result.error !== undefined) {
      f.err.textContent = result.error;
      return;
    }
    f.err.textContent = '';
    value = result.value!;
    renderAll(f.el);
  }

  for (const f of fields) {
    f.el.addEventListener('input', () => onEdit(f));
  }

  baseInput.addEventListener('input', () => {
    const custom = fields[fields.length - 1]!;
    const base = customBase();
    baseLabel.textContent = base === null ? '?' : String(base);
    if (base === null) {
      custom.err.textContent = 'Base must be a whole number from 2 to 36.';
      custom.el.value = '';
      return;
    }
    custom.err.textContent = '';
    // Re-express the shared value in the newly chosen base.
    custom.el.value = value === null ? '' : format(value, base, custom);
  });

  groupToggle.addEventListener('change', () => renderAll());
  prefixToggle.addEventListener('change', () => renderAll());
  clearBtn.addEventListener('click', () => {
    clearAll();
    fields[0]!.el.focus();
  });
}
