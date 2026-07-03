import { $, wireDropzone } from '../../lib/dom';
import { base64ToBytes, bytesToBase64, formatBytes } from '../../lib/bytes';
import { downloadDataUrl, downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="base64-file"]');

if (root) {
  // 10 MB cap: the Base64 output is ~33% bigger again, and multi-megabyte
  // strings are where textareas, clipboards and data URIs start to hurt.
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  // ≈ 10 MB decoded, with slack for the header, padding and whitespace.
  const MAX_DECODE_CHARS = 15_000_000;

  const dropzone = $('#b64f-dropzone', root)!;
  const fileInfo = $('#b64f-file-info', root)!;
  const encodeError = $('#b64f-error', root)!;
  const b64Out = $<HTMLTextAreaElement>('#b64f-b64', root)!;
  const dataUriOut = $<HTMLTextAreaElement>('#b64f-datauri', root)!;
  const statOriginal = $('#b64f-stat-original', root)!;
  const statEncoded = $('#b64f-stat-encoded', root)!;
  const statOverhead = $('#b64f-stat-overhead', root)!;
  const downloadTxtBtn = $('#b64f-download-txt', root)!;
  const clearBtn = $('#b64f-clear', root)!;
  const decodeInput = $<HTMLTextAreaElement>('#b64f-decode-input', root)!;
  const filenameInput = $<HTMLInputElement>('#b64f-filename', root)!;
  const decodeBtn = $('#b64f-decode', root)!;
  const decodeError = $('#b64f-decode-error', root)!;
  const decodeInfo = $('#b64f-decode-info', root)!;

  let encodedFileName = '';

  // ---------- Encode: file → Base64 + data URI ----------

  function resetEncodeOutputs(): void {
    b64Out.value = '';
    dataUriOut.value = '';
    statOriginal.textContent = '–';
    statEncoded.textContent = '–';
    statOverhead.textContent = '–';
    fileInfo.textContent = '';
    encodedFileName = '';
  }

  function showEncodeError(message: string): void {
    resetEncodeOutputs();
    encodeError.textContent = message;
  }

  function renderEncoded(file: File, bytes: Uint8Array): void {
    const mime = file.type || 'application/octet-stream';
    const b64 = bytesToBase64(bytes);
    b64Out.value = b64;
    dataUriOut.value = `data:${mime};base64,${b64}`;
    statOriginal.textContent = formatBytes(file.size);
    // Base64 is pure ASCII, so 1 character = 1 byte.
    statEncoded.textContent = formatBytes(b64.length);
    statOverhead.textContent = `+${(((b64.length - file.size) / file.size) * 100).toFixed(1)}%`;
    fileInfo.textContent = `${file.name} · ${formatBytes(file.size)} · ${mime}`;
    encodeError.textContent = '';
    encodedFileName = file.name;
  }

  function handleFiles(files: File[]): void {
    const file = files[0];
    if (!file) return;
    if (files.length > 1) showToast('Multiple files received — encoded the first one only');
    if (file.size === 0) {
      showEncodeError(`"${file.name}" is empty (0 bytes) — there is nothing to encode.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showEncodeError(
        `"${file.name}" is ${formatBytes(file.size)} — over the 10 MB limit. ` +
          `Base64 adds about a third, so the output would be ~${formatBytes(Math.ceil((file.size * 4) / 3))} of text.`
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => renderEncoded(file, new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () =>
      showEncodeError(`Could not read "${file.name}" — the browser reported a read error. Try selecting it again.`);
    reader.readAsArrayBuffer(file);
  }

  wireDropzone(dropzone, handleFiles);

  downloadTxtBtn.addEventListener('click', () => {
    if (!b64Out.value) {
      showToast('Nothing to download — encode a file first', 'error');
      return;
    }
    downloadText(b64Out.value, `${encodedFileName || 'file'}.base64.txt`);
  });

  clearBtn.addEventListener('click', () => {
    resetEncodeOutputs();
    encodeError.textContent = '';
  });

  // ---------- Decode: data URI (or raw Base64) → file ----------

  const EXT_BY_MIME: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'application/pdf': 'pdf',
    'application/json': 'json',
    'application/zip': 'zip',
    'application/xml': 'xml',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/csv': 'csv',
    'text/javascript': 'js',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'font/woff2': 'woff2',
    'font/woff': 'woff',
    'font/ttf': 'ttf',
  };
  // MIME "type/subtype" of RFC 2045 token characters — anything else is
  // untrusted input and falls back to octet-stream.
  const MIME_SHAPE = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/;

  function extensionFor(mime: string): string {
    const known = EXT_BY_MIME[mime];
    if (known) return known;
    const sub = (mime.split('/')[1] ?? '').replace(/^x-/, '');
    return /^[a-z0-9]{1,8}$/.test(sub) ? sub : 'bin';
  }

  decodeBtn.addEventListener('click', () => {
    decodeError.textContent = '';
    decodeInfo.textContent = '';
    const raw = decodeInput.value.trim();
    if (!raw) {
      decodeError.textContent = 'Paste a data URI or raw Base64 above first.';
      return;
    }
    if (raw.length > MAX_DECODE_CHARS) {
      decodeError.textContent =
        'Input is longer than 15 million characters (about 10 MB decoded) — beyond what this tool handles in a browser tab.';
      return;
    }

    let mime = 'application/octet-stream';
    let bytes: Uint8Array;
    try {
      if (/^data:/i.test(raw)) {
        const comma = raw.indexOf(',');
        if (comma === -1) {
          decodeError.textContent =
            'Malformed data URI — there is no comma separating the header from the payload.';
          return;
        }
        const headerParts = raw.slice(5, comma).split(';');
        const isBase64 = headerParts.some((p) => p.trim().toLowerCase() === 'base64');
        const declared = (headerParts[0] ?? '').trim().toLowerCase();
        mime = declared === '' ? 'text/plain' : MIME_SHAPE.test(declared) ? declared : 'application/octet-stream';
        const payload = raw.slice(comma + 1);
        bytes = isBase64 ? base64ToBytes(payload) : new TextEncoder().encode(decodeURIComponent(payload));
      } else {
        bytes = base64ToBytes(raw);
      }
    } catch (e) {
      decodeError.textContent =
        e instanceof URIError
          ? 'This data URI has no ";base64" flag and its percent-encoding is malformed, so it cannot be decoded.'
          : 'The Base64 payload is invalid — it contains characters outside A–Z, a–z, 0–9, + and /, or the length no longer lines up. Check nothing was cut off when copying.';
      return;
    }

    if (bytes.length === 0) {
      decodeError.textContent = 'The payload decoded to 0 bytes — the part after the comma appears to be missing.';
      return;
    }

    let filename = (filenameInput.value.trim() || 'decoded').replace(/[/\\]/g, '_');
    if (!/\.[A-Za-z0-9]{1,10}$/.test(filename)) filename += `.${extensionFor(mime)}`;

    // Rebuild a normalised data URI so url-safe alphabets, stripped padding
    // and embedded whitespace in the input all still download correctly.
    downloadDataUrl(`data:${mime};base64,${bytesToBase64(bytes)}`, filename);
    decodeInfo.textContent = `Decoded ${formatBytes(bytes.length)} of ${mime} → ${filename}`;
  });
}
