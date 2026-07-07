import { $, wireDropzone } from '../../lib/dom';

/**
 * jsQR ships its own types. The decoder is loaded lazily via dynamic import
 * (a small script only needed once an image or camera frame actually arrives),
 * so the function type is pulled in as a type-only import — no runtime bundle.
 */
type JsQRModule = typeof import('jsqr');
type JsQRFn = JsQRModule['default'];
type QRResult = NonNullable<ReturnType<JsQRFn>>;

const root = document.querySelector<HTMLElement>('[data-tool="qr-code-reader"]');

if (root) {
  const cameraBtn = $<HTMLButtonElement>('#qrr-camera-btn', root)!;
  const stopBtn = $<HTMLButtonElement>('#qrr-stop-btn', root)!;
  const cameraWrap = $('#qrr-camera-wrap', root)!;
  const video = $<HTMLVideoElement>('#qrr-video', root)!;
  const dropzone = $('#qrr-dropzone', root)!;
  const errorEl = $('#qrr-error', root)!;
  const statusEl = $('#qrr-status', root)!;
  const output = $<HTMLTextAreaElement>('#qrr-output', root)!;
  const typeBadge = $('#qrr-type-badge', root)!;
  const copyBtn = $<HTMLButtonElement>('#qrr-copy', root)!;
  const urlNote = $('#qrr-url-note', root)!;

  // Longest-side pixel caps. Still images are scaled down to bound memory and
  // keep the one-shot jsQR pass fast; camera frames are smaller so the rAF scan
  // loop stays smooth. Both are generous enough for typical codes.
  const MAX_STILL = 2000;
  const MAX_CAMERA = 720;

  const setError = (msg: string): void => {
    errorEl.textContent = msg;
  };
  const setStatus = (msg: string): void => {
    statusEl.textContent = msg;
  };

  // ---------- decoder (lazy) ----------

  let jsQR: JsQRFn | null = null;
  let loadingDecoder: Promise<JsQRFn> | null = null;

  function loadDecoder(): Promise<JsQRFn> {
    if (!loadingDecoder) {
      loadingDecoder = import('jsqr')
        .then((mod) => {
          jsQR = mod.default;
          return mod.default;
        })
        .catch((err: unknown) => {
          loadingDecoder = null; // allow a retry on the next attempt
          throw err;
        });
    }
    return loadingDecoder;
  }

  // ---------- content classification ----------

  function classify(text: string): string {
    const s = text.trim();
    if (/^WIFI:/i.test(s)) return 'Wi-Fi network';
    if (/^BEGIN:VCARD/i.test(s)) return 'Contact card (vCard)';
    if (/^BEGIN:(VEVENT|VCALENDAR)/i.test(s)) return 'Calendar event';
    if (/^mailto:/i.test(s) || /^MATMSG:/i.test(s)) return 'Email';
    if (/^tel:/i.test(s)) return 'Phone number';
    if (/^(smsto|sms):/i.test(s)) return 'SMS';
    if (/^geo:/i.test(s)) return 'Location';
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return 'URL';
    return 'Plain text';
  }

  function hostOf(text: string): string | null {
    try {
      return new URL(text.trim()).host || null;
    } catch {
      return null;
    }
  }

  // ---------- rendering a decoded code ----------

  function showResult(code: QRResult): void {
    const text = code.data ?? '';
    setError('');
    output.value = text;
    copyBtn.disabled = text === '';

    const type = classify(text);
    typeBadge.hidden = false;
    typeBadge.textContent = type;

    if (type === 'URL') {
      const host = hostOf(text);
      typeBadge.className = 'badge badge-warn';
      urlNote.hidden = false;
      urlNote.textContent = host
        ? `Caution: this link points to ${host}. Check it before opening — this reader will not open it for you.`
        : 'Caution: this looks like a link. Check it before opening — this reader will not open it for you.';
    } else {
      typeBadge.className = 'badge';
      urlNote.hidden = true;
      urlNote.textContent = '';
    }

    const ver = typeof code.version === 'number' ? ` (version ${code.version})` : '';
    setStatus(text === '' ? `Read a QR code${ver} that holds an empty string.` : `Read a ${type}${ver}.`);
  }

  // ---------- image → ImageData ----------

  type Source = ImageBitmap | HTMLImageElement;

  async function loadImage(file: File): Promise<Source> {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(file);
      } catch {
        // Some formats/animated images make createImageBitmap reject — fall
        // back to an <img>, which decodes a wider range of inputs.
      }
    }
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.dataset.objurl = url;
      img.onload = () => resolve(img);
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('image decode failed'));
      };
      img.src = url;
    });
  }

  function releaseSource(src: Source): void {
    if (src instanceof HTMLImageElement) {
      const url = src.dataset.objurl;
      if (url) URL.revokeObjectURL(url);
    } else {
      src.close();
    }
  }

  const stillCanvas = document.createElement('canvas');
  const stillCtx = stillCanvas.getContext('2d', { willReadFrequently: true });

  function drawToImageData(
    src: CanvasImageSource,
    sw: number,
    sh: number,
    maxSide: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D | null
  ): ImageData | null {
    if (!ctx || !sw || !sh) return null;
    const scale = Math.min(1, maxSide / Math.max(sw, sh));
    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));
    if (canvas.width !== dw) canvas.width = dw;
    if (canvas.height !== dh) canvas.height = dh;
    ctx.drawImage(src, 0, 0, dw, dh);
    try {
      return ctx.getImageData(0, 0, dw, dh);
    } catch {
      return null; // tainted canvas is impossible for local files, but guard anyway
    }
  }

  let runId = 0;

  async function decodeFile(file: File): Promise<void> {
    const token = ++runId;
    setError('');

    if (file.size === 0) {
      setError(`"${file.name}" is empty (0 bytes) — there's no image to read.`);
      return;
    }
    if (file.type && !file.type.startsWith('image/')) {
      setError(`"${file.name}" isn't an image (${file.type}). Upload a PNG, JPEG, WebP, GIF or BMP.`);
      return;
    }

    setStatus('Reading image…');

    let source: Source;
    try {
      source = await loadImage(file);
    } catch {
      if (token !== runId) return;
      setStatus('');
      setError(`Couldn't read "${file.name}" as an image — the file may be corrupt or an unsupported format.`);
      return;
    }
    if (token !== runId) {
      releaseSource(source);
      return;
    }

    let decode: JsQRFn;
    try {
      decode = jsQR ?? (await loadDecoder());
    } catch {
      releaseSource(source);
      if (token !== runId) return;
      setStatus('');
      setError('Could not load the QR decoder (a one-off script) — you may be offline. Reconnect and try again.');
      return;
    }
    if (token !== runId) {
      releaseSource(source);
      return;
    }

    const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    const imageData = drawToImageData(source, sw, sh, MAX_STILL, stillCanvas, stillCtx);
    releaseSource(source);

    if (!imageData) {
      setStatus('');
      setError('This image could not be processed in the browser — try a smaller or re-exported file.');
      return;
    }

    const code = decode(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
    if (token !== runId) return;

    if (code) {
      showResult(code);
    } else {
      setStatus('');
      setError(
        'No QR code found in this image. Make sure the whole code is visible, in focus, and not too small — then upload it again.'
      );
    }
  }

  // ---------- camera scanning ----------

  const scanCanvas = document.createElement('canvas');
  const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });
  let stream: MediaStream | null = null;
  let rafId = 0;

  function scanLoop(): void {
    if (!stream) return;
    if (video.readyState >= 2 && video.videoWidth > 0 && jsQR && scanCtx) {
      const imageData = drawToImageData(video, video.videoWidth, video.videoHeight, MAX_CAMERA, scanCanvas, scanCtx);
      if (imageData) {
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code) {
          stopCamera();
          showResult(code);
          return;
        }
      }
    }
    rafId = requestAnimationFrame(scanLoop);
  }

  function stopCamera(): void {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      stream = null;
    }
    video.srcObject = null;
    cameraWrap.hidden = true;
    stopBtn.hidden = true;
    cameraBtn.hidden = false;
    cameraBtn.disabled = false;
  }

  async function startCamera(): Promise<void> {
    setError('');
    const media = navigator.mediaDevices;
    if (!media || typeof media.getUserMedia !== 'function') {
      setError('Camera access needs a secure (https) connection and a browser that allows it. Upload an image instead.');
      return;
    }

    cameraBtn.disabled = true;
    setStatus('Loading decoder…');
    try {
      await loadDecoder();
    } catch {
      cameraBtn.disabled = false;
      setStatus('');
      setError('Could not load the QR decoder — you may be offline. Reconnect and try again.');
      return;
    }

    setStatus('Requesting camera…');
    try {
      stream = await media.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
    } catch (err) {
      cameraBtn.disabled = false;
      setStatus('');
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
        setError('Camera permission was denied. You can still read a code by uploading an image below.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
        setError('No camera was found on this device. Upload a QR image instead.');
      } else {
        setError('Could not start the camera. Upload a QR image instead.');
      }
      return;
    }

    cameraBtn.disabled = false;
    cameraBtn.hidden = true;
    stopBtn.hidden = false;
    cameraWrap.hidden = false;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Autoplay can reject; the element is muted + playsinline so this is rare.
      // The scan loop tolerates a not-yet-playing video via the readyState check.
    }
    setStatus('Scanning… point a QR code at the camera.');
    rafId = requestAnimationFrame(scanLoop);
  }

  cameraBtn.addEventListener('click', () => void startCamera());
  stopBtn.addEventListener('click', () => {
    stopCamera();
    setStatus('Camera stopped. Upload an image or start the camera again.');
  });

  // Release the camera if the tab is hidden or the page is being unloaded.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
      stopCamera();
      setStatus('Camera stopped. Start it again when you return.');
    }
  });
  window.addEventListener('pagehide', () => stopCamera());

  // ---------- file input (drop / click / drag) ----------

  wireDropzone(
    dropzone,
    (files) => {
      const [first] = files;
      if (!first) return;
      if (stream) stopCamera();
      void decodeFile(first);
    },
    'image/*'
  );
}
