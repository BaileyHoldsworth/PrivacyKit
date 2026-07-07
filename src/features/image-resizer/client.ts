// Type-only import: erased at build time, so pica is NOT eagerly bundled — the
// runtime code loads it lazily on first use (see loadPica) per the tool plan.
import type { Pica } from 'pica';
import { $, onInput, wireDropzone } from '../../lib/dom';
import { formatBytes } from '../../lib/bytes';
import { downloadBlob } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="image-resizer"]');

if (root) {
  const MAX_BATCH = 20;
  const MAX_FILE_BYTES = 30 * 1024 * 1024;
  // Ceiling on the *output* pixel count — a guard against a percentage or target
  // that would ask the browser to allocate an unreasonable canvas.
  const MAX_OUT_PIXELS = 100_000_000;
  const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp';

  const LOSSY = new Set(['image/jpeg', 'image/webp']);
  // Canvas.toBlob can only encode these three; anything else falls back to PNG.
  const ENCODABLE = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const dropzone = $('#imr-dropzone', root)!;
  const modeSelect = $<HTMLSelectElement>('#imr-mode', root)!;
  const percentGroup = $('#imr-percent-group', root)!;
  const percentInput = $<HTMLInputElement>('#imr-percent', root)!;
  const percentValue = $('#imr-percent-value', root)!;
  const dimGroup = $('#imr-dim-group', root)!;
  const widthInput = $<HTMLInputElement>('#imr-width', root)!;
  const heightInput = $<HTMLInputElement>('#imr-height', root)!;
  const lockInput = $<HTMLInputElement>('#imr-lock', root)!;
  const formatSelect = $<HTMLSelectElement>('#imr-format', root)!;
  const qualityInput = $<HTMLInputElement>('#imr-quality', root)!;
  const qualityValue = $('#imr-quality-value', root)!;
  const errorEl = $('#imr-error', root)!;
  const resizeBtn = $<HTMLButtonElement>('#imr-resize', root)!;
  const downloadAllBtn = $<HTMLButtonElement>('#imr-download-all', root)!;
  const clearBtn = $<HTMLButtonElement>('#imr-clear', root)!;
  const totalBefore = $('#imr-total-before', root)!;
  const totalAfter = $('#imr-total-after', root)!;
  const totalSaved = $('#imr-total-saved', root)!;
  const resultsList = $<HTMLUListElement>('#imr-results', root)!;

  interface Entry {
    original: File;
    result: File | null;
    /** Invalid input (wrong type, empty, oversized) — never queued. */
    rejected: boolean;
    li: HTMLLIElement;
    status: HTMLElement;
    downloadBtn: HTMLButtonElement;
  }

  interface Settings {
    mode: 'percent' | 'dimensions';
    percent: number;
    width: number; // 0 = not set
    height: number; // 0 = not set
    lock: boolean;
    format: string; // 'keep' | image mime
    quality: number;
  }

  const entries: Entry[] = [];
  // Resize one file at a time so a batch of large images doesn't allocate many
  // full-resolution canvases at once. pica still uses a worker pool internally.
  let queue: Promise<void> = Promise.resolve();
  let pending = 0;
  let batchAbort = new AbortController();
  let downloadingAll = false;

  // Aspect ratio used to link the width/height fields. Seeded from the static
  // defaults, then replaced by the first image the user actually loads.
  let refRatio = 800 / 600;
  let refFromImage = false;

  let picaPromise: Promise<Pica> | null = null;
  const loadPica = (): Promise<Pica> =>
    (picaPromise ??= import('pica').then((m) => m.default()));

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  function readSettings(): Settings {
    const percent = parseFloat(percentInput.value);
    const width = parseInt(widthInput.value, 10);
    const height = parseInt(heightInput.value, 10);
    const quality = parseFloat(qualityInput.value);
    return {
      mode: modeSelect.value === 'dimensions' ? 'dimensions' : 'percent',
      percent: Number.isFinite(percent) && percent > 0 ? percent : 100,
      width: Number.isFinite(width) && width > 0 ? width : 0,
      height: Number.isFinite(height) && height > 0 ? height : 0,
      lock: lockInput.checked,
      format: formatSelect.value,
      quality: Number.isFinite(quality) ? Math.min(1, Math.max(0.4, quality)) : 0.85,
    };
  }

  /** Settings error that holds for every image (independent of pixel sizes). */
  function settingsError(s: Settings): string | null {
    if (s.mode !== 'dimensions') return null;
    if (s.lock) {
      if (s.width === 0 && s.height === 0) return 'Enter a width or a height.';
      return null;
    }
    if (s.width === 0 || s.height === 0) {
      return 'Enter both a width and a height, or lock the aspect ratio.';
    }
    return null;
  }

  function targetDims(
    srcW: number,
    srcH: number,
    s: Settings
  ): { w: number; h: number } {
    if (s.mode === 'percent') {
      const f = s.percent / 100;
      return { w: Math.max(1, Math.round(srcW * f)), h: Math.max(1, Math.round(srcH * f)) };
    }
    if (s.lock) {
      // Fit inside the width/height box, preserving THIS image's own ratio. A
      // blank field means that side is unconstrained.
      let scale: number;
      if (s.width > 0 && s.height > 0) scale = Math.min(s.width / srcW, s.height / srcH);
      else if (s.width > 0) scale = s.width / srcW;
      else scale = s.height / srcH;
      return { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
    }
    // Unlocked: force the exact size (may distort).
    return { w: Math.round(s.width), h: Math.round(s.height) };
  }

  function resolveMime(format: string, srcType: string): string {
    if (format !== 'keep') return format;
    return ENCODABLE.has(srcType) ? srcType : 'image/png';
  }

  function outputName(originalName: string, mime: string, w: number, h: number): string {
    const ext = EXT_BY_MIME[mime] ?? 'png';
    const base = originalName.replace(/\.[^.]+$/, '') || 'image';
    return `${base}-${w}x${h}.${ext}`;
  }

  function savedLabel(before: number, after: number): string {
    if (before <= 0) return '';
    const pct = (1 - after / before) * 100;
    if (Math.abs(pct) < 0.05) return 'same size';
    return pct > 0 ? `${pct.toFixed(1)}% smaller` : `${Math.abs(pct).toFixed(1)}% larger`;
  }

  interface Decoded {
    source: ImageBitmap | HTMLImageElement;
    width: number;
    height: number;
    cleanup: () => void;
  }

  async function decode(file: File): Promise<Decoded> {
    // Respect EXIF orientation so a portrait photo resizes the way it looks.
    try {
      const bmp = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions);
      return { source: bmp, width: bmp.width, height: bmp.height, cleanup: () => bmp.close() };
    } catch {
      // Fallback for anything createImageBitmap refuses but <img> can render.
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        await img.decode();
        return {
          source: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          cleanup: () => URL.revokeObjectURL(url),
        };
      } catch (err) {
        URL.revokeObjectURL(url);
        throw err;
      }
    }
  }

  /** JPEG has no alpha; composite over white so transparency isn't rendered black. */
  function flattenWhite(src: HTMLCanvasElement): HTMLCanvasElement {
    const flat = document.createElement('canvas');
    flat.width = src.width;
    flat.height = src.height;
    const ctx = flat.getContext('2d');
    if (!ctx) return src;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(src, 0, 0);
    return flat;
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
      if (entry.result) downloadBlob(entry.result, entry.result.name);
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
    resizeBtn.disabled = pending > 0 || !entries.some((e) => !e.rejected);
    downloadAllBtn.disabled = downloadingAll || !entries.some((e) => e.result !== null);
    clearBtn.disabled = entries.length === 0;
  }

  async function resizeOne(entry: Entry, s: Settings, signal: AbortSignal): Promise<void> {
    entry.status.className = 'field-hint';
    entry.status.textContent = 'Resizing…';
    let decoded: Decoded;
    try {
      decoded = await decode(entry.original);
    } catch {
      entry.status.className = 'field-error';
      entry.status.textContent =
        'Could not decode this file as an image — it may be corrupt or an unsupported format.';
      return;
    }
    if (signal.aborted) {
      decoded.cleanup();
      entry.status.textContent = 'Cancelled.';
      return;
    }
    try {
      // Seed the aspect-ratio link from the first real image loaded.
      if (!refFromImage && decoded.height > 0) {
        refFromImage = true;
        refRatio = decoded.width / decoded.height;
        relinkFromWidth();
      }

      const { w, h } = targetDims(decoded.width, decoded.height, s);
      if (w * h > MAX_OUT_PIXELS) {
        entry.status.className = 'field-error';
        entry.status.textContent = `Target ${w}×${h} is over the ${MAX_OUT_PIXELS / 1_000_000}-megapixel output limit — choose a smaller size.`;
        return;
      }

      const dest = document.createElement('canvas');
      dest.width = w;
      dest.height = h;

      const resizer = await loadPica();
      // Lanczos3 in a Web Worker (pica's default features are js/wasm/ww, so the
      // filter is honoured rather than delegated to the browser's own scaler).
      await resizer.resize(decoded.source, dest, { filter: 'lanczos3' });

      const outMime = resolveMime(s.format, entry.original.type || 'image/png');
      const canvas = outMime === 'image/jpeg' ? flattenWhite(dest) : dest;
      const quality = LOSSY.has(outMime) ? s.quality : undefined;
      const blob = await resizer.toBlob(canvas, outMime, quality);

      const filename = outputName(entry.original.name, outMime, w, h);
      entry.result = new File([blob], filename, { type: outMime });

      const before = entry.original.size;
      const after = entry.result.size;
      const saved = savedLabel(before, after);
      entry.status.className = 'field-hint';
      entry.status.textContent =
        `${decoded.width}×${decoded.height} → ${w}×${h} · ${formatBytes(before)} → ${formatBytes(after)}` +
        (saved ? ` · ${saved}` : '');
      entry.downloadBtn.disabled = false;
    } catch (err) {
      if (signal.aborted) {
        entry.status.textContent = 'Cancelled.';
        return;
      }
      entry.status.className = 'field-error';
      entry.status.textContent = `Resizing failed for this file${
        err instanceof Error && err.message ? ` (${err.message})` : ''
      }.`;
    } finally {
      decoded.cleanup();
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
        return resizeOne(entry, s, signal);
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
    const invalid = settingsError(s);
    const added: Entry[] = [];
    for (const file of files.slice(0, room)) {
      const entry = makeRow(file);
      entries.push(entry);
      resultsList.appendChild(entry.li);
      const type = file.type;
      if (type === 'image/svg+xml') {
        rejectRow(entry, 'SVG is a vector format — open it at any size instead, or convert it to PNG first.');
      } else if (type !== '' && !type.startsWith('image/')) {
        rejectRow(entry, `Unsupported type (${type}) — this tool takes raster images (JPEG, PNG, WebP, GIF, BMP).`);
      } else if (file.size === 0) {
        rejectRow(entry, 'Empty file (0 bytes) — there is nothing to resize.');
      } else if (file.size > MAX_FILE_BYTES) {
        rejectRow(entry, `${formatBytes(file.size)} is over the ${formatBytes(MAX_FILE_BYTES)} per-file limit.`);
      } else {
        added.push(entry);
      }
    }

    if (invalid) {
      if (!errorEl.textContent) errorEl.textContent = `${invalid} Then press Resize with current settings.`;
      for (const entry of added) {
        entry.status.className = 'field-hint';
        entry.status.textContent = 'Waiting for a valid size — set one above, then press Resize.';
      }
    } else {
      for (const entry of added) enqueue(entry, s);
    }
    updateButtons();
  }

  function reprocessAll(): void {
    const s = readSettings();
    const invalid = settingsError(s);
    if (invalid) {
      errorEl.textContent = invalid;
      return;
    }
    errorEl.textContent = '';
    batchAbort.abort();
    batchAbort = new AbortController();
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
  }

  // ---- Aspect-ratio linking (dimensions mode) ----
  function relinkFromWidth(): void {
    if (!lockInput.checked) return;
    const w = parseInt(widthInput.value, 10);
    if (Number.isFinite(w) && w > 0 && refRatio > 0) {
      heightInput.value = String(Math.max(1, Math.round(w / refRatio)));
    }
  }
  function relinkFromHeight(): void {
    if (!lockInput.checked) return;
    const h = parseInt(heightInput.value, 10);
    if (Number.isFinite(h) && h > 0) {
      widthInput.value = String(Math.max(1, Math.round(h * refRatio)));
    }
  }

  function applyMode(): void {
    const dims = modeSelect.value === 'dimensions';
    percentGroup.hidden = dims;
    dimGroup.hidden = !dims;
  }

  // ---- Wire up ----
  wireDropzone(dropzone, handleFiles, ACCEPT);

  onInput(percentInput, () => {
    const p = parseInt(percentInput.value, 10);
    percentValue.textContent = `${Number.isFinite(p) ? p : 50}%`;
  });
  onInput(qualityInput, () => {
    const q = parseFloat(qualityInput.value);
    qualityValue.textContent = Number.isFinite(q) ? q.toFixed(2) : '0.85';
  });
  onInput(widthInput, relinkFromWidth);
  onInput(heightInput, relinkFromHeight);
  lockInput.addEventListener('change', () => {
    if (lockInput.checked) relinkFromWidth();
  });
  modeSelect.addEventListener('change', applyMode);

  resizeBtn.addEventListener('click', reprocessAll);

  downloadAllBtn.addEventListener('click', async () => {
    const done = entries.filter((e): e is Entry & { result: File } => e.result !== null);
    if (done.length === 0) {
      showToast('Nothing to download yet — resize some images first', 'error');
      return;
    }
    downloadingAll = true;
    updateButtons();
    for (const entry of done) {
      downloadBlob(entry.result, entry.result.name);
      // Sequential with a gap — browsers throttle rapid-fire download bursts.
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

  applyMode();
  updateButtons();
}
