import { $, wireDropzone } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { downloadText } from '../../lib/download';
import { formatBytes } from '../../lib/bytes';

type ExifData = Record<string, unknown>;

const root = document.querySelector<HTMLElement>('[data-tool="exif-viewer"]');

if (root) {
  const dropzone = $('#exv-dropzone', root)!;
  const error = $('#exv-error', root)!;
  const fileInfo = $('#exv-file-info', root)!;
  const preview = $<HTMLImageElement>('#exv-preview', root)!;
  const queueWrap = $('#exv-queue-wrap', root)!;
  const queueList = $('#exv-queue', root)!;
  const gpsBadge = $('#exv-gps-badge', root)!;
  const copyBtn = $<HTMLButtonElement>('#exv-copy', root)!;
  const downloadBtn = $<HTMLButtonElement>('#exv-download', root)!;
  const clearBtn = $<HTMLButtonElement>('#exv-clear', root)!;

  const sections = {
    camera: $('#exv-sec-camera', root)!,
    capture: $('#exv-sec-capture', root)!,
    gps: $('#exv-sec-gps', root)!,
    dates: $('#exv-sec-dates', root)!,
    software: $('#exv-sec-software', root)!,
  };

  // ---------- value formatters ----------

  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;

  function fmtExposure(v: unknown): string {
    const n = num(v);
    if (n === null || n <= 0) return String(v);
    return n >= 1 ? `${+n.toFixed(1)} s` : `1/${Math.round(1 / n)} s`;
  }

  function fmtDate(v: unknown): string {
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      const p = (x: number) => String(x).padStart(2, '0');
      return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
    }
    return String(v);
  }

  const fmtPlain = (v: unknown): string => (Array.isArray(v) ? v.join(', ') : String(v));

  type Row = { key: string; label: string; fmt?: (v: unknown) => string };

  const CAMERA_ROWS: Row[] = [
    { key: 'Make', label: 'Make' },
    { key: 'Model', label: 'Model' },
    { key: 'LensMake', label: 'Lens make' },
    { key: 'LensModel', label: 'Lens model' },
    { key: 'SerialNumber', label: 'Body serial number' },
  ];
  const CAPTURE_ROWS: Row[] = [
    { key: 'ExposureTime', label: 'Shutter speed', fmt: fmtExposure },
    { key: 'FNumber', label: 'Aperture', fmt: (v) => `f/${String(v)}` },
    { key: 'ISO', label: 'ISO' },
    { key: 'FocalLength', label: 'Focal length', fmt: (v) => `${String(v)} mm` },
    { key: 'FocalLengthIn35mmFormat', label: 'Focal length (35mm equiv.)', fmt: (v) => `${String(v)} mm` },
    { key: 'ExposureProgram', label: 'Exposure program' },
    { key: 'Flash', label: 'Flash' },
    { key: 'WhiteBalance', label: 'White balance' },
    { key: 'Orientation', label: 'Orientation' },
    { key: 'ExifImageWidth', label: 'Width', fmt: (v) => `${String(v)} px` },
    { key: 'ExifImageHeight', label: 'Height', fmt: (v) => `${String(v)} px` },
  ];
  const DATE_ROWS: Row[] = [
    { key: 'DateTimeOriginal', label: 'Taken', fmt: fmtDate },
    { key: 'CreateDate', label: 'Digitised', fmt: fmtDate },
    { key: 'ModifyDate', label: 'Last modified (EXIF)', fmt: fmtDate },
    { key: 'OffsetTimeOriginal', label: 'Time zone offset' },
  ];
  const SOFTWARE_ROWS: Row[] = [
    { key: 'Software', label: 'Software' },
    { key: 'HostComputer', label: 'Host computer' },
    { key: 'Artist', label: 'Artist' },
    { key: 'Copyright', label: 'Copyright' },
  ];

  // ---------- rendering ----------

  function li(label: string, value: string | HTMLElement): HTMLLIElement {
    const item = document.createElement('li');
    const l = document.createElement('span');
    l.textContent = label;
    const v = document.createElement('span');
    if (typeof value === 'string') v.textContent = value;
    else v.appendChild(value);
    item.append(l, v);
    return item;
  }

  function hint(text: string): HTMLLIElement {
    const item = document.createElement('li');
    const s = document.createElement('span');
    s.className = 'field-hint';
    s.textContent = text;
    item.appendChild(s);
    return item;
  }

  function renderRows(ul: HTMLElement, data: ExifData, rows: Row[], noneMsg: string): string[] {
    ul.replaceChildren();
    const lines: string[] = [];
    for (const row of rows) {
      const raw = data[row.key];
      if (raw === undefined || raw === null || raw === '') continue;
      const text = row.fmt ? row.fmt(raw) : fmtPlain(raw);
      ul.appendChild(li(row.label, text));
      lines.push(`${row.label}: ${text}`);
    }
    if (lines.length === 0) ul.appendChild(hint(noneMsg));
    return lines;
  }

  function renderGps(data: ExifData): string[] {
    const ul = sections.gps;
    ul.replaceChildren();
    const lat = num(data['latitude']);
    const lon = num(data['longitude']);

    if (lat === null || lon === null) {
      ul.appendChild(hint("No GPS tags found — this photo doesn't reveal a location. That's a good thing."));
      gpsBadge.hidden = false;
      gpsBadge.className = 'badge badge-ok';
      gpsBadge.textContent = 'No location';
      return [];
    }

    gpsBadge.hidden = false;
    gpsBadge.className = 'badge badge-warn';
    gpsBadge.textContent = 'Location embedded';

    const coord = `${Math.abs(lat).toFixed(6)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(6)}° ${lon < 0 ? 'W' : 'E'}`;
    ul.appendChild(li('Coordinates', coord));

    const la = lat.toFixed(6);
    const lo = lon.toFixed(6);
    const a = document.createElement('a');
    a.href = `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=16/${la}/${lo}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Open in OpenStreetMap';
    ul.appendChild(li('Map', a));

    const lines = [`Coordinates: ${coord}`, `Map: ${a.href}`];
    const alt = num(data['GPSAltitude']);
    if (alt !== null) {
      const altText = `${alt.toFixed(1)} m`;
      ul.appendChild(li('Altitude', altText));
      lines.push(`Altitude: ${altText}`);
    }
    return lines;
  }

  function resetSections(placeholder: string): void {
    for (const ul of Object.values(sections)) ul.replaceChildren(hint(placeholder));
    gpsBadge.hidden = true;
  }

  // ---------- state ----------

  let queue: File[] = [];
  let previewUrl: string | null = null;
  let copyDump = '';
  let jsonDump = '';
  let jsonName = 'metadata.exif.json';
  let loadToken = 0;

  preview.addEventListener('load', () => {
    // Manifest note: object URL revoked after the thumbnail has rendered.
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  });
  preview.addEventListener('error', () => {
    // HEIC/TIFF previews don't render in every browser — metadata still does.
    preview.hidden = true;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  });

  function setPreview(file: File): void {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    preview.hidden = false;
    preview.src = previewUrl;
  }

  function renderQueue(): void {
    queueList.replaceChildren();
    queueWrap.hidden = queue.length === 0;
    queue.forEach((file, i) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${file.name} (${formatBytes(file.size)})`;
      const view = document.createElement('button');
      view.type = 'button';
      view.className = 'btn btn-ghost btn-sm';
      view.textContent = 'View';
      view.addEventListener('click', () => {
        queue.splice(i, 1);
        renderQueue();
        void loadFile(file);
      });
      item.append(name, view);
      queueList.appendChild(item);
    });
  }

  async function loadFile(file: File): Promise<void> {
    const token = ++loadToken;
    error.textContent = '';

    if (file.size === 0) {
      error.textContent = `"${file.name}" is empty (0 bytes) — there is no metadata to read.`;
      return;
    }

    fileInfo.textContent = `${file.name} — ${formatBytes(file.size)}${file.type ? ` — ${file.type}` : ''}`;
    setPreview(file);
    resetSections('Reading…');

    let data: ExifData | undefined;
    try {
      // exifr is ~50 KB gzipped; load it only when a file actually arrives.
      const exifr = await import('exifr');
      data = (await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        interop: false,
      })) as ExifData | undefined;
    } catch {
      if (token !== loadToken) return;
      resetSections('Nothing to show — the file could not be parsed.');
      error.textContent = `Couldn't read "${file.name}" — it doesn't look like a supported image (JPEG, TIFF, PNG, HEIC or AVIF).`;
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
      clearBtn.disabled = false;
      return;
    }
    if (token !== loadToken) return; // a newer file superseded this one

    const dump: string[] = [`File: ${file.name} (${formatBytes(file.size)})`];
    const d = data ?? {};

    const add = (title: string, lines: string[], noneMsg: string) => {
      dump.push('', `[${title}]`, ...(lines.length ? lines : [noneMsg]));
    };
    add('Camera', renderRows(sections.camera, d, CAMERA_ROWS, 'No camera metadata found.'), 'none found');
    add('Capture', renderRows(sections.capture, d, CAPTURE_ROWS, 'No capture settings found.'), 'none found');
    add('GPS', renderGps(d), 'none found');
    add('Dates', renderRows(sections.dates, d, DATE_ROWS, 'No date metadata found.'), 'none found');
    add(
      'Software',
      renderRows(sections.software, d, SOFTWARE_ROWS, 'No software or authorship metadata found.'),
      'none found'
    );

    if (!data || Object.keys(data).length === 0) {
      fileInfo.textContent += ' — no EXIF metadata at all, which is good news for privacy.';
    }

    copyDump = dump.join('\n');
    jsonDump = JSON.stringify(data ?? {}, null, 2);
    jsonName = `${file.name.replace(/\.[^.]+$/, '') || 'metadata'}.exif.json`;
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    clearBtn.disabled = false;
  }

  function clearAll(): void {
    loadToken++;
    queue = [];
    renderQueue();
    error.textContent = '';
    fileInfo.textContent = '';
    preview.hidden = true;
    preview.removeAttribute('src');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    copyDump = '';
    jsonDump = '';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    clearBtn.disabled = true;
    resetSections('Load a photo to populate this section.');
  }

  wireDropzone(
    dropzone,
    (files) => {
      const [first, ...rest] = files;
      if (!first) return;
      queue = rest;
      renderQueue();
      void loadFile(first);
    },
    'image/*,.heic,.heif,.avif,.tif,.tiff'
  );

  copyBtn.addEventListener('click', () => void copyText(copyDump));
  downloadBtn.addEventListener('click', () => {
    if (jsonDump) downloadText(jsonDump, jsonName, 'application/json');
  });
  clearBtn.addEventListener('click', clearAll);
}
