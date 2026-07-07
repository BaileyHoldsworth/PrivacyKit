import { $ } from '../../lib/dom';
import { randomBytes } from '../../lib/random';

// bcryptjs is pure JS and only needed once the user acts, so it is lazy-loaded
// on first hash/verify to keep the initial tool bundle small.
type BcryptModule = typeof import('bcryptjs');
type Bcrypt = BcryptModule['default'];

let bcryptPromise: Promise<BcryptModule> | null = null;
const loadBcrypt = (): Promise<BcryptModule> => (bcryptPromise ??= import('bcryptjs'));

// $2a$ / $2b$ / $2y$, a 2-digit cost, then 53 chars of bcrypt-base64
// (22-char salt + 31-char digest). 60 characters in total.
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const MAX_BYTES = 72; // bcrypt ignores input past 72 bytes

const root = document.querySelector<HTMLElement>('[data-tool="bcrypt-generator"]');

if (root) {
  // Tabs
  const tabHash = $<HTMLButtonElement>('#bcr-tab-hash', root)!;
  const tabVerify = $<HTMLButtonElement>('#bcr-tab-verify', root)!;
  const panelHash = $('#bcr-panel-hash', root)!;
  const panelVerify = $('#bcr-panel-verify', root)!;

  // Hash mode
  const hashInput = $<HTMLInputElement>('#bcr-hash-input', root)!;
  const costRange = $<HTMLInputElement>('#bcr-cost', root)!;
  const costValue = $('#bcr-cost-value', root)!;
  const costRounds = $('#bcr-cost-rounds', root)!;
  const hashWarn = $('#bcr-hash-warn', root)!;
  const hashError = $('#bcr-hash-error', root)!;
  const hashBtn = $<HTMLButtonElement>('#bcr-hash-btn', root)!;
  const hashOutput = $<HTMLInputElement>('#bcr-hash-output', root)!;
  const hashStatus = $('#bcr-hash-status', root)!;

  // Verify mode
  const verifyInput = $<HTMLInputElement>('#bcr-verify-input', root)!;
  const verifyHashInput = $<HTMLInputElement>('#bcr-verify-hash', root)!;
  const verifyError = $('#bcr-verify-error', root)!;
  const verifyBtn = $<HTMLButtonElement>('#bcr-verify-btn', root)!;
  const verifyResult = $('#bcr-verify-result', root)!;

  const utf8Length = (s: string): number => new TextEncoder().encode(s).length;
  const fmt = (n: number): string => n.toLocaleString('en-US');

  // ---------- Tabs ----------

  function setMode(next: 'hash' | 'verify'): void {
    const hashActive = next === 'hash';
    tabHash.classList.toggle('btn-primary', hashActive);
    tabHash.setAttribute('aria-pressed', String(hashActive));
    tabVerify.classList.toggle('btn-primary', !hashActive);
    tabVerify.setAttribute('aria-pressed', String(!hashActive));
    panelHash.hidden = !hashActive;
    panelVerify.hidden = hashActive;
  }

  tabHash.addEventListener('click', () => setMode('hash'));
  tabVerify.addEventListener('click', () => setMode('verify'));

  // ---------- Hash mode ----------

  function updateCost(): void {
    const cost = parseInt(costRange.value, 10);
    costValue.textContent = String(cost);
    costRounds.textContent = fmt(2 ** cost);
  }

  function updateWarn(): void {
    const n = utf8Length(hashInput.value);
    hashWarn.textContent =
      n > MAX_BYTES
        ? `Only the first ${MAX_BYTES} bytes are hashed — this input is ${fmt(n)} bytes, so the rest is ignored.`
        : '';
  }

  /**
   * Build a bcrypt salt from cryptographically secure bytes sourced through
   * src/lib/random, so all randomness the tool introduces goes through one
   * audited path. Format: $2b$<2-digit cost>$<22-char bcrypt-base64 of 16 bytes>.
   */
  function buildSalt(bcrypt: Bcrypt, cost: number): string {
    const bytes = randomBytes(16);
    return `$2b$${String(cost).padStart(2, '0')}$${bcrypt.encodeBase64(bytes, 16)}`;
  }

  /** Promise wrapper around bcrypt's callback form so we get progress updates. */
  function bcryptHash(
    bcrypt: Bcrypt,
    password: string,
    salt: string,
    onProgress: (pct: number) => void
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      bcrypt.hash(
        password,
        salt,
        (err, result) => {
          if (err || typeof result !== 'string') reject(err ?? new Error('bcrypt hash failed'));
          else resolve(result);
        },
        onProgress
      );
    });
  }

  let hashing = false;

  async function doHash(): Promise<void> {
    if (hashing) return;
    hashError.textContent = '';
    const password = hashInput.value;
    if (!password) {
      hashError.textContent = 'Enter a string to hash.';
      hashOutput.value = '';
      hashStatus.textContent = '';
      return;
    }
    const cost = parseInt(costRange.value, 10);

    hashing = true;
    hashBtn.disabled = true;
    hashOutput.value = '';
    hashStatus.textContent = 'Hashing…';

    try {
      const bcrypt = (await loadBcrypt()).default;
      const salt = buildSalt(bcrypt, cost);
      const started = performance.now();
      const digest = await bcryptHash(bcrypt, password, salt, (pct) => {
        hashStatus.textContent = `Hashing… ${Math.round(pct * 100)}%`;
      });
      const ms = Math.round(performance.now() - started);
      hashOutput.value = digest;
      hashStatus.textContent = `Hashed at cost ${cost} in ${fmt(ms)} ms`;
    } catch {
      hashError.textContent =
        'Could not compute the hash — the bcrypt library failed to load. Check your connection and try again.';
      hashStatus.textContent = '';
    } finally {
      hashing = false;
      hashBtn.disabled = false;
    }
  }

  hashBtn.addEventListener('click', () => void doHash());
  hashInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void doHash();
    }
  });
  hashInput.addEventListener('input', updateWarn);
  costRange.addEventListener('input', updateCost);

  // ---------- Verify mode ----------

  function showHint(text: string): void {
    const hint = document.createElement('span');
    hint.className = 'field-hint';
    hint.textContent = text;
    verifyResult.replaceChildren(hint);
  }

  function renderResult(match: boolean, cost: number): void {
    const badge = document.createElement('span');
    badge.className = match ? 'badge badge-ok' : 'badge badge-danger';
    badge.textContent = match ? 'Match' : 'No match';

    const detail = document.createElement('span');
    detail.className = 'field-hint';
    detail.style.marginLeft = 'var(--s-3)';
    detail.textContent = match
      ? `The string matches this hash (cost ${cost}).`
      : `The string does not match this hash (cost ${cost}).`;

    verifyResult.replaceChildren(badge, detail);
  }

  let verifying = false;

  async function doVerify(): Promise<void> {
    if (verifying) return;
    verifyError.textContent = '';
    const password = verifyInput.value;
    const hash = verifyHashInput.value.trim();

    if (!password) {
      verifyError.textContent = 'Enter the plaintext string to test.';
      showHint('Enter a string and a bcrypt hash, then press Verify.');
      return;
    }
    if (!hash) {
      verifyError.textContent = 'Paste the bcrypt hash to check against.';
      showHint('Enter a string and a bcrypt hash, then press Verify.');
      return;
    }
    if (!BCRYPT_RE.test(hash)) {
      verifyError.textContent =
        'That does not look like a bcrypt hash — it should start with $2a$, $2b$ or $2y$ and be 60 characters long.';
      showHint('Enter a string and a bcrypt hash, then press Verify.');
      return;
    }

    verifying = true;
    verifyBtn.disabled = true;
    showHint('Checking…');

    try {
      const bcrypt = (await loadBcrypt()).default;
      const match = await bcrypt.compare(password, hash);
      renderResult(match, bcrypt.getRounds(hash));
    } catch {
      verifyError.textContent =
        'Could not run the check — the bcrypt library failed to load. Check your connection and try again.';
      showHint('Enter a string and a bcrypt hash, then press Verify.');
    } finally {
      verifying = false;
      verifyBtn.disabled = false;
    }
  }

  verifyBtn.addEventListener('click', () => void doVerify());
  for (const el of [verifyInput, verifyHashInput]) {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void doVerify();
      }
    });
  }

  // ---------- Init ----------

  updateCost();
  updateWarn();
}
