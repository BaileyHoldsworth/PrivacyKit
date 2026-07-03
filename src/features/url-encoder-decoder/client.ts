import { $, onInput } from '../../lib/dom';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="url-encoder-decoder"]');

if (root) {
  const direction = $<HTMLSelectElement>('#url-direction', root)!;
  const style = $<HTMLSelectElement>('#url-style', root)!;
  const styleHint = $('#url-style-hint', root)!;
  const swapBtn = $<HTMLButtonElement>('#url-swap', root)!;
  const perLine = $<HTMLInputElement>('#url-lines', root)!;
  const plusAsSpace = $<HTMLInputElement>('#url-plus', root)!;
  const input = $<HTMLTextAreaElement>('#url-input', root)!;
  const output = $<HTMLTextAreaElement>('#url-output', root)!;
  const inputLabel = $('#url-input-label', root)!;
  const outputLabel = $('#url-output-label', root)!;
  const inputCount = $('#url-input-count', root)!;
  const outputCount = $('#url-output-count', root)!;
  const error = $('#url-error', root)!;
  const clearBtn = $<HTMLButtonElement>('#url-clear', root)!;
  const downloadBtn = $<HTMLButtonElement>('#url-download', root)!;

  const HINTS = {
    component:
      'encodeURIComponent escapes every reserved character, including / ? & = and # — ' +
      'use it on a single value such as one query-string parameter.',
    uri:
      'encodeURI keeps URL structure intact (: / ? # & = + stay unescaped) — use it on a ' +
      'complete URL, never on a value that itself contains & or =.',
    decode:
      'Decoding uses decodeURIComponent, which reverses both encodeURIComponent and ' +
      'encodeURI output.',
  };

  /**
   * Returns the index of the first byte of the first invalid UTF-8 sequence,
   * or -1 if the whole array is valid. Rejects overlong forms, surrogates
   * and code points above U+10FFFF — the same rules decodeURIComponent applies.
   */
  function findInvalidUtf8(bytes: number[]): number {
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i]!;
      if (b <= 0x7f) {
        i++;
        continue;
      }
      let need: number;
      let min: number;
      let cp: number;
      if (b >= 0xc2 && b <= 0xdf) {
        need = 1;
        min = 0x80;
        cp = b & 0x1f;
      } else if (b >= 0xe0 && b <= 0xef) {
        need = 2;
        min = 0x800;
        cp = b & 0x0f;
      } else if (b >= 0xf0 && b <= 0xf4) {
        need = 3;
        min = 0x10000;
        cp = b & 0x07;
      } else {
        return i; // stray continuation byte, overlong lead (C0/C1) or > F4
      }
      if (i + need >= bytes.length) return i; // truncated sequence
      for (let j = 1; j <= need; j++) {
        const c = bytes[i + j]!;
        if ((c & 0xc0) !== 0x80) return i;
        cp = (cp << 6) | (c & 0x3f);
      }
      if (cp < min || (cp >= 0xd800 && cp <= 0xdfff) || cp > 0x10ffff) return i;
      i += need + 1;
    }
    return -1;
  }

  /**
   * Pinpoints why decodeURIComponent threw: either a "%" not followed by two
   * hex digits, or a syntactically valid escape run that is not valid UTF-8.
   * Only literal characters terminate a multi-byte sequence, so each
   * contiguous run of %XX escapes can be validated independently.
   */
  function locateDecodeError(text: string): { index: number; kind: 'escape' | 'utf8' } | null {
    const malformed = /%(?![0-9A-Fa-f]{2})/.exec(text);
    const runRe = /(?:%[0-9A-Fa-f]{2})+/g;
    let run: RegExpExecArray | null;
    while ((run = runRe.exec(text)) !== null) {
      if (malformed && malformed.index < run.index) break;
      const bytes: number[] = [];
      for (let j = 0; j < run[0].length; j += 3) {
        bytes.push(parseInt(run[0].slice(j + 1, j + 3), 16));
      }
      const bad = findInvalidUtf8(bytes);
      if (bad !== -1) return { index: run.index + bad * 3, kind: 'utf8' };
    }
    if (malformed) return { index: malformed.index, kind: 'escape' };
    return null;
  }

  function describePosition(text: string, index: number): string {
    const before = text.slice(0, index);
    const line = (before.match(/\n/g)?.length ?? 0) + 1;
    if (line === 1) return `position ${index + 1}`;
    const col = index - before.lastIndexOf('\n');
    return `line ${line}, character ${col}`;
  }

  function setCount(el: HTMLElement, chars: number): void {
    el.textContent = `${chars.toLocaleString()} ${chars === 1 ? 'character' : 'characters'}`;
  }

  function fail(message: string): void {
    output.value = '';
    setCount(outputCount, 0);
    error.textContent = message;
  }

  function encodeOne(text: string): string {
    return style.value === 'uri' ? encodeURI(text) : encodeURIComponent(text);
  }

  function convert(): void {
    const raw = input.value;
    error.textContent = '';
    setCount(inputCount, raw.length);

    if (direction.value === 'encode') {
      let encoded: string;
      try {
        // Split on any newline convention so CRLF input does not leave a
        // stray %0D at the end of every encoded line.
        encoded = perLine.checked ? raw.split(/\r\n|\r|\n/).map(encodeOne).join('\n') : encodeOne(raw);
      } catch {
        // Only unpaired surrogates (e.g. half an emoji from a bad paste) get here.
        fail('The input contains an unpaired surrogate character that cannot be encoded — re-paste the text or remove the broken character.');
        return;
      }
      output.value = encoded;
      setCount(outputCount, encoded.length);
      return;
    }

    // Decode. "+" only means a space in form-encoded data, so it is opt-in.
    const text = plusAsSpace.checked ? raw.replace(/\+/g, ' ') : raw;
    let decoded: string;
    try {
      decoded = decodeURIComponent(text);
    } catch {
      const loc = locateDecodeError(text);
      if (!loc) {
        fail('This input could not be decoded — check for broken % escapes.');
      } else if (loc.kind === 'escape') {
        const found = text.slice(loc.index + 1, loc.index + 3);
        fail(
          `Broken escape at ${describePosition(text, loc.index)} — every “%” must be followed by two hex digits, ` +
            (found ? `but here it is followed by “${found}”. ` : 'but here the input ends. ') +
            'A literal percent sign must itself be encoded as %25.'
        );
      } else {
        const snippet = text.slice(loc.index, loc.index + 12);
        fail(
          `The escape sequence at ${describePosition(text, loc.index)} (“${snippet}…”) is not valid UTF-8. ` +
            'It was likely produced by a legacy encoder using Latin-1 — e.g. é as %E9 instead of %C3%A9.'
        );
      }
      return;
    }
    output.value = decoded;
    setCount(outputCount, decoded.length);
  }

  function applyDirection(): void {
    const encoding = direction.value === 'encode';
    style.disabled = !encoding;
    perLine.disabled = !encoding;
    plusAsSpace.disabled = encoding;
    styleHint.textContent = encoding
      ? HINTS[style.value === 'uri' ? 'uri' : 'component']
      : HINTS.decode;
    inputLabel.textContent = encoding ? 'Text input' : 'Encoded input';
    outputLabel.textContent = encoding ? 'Encoded output' : 'Decoded text';
    input.placeholder = encoding ? 'Type or paste text to encode' : 'Paste percent-encoded text to decode';
    output.placeholder = encoding
      ? 'Percent-encoded text appears here as you type'
      : 'Decoded text appears here';
  }

  onInput(input, convert, 150);
  direction.addEventListener('change', () => {
    applyDirection();
    convert();
  });
  style.addEventListener('change', () => {
    applyDirection();
    convert();
  });
  for (const box of [perLine, plusAsSpace]) box.addEventListener('change', convert);

  swapBtn.addEventListener('click', () => {
    direction.value = direction.value === 'encode' ? 'decode' : 'encode';
    if (output.value) input.value = output.value;
    applyDirection();
    convert();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet', 'error');
      return;
    }
    downloadText(output.value, direction.value === 'encode' ? 'url-encoded.txt' : 'url-decoded.txt');
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    convert();
    input.focus();
  });

  applyDirection();
  convert();
}
