import { $, onInput, wireDropzone } from '../../lib/dom';
import { formatBytes } from '../../lib/bytes';
import { downloadBlob } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="image-converter"]');

if (root) {
  // Converting decodes to raw pixels; a very large photo would need hundreds of
  // MB of RAM in the tab, so refuse politely rather than crash it.
  const MAX_FILE_BYTES = 40 * 1024 * 1024;
  const MAX_BATCH = 30;
  // Mainstream browsers cap canvas dimensions around 16384px per side.
  const MAX_SIDE = 16384;

  // Output-format metadata. `alpha` = the encoder keeps the alpha channel.
  const OUTPUT: Record<string, { ext: string; label: string; lossy: boolean; alpha: boolean }> = {
    'image/jpeg': { ext: 'jpg', label: 'JPG', lossy: true, alpha: false },
    'image/png': { ext: 'png', label: 'PNG', lossy: false, alpha: true },
    'image/webp': { ext: 'webp', label: 'WEBP', lossy: true, alpha: true },
  };

  // Label for the input side of "PNG → JPG". Falls back to the extension.
  const INPUT_LABEL: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/x-ms-bmp': 'BMP',
    'image/avif': 'AVIF',
  };

  const HEIC_RE = /\.(heic|heif|hif)$/i;

  const dropzone = $('#imc2-dropzone', root)!;
  const formatSelect = $<HTMLSelectElement>('#imc2-format', root)!;
  const qualityInput = $<HTMLInputElement>('#imc2-quality', root)!;
  const qualityValue = $('#imc2-quality-value', root)!;
  const whiteBgInput = $<HTMLInputElement>('#imc2-white-bg', root)!;
  const errorEl = $('#imc2-error', root)!;
  const reconvertBtn = $<HTMLButtonElement>('#imc2-reconvert', root)!;
  const downloadAllBtn = $<HTMLButtonElement>('#imc2-download-all', root)!;
  const clearBtn = $<HTMLButtonElement>('#imc2-clear', root)!;
  const statCount = $('#imc2-stat-count', root)!;
  const statBefore = $('#imc2-stat-before', root)!;
  const statAfter = $('#imc2-stat-after', root)!;
  const resultsList = $<HTMLUListElement>('#imc2-results', root)!;

  interface Settings {
    format: string; // 'image/jpeg' | 'image/png' | 'image/webp'
    quality: number;
    whiteBg: boolean;
  }

  interface Entry {
    original: File;
    /** Detected input-format label, e.g. "PNG". */
    fromLabel: string;
    result: Blob | null;
    outName: string;
    /** Invalid input (empty, HEIC, oversized, undecodable) — never queued. */
    rejected: boolean;
    li: HTMLLIElement;
    status: HTMLElement;
    downloadBtn: HTMLButtonElement;
  }

  const entries: Entry[] = [];
  // Convert one file at a time so a folder of photos never decodes all at once.
  let queue: Promise<void> = Promise.resolve();
  let pending = 0;
  let batchAbort = new AbortController();
  let downloadingAll = false;

  // ---------- Pure helpers ----------

  function readSettings(): Settings {
    const q = parseFloat(qualityInput.value);
    return {
      format: OUTPUT[formatSelect.value] ? formatSelect.value : 'image/jpeg',
      quality: Number.isFinite(q) ? Math.min(1, Math.max(0.4, q)) : 0.85,
      whiteBg: whiteBgInput.checked,
    };
  }

  function inputLabel(file: File): string {
    if (INPUT_LABEL[file.type]) return INPUT_LABEL[file.type]!;
    const name = file.name.toLowerCase();
    const dot = name.lastIndexOf('.');
    const ext = dot > 0 ? name.slice(dot + 1) : '';
    if (ext === 'jpeg' || ext === 'jpg' || ext === 'jfif') return 'JPG';
    if (ext) return ext.toUpperCase();
    return 'image';
  }

  function outputName(originalName: string, ext: string): string {
    const base = originalName.replace(/\.[^.]+$/, '') || 'image';
    return `${base}.${ext}`;
  }

  function deltaLabel(before: number, after: number): string {
    if (before === 0) return '';
    const pct = ((after - before) / before) * 100;
    if (Math.abs(pct) < 0.05) return 'same size';
    return pct < 0 ? `${Math.abs(pct).toFixed(1)}% smaller` : `${pct.toFixed(1)}% larger`;
  }

  // ---------- DOM builders (textContent only — filenames are untrusted) ----------

  function makeRow(file: File, fromLabel: string): Entry {
    const li = document.createElement('li');
    const meta = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = file.name || 'unnamed image';
    const status = document.createElement('div');
    status.className = 'field-hint';
    status.textContent = 'Queued…';
    meta.append(name, status);

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'btn btn-ghost btn-sm';
    downloadBtn.textContent = 'Download';
    downloadBtn.disabled = true;

    li.append(meta, downloadBtn);

    const entry: Entry = {
      original: file,
      fromLabel,
      result: null,
      outName: '',
      rejected: false,
      li,
      status,
      downloadBtn,
    };
    downloadBtn.addEventListener('click', () => {
      if (entry.result) downloadBlob(entry.result, entry.outName);
    });
    return entry;
  }

  function rejectRow(entry: Entry, message: string): void {
    entry.rejected = true;
    entry.result = null;
    entry.downloadBtn.disabled = true;
    entry.status.className = 'field-error';
    entry.status.textContent = message;
  }

  // ---------- Canvas conversion ----------

  function encode(bitmap: ImageBitmap, s: Settings): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    // JPEG has no alpha: transparent pixels composite over black by default.
    // Filling white first flattens them onto white instead.
    if (!OUTPUT[s.format]!.alpha && s.whiteBg) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    return new Promise((resolve) => {
      // PNG is lossless and ignores the quality argument.
      canvas.toBlob(resolve, s.format, OUTPUT[s.format]!.lossy ? s.quality : undefined);
    });
  }

  async function convertOne(entry: Entry, s: Settings, signal: AbortSignal): Promise<void> {
    entry.status.className = 'field-hint';
    entry.status.textContent = 'Converting…';
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(entry.original);
    } catch {
      if (signal.aborted) return;
      entry.status.className = 'field-error';
      entry.status.textContent =
        'Could not decode this file — it may be corrupt, truncated, or not really an image.';
      return;
    }
    if (signal.aborted) {
      bitmap.close();
      return;
    }
    if (bitmap.width > MAX_SIDE || bitmap.height > MAX_SIDE) {
      const dims = `${bitmap.width} × ${bitmap.height}`;
      bitmap.close();
      entry.status.className = 'field-error';
      entry.status.textContent = `${dims}px exceeds the browser's ${MAX_SIDE}px canvas limit — resize it first.`;
      return;
    }

    let blob: Blob | null;
    try {
      blob = await encode(bitmap, s);
    } finally {
      bitmap.close();
    }
    if (signal.aborted) return;
    if (!blob || blob.size === 0) {
      entry.status.className = 'field-error';
      entry.status.textContent = 'This browser could not encode the image on a canvas.';
      return;
    }

    // Safari can silently fall back to PNG when asked to encode WebP (and some
    // browsers do the same for JPEG). Trust the produced type, not the request.
    const outType = OUTPUT[blob.type] ? blob.type : s.format;
    const meta = OUTPUT[outType]!;
    const fellBack = outType !== s.format;

    entry.result = blob;
    entry.outName = outputName(entry.original.name, meta.ext);
    entry.downloadBtn.disabled = false;

    const before = entry.original.size;
    const delta = deltaLabel(before, blob.size);
    entry.status.className = 'field-hint';
    entry.status.textContent =
      `${entry.fromLabel} → ${meta.label} · ${formatBytes(before)} → ${formatBytes(blob.size)}` +
      (delta ? ` · ${delta}` : '') +
      (fellBack ? ` · your browser can't encode ${OUTPUT[s.format]!.label}, saved as ${meta.label}` : '');
  }

  // ---------- Queue & totals ----------

  function updateTotals(): void {
    const done = entries.filter((e): e is Entry & { result: Blob } => e.result !== null);
    if (done.length === 0) {
      statCount.textContent = '–';
      statBefore.textContent = '–';
      statAfter.textContent = '–';
      return;
    }
    const before = done.reduce((sum, e) => sum + e.original.size, 0);
    const after = done.reduce((sum, e) => sum + e.result.size, 0);
    statCount.textContent = String(done.length);
    statBefore.textContent = formatBytes(before);
    statAfter.textContent = formatBytes(after);
  }

  function updateButtons(): void {
    const hasConvertible = entries.some((e) => !e.rejected);
    reconvertBtn.disabled = pending > 0 || !hasConvertible;
    downloadAllBtn.disabled = downloadingAll || !entries.some((e) => e.result !== null);
    clearBtn.disabled = entries.length === 0;
  }

  function enqueue(entry: Entry, s: Settings): void {
    const signal = batchAbort.signal;
    pending++;
    updateButtons();
    queue = queue
      .then(() => {
        if (signal.aborted) return;
        return convertOne(entry, s, signal);
      })
      .then(() => {
        pending--;
        updateTotals();
        updateButtons();
      });
  }

  // ---------- Ingest ----------

  function handleFiles(files: File[]): void {
    errorEl.textContent = '';
    const room = MAX_BATCH - entries.length;
    if (room <= 0) {
      errorEl.textContent = `This batch already holds ${MAX_BATCH} images — press Clear to start a new one.`;
      return;
    }
    if (files.length > room) {
      errorEl.textContent = `Batches are capped at ${MAX_BATCH} images — the first ${room} of ${files.length} were added.`;
    }
    const s = readSettings();
    for (const file of files.slice(0, room)) {
      const entry = makeRow(file, inputLabel(file));
      entries.push(entry);
      resultsList.appendChild(entry.li);

      if (file.size === 0) {
        rejectRow(entry, 'Empty file (0 bytes) — there is nothing to convert.');
      } else if (HEIC_RE.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif') {
        rejectRow(
          entry,
          'HEIC/HEIF is not supported — its decoder (libheif) is LGPL-licensed and browsers can’t decode it. Export to JPEG on your device first.'
        );
      } else if (file.size > MAX_FILE_BYTES) {
        rejectRow(entry, `${formatBytes(file.size)} is over the ${formatBytes(MAX_FILE_BYTES)} per-file limit.`);
      } else {
        enqueue(entry, s);
      }
    }
    updateButtons();
  }

  // ---------- Controls ----------

  // PNG keeps alpha and is lossless: quality and white-fill don't apply to it;
  // WebP keeps alpha too, so white-fill only matters for JPEG output.
  function syncControls(): void {
    const meta = OUTPUT[formatSelect.value] ?? OUTPUT['image/jpeg']!;
    qualityInput.disabled = !meta.lossy;
    whiteBgInput.disabled = meta.alpha;
  }

  wireDropzone(dropzone, handleFiles, 'image/*');

  onInput(qualityInput, () => {
    const q = parseFloat(qualityInput.value);
    qualityValue.textContent = Number.isFinite(q) ? q.toFixed(2) : '0.85';
  });

  formatSelect.addEventListener('change', syncControls);

  reconvertBtn.addEventListener('click', () => {
    // Cancel any in-flight batch, then requeue every valid entry afresh.
    batchAbort.abort();
    batchAbort = new AbortController();
    queue = Promise.resolve();
    pending = 0;
    const s = readSettings();
    let requeued = 0;
    for (const entry of entries) {
      if (entry.rejected) continue;
      entry.result = null;
      entry.outName = '';
      entry.downloadBtn.disabled = true;
      entry.status.className = 'field-hint';
      entry.status.textContent = 'Queued…';
      enqueue(entry, s);
      requeued++;
    }
    if (requeued === 0) showToast('No convertible images in this batch', 'error');
    updateTotals();
    updateButtons();
  });

  downloadAllBtn.addEventListener('click', async () => {
    const done = entries.filter((e): e is Entry & { result: Blob } => e.result !== null);
    if (done.length === 0) {
      showToast('Nothing to download yet — convert some images first', 'error');
      return;
    }
    downloadingAll = true;
    updateButtons();
    try {
      for (const entry of done) {
        downloadBlob(entry.result, entry.outName);
        // Space the clicks out — browsers drop rapid-fire download bursts.
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      if (done.length > 1) showToast(`Started ${done.length} downloads`);
    } finally {
      downloadingAll = false;
      updateButtons();
    }
  });

  clearBtn.addEventListener('click', () => {
    batchAbort.abort();
    batchAbort = new AbortController();
    queue = Promise.resolve();
    pending = 0;
    entries.length = 0;
    resultsList.replaceChildren();
    errorEl.textContent = '';
    updateTotals();
    updateButtons();
  });

  if (typeof createImageBitmap !== 'function') {
    errorEl.textContent =
      'This browser does not support the image APIs this tool needs (createImageBitmap).';
  }

  syncControls();
  updateButtons();
}
