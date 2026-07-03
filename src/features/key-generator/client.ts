import { randomBytes, randomChars } from '../../lib/random';
import { bytesToHex, bytesToBase64 } from '../../lib/bytes';
import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="key-generator"]');

if (root) {
  const sizeSelect = $<HTMLSelectElement>('#kg-size', root)!;
  const customBytes = $<HTMLInputElement>('#kg-custom-bytes', root)!;
  const formatSelect = $<HTMLSelectElement>('#kg-format', root)!;
  const countInput = $<HTMLInputElement>('#kg-count', root)!;
  const countValue = $('#kg-count-value', root)!;
  const error = $('#kg-error', root)!;
  const results = $<HTMLUListElement>('#kg-results', root)!;
  const generateBtn = $('#kg-generate', root)!;
  const copyAllBtn = $('#kg-copy-all', root)!;
  const entropyEl = $('#kg-entropy', root)!;
  const lengthEl = $('#kg-length', root)!;

  const FORMATS = ['hex', 'base64', 'base64url', 'alphanumeric'] as const;
  type Format = (typeof FORMATS)[number];

  const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const BITS_PER_ALNUM_CHAR = Math.log2(62); // ≈ 5.954
  const MAX_CUSTOM_BYTES = 1024;

  let currentKeys: string[] = [];

  function currentFormat(): Format {
    const v = formatSelect.value;
    return (FORMATS as readonly string[]).includes(v) ? (v as Format) : 'hex';
  }

  function currentCount(): number {
    const n = parseInt(countInput.value, 10);
    return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 3;
  }

  /** Selected key length in bytes, or null if the custom field is invalid. */
  function selectedBytes(): number | null {
    if (sizeSelect.value === 'custom') {
      const raw = customBytes.value.trim();
      const n = Number(raw);
      if (raw === '' || !Number.isInteger(n) || n < 1 || n > MAX_CUSTOM_BYTES) {
        return null;
      }
      return n;
    }
    const bits = parseInt(sizeSelect.value, 10);
    return Number.isFinite(bits) ? bits / 8 : 32;
  }

  function makeKey(bytes: number, format: Format): { key: string; bits: number } {
    if (format === 'alphanumeric') {
      // Round the character count up so the key never carries fewer bits than
      // the requested size: each char contributes log2(62) ≈ 5.95 bits.
      const chars = Math.ceil((bytes * 8) / BITS_PER_ALNUM_CHAR);
      return { key: randomChars(ALNUM, chars), bits: chars * BITS_PER_ALNUM_CHAR };
    }
    const buf = randomBytes(bytes);
    const key =
      format === 'hex' ? bytesToHex(buf) : bytesToBase64(buf, format === 'base64url');
    return { key, bits: bytes * 8 };
  }

  function clearOutput(): void {
    currentKeys = [];
    results.textContent = '';
    entropyEl.textContent = '–';
    lengthEl.textContent = '–';
  }

  function render(): void {
    results.textContent = '';
    for (const key of currentKeys) {
      const li = document.createElement('li');
      li.style.cursor = 'pointer';
      li.title = 'Click to copy';

      const label = document.createElement('span');
      label.textContent = key;

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-ghost btn-sm';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', 'Copy this key');
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        void copyText(key);
      });

      li.addEventListener('click', () => void copyText(key));
      li.append(label, copyBtn);
      results.appendChild(li);
    }
  }

  function generate(): void {
    const bytes = selectedBytes();
    if (bytes === null) {
      error.textContent = `Custom length must be a whole number of bytes between 1 and ${MAX_CUSTOM_BYTES}.`;
      clearOutput();
      return;
    }
    error.textContent = '';

    const format = currentFormat();
    const count = currentCount();

    currentKeys = [];
    let bits = 0;
    for (let i = 0; i < count; i++) {
      const made = makeKey(bytes, format);
      currentKeys.push(made.key);
      bits = made.bits;
    }
    render();
    entropyEl.textContent = String(Math.round(bits));
    lengthEl.textContent = String(currentKeys[0]?.length ?? 0);
  }

  sizeSelect.addEventListener('change', () => {
    customBytes.disabled = sizeSelect.value !== 'custom';
    generate();
  });
  formatSelect.addEventListener('change', generate);
  onInput(customBytes, generate);
  customBytes.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generate();
  });
  onInput(countInput, () => {
    countValue.textContent = countInput.value;
    generate();
  });
  generateBtn.addEventListener('click', generate);
  copyAllBtn.addEventListener('click', () => {
    if (currentKeys.length === 0) {
      showToast('Nothing to copy yet — generate some keys first', 'error');
      return;
    }
    void copyText(currentKeys.join('\n'));
  });

  generate();
}
