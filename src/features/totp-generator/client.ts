import * as OTPAuth from 'otpauth';
import { randomBytes } from '../../lib/random';
import { $, onInput } from '../../lib/dom';
import { showToast } from '../../lib/toast';
import { downloadDataUrl } from '../../lib/download';

/** The `qrcode` package ships no type declarations; the surface used here is typed locally. */
interface QRRenderOptions {
  margin?: number;
  width?: number;
  color?: { dark?: string; light?: string };
}
interface QRCodeModule {
  toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRRenderOptions): Promise<unknown>;
}

const root = document.querySelector<HTMLElement>('[data-tool="totp-generator"]');

if (root) {
  const secretInput = $<HTMLInputElement>('#totp-secret', root)!;
  const issuerInput = $<HTMLInputElement>('#totp-issuer', root)!;
  const accountInput = $<HTMLInputElement>('#totp-account', root)!;
  const digitsSelect = $<HTMLSelectElement>('#totp-digits', root)!;
  const periodInput = $<HTMLInputElement>('#totp-period', root)!;
  const algoSelect = $<HTMLSelectElement>('#totp-algo', root)!;
  const errorEl = $('#totp-error', root)!;
  const codeEl = $('#totp-code', root)!;
  const codeValue = $<HTMLInputElement>('#totp-code-value', root)!;
  const countdownEl = $('#totp-countdown', root)!;
  const barFill = $<HTMLElement>('#totp-bar-fill', root)!;
  const uriInput = $<HTMLInputElement>('#totp-uri', root)!;
  const genSecretBtn = $<HTMLButtonElement>('#totp-gen-secret', root)!;
  const qrCanvas = $<HTMLCanvasElement>('#totp-qr', root)!;
  const qrStatus = $('#totp-qr-status', root)!;
  const downloadQrBtn = $<HTMLButtonElement>('#totp-download-qr', root)!;

  const QR_SAFE_NOTE = 'The QR carries the secret in plain text — treat it like the password itself.';

  // ---- qrcode: heavy renderer, loaded on first valid secret via dynamic import ----
  let qr: QRCodeModule | null = null;
  let qrLoading: Promise<QRCodeModule> | null = null;
  function loadQr(): Promise<QRCodeModule> {
    if (!qrLoading) {
      // @ts-ignore -- `qrcode` has no bundled or @types declarations; typed via QRCodeModule above.
      qrLoading = import('qrcode')
        .then((mod: unknown) => {
          qr = ((mod as { default?: unknown }).default ?? mod) as QRCodeModule;
          return qr;
        })
        .catch((err: unknown) => {
          qrLoading = null;
          throw err;
        });
    }
    return qrLoading;
  }

  let totp: OTPAuth.TOTP | null = null;
  let lastCounter = -1;
  let qrRunId = 0;

  const placeholder = (): string => (digitsSelect.value === '8' ? '–––– ––––' : '––– –––');

  function groupCode(code: string): string {
    const half = Math.ceil(code.length / 2);
    return `${code.slice(0, half)} ${code.slice(half)}`;
  }

  function clearQr(): void {
    qrRunId++;
    qrCanvas.getContext('2d')?.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    downloadQrBtn.disabled = true;
    qrStatus.textContent = QR_SAFE_NOTE;
  }

  /** Reset the output to an idle state with an optional countdown-line message. */
  function clearOutput(message: string): void {
    totp = null;
    lastCounter = -1;
    codeEl.textContent = placeholder();
    codeValue.value = '';
    uriInput.value = '';
    countdownEl.textContent = message;
    barFill.style.width = '0%';
    clearQr();
  }

  async function renderQr(uri: string): Promise<void> {
    const id = ++qrRunId;
    let lib = qr;
    if (!lib) {
      try {
        lib = await loadQr();
      } catch {
        if (id === qrRunId) {
          downloadQrBtn.disabled = true;
          qrStatus.textContent =
            'Could not load the QR renderer (a one-off static file) — you may be offline. The codes above still work.';
        }
        return;
      }
      if (id !== qrRunId) return;
    }
    try {
      // Fixed black-on-white so the code stays scannable regardless of page theme.
      await lib.toCanvas(qrCanvas, uri, {
        margin: 2,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch {
      if (id === qrRunId) {
        qrCanvas.getContext('2d')?.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        downloadQrBtn.disabled = true;
        qrStatus.textContent = 'Could not render a QR code for this secret.';
      }
      return;
    }
    if (id !== qrRunId) return;
    downloadQrBtn.disabled = false;
    qrStatus.textContent = QR_SAFE_NOTE;
  }

  /** Refresh the displayed code + countdown from the current config. Cheap; runs on a timer. */
  function tick(): void {
    if (!totp) return;
    const now = Date.now();
    const counter = totp.counter({ timestamp: now });
    if (counter !== lastCounter) {
      lastCounter = counter;
      const code = totp.generate({ timestamp: now });
      codeEl.textContent = groupCode(code);
      codeValue.value = code;
    }
    const remainingMs = totp.remaining({ timestamp: now });
    countdownEl.textContent = `Refreshes in ${Math.ceil(remainingMs / 1000)}s`;
    barFill.style.width = `${(remainingMs / (totp.period * 1000)) * 100}%`;
  }

  /** Read every input, validate, and (re)build the TOTP object, URI and QR. */
  function rebuild(): void {
    let secretRaw = secretInput.value.trim();

    if (secretRaw === '') {
      errorEl.textContent = '';
      clearOutput('Enter a secret to start');
      return;
    }

    // A pasted otpauth:// link fills in every parameter, then leaves just the
    // Base32 secret in the field so the tool has a single source of truth.
    if (secretRaw.toLowerCase().startsWith('otpauth://')) {
      let parsed: OTPAuth.HOTP | OTPAuth.TOTP;
      try {
        parsed = OTPAuth.URI.parse(secretRaw);
      } catch {
        errorEl.textContent = 'That does not look like a complete otpauth:// link — check you copied all of it.';
        clearOutput('Enter a secret to start');
        return;
      }
      if (!(parsed instanceof OTPAuth.TOTP)) {
        errorEl.textContent = 'This is a counter-based (HOTP) link. This tool generates time-based (TOTP) codes.';
        clearOutput('Enter a secret to start');
        return;
      }
      issuerInput.value = parsed.issuer;
      accountInput.value = parsed.label;
      digitsSelect.value = parsed.digits === 8 ? '8' : '6';
      periodInput.value = String(parsed.period);
      algoSelect.value = ['SHA1', 'SHA256', 'SHA512'].includes(parsed.algorithm) ? parsed.algorithm : 'SHA1';
      secretRaw = parsed.secret.base32;
      secretInput.value = secretRaw;
    }

    const period = parseInt(periodInput.value, 10);
    if (!Number.isFinite(period) || period < 1 || period > 3600) {
      errorEl.textContent = 'Period must be a whole number of seconds between 1 and 3600.';
      clearOutput('Set a valid period');
      return;
    }

    let secret: OTPAuth.Secret;
    try {
      secret = OTPAuth.Secret.fromBase32(secretRaw);
    } catch {
      errorEl.textContent = 'Not a valid Base32 secret — use only the letters A–Z and the digits 2–7.';
      clearOutput('Fix the secret to continue');
      return;
    }
    if (secret.bytes.length === 0) {
      errorEl.textContent = 'That secret is empty once decoded — check you pasted the whole key.';
      clearOutput('Fix the secret to continue');
      return;
    }

    errorEl.textContent = '';
    const account = accountInput.value.trim();
    totp = new OTPAuth.TOTP({
      issuer: issuerInput.value.trim(),
      label: account || 'account',
      issuerInLabel: true,
      secret,
      algorithm: algoSelect.value,
      digits: digitsSelect.value === '8' ? 8 : 6,
      period,
    });

    lastCounter = -1;
    uriInput.value = totp.toString();
    tick();
    void renderQr(uriInput.value);
  }

  // ---- events ----
  onInput(secretInput, rebuild, 150);
  onInput(issuerInput, rebuild, 150);
  onInput(accountInput, rebuild, 150);
  onInput(periodInput, rebuild);
  digitsSelect.addEventListener('change', rebuild);
  algoSelect.addEventListener('change', rebuild);

  genSecretBtn.addEventListener('click', () => {
    // 160-bit secret (RFC 6238 recommendation). Entropy comes from src/lib/random.
    const secret = new OTPAuth.Secret({ buffer: randomBytes(20).buffer });
    secretInput.value = secret.base32;
    rebuild();
    showToast('Generated a new 160-bit secret');
  });

  downloadQrBtn.addEventListener('click', () => {
    if (downloadQrBtn.disabled) return;
    downloadDataUrl(qrCanvas.toDataURL('image/png'), 'totp-qr.png');
  });

  // ---- live countdown ----
  let timer: number | undefined;
  const stop = (): void => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
  timer = window.setInterval(tick, 250);
  window.addEventListener('pagehide', stop);
  document.addEventListener('astro:before-swap', stop);

  rebuild();
}
