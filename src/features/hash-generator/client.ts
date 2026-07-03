import { $, onInput, wireDropzone } from '../../lib/dom';
import { bytesToHex, formatBytes } from '../../lib/bytes';
import { showToast } from '../../lib/toast';

type HashWasm = typeof import('hash-wasm');
type Hasher = Awaited<ReturnType<HashWasm['createSHA256']>>;

interface AlgoSpec {
  /** Key used in element ids: #hash-alg-<key>, #hash-row-<key>, #hash-out-<key> */
  key: string;
  /** WebCrypto identifier when crypto.subtle can do it natively (text mode). */
  webCrypto?: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
  /** Incremental hasher factory (file streaming, and text fallback). */
  create: (hw: HashWasm) => Promise<Hasher>;
  /** One-shot hash-wasm call for text mode when WebCrypto can't help. */
  oneShot: (hw: HashWasm, data: Uint8Array) => Promise<string>;
}

const ALGOS: AlgoSpec[] = [
  { key: 'md5', create: (hw) => hw.createMD5(), oneShot: (hw, d) => hw.md5(d) },
  { key: 'sha1', webCrypto: 'SHA-1', create: (hw) => hw.createSHA1(), oneShot: (hw, d) => hw.sha1(d) },
  { key: 'sha256', webCrypto: 'SHA-256', create: (hw) => hw.createSHA256(), oneShot: (hw, d) => hw.sha256(d) },
  { key: 'sha384', webCrypto: 'SHA-384', create: (hw) => hw.createSHA384(), oneShot: (hw, d) => hw.sha384(d) },
  { key: 'sha512', webCrypto: 'SHA-512', create: (hw) => hw.createSHA512(), oneShot: (hw, d) => hw.sha512(d) },
  { key: 'sha3-256', create: (hw) => hw.createSHA3(256), oneShot: (hw, d) => hw.sha3(d, 256) },
  { key: 'sha3-512', create: (hw) => hw.createSHA3(512), oneShot: (hw, d) => hw.sha3(d, 512) },
  { key: 'crc32', create: (hw) => hw.createCRC32(), oneShot: (hw, d) => hw.crc32(d) },
];

const PROGRESS_THRESHOLD = 50 * 1024 * 1024; // show % for files over 50 MB

const root = document.querySelector<HTMLElement>('[data-tool="hash-generator"]');

