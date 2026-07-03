import { $ } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { bytesToHex } from '../../lib/bytes';

const root = document.querySelector<HTMLElement>('[data-tool="browser-fingerprint"]');

if (root) {
  const runBtn = $<HTMLButtonElement>('#bfp-run', root)!;
  const copyBtn = $<HTMLButtonElement>('#bfp-copy', root)!;
  const clearBtn = $<HTMLButtonElement>('#bfp-clear', root)!;
  const error = $('#bfp-error', root)!;
  const combinedEl = $('#bfp-combined', root)!;
  const canvasSummaryEl = $('#bfp-canvas-summary', root)!;

  // Extra navigator/window fields not in the standard lib.dom typings.
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    doNotTrack?: string | null;
  };
  const win = window as Window & { doNotTrack?: string | null };

  const NA = 'unavailable';

  /** SHA-256 → first 16 hex chars. Requires a secure context (WebCrypto). */
  async function sha16(text: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return bytesToHex(new Uint8Array(digest)).slice(0, 16);
  }

  function readValue(id: string): HTMLElement {
    return $(`#bfp-val-${id}`, root!)!;
  }

  /** Draw a fixed scene and return its data URL, or null if canvas is blocked. */
  function canvasDataUrl(): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('PrivacyKit \u{1F512} fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('PrivacyKit \u{1F512} fingerprint', 4, 17);
      return canvas.toDataURL();
    } catch {
      return null;
    }
  }

  /** Unmasked WebGL renderer string via the debug extension, guarded. */
  function webglRenderer(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (!gl) return NA;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        const r = gl.getParameter(
          (dbg as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL
        );
        if (typeof r === 'string' && r) return r;
      }
      const fallback = gl.getParameter(gl.RENDERER);
      return typeof fallback === 'string' && fallback ? fallback : NA;
    } catch {
      return NA;
    }
  }

  function matchMediaSafe(query: string): boolean | null {
    try {
      if (typeof window.matchMedia !== 'function') return null;
      return window.matchMedia(query).matches;
    } catch {
      return null;
    }
  }

  function doNotTrackValue(): string {
    const raw = nav.doNotTrack ?? win.doNotTrack ?? null;
    if (raw === '1' || raw === 'yes') return 'enabled (1)';
    if (raw === '0' || raw === 'no') return 'disabled (0)';
    return 'not set';
  }

  interface Report {
    rows: { id: string; value: string }[];
    canvasHash: string;
  }

  async function collect(): Promise<Report> {
    const languages =
      Array.isArray(nav.languages) && nav.languages.length ? nav.languages.join(', ') : nav.language || NA;

    const screenRes =
      typeof screen.width === 'number' ? `${screen.width} × ${screen.height}` : NA;
    const dpr = typeof window.devicePixelRatio === 'number' ? String(window.devicePixelRatio) : NA;
    const depth = typeof screen.colorDepth === 'number' ? `${screen.colorDepth}-bit` : NA;

    const dark = matchMediaSafe('(prefers-color-scheme: dark)');
    const scheme = dark === null ? NA : dark ? 'dark' : 'light';
    const reduce = matchMediaSafe('(prefers-reduced-motion: reduce)');
    const motion = reduce === null ? NA : reduce ? 'reduce' : 'no-preference';

    const cores =
      typeof nav.hardwareConcurrency === 'number' ? String(nav.hardwareConcurrency) : NA;
    const memory = typeof nav.deviceMemory === 'number' ? `${nav.deviceMemory} GB (approx.)` : NA;
    const touch = typeof nav.maxTouchPoints === 'number' ? String(nav.maxTouchPoints) : NA;

    let timezone = NA;
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || NA;
    } catch {
      timezone = NA;
    }

    const dataUrl = canvasDataUrl();
    let canvasHash = NA;
    if (dataUrl && crypto.subtle) {
      try {
        canvasHash = await sha16(dataUrl);
      } catch {
        canvasHash = NA;
      }
    } else if (!dataUrl) {
      canvasHash = 'blocked';
    }

    const rows = [
      { id: 'ua', value: nav.userAgent || NA },
      { id: 'lang', value: languages },
      { id: 'platform', value: nav.platform || NA },
      { id: 'dnt', value: doNotTrackValue() },
      { id: 'cookies', value: nav.cookieEnabled ? 'yes' : 'no' },
      { id: 'screen', value: screenRes },
      { id: 'dpr', value: dpr },
      { id: 'depth', value: depth },
      { id: 'scheme', value: scheme },
      { id: 'motion', value: motion },
      { id: 'cores', value: cores },
      { id: 'memory', value: memory },
      { id: 'touch', value: touch },
      { id: 'tz', value: timezone },
      { id: 'canvas', value: canvasHash },
      { id: 'webgl', value: webglRenderer() },
    ];

    return { rows, canvasHash };
  }

  let reportText = '';

  async function run(): Promise<void> {
    error.textContent = '';
    runBtn.disabled = true;
    runBtn.textContent = 'Reading…';

    try {
      const { rows, canvasHash } = await collect();

      for (const row of rows) readValue(row.id).textContent = row.value;
      canvasSummaryEl.textContent = canvasHash;

      // Combined fingerprint: hash every signal in order. Same device → same
      // hash on reload; different device → different hash.
      const joined = rows.map((r) => `${r.id}=${r.value}`).join('␟');
      let combined = 'unavailable (needs HTTPS)';
      if (crypto.subtle) {
        try {
          combined = await sha16(joined);
        } catch {
          combined = NA;
        }
      }
      combinedEl.textContent = combined;

      reportText = [
        'Browser fingerprint (read locally, never sent)',
        `Combined fingerprint: ${combined}`,
        '',
        ...rows.map((r) => `${r.id}: ${r.value}`),
      ].join('\n');

      copyBtn.disabled = false;
      clearBtn.disabled = false;

      if (!crypto.subtle) {
        error.textContent =
          'Hashes need a secure context (HTTPS). Every other signal is shown, but the canvas and combined hashes are unavailable on this connection.';
      }
    } catch {
      error.textContent = 'Something went wrong reading your browser. No data left this page.';
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Refresh fingerprint';
    }
  }

  function clearAll(): void {
    error.textContent = '';
    reportText = '';
    combinedEl.textContent = '–';
    canvasSummaryEl.textContent = '–';
    for (const el of root!.querySelectorAll<HTMLElement>('.bfp-val')) el.textContent = '–';
    copyBtn.disabled = true;
    clearBtn.disabled = true;
    runBtn.textContent = 'Show my fingerprint';
  }

  runBtn.addEventListener('click', () => void run());
  copyBtn.addEventListener('click', () => {
    if (reportText) void copyText(reportText);
  });
  clearBtn.addEventListener('click', clearAll);

  // Hydrated: safe to enable the trigger (it never fires on load — respectful).
  runBtn.disabled = false;
}
