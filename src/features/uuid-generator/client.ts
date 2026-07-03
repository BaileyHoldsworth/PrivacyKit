import { randomBytes } from '../../lib/random';
import { $, $$, onInput } from '../../lib/dom';
import { downloadText } from '../../lib/download';

const root = document.querySelector<HTMLElement>('[data-tool="uuid-generator"]');

if (root) {
  const output = $<HTMLTextAreaElement>('#uuid-output', root)!;
  const downloadBtn = $<HTMLButtonElement>('#uuid-download', root)!;
  const versionButtons = $$<HTMLButtonElement>('[data-uuid-version]', root);
  const countInput = $<HTMLInputElement>('#uuid-count', root)!;
  const countValue = $('#uuid-count-value', root)!;
  const uppercaseBox = $<HTMLInputElement>('#uuid-uppercase', root)!;
  const noHyphensBox = $<HTMLInputElement>('#uuid-no-hyphens', root)!;
  const error = $('#uuid-error', root)!;
  const generateBtn = $('#uuid-generate', root)!;
  const bitsEl = $('#uuid-bits', root)!;
  const layoutEl = $('#uuid-layout', root)!;
  const noteEl = $('#uuid-note', root)!;

  const NOTES: Record<'4' | '7', string> = {
    '4': 'v4 UUIDs are 122 bits of pure randomness — nothing in them reveals when or where they were made.',
    '7': 'v7 UUIDs start with a 48-bit millisecond timestamp, so they sort by creation time — good for database keys, but anyone holding one can read off when it was generated.',
  };
  const LAYOUTS: Record<'4' | '7', { bits: string; layout: string }> = {
    '4': { bits: '122', layout: 'all random' },
    '7': { bits: '74', layout: '48-bit timestamp + random' },
  };

  let version: '4' | '7' = '4';
  /** Canonical (lowercase, hyphenated) UUIDs; formatting is applied at render time. */
  let uuids: string[] = [];

  const HEX: string[] = [];
  for (let i = 0; i < 256; i++) HEX.push(i.toString(16).padStart(2, '0'));

  function formatUuidBytes(b: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < 16; i++) hex += HEX[b[i]!];
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function uuidV4(): string {
    // Native fast path; fall back to raw CSPRNG bytes (e.g. very old browsers).
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const b = randomBytes(16);
    b[6] = 0x40 | (b[6]! & 0x0f); // version 4
    b[8] = 0x80 | (b[8]! & 0x3f); // RFC 9562 variant
    return formatUuidBytes(b);
  }

  /** RFC 9562 UUIDv7: 48-bit Unix ms timestamp, then 74 random bits. */
  function uuidV7(): string {
    const b = randomBytes(16);
    const ms = Date.now();
    // Big-endian 48-bit timestamp. ms exceeds 32 bits, so split before any
    // bitwise ops (which would truncate).
    const hi = Math.floor(ms / 0x100000000);
    const lo = ms % 0x100000000;
    b[0] = (hi >>> 8) & 0xff;
    b[1] = hi & 0xff;
    b[2] = (lo >>> 24) & 0xff;
    b[3] = (lo >>> 16) & 0xff;
    b[4] = (lo >>> 8) & 0xff;
    b[5] = lo & 0xff;
    b[6] = 0x70 | (b[6]! & 0x0f); // version 7 over rand_a
    b[8] = 0x80 | (b[8]! & 0x3f); // RFC 9562 variant over rand_b
    return formatUuidBytes(b);
  }

  /** Re-render the stored UUIDs with the current display toggles. */
  function render(): void {
    let lines = uuids;
    if (noHyphensBox.checked) lines = lines.map((u) => u.replaceAll('-', ''));
    if (uppercaseBox.checked) lines = lines.map((u) => u.toUpperCase());
    output.value = lines.join('\n');
    downloadBtn.disabled = uuids.length === 0;
  }

  function generate(): void {
    error.textContent = '';
    if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
      error.textContent =
        'This browser does not expose a secure random source (crypto.getRandomValues), so UUIDs cannot be generated safely.';
      return;
    }
    // The slider constrains input to 1-100; clamp anyway so a DOM edit can
    // never trigger a runaway loop.
    const parsed = parseInt(countInput.value, 10);
    const count = Math.min(100, Math.max(1, Number.isNaN(parsed) ? 5 : parsed));

    const make = version === '7' ? uuidV7 : uuidV4;
    const next: string[] = [];
    for (let i = 0; i < count; i++) next.push(make());
    uuids = next;
    render();

    bitsEl.textContent = LAYOUTS[version].bits;
    layoutEl.textContent = LAYOUTS[version].layout;
    noteEl.textContent = NOTES[version];
  }

  for (const btn of versionButtons) {
    btn.addEventListener('click', () => {
      for (const b of versionButtons) {
        const active = b === btn;
        b.setAttribute('aria-pressed', String(active));
        b.classList.toggle('btn-primary', active);
      }
      version = btn.dataset.uuidVersion === '7' ? '7' : '4';
      generate();
    });
  }

  onInput(countInput, () => {
    countValue.textContent = countInput.value;
    generate();
  });
  // Display toggles reformat the existing batch instead of regenerating, so
  // flipping case or hyphens never silently swaps the IDs out.
  uppercaseBox.addEventListener('change', render);
  noHyphensBox.addEventListener('change', render);
  generateBtn.addEventListener('click', generate);
  downloadBtn.addEventListener('click', () => {
    if (uuids.length === 0) return;
    downloadText(`${output.value}\n`, `uuids-v${version}.txt`);
  });

  generate();
}