if (root) {
  const tabText = $('#hash-tab-text', root)!;
  const tabFile = $('#hash-tab-file', root)!;
  const panelText = $('#hash-panel-text', root)!;
  const panelFile = $('#hash-panel-file', root)!;
  const textInput = $<HTMLTextAreaElement>('#hash-text', root)!;
  const textInfo = $('#hash-text-info', root)!;
  const dropzone = $('#hash-dropzone', root)!;
  const fileInfo = $('#hash-file-info', root)!;
  const upperBox = $<HTMLInputElement>('#hash-uppercase', root)!;
  const error = $('#hash-error', root)!;
  const clearBtn = $('#hash-clear', root)!;

  const checkboxOf = (key: string) => $<HTMLInputElement>(`#hash-alg-${key}`, root)!;
  const rowOf = (key: string) => $(`#hash-row-${key}`, root)!;
  const outOf = (key: string) => $(`#hash-out-${key}`, root)!;

  let mode: 'text' | 'file' = 'text';
  let currentFile: File | null = null;
  /** Lowercase hex results for the CURRENT input; cleared whenever it changes. */
  const results = new Map<string, string>();
  /** Increments to cancel in-flight async work when the input changes. */
  let runId = 0;

  let hwPromise: Promise<HashWasm> | null = null;
  const loadHashWasm = () => (hwPromise ??= import('hash-wasm'));

  const subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle;

  // ---------- Rendering ----------

  function renderRow(key: string): void {
    const hex = results.get(key);
    outOf(key).textContent = hex ? (upperBox.checked ? hex.toUpperCase() : hex) : '–';
  }

  function renderAll(): void {
    for (const algo of ALGOS) {
      rowOf(algo.key).hidden = !checkboxOf(algo.key).checked;
      renderRow(algo.key);
    }
  }

  function hasInput(): boolean {
    return mode === 'text' ? textInput.value.length > 0 : currentFile !== null;
  }

  // ---------- Computation ----------

  async function hashText(missing: AlgoSpec[], id: number): Promise<void> {
    const data = new TextEncoder().encode(textInput.value);
    textInfo.textContent = `${formatBytes(data.length)} of UTF-8`;
    const needWasm = missing.some((a) => !a.webCrypto || !subtle);
    const hw = needWasm ? await loadHashWasm() : null;
    if (id !== runId) return;
    for (const algo of missing) {
      const hex =
        algo.webCrypto && subtle
          ? bytesToHex(new Uint8Array(await subtle.digest(algo.webCrypto, data)))
          : await algo.oneShot(hw!, data);
      if (id !== runId) return;
      results.set(algo.key, hex);
      renderRow(algo.key);
    }
  }

  async function hashFile(file: File, missing: AlgoSpec[], id: number): Promise<void> {
    const baseInfo = `${file.name} · ${formatBytes(file.size)}`;
    fileInfo.textContent = baseInfo;
    const hw = await loadHashWasm();
    if (id !== runId) return;
    const hashers = await Promise.all(missing.map((a) => a.create(hw)));
    if (id !== runId) return;
    for (const h of hashers) h.init();

    const showProgress = file.size > PROGRESS_THRESHOLD;
    const reader = file.stream().getReader();
    let done = 0;
    let lastPct = -1;
    for (;;) {
      const chunk = await reader.read();
      if (id !== runId) {
        void reader.cancel();
        return;
      }
      if (chunk.done) break;
      for (const h of hashers) h.update(chunk.value);
      done += chunk.value.length;
      if (showProgress) {
        const pct = Math.floor((done / file.size) * 100);
        if (pct !== lastPct) {
          lastPct = pct;
          fileInfo.textContent = `Hashing ${file.name} — ${pct}% of ${formatBytes(file.size)}`;
        }
      }
    }
    missing.forEach((algo, i) => {
      results.set(algo.key, hashers[i]!.digest('hex'));
      renderRow(algo.key);
    });
    fileInfo.textContent =
      file.size === 0 ? `${baseInfo} — the file is empty; these are the digests of zero bytes` : baseInfo;
  }

  /** Compute any checked algorithms that don't have a cached result yet. */
  function refresh(): void {
    const id = ++runId;
    error.textContent = '';
    renderAll();

    if (!hasInput()) {
      if (mode === 'text') textInfo.textContent = '';
      return;
    }
    const checked = ALGOS.filter((a) => checkboxOf(a.key).checked);
    if (checked.length === 0) {
      error.textContent = 'Select at least one algorithm.';
      return;
    }
    const missing = checked.filter((a) => !results.has(a.key));
    if (missing.length === 0) return;

    const task =
      mode === 'text' ? hashText(missing, id) : hashFile(currentFile!, missing, id);
    task.catch(() => {
      if (id !== runId) return;
      error.textContent =
        mode === 'text'
          ? 'Hashing failed — the hashing library could not be loaded. Check your connection and try again.'
          : `Could not read "${currentFile?.name ?? 'the file'}" — it may have moved or changed since you selected it. Re-select it and try again.`;
    });
  }

  function inputChanged(): void {
    results.clear();
    refresh();
  }

  // ---------- Wiring ----------

  function setMode(next: 'text' | 'file'): void {
    if (mode === next) return;
    mode = next;
    const textActive = next === 'text';
    tabText.classList.toggle('btn-primary', textActive);
    tabText.setAttribute('aria-pressed', String(textActive));
    tabFile.classList.toggle('btn-primary', !textActive);
    tabFile.setAttribute('aria-pressed', String(!textActive));
    panelText.hidden = !textActive;
    panelFile.hidden = textActive;
    inputChanged();
  }

  tabText.addEventListener('click', () => setMode('text'));
  tabFile.addEventListener('click', () => setMode('file'));

  // 200ms debounce: a 10 MB paste re-encodes and re-hashes on every keystroke otherwise.
  onInput(textInput, inputChanged, 200);

  wireDropzone(dropzone, (files) => {
    const file = files[0];
    if (!file) return;
    if (files.length > 1) showToast('Multiple files received — hashing the first one only');
    currentFile = file;
    inputChanged();
  });

  for (const algo of ALGOS) {
    checkboxOf(algo.key).addEventListener('change', refresh);
  }

  upperBox.addEventListener('change', renderAll);

  clearBtn.addEventListener('click', () => {
    runId++;
    textInput.value = '';
    currentFile = null;
    results.clear();
    textInfo.textContent = '';
    fileInfo.textContent = '';
    error.textContent = '';
    renderAll();
  });
}
