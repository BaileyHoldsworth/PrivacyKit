import { $, onInput } from '../../lib/dom';
import { bytesToBase64, bytesToHex, hexToBytes } from '../../lib/bytes';

const root = document.querySelector<HTMLElement>('[data-tool="hmac-generator"]');

if (root) {
  const message = $<HTMLTextAreaElement>('#hmac-message', root)!;
  const keyInput = $<HTMLInputElement>('#hmac-key', root)!;
  const keyEncoding = $<HTMLSelectElement>('#hmac-key-encoding', root)!;
  const algorithm = $<HTMLSelectElement>('#hmac-algorithm', root)!;
  const hexOut = $<HTMLInputElement>('#hmac-hex', root)!;
  const b64Out = $<HTMLInputElement>('#hmac-b64', root)!;
  const error = $('#hmac-error', root)!;
  const clearBtn = $('#hmac-clear', root)!;

  // Monotonic sequence number so a slow sign() over a huge message can never
  // overwrite the result of a newer keystroke.
  let seq = 0;

  function show(hex: string, b64: string, msg = ''): void {
    hexOut.value = hex;
    b64Out.value = b64;
    error.textContent = msg;
  }

  function keyBytes(): Uint8Array | null {
    if (keyEncoding.value === 'hex') {
      let bytes: Uint8Array;
      try {
        bytes = hexToBytes(keyInput.value);
      } catch {
        show('', '', 'The key is not valid hex — use pairs of 0-9 a-f characters, e.g. 4a656665.');
        return null;
      }
      if (bytes.length === 0) {
        show('', '', 'The hex key is empty once whitespace is removed — enter at least one byte.');
        return null;
      }
      return bytes;
    }
    return new TextEncoder().encode(keyInput.value);
  }

  async function compute(): Promise<void> {
    const run = ++seq;

    if (keyInput.value === '') {
      // HMAC of an empty message is defined, but an empty key is not usable —
      // WebCrypto rejects zero-length HMAC keys.
      show('', '', message.value === '' ? '' : 'Enter a secret key — HMAC needs one even for a short message.');
      return;
    }

    const key = keyBytes();
    if (key === null) return;

    if (!globalThis.crypto?.subtle) {
      show('', '', 'WebCrypto is unavailable — this tool needs a secure (HTTPS) context to sign.');
      return;
    }

    try {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'HMAC', hash: algorithm.value },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(message.value) as BufferSource
      );
      if (run !== seq) return; // superseded by a newer input event
      const bytes = new Uint8Array(signature);
      show(bytesToHex(bytes), bytesToBase64(bytes));
    } catch {
      if (run !== seq) return;
      show('', '', 'Signing failed — your browser rejected this key or algorithm. Try HMAC-SHA-256 with a non-empty key.');
    }
  }

  // Live compute, debounced per the tool spec; selects recompute immediately.
  onInput(message, () => void compute(), 150);
  onInput(keyInput, () => void compute(), 150);
  keyEncoding.addEventListener('change', () => void compute());
  algorithm.addEventListener('change', () => void compute());

  clearBtn.addEventListener('click', () => {
    message.value = '';
    keyInput.value = '';
    show('', '');
    message.focus();
  });
}
