import { $, onInput } from '../../lib/dom';
import { downloadDataUrl, downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

/** The `qrcode` package ships no type declarations; the surface used here is typed locally. */
type EcLevel = 'L' | 'M' | 'Q' | 'H';

interface QRRenderOptions {
  errorCorrectionLevel?: EcLevel;
  margin?: number;
  width?: number;
  color?: { dark?: string; light?: string };
}

interface QRCodeModule {
  toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRRenderOptions): Promise<unknown>;
  toString(text: string, options?: QRRenderOptions & { type: 'svg' }): Promise<string>;
}

const root = document.querySelector<HTMLElement>('[data-tool="qr-code-generator"]');

if (root) {
  const typeSelect = $<HTMLSelectElement>('#qr-type', root)!;
  const panelText = $('#qr-panel-text', root)!;
  const panelWifi = $('#qr-panel-wifi', root)!;
  const panelVcard = $('#qr-panel-vcard', root)!;
  const textInput = $<HTMLTextAreaElement>('#qr-text', root)!;
  const wifiSsid = $<HTMLInputElement>('#qr-wifi-ssid', root)!;
  const wifiSecurity = $<HTMLSelectElement>('#qr-wifi-security', root)!;
  const wifiPassword = $<HTMLInputElement>('#qr-wifi-password', root)!;
  const wifiHidden = $<HTMLInputElement>('#qr-wifi-hidden', root)!;
  const vcFirst = $<HTMLInputElement>('#qr-vc-first', root)!;
  const vcLast = $<HTMLInputElement>('#qr-vc-last', root)!;
  const vcPhone = $<HTMLInputElement>('#qr-vc-phone', root)!;
  const vcEmail = $<HTMLInputElement>('#qr-vc-email', root)!;
  const vcOrg = $<HTMLInputElement>('#qr-vc-org', root)!;
  const sizeInput = $<HTMLInputElement>('#qr-size', root)!;
  const sizeValue = $('#qr-size-value', root)!;
  const marginInput = $<HTMLInputElement>('#qr-margin', root)!;
  const marginValue = $('#qr-margin-value', root)!;
  const ecSelect = $<HTMLSelectElement>('#qr-ec', root)!;
  const darkInput = $<HTMLInputElement>('#qr-dark', root)!;
  const lightInput = $<HTMLInputElement>('#qr-light', root)!;
  const warnEl = $('#qr-warn', root)!;
  const errorEl = $('#qr-error', root)!;
  const canvas = $<HTMLCanvasElement>('#qr-canvas', root)!;
  const statusEl = $('#qr-status', root)!;
  const payloadOut = $<HTMLTextAreaElement>('#qr-payload', root)!;
  const downloadPng = $<HTMLButtonElement>('#qr-download-png', root)!;
  const downloadSvg = $<HTMLButtonElement>('#qr-download-svg', root)!;

  /** Byte capacity of the largest QR symbol (version 40) per error correction level. */
  const CAPACITY: Record<EcLevel, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };

  let qr: QRCodeModule | null = null;
  let loading: Promise<QRCodeModule> | null = null;

  /**
   * The encoder is the heavy part of the page, so it loads on first real
   * content via dynamic import. Memoised; reset on failure so the next
   * keystroke retries (e.g. after coming back online).
   */
  function loadQr(): Promise<QRCodeModule> {
    if (!loading) {
      // @ts-ignore -- `qrcode` has no bundled or @types declarations; typed via QRCodeModule above.
      loading = import('qrcode')
        .then((mod: unknown) => {
          qr = ((mod as { default?: unknown }).default ?? mod) as QRCodeModule;
          return qr;
        })
        .catch((err: unknown) => {
          loading = null;
          throw err;
        });
    }
    return loading;
  }

  // ZXing WIFI: format — backslash-escape \ ; , " : in SSID and password.
  const wifiEsc = (s: string): string => s.replace(/([\\;,":])/g, '\\$1');
  // vCard 3.0 (RFC 2426) text values — escape backslash first, then newlines, ; and ,.
  const vcardEsc = (s: string): string =>
    s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([;,])/g, '\\$1');

  type Built = { payload: string } | { error: string } | { prompt: string };

  function buildPayload(): Built {
    switch (typeSelect.value) {
      case 'wifi': {
        const ssid = wifiSsid.value;
        const security = wifiSecurity.value;
        const password = wifiPassword.value;
        if (ssid.trim() === '') {
          return password === ''
            ? { prompt: 'Enter the network name (SSID) to build a Wi-Fi joining code.' }
            : { error: 'Enter the network name (SSID) — phones need it to find the network.' };
        }
        if (security !== 'nopass' && password === '') {
          return { error: `A ${security} network needs its password — or choose "Open (no password)".` };
        }
        let out = `WIFI:T:${security};S:${wifiEsc(ssid)};`;
        if (security !== 'nopass') out += `P:${wifiEsc(password)};`;
        if (wifiHidden.checked) out += 'H:true;';
        return { payload: out + ';' };
      }
      case 'vcard': {
        const first = vcFirst.value.trim();
        const last = vcLast.value.trim();
        const phone = vcPhone.value.trim();
        const email = vcEmail.value.trim();
        const org = vcOrg.value.trim();
        if (first === '' && last === '') {
          return phone === '' && email === '' && org === ''
            ? { prompt: 'Fill in the contact details to build a scannable vCard.' }
            : { error: 'Add at least a first or last name — a vCard without a name field is invalid.' };
        }
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${vcardEsc(last)};${vcardEsc(first)};;;`,
          `FN:${vcardEsc([first, last].filter(Boolean).join(' '))}`,
        ];
        if (org) lines.push(`ORG:${vcardEsc(org)}`);
        if (phone) lines.push(`TEL;TYPE=CELL:${vcardEsc(phone)}`);
        if (email) lines.push(`EMAIL:${vcardEsc(email)}`);
        lines.push('END:VCARD');
        return { payload: lines.join('\r\n') };
      }
      default: {
        const raw = textInput.value;
        if (raw.trim() === '') {
          return { prompt: 'Enter content above — the code renders as you type.' };
        }
        return { payload: raw };
      }
    }
  }

  // WCAG relative luminance of a #rrggbb colour.
  function luminance(hex: string): number {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v: number): number => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
  }

  function updateContrastWarning(): void {
    const ld = luminance(darkInput.value);
    const ll = luminance(lightInput.value);
    let msg = '';
    if (ld > ll) {
      msg = 'Inverted colours — most scanners only read dark modules on a light background. Swap the two if scans fail.';
    } else {
      const ratio = (ll + 0.05) / (ld + 0.05);
      if (ratio < 3) {
        msg = `Low contrast (${ratio.toFixed(1)}:1) — scanners need roughly 3:1 or better between code and background.`;
      }
    }
    warnEl.textContent = msg;
    warnEl.style.display = msg ? 'inline-flex' : 'none';
  }

  function clearPreview(): void {
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    payloadOut.value = '';
    downloadPng.disabled = true;
    downloadSvg.disabled = true;
  }

  function renderOptions(): QRRenderOptions {
    return {
      errorCorrectionLevel: ecSelect.value as EcLevel,
      margin: parseInt(marginInput.value, 10),
      width: parseInt(sizeInput.value, 10),
      color: { dark: darkInput.value, light: lightInput.value },
    };
  }

  let currentPayload: string | null = null;
  let runId = 0;

  async function render(): Promise<void> {
    const id = ++runId;
    updateContrastWarning();
    const built = buildPayload();

    if (!('payload' in built)) {
      currentPayload = null;
      clearPreview();
      errorEl.textContent = 'error' in built ? built.error : '';
      statusEl.textContent = 'prompt' in built ? built.prompt : '';
      return;
    }

    const ec = ecSelect.value as EcLevel;
    const bytes = new TextEncoder().encode(built.payload).length;
    const capacity = CAPACITY[ec];
    if (bytes > capacity) {
      currentPayload = null;
      clearPreview();
      statusEl.textContent = '';
      errorEl.textContent =
        `Too much data: ${bytes.toLocaleString()} bytes, but a QR code holds at most ` +
        `${capacity.toLocaleString()} bytes at level ${ec}. Shorten the content` +
        (ec === 'L' ? '.' : ' or pick a lower error correction level.');
      return;
    }

    let lib = qr;
    if (!lib) {
      try {
        lib = await loadQr();
      } catch {
        if (id === runId) {
          currentPayload = null;
          clearPreview();
          statusEl.textContent = '';
          errorEl.textContent =
            'Could not load the QR encoder (a one-off static file) — you may be offline. Check your connection and type again to retry.';
        }
        return;
      }
      if (id !== runId) return;
    }

    try {
      await lib.toCanvas(canvas, built.payload, renderOptions());
    } catch {
      if (id === runId) {
        currentPayload = null;
        clearPreview();
        statusEl.textContent = '';
        errorEl.textContent = 'Could not render this content as a QR code — remove unusual characters and try again.';
      }
      return;
    }
    if (id !== runId) return;

    currentPayload = built.payload;
    errorEl.textContent = '';
    payloadOut.value = built.payload;
    downloadPng.disabled = false;
    downloadSvg.disabled = false;
    statusEl.textContent = `${bytes.toLocaleString()} of ${capacity.toLocaleString()} bytes used at error correction level ${ec}.`;
  }

  function applyType(): void {
    const t = typeSelect.value;
    panelText.style.display = t === 'text' ? '' : 'none';
    panelWifi.style.display = t === 'wifi' ? '' : 'none';
    panelVcard.style.display = t === 'vcard' ? '' : 'none';
  }

  function applySecurity(): void {
    wifiPassword.disabled = wifiSecurity.value === 'nopass';
    if (wifiPassword.disabled) wifiPassword.value = '';
  }

  typeSelect.addEventListener('change', () => {
    applyType();
    void render();
  });
  wifiSecurity.addEventListener('change', () => {
    applySecurity();
    void render();
  });
  wifiHidden.addEventListener('change', () => void render());
  ecSelect.addEventListener('change', () => void render());

  for (const el of [textInput, wifiSsid, wifiPassword, vcFirst, vcLast, vcPhone, vcEmail, vcOrg]) {
    onInput(el, () => void render(), 150);
  }
  onInput(sizeInput, () => {
    sizeValue.textContent = sizeInput.value;
    void render();
  });
  onInput(marginInput, () => {
    marginValue.textContent = marginInput.value;
    void render();
  });
  onInput(darkInput, () => void render(), 100);
  onInput(lightInput, () => void render(), 100);

  downloadPng.addEventListener('click', () => {
    if (!currentPayload) return;
    downloadDataUrl(canvas.toDataURL('image/png'), 'qr-code.png');
  });

  downloadSvg.addEventListener('click', () => {
    const payload = currentPayload;
    if (!payload) return;
    void (async () => {
      try {
        const lib = await loadQr();
        const svg = await lib.toString(payload, { ...renderOptions(), type: 'svg' });
        downloadText(svg, 'qr-code.svg', 'image/svg+xml');
      } catch {
        showToast('Could not build the SVG — check your connection and try again', 'error');
      }
    })();
  });

  applyType();
  applySecurity();
  void render();
}
