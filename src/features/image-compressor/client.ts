import type { Options } from 'browser-image-compression';
// URL of the library file itself (a string, not the code) — served same-origin
// so the compression Web Worker never touches the CDN the lib defaults to.
import libUrl from 'browser-image-compression/dist/browser-image-compression.js?url';
import { $, onInput, wireDropzone } from '../../lib/dom';
import { formatBytes } from '../../lib/bytes';
import { downloadBlob } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="image-compressor"]');

if (root) {
  const MAX_BATCH = 20;
  const MAX_FILE_BYTES = 30 * 1024 * 1024;
  const ACCEPT = 'image/jpeg,image/png,image/webp';
  // Drag-and-drop ignores the accept attribute, so types are re-checked here.
  const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const dropzone = $('#imc-dropzone', root)!;
  const maxDimSelect = $<HTMLSelectElement>('#imc-max-dim', root)!;
  const formatSelect = $<HTMLSelectElement>('#imc-format', root)!;
  const qualityInput = $<HTMLInputElement>('#imc-quality', root)!;
  const qualityValue = $('#imc-quality-value', root)!;
  const errorEl = $('#imc-error', root)!;
  const recompressBtn = $<HTMLButtonElement>('#imc-recompress', root)!;
  const downloadAllBtn = $<HTMLButtonElement>('#imc-download-all', root)!;
  const clearBtn = $<HTMLButtonElement>('#imc-clear', root)!;
  const totalBefore = $('#imc-total-before', root)!;
  const totalAfter = $('#imc-total-after', root)!;
  const totalSaved = $('#imc-total-saved', root)!;
  const resultsList = $<HTMLUListElement>('#imc-results', root)!;

  interface Entry {
    original: File;
    result: File | null;
    /** Invalid input (wrong type, empty, oversized) — never queued or re-queued. */
    rejected: boolean;
    li: HTMLLIElement;
    status: HTMLElement;
    downloadBtn: HTMLButtonElement;
  }

  interface Settings {
    maxDim: number; // 0 = keep original dimensions
    quality: number;
    format: string; // 'keep' | 'image/jpeg' | 'image/webp'
  }

  const entries: Entry[] = [];
  // Files compress one at a time (each in a Web Worker) to bound memory use.
  let queue: Promise<void> = Promise.resolve();
  let pending = 0;
  let batchAbort = new AbortController();
  let downloadingAll = false;

  let libPromise: Promise<typeof import('browser-image-compression')> | null = null;
  const loadLib = () => (libPromise ??= import('browser-image-compression'));

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  function readSettings(): Settings {
    const maxDim = parseInt(maxDimSelect.value, 10);
    const quality = parseFloat(qualityInput.value);
    return {
      maxDim: Number.isFinite(maxDim) && maxDim > 0 ? maxDim : 0,
      quality: Number.isFinite(quality) ? Math.min(0.95, Math.max(0.5, quality)) : 0.8,
      format: formatSelect.value,
    };
  }

  function savedLabel(before: number, after: number): string {
    const pct = (1 - after / before) * 100;
    if (Math.abs(pct) < 0.05) return '0.0% saved';
    return pct > 0 ? `${pct.toFixed(1)}% saved` : `${Math.abs(pct).toFixed(1)}% larger`;
  }

  function outputName(originalName: string, mime: string): string {
    const ext = EXT_BY_MIME[mime] ?? 'img';
    const base = originalName.replace(/\.[^.]+$/, '') || 'image';
    return `${base}-compressed.${ext}`;
  }

  function makeRow(file: File): Entry {
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
    const entry: Entry = { original: file, result: null, rejected: false, li, status, downloadBtn };
    downloadBtn.addEventListener('click', () => {
      if (entry.result) downloadBlob(entry.result, outputName(entry.original.name, entry.result.type));
    });
    return entry;
  }

  function rejectRow(entry: Entry, message: string): void {
    entry.rejected = true;
    entry.status.className = 'field-error';
    entry.status.textContent = message;
  }

  function updateTotals(): void {
    const done = entries.filter((e): e is Entry & { result: File } => e.result !== null);
    if (done.length === 0) {
      totalBefore.textContent = '–';
      totalAfter.textContent = '–';
      totalSaved.textContent = '–';
      return;
    }
    const before = done.reduce((sum, e) => sum + e.original.size, 0);
    const after = done.reduce((sum, e) => sum + e.result.size, 0);
    totalBefore.textContent = formatBytes(before);
    totalAfter.textContent = formatBytes(after);
    totalSaved.textContent = before > 0 ? `${((1 - after / before) * 100).toFixed(1)}%` : '–';
  }

  function updateButtons(): void {
    recompressBtn.disabled = pending > 0 || !entries.some((e) => !e.rejected);
    downloadAllBtn.disabled = downloadingAll || !entries.some((e) => e.result !== null);
    clearBtn.disabled = entries.length === 0;
  }

  async function compressOne(entry: Entry, s: Settings, signal: AbortSignal): Promise<void> {
    entry.status.className = 'field-hint';
    entry.status.textContent = 'Compressing… 0%';
    try {
      const imageCompression = (await loadLib()).default;
      const options: Options = {
        useWebWorker: true,
        libURL: new URL(libUrl, location.href).href,
        initialQuality: s.quality,
        alwaysKeepResolution: s.maxDim === 0,
        onProgress: (p: number) => {
          entry.status.textContent = `Compressing… ${Math.round(p)}%`;
        },
        signal,
      };
      if (s.maxDim > 0) options.maxWidthOrHeight = s.maxDim;
      if (s.format !== 'keep') options.fileType = s.format;

      const compressed = await imageCompression(entry.original, options);

      // Re-encoding an already-optimised image can grow it. When the format is
      // unchanged the original is still valid output, so keep whichever is smaller.
      const keepOriginal = s.format === 'keep' && compressed.size >= entry.original.size;
      entry.result = keepOriginal ? entry.original : compressed;
      const before = entry.original.size;
      const after = entry.result.size;
      entry.status.textContent = keepOriginal
        ? `${formatBytes(before)} → ${formatBytes(after)} · already this small, kept the original bytes`
        : `${formatBytes(before)} → ${formatBytes(after)} · ${savedLabel(before, after)}`;
      entry.downloadBtn.disabled = false;
    } catch (err) {
      if (signal.aborted) {
        entry.status.textContent = 'Cancelled.';
        return;
      }
      entry.status.className = 'field-error';
      entry.status.textContent =
        err instanceof Error && /not an image/i.test(err.message)
          ? 'The browser could not decode this file as an image — it may be corrupt or mislabelled.'
          : `Compression failed for this file${err instanceof Error && err.message ? ` (${err.message})` : ''}.`;
    }
  }

  function enqueue(entry: Entry, s: Settings): void {
    const signal = batchAbort.signal;
    pending++;
    updateButtons();
    queue = queue
      .then(() => {
        if (signal.aborted) {
          entry.status.textContent = 'Cancelled.';
          return;
        }
        return compressOne(entry, s, signal);
      })
      .then(() => {
        pending--;
        updateTotals();
        updateButtons();
      });
  }

  function handleFiles(files: File[]): void {
    errorEl.textContent = '';
    const room = MAX_BATCH - entries.length;
    if (room <= 0) {
      errorEl.textContent = `This batch already holds ${MAX_BATCH} images — press Clear to start a new one.`;
      return;
    }
    if (files.length > room) {
      errorEl.textContent = `Batches are capped at ${MAX_BATCH} images — the first ${room} of ${files.length} files were added.`;
    }
    const s = readSettings();
    for (const file of files.slice(0, room)) {
      const entry = makeRow(file);
      entries.push(entry);
      resultsList.appendChild(entry.li);
      if (!ACCEPTED_TYPES.has(file.type)) {
        rejectRow(entry, `Unsupported type (${file.type || 'unknown'}) — this tool takes JPEG, PNG and WebP.`);
      } else if (file.size === 0) {
        rejectRow(entry, 'Empty file (0 bytes) — there is nothing to compress.');
      } else if (file.size > MAX_FILE_BYTES) {
        rejectRow(entry, `${formatBytes(file.size)} is over the ${formatBytes(MAX_FILE_BYTES)} per-file limit.`);
      } else {
        enqueue(entry, s);
      }
    }
    updateButtons();
  }

  wireDropzone(dropzone, handleFiles, ACCEPT);

  onInput(qualityInput, () => {
    const q = parseFloat(qualityInput.value);
    qualityValue.textContent = Number.isFinite(q) ? q.toFixed(2) : '0.80';
  });

  recompressBtn.addEventListener('click', () => {
    batchAbort.abort();
    batchAbort = new AbortController();
    const s = readSettings();
    for (const entry of entries) {
      if (entry.rejected) continue;
      entry.result = null;
      entry.downloadBtn.disabled = true;
      entry.status.className = 'field-hint';
      entry.status.textContent = 'Queued…';
      enqueue(entry, s);
    }
    updateTotals();
    updateButtons();
  });

  downloadAllBtn.addEventListener('click', async () => {
    const done = entries.filter((e): e is Entry & { result: File } => e.result !== null);
    if (done.length === 0) {
      showToast('Nothing to download yet — compress some images first', 'error');
      return;
    }
    downloadingAll = true;
    updateButtons();
    for (const entry of done) {
      downloadBlob(entry.result, outputName(entry.original.name, entry.result.type));
      // Sequential with a gap — browsers block rapid-fire download bursts.
      await sleep(350);
    }
    downloadingAll = false;
    updateButtons();
    showToast(`Downloaded ${done.length} image${done.length === 1 ? '' : 's'}`);
  });

  clearBtn.addEventListener('click', () => {
    batchAbort.abort();
    batchAbort = new AbortController();
    entries.length = 0;
    resultsList.replaceChildren();
    errorEl.textContent = '';
    updateTotals();
    updateButtons();
  });
}
