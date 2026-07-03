import { $, onInput } from '../../lib/dom';
import { bytesToBase64, base64ToBytes, formatBytes } from '../../lib/bytes';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="base64-encoder-decoder"]');

if (root) {
  const mode = $<HTMLSelectElement>('#b64-mode', root)!;
  const swapBtn = $<HTMLButtonElement>('#b64-swap', root)!;
  const urlSafe = $<HTMLInputElement>('#b64-urlsafe', root)!;
  const wrap = $<HTMLInputElement>('#b64-wrap', root)!;
  const input = $<HTMLTextAreaElement>('#b64-input', root)!;
  const output = $<HTMLTextAreaElement>('#b64-output', root)!;
  const inputLabel = $('#b64-input-label', root)!;
  const outputLabel = $('#b64-output-label', root)!;
  const inputCount = $('#b64-input-count', root)!;
  const outputCount = $('#b64-output-count', root)!;
  const error = $('#b64-error', root)!;
  const clearBtn = $<HTMLButtonElement>('#b64-clear', root)!;
  const downloadBtn = $<HTMLButtonElement>('#b64-download', root)!;

  // Chunk sizes keep each synchronous slice well under the ~50ms INP budget
  // even for 10MB inputs. Multiples of 3 bytes (encode) / 4 chars (decode)
  // guarantee '=' padding can only appear in the final chunk.
  const ENC_STEP = 3 * 0x50000;
  const DEC_STEP = 4 * 0x60000;
  const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
  // Conversions yield to the event loop; a stale run bails when a newer one starts.
  let runId = 0;

  function wrap76(s: string): string {
    if (s.length <= 76) return s;
    const parts: string[] = [];
    for (let i = 0; i < s.length; i += 76) parts.push(s.slice(i, i + 76));
    return parts.join('\n');
  }

  function describePosition(text: string, index: number): string {
    const before = text.slice(0, index);
    const line = (before.match(/\n/g)?.length ?? 0) + 1;
    if (line === 1) return `position ${index + 1}`;
    const col = index - before.lastIndexOf('\n');
    return `line ${line}, character ${col}`;
  }

  /** Pre-flight check so decode errors carry a position hint instead of a bare atob throw. */
  function validateBase64(raw: string): string | null {
    const bad = raw.match(/[^A-Za-z0-9+/=\-_\s]/);
    if (bad && bad.index !== undefined) {
      return `Invalid character “${bad[0]}” at ${describePosition(raw, bad.index)} — Base64 uses only A–Z, a–z, 0–9, +, / (or -, _) and = padding.`;
    }
    const cleaned = raw.replace(/\s+/g, '');
    const eq = cleaned.indexOf('=');
    if (eq !== -1 && !/^={1,2}$/.test(cleaned.slice(eq))) {
      return `Unexpected “=” at ${describePosition(raw, raw.indexOf('='))} — padding can only appear as the last one or two characters.`;
    }
    if (cleaned.replace(/=+$/, '').length % 4 === 1) {
      return `Length is off — Base64 comes in blocks of 4 characters, so ${cleaned.length} characters (ignoring whitespace) cannot be a complete value. A character may be missing.`;
    }
    return null;
  }

  function setCounts(el: HTMLElement, chars: number, bytes: number): void {
    el.textContent = `${chars.toLocaleString()} ${chars === 1 ? 'character' : 'characters'} · ${formatBytes(bytes)}`;
  }

  function fail(message: string): void {
    output.value = '';
    setCounts(outputCount, 0, 0);
    error.textContent = message;
  }

  async function convert(): Promise<void> {
    const id = ++runId;
    const raw = input.value;
    error.textContent = '';

    if (mode.value === 'encode') {
      const bytes = new TextEncoder().encode(raw);
      setCounts(inputCount, raw.length, bytes.length);
      let b64 = '';
      for (let i = 0; i < bytes.length; i += ENC_STEP) {
        b64 += bytesToBase64(bytes.subarray(i, i + ENC_STEP), urlSafe.checked);
        if (i + ENC_STEP < bytes.length) {
          await tick();
          if (id !== runId) return;
        }
      }
      if (wrap.checked) b64 = wrap76(b64);
      output.value = b64;
      setCounts(outputCount, b64.length, b64.length); // Base64 is ASCII: 1 char = 1 byte
      return;
    }

    // Decode
    setCounts(inputCount, raw.length, new TextEncoder().encode(raw).length);
    const problem = validateBase64(raw);
    if (problem) {
      fail(problem);
      return;
    }
    const cleaned = raw.replace(/\s+/g, '');
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (let i = 0; i < cleaned.length; i += DEC_STEP) {
        const part = base64ToBytes(cleaned.slice(i, i + DEC_STEP));
        chunks.push(part);
        total += part.length;
        if (i + DEC_STEP < cleaned.length) {
          await tick();
          if (id !== runId) return;
        }
      }
    } catch {
      fail('This input could not be decoded as Base64 — check for missing or stray characters.');
      return;
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const part of chunks) {
      bytes.set(part, offset);
      offset += part.length;
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      fail(
        `Valid Base64, but the ${formatBytes(total)} it decodes to are not UTF-8 text — this looks like binary data. Use the Base64 file converter to decode it to a downloadable file.`
      );
      return;
    }
    output.value = text;
    setCounts(outputCount, text.length, total);
  }

  function applyMode(): void {
    const encoding = mode.value === 'encode';
    inputLabel.textContent = encoding ? 'Text input' : 'Base64 input';
    outputLabel.textContent = encoding ? 'Base64 output' : 'Decoded text';
    input.placeholder = encoding ? 'Type or paste text to encode' : 'Paste Base64 to decode';
    output.placeholder = encoding ? 'Base64 appears here as you type' : 'Decoded text appears here';
  }

  onInput(input, () => void convert(), 150);
  mode.addEventListener('change', () => {
    applyMode();
    void convert();
  });
  for (const box of [urlSafe, wrap]) box.addEventListener('change', () => void convert());

  swapBtn.addEventListener('click', () => {
    mode.value = mode.value === 'encode' ? 'decode' : 'encode';
    if (output.value) input.value = output.value;
    applyMode();
    void convert();
    input.focus();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    void convert();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet', 'error');
      return;
    }
    downloadText(output.value, mode.value === 'encode' ? 'encoded-base64.txt' : 'decoded-text.txt');
  });

  applyMode();
  void convert();
}
