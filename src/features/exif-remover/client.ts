import { $, wireDropzone } from '../../lib/dom';
import { formatBytes } from '../../lib/bytes';
import { downloadBlob } from '../../lib/download';
import { showToast } from '../../lib/toast';

type MetadataFields = Record<string, unknown>;
type ExifrParse = (input: Blob | ArrayBuffer, options?: unknown) => Promise<MetadataFields | undefined>;

const root = document.querySelector<HTMLElement>('[data-tool="exif-remover"]');

if (root) {
  // Decoding a photo this large into raw pixels would need hundreds of MB of
  // RAM in the tab — refuse politely rather than crash it.
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  // Mainstream browsers cap canvas dimensions around 16384px per side.
  const MAX_SIDE = 16384;

  const EXT_BY_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const TYPE_BY_EXT: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jfif: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  // Metadata segments only. A canvas re-encode always writes structural
  // JFIF (JPEG) / IHDR (PNG) headers; those carry no personal data, so they
  // are excluded from both the "before" count and the after-proof —
  // otherwise the proof could never come back empty.
  const METADATA_OPTS = {
    tiff: true,
    ifd1: true,
    exif: true,
    gps: true,
    xmp: true,
    icc: true,
    iptc: true,
    jfif: false,
    ihdr: false,
    mergeOutput: true,
  };

  const dropzone = $('#exr-dropzone', root)!;
  const errorEl = $('#exr-error', root)!;
  const resultsList = $('#exr-results', root)!;
  const statCount = $('#exr-stat-count', root)!;
  const statBefore = $('#exr-stat-before', root)!;
  const statAfter = $('#exr-stat-after', root)!;
  const downloadAllBtn = $<HTMLButtonElement>('#exr-download-all', root)!;
  const clearBtn = $<HTMLButtonElement>('#exr-clear', root)!;

  const results: { name: string; blob: Blob }[] = [];
  let cleanedCount = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  // ---------- Lazy exifr (verification only — stripping never depends on it) ----------

  let parserPromise: Promise<ExifrParse | null> | undefined;
  function loadParser(): Promise<ExifrParse | null> {
    parserPromise ??= import('exifr')
      .then((mod) => mod.default.parse.bind(mod.default) as ExifrParse)
      .catch(() => null);
    return parserPromise;
  }

  function metadataSummary(fields: MetadataFields | undefined): { count: number; hasGps: boolean } {
    if (!fields || typeof fields !== 'object') return { count: 0, hasGps: false };
    const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
    const hasGps = keys.some((k) => /^GPS/i.test(k) || k === 'latitude' || k === 'longitude');
    return { count: keys.length, hasGps };
  }

  async function tryParse(input: Blob, parse: ExifrParse): Promise<MetadataFields | undefined> {
    try {
      return await parse(input, METADATA_OPTS);
    } catch {
      // exifr throws on truncated/odd files — treat as "nothing readable".
      return undefined;
    }
  }

  // ---------- Small DOM builders (textContent only — filenames are untrusted) ----------

  function badge(text: string, kind: '' | 'ok' | 'warn' | 'danger'): HTMLSpanElement {
    const el = document.createElement('span');
    el.className = kind ? `badge badge-${kind}` : 'badge';
    el.textContent = text;
    return el;
  }

  function detectType(file: File): string | null {
    if (EXT_BY_TYPE[file.type]) return file.type;
    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    return TYPE_BY_EXT[ext] ?? null;
  }

  function cleanName(original: string, outType: string): string {
    const dot = original.lastIndexOf('.');
    const base = dot > 0 ? original.slice(0, dot) : original;
    return `${base}-clean.${EXT_BY_TYPE[outType] ?? 'png'}`;
  }

  function encodeCanvas(bitmap: ImageBitmap, type: string): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    ctx.drawImage(bitmap, 0, 0);
    return new Promise((resolve) => {
      // PNG ignores quality (lossless); JPEG/WebP re-encode at 0.95.
      canvas.toBlob(resolve, type, type === 'image/png' ? undefined : 0.95);
    });
  }

  function updateStats(): void {
    statCount.textContent = String(cleanedCount);
    statBefore.textContent = formatBytes(totalBefore);
    statAfter.textContent = formatBytes(totalAfter);
    downloadAllBtn.disabled = results.length === 0;
    clearBtn.disabled = resultsList.childElementCount === 0;
  }

  // ---------- Per-file pipeline ----------

  async function processOne(file: File): Promise<void> {
    const li = document.createElement('li');
    const left = document.createElement('div');
    const nameEl = document.createElement('div');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = file.name;
    nameEl.append(nameStrong);
    const detail = document.createElement('div');
    detail.className = 'field-hint';
    detail.textContent = 'Processing…';
    const badgeRow = document.createElement('div');
    left.append(nameEl, detail, badgeRow);
    li.append(left);
    resultsList.append(li);
    clearBtn.disabled = false;

    const fail = (message: string): void => {
      detail.textContent = message;
      detail.className = 'field-error';
      badgeRow.append(badge('Skipped', 'danger'));
    };

    try {
      if (file.size === 0) {
        fail('Empty file (0 bytes) — there is nothing to clean.');
        return;
      }
      const type = detectType(file);
      if (!type) {
        fail(`Unsupported format${file.type ? ` (${file.type})` : ''} — this tool cleans JPEG, PNG and WebP only.`);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        fail(`${formatBytes(file.size)} is over the 50 MB per-photo limit.`);
        return;
      }

      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        fail('Could not decode this file — it may be corrupt, truncated, or not really a JPEG/PNG/WebP.');
        return;
      }

      if (bitmap.width > MAX_SIDE || bitmap.height > MAX_SIDE) {
        const dims = `${bitmap.width} × ${bitmap.height}`;
        bitmap.close();
        fail(`${dims}px exceeds the browser's ${MAX_SIDE}px canvas limit — resize the image first.`);
        return;
      }

      const blob = await encodeCanvas(bitmap, type);
      bitmap.close();
      if (!blob || blob.size === 0) {
        fail('This browser could not re-encode the image on a canvas.');
        return;
      }

      // Safari can silently fall back to PNG when asked to encode WebP.
      const outType = EXT_BY_TYPE[blob.type] ? blob.type : 'image/png';
      const fellBack = outType !== type;
      const outName = cleanName(file.name, outType);

      const delta = ((blob.size - file.size) / file.size) * 100;
      const deltaText = `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}%`;
      detail.textContent =
        `${formatBytes(file.size)} → ${formatBytes(blob.size)} (${deltaText})` +
        (fellBack ? ' · saved as PNG — this browser cannot encode WebP' : '');
      detail.className = 'field-hint';

      // Prove it worked: parse the output with exifr and show the result.
      const parse = await loadParser();
      if (parse) {
        const before = metadataSummary(await tryParse(file, parse));
        const after = metadataSummary(await tryParse(blob, parse));
        if (before.count > 0) {
          badgeRow.append(
            badge(
              `Removed ${before.count} metadata field${before.count === 1 ? '' : 's'}${before.hasGps ? ', including GPS' : ''}`,
              'warn'
            )
          );
        } else {
          badgeRow.append(badge('No metadata found in original', ''));
        }
        if (after.count === 0) {
          badgeRow.append(badge('Output verified — no metadata found', 'ok'));
        } else {
          // Should be unreachable with a canvas re-encode; surface it honestly.
          badgeRow.append(badge(`${after.count} field${after.count === 1 ? '' : 's'} still present — do not rely on this file`, 'danger'));
        }
      } else {
        badgeRow.append(badge('Verification unavailable — metadata still stripped by the re-encode', 'warn'));
      }

      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'btn btn-ghost btn-sm';
      downloadBtn.textContent = 'Download';
      downloadBtn.setAttribute('aria-label', `Download ${outName}`);
      downloadBtn.addEventListener('click', () => downloadBlob(blob, outName));
      li.append(downloadBtn);

      results.push({ name: outName, blob });
      cleanedCount++;
      totalBefore += file.size;
      totalAfter += blob.size;
      updateStats();
    } catch {
      fail('Unexpected error while processing this photo.');
    }
  }

  // Process drops sequentially so a folder of photos never decodes all at once.
  let queue: Promise<void> = Promise.resolve();
  wireDropzone(
    dropzone,
    (files) => {
      errorEl.textContent = '';
      for (const file of files) {
        queue = queue.then(() => processOne(file));
      }
    },
    'image/jpeg,image/png,image/webp'
  );

  if (typeof createImageBitmap !== 'function') {
    errorEl.textContent = 'This browser does not support the image APIs this tool needs (createImageBitmap).';
  }

  // ---------- Toolbar ----------

  downloadAllBtn.addEventListener('click', async () => {
    if (results.length === 0) return;
    downloadAllBtn.disabled = true;
    try {
      for (const r of results) {
        downloadBlob(r.blob, r.name);
        // Space the clicks out — rapid successive downloads get dropped.
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (results.length > 1) showToast(`Started ${results.length} downloads`);
    } finally {
      downloadAllBtn.disabled = false;
    }
  });

  clearBtn.addEventListener('click', () => {
    results.length = 0;
    cleanedCount = 0;
    totalBefore = 0;
    totalAfter = 0;
    resultsList.textContent = '';
    errorEl.textContent = '';
    statCount.textContent = '–';
    statBefore.textContent = '–';
    statAfter.textContent = '–';
    downloadAllBtn.disabled = true;
    clearBtn.disabled = true;
  });
}
