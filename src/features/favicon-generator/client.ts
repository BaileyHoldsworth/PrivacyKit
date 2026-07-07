import { $, onInput, wireDropzone } from '../../lib/dom';
import { formatBytes } from '../../lib/bytes';
import { downloadBlob } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="favicon-generator"]');

if (root) {
  const MAX_FILE_BYTES = 30 * 1024 * 1024;

  // Every icon this tool emits. The 16/32/48 PNGs are also embedded in the .ico.
  const TARGETS: { size: number; name: string }[] = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
  ];
  const ICO_SIZES = [16, 32, 48];

  const dropzone = $('#fav-dropzone', root)!;
  const bgEnable = $<HTMLInputElement>('#fav-bg-enable', root)!;
  const bgColor = $<HTMLInputElement>('#fav-bg-color', root)!;
  const errorEl = $('#fav-error', root)!;
  const sourceEl = $('#fav-source', root)!;
  const downloadAllBtn = $<HTMLButtonElement>('#fav-download-all', root)!;
  const clearBtn = $<HTMLButtonElement>('#fav-clear', root)!;
  const resultsList = $<HTMLUListElement>('#fav-results', root)!;
  const emptyHint = $('#fav-empty', root)!;

  interface Generated {
    name: string;
    blob: Blob;
  }

  let currentBitmap: ImageBitmap | null = null;
  let sourceInfo = '';
  // Bumped on every run; async work from a superseded run drops its results.
  let runToken = 0;
  let busy = false;
  let downloadingAll = false;
  const generated: Generated[] = [];
  const previewUrls: string[] = [];

  /**
   * Assemble a multi-size icon (.ico). Layout, all little-endian:
   *   ICONDIR      6 bytes  — reserved(0), type(1=icon), image count
   *   ICONDIRENTRY 16 bytes each — width, height (0 encodes 256), 0, 0,
   *                planes(1), bitCount(32), byteLength, offset
   *   then each PNG payload, in entry order.
   * Modern browsers read PNG-compressed payloads inside an ICO directly.
   */
  function buildIco(images: { size: number; png: Uint8Array }[]): Uint8Array<ArrayBuffer> {
    const count = images.length;
    const headerSize = 6 + 16 * count;
    const total = headerSize + images.reduce((sum, i) => sum + i.png.length, 0);
    const buf = new ArrayBuffer(total);
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);

    view.setUint16(0, 0, true); // reserved
    view.setUint16(2, 1, true); // type = icon
    view.setUint16(4, count, true); // number of images

    let offset = headerSize;
    let entry = 6;
    for (const img of images) {
      const dim = img.size >= 256 ? 0 : img.size; // 0 means 256 px
      view.setUint8(entry + 0, dim); // width
      view.setUint8(entry + 1, dim); // height
      view.setUint8(entry + 2, 0); // palette size (0 = no palette)
      view.setUint8(entry + 3, 0); // reserved
      view.setUint16(entry + 4, 1, true); // colour planes
      view.setUint16(entry + 6, 32, true); // bits per pixel
      view.setUint32(entry + 8, img.png.length, true); // payload byte length
      view.setUint32(entry + 12, offset, true); // payload offset
      bytes.set(img.png, offset);
      offset += img.png.length;
      entry += 16;
    }
    return bytes;
  }

  function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    return ctx;
  }

  /** Centre-crop the source to a square canvas at its shorter side. */
  function makeSquareCanvas(bitmap: ImageBitmap): HTMLCanvasElement {
    const s = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - s) / 2);
    const sy = Math.floor((bitmap.height - s) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    ctx2d(canvas).drawImage(bitmap, sx, sy, s, s, 0, 0, s, s);
    return canvas;
  }

  /**
   * Resize the square source to `target` px. Downscaling halves in steps to
   * keep small icons sharp; `bg`, when set, is painted first so transparent
   * pixels flatten onto it (needed for the iOS Apple touch icon).
   */
  function drawAt(square: HTMLCanvasElement, target: number, bg: string | null): HTMLCanvasElement {
    let cur = square;
    while (Math.floor(cur.width / 2) >= target) {
      const half = Math.floor(cur.width / 2);
      const step = document.createElement('canvas');
      step.width = half;
      step.height = half;
      const sctx = ctx2d(step);
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(cur, 0, 0, half, half);
      cur = step;
    }
    const out = document.createElement('canvas');
    out.width = target;
    out.height = target;
    const octx = ctx2d(out);
    if (bg) {
      octx.fillStyle = bg;
      octx.fillRect(0, 0, target, target);
    }
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(cur, 0, 0, target, target);
    return out;
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob returned null'));
      }, 'image/png');
    });
  }

  function setBusy(state: boolean): void {
    busy = state;
    sourceEl.textContent = state ? `${sourceInfo} · generating icons…` : sourceInfo;
    updateButtons();
  }

  function updateButtons(): void {
    downloadAllBtn.disabled = busy || downloadingAll || generated.length === 0;
    clearBtn.disabled = busy || (generated.length === 0 && currentBitmap === null);
  }

  function revokePreviews(): void {
    for (const url of previewUrls) URL.revokeObjectURL(url);
    previewUrls.length = 0;
  }

  function addRow(name: string, dim: string, blob: Blob, previewBlob: Blob, displayPx: number): void {
    const li = document.createElement('li');

    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.alignItems = 'center';
    meta.style.gap = 'var(--s-3)';
    meta.style.minWidth = '0';

    const img = document.createElement('img');
    const url = URL.createObjectURL(previewBlob);
    previewUrls.push(url);
    img.src = url;
    img.width = displayPx;
    img.height = displayPx;
    img.alt = '';
    img.decoding = 'async';

    const text = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = name;
    const detail = document.createElement('div');
    detail.className = 'field-hint';
    detail.textContent = `${dim} · ${formatBytes(blob.size)}`;
    text.append(strong, detail);
    meta.append(img, text);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-sm';
    btn.textContent = 'Download';
    btn.addEventListener('click', () => downloadBlob(blob, name));

    li.append(meta, btn);
    resultsList.appendChild(li);
  }

  function renderResults(
    pngs: { size: number; name: string; blob: Blob }[],
    icoBlob: Blob,
  ): void {
    revokePreviews();
    resultsList.replaceChildren();
    generated.length = 0;

    const preview32 = pngs.find((p) => p.size === 32) ?? pngs[0]!;
    addRow('favicon.ico', 'ICO · 16, 32, 48', icoBlob, preview32.blob, 48);
    generated.push({ name: 'favicon.ico', blob: icoBlob });

    for (const p of pngs) {
      addRow(p.name, `${p.size}×${p.size}`, p.blob, p.blob, Math.min(48, p.size));
      generated.push({ name: p.name, blob: p.blob });
    }

    emptyHint.hidden = true;
    updateButtons();
  }

  async function generate(): Promise<void> {
    if (!currentBitmap) return;
    // A newer call supersedes this one via runToken, so overlapping runs from
    // rapid option changes resolve to the latest settings rather than being lost.
    const token = ++runToken;
    errorEl.textContent = '';
    setBusy(true);
    const bg = bgEnable.checked ? bgColor.value : null;

    try {
      const square = makeSquareCanvas(currentBitmap);
      const pngs: { size: number; name: string; blob: Blob; bytes: Uint8Array }[] = [];
      for (const t of TARGETS) {
        const canvas = drawAt(square, t.size, bg);
        const blob = await canvasToBlob(canvas);
        if (token !== runToken) return; // a newer run started; drop this one
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (token !== runToken) return;
        pngs.push({ size: t.size, name: t.name, blob, bytes });
      }
      const icoImages = ICO_SIZES.map((s) => ({
        size: s,
        png: pngs.find((p) => p.size === s)!.bytes,
      }));
      const icoBlob = new Blob([buildIco(icoImages)], { type: 'image/x-icon' });
      renderResults(pngs, icoBlob);
    } catch {
      if (token !== runToken) return;
      errorEl.textContent =
        'Could not render this image — it may be corrupt, empty, or a format the browser cannot decode.';
    } finally {
      if (token === runToken) setBusy(false);
    }
  }

  async function loadFile(file: File): Promise<void> {
    errorEl.textContent = '';
    if (file.size === 0) {
      errorEl.textContent = 'That file is empty (0 bytes) — pick an image with actual content.';
      return;
    }
    if (!file.type.startsWith('image/')) {
      errorEl.textContent = `That is not an image (${file.type || 'unknown type'}) — use a PNG, JPEG, WebP, GIF or SVG.`;
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      errorEl.textContent = `${formatBytes(file.size)} is over the ${formatBytes(MAX_FILE_BYTES)} limit — resize the image first.`;
      return;
    }

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      errorEl.textContent =
        'The browser could not decode this file as an image. An SVG without an intrinsic width/height can trigger this — add width and height to the <svg>, or use a PNG.';
      return;
    }
    if (bitmap.width === 0 || bitmap.height === 0) {
      bitmap.close();
      errorEl.textContent = 'This image has no pixel dimensions, so there is nothing to scale.';
      return;
    }

    currentBitmap?.close();
    currentBitmap = bitmap;

    const square = Math.min(bitmap.width, bitmap.height);
    sourceInfo =
      bitmap.width === bitmap.height
        ? `Source: ${bitmap.width}×${bitmap.height}.`
        : `Source: ${bitmap.width}×${bitmap.height} → centre-cropped to ${square}×${square}.`;

    await generate();
  }

  function handleFiles(files: File[]): void {
    if (files.length === 0) return;
    if (files.length > 1) {
      errorEl.textContent = 'One image at a time — using the first file you dropped.';
    }
    void loadFile(files[0]!);
  }

  function clearAll(): void {
    runToken++; // cancel any in-flight run
    currentBitmap?.close();
    currentBitmap = null;
    sourceInfo = '';
    busy = false;
    revokePreviews();
    resultsList.replaceChildren();
    generated.length = 0;
    errorEl.textContent = '';
    sourceEl.textContent = '';
    emptyHint.hidden = false;
    updateButtons();
  }

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  wireDropzone(dropzone, handleFiles, 'image/*');

  bgEnable.addEventListener('change', () => {
    bgColor.disabled = !bgEnable.checked;
    void generate();
  });
  onInput(bgColor, () => {
    if (bgEnable.checked) void generate();
  }, 200);

  downloadAllBtn.addEventListener('click', async () => {
    if (generated.length === 0) {
      showToast('Add an image first — there is nothing to download yet', 'error');
      return;
    }
    downloadingAll = true;
    updateButtons();
    for (const item of generated) {
      downloadBlob(item.blob, item.name);
      // Browsers throttle rapid-fire downloads; space them out.
      await sleep(350);
    }
    downloadingAll = false;
    updateButtons();
    showToast(`Downloaded ${generated.length} files`);
  });

  clearBtn.addEventListener('click', clearAll);

  updateButtons();
}
