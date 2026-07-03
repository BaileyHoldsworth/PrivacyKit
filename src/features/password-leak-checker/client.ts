import { $ } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="password-leak-checker"]');

if (root) {
  const passwordInput = $<HTMLInputElement>('#plc-password', root)!;
  const toggleBtn = $<HTMLButtonElement>('#plc-toggle', root)!;
  const checkBtn = $<HTMLButtonElement>('#plc-check', root)!;
  const status = $('#plc-status', root)!;
  const error = $('#plc-error', root)!;
  const result = $('#plc-result', root)!;

  // A real password is never megabytes long; a huge paste is almost certainly a
  // mistake, and hashing it would just stall the UI. HIBP itself accepts any
  // length, so this cap is purely a sanity guard.
  const MAX_LEN = 1024;
  const PLACEHOLDER =
    'Enter a password and press Check. Only a 5-character hash prefix is ever transmitted; the match against your full hash happens here in your browser.';

  const nf = new Intl.NumberFormat('en-AU');
  let inFlight: AbortController | null = null;

  function setBusy(busy: boolean): void {
    checkBtn.disabled = busy;
    checkBtn.textContent = busy ? 'Checking…' : 'Check this password';
  }

  function showPlaceholder(text: string): void {
    result.textContent = '';
    const p = document.createElement('p');
    p.className = 'field-hint';
    p.textContent = text;
    result.appendChild(p);
  }

  /** SHA-1 of the UTF-8 password, as an uppercase hex string. */
  async function sha1HexUpper(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-1', data);
    let hex = '';
    for (const b of new Uint8Array(digest)) hex += b.toString(16).padStart(2, '0');
    return hex.toUpperCase();
  }

  /**
   * Scan a range-API response body for our 35-char suffix. Each line is
   * "SUFFIX:COUNT" (CRLF-separated). With Add-Padding some lines are decoys with
   * a count of 0, so a match only counts when the count is above zero.
   */
  function countForSuffix(body: string, suffix: string): number {
    for (const line of body.split('\n')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      if (line.slice(0, idx).trim() === suffix) {
        const count = parseInt(line.slice(idx + 1).replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(count) ? count : 0;
      }
    }
    return 0;
  }

  function renderFound(count: number): void {
    result.textContent = '';

    const badge = document.createElement('span');
    badge.className = 'badge badge-danger';
    badge.textContent = 'Found in known breaches';
    result.appendChild(badge);

    const lead = document.createElement('p');
    lead.style.marginTop = 'var(--s-2)';
    lead.innerHTML =
      `This password has appeared <strong>${nf.format(count)}</strong> ` +
      `time${count === 1 ? '' : 's'} in data breaches indexed by Have I Been Pwned. ` +
      'Attackers load exactly these lists into credential-stuffing tools, so treat it as compromised.';
    result.appendChild(lead);

    const advice = document.createElement('p');
    advice.style.marginTop = 'var(--s-2)';
    advice.innerHTML =
      'Stop using it everywhere, and replace it with a unique one per account. The ' +
      '<a href="/tools/password-generator/">password generator</a> creates a strong random password locally.';
    result.appendChild(advice);
  }

  function renderSafe(): void {
    result.textContent = '';

    const badge = document.createElement('span');
    badge.className = 'badge badge-ok';
    badge.textContent = 'Not found in known breaches';
    result.appendChild(badge);

    const lead = document.createElement('p');
    lead.style.marginTop = 'var(--s-2)';
    lead.textContent =
      'This password is not among the leaked hashes Have I Been Pwned has indexed. ' +
      'That is good, but it is not proof of strength: a new weak password can be absent ' +
      'from every breach list and still be guessed quickly. Length and randomness are what ' +
      'actually make a password hard to crack.';
    result.appendChild(lead);
  }

  async function check(): Promise<void> {
    error.textContent = '';

    const password = passwordInput.value;
    if (password.length === 0) {
      error.textContent = 'Enter a password to check.';
      passwordInput.focus();
      return;
    }
    if (password.length > MAX_LEN) {
      error.textContent = `That is longer than any real password (limit ${MAX_LEN} characters). Trim it and try again.`;
      return;
    }

    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);

    setBusy(true);
    status.textContent = 'Hashing locally…';

    let hex: string;
    try {
      hex = await sha1HexUpper(password);
    } catch {
      clearTimeout(timeout);
      if (controller !== inFlight) return;
      inFlight = null;
      setBusy(false);
      status.textContent = '';
      error.textContent = 'Could not compute a SHA-1 hash in this browser.';
      return;
    }

    const prefix = hex.slice(0, 5);
    const suffix = hex.slice(5);
    status.textContent = `Querying Have I Been Pwned with prefix ${prefix}…`;

    try {
      // k-anonymity: send only the 5-char prefix; Add-Padding hides the real
      // bucket size so response length can't leak whether it was a hit.
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (controller !== inFlight) return; // superseded by a newer check
      inFlight = null;

      if (!res.ok) {
        setBusy(false);
        status.textContent = '';
        error.textContent = `Have I Been Pwned returned HTTP ${res.status}. Try again in a moment.`;
        return;
      }

      const body = await res.text();
      const count = countForSuffix(body, suffix);
      setBusy(false);
      status.textContent = '';

      if (count > 0) renderFound(count);
      else renderSafe();
    } catch {
      clearTimeout(timeout);
      if (controller !== inFlight) return;
      inFlight = null;
      setBusy(false);
      status.textContent = '';
      const aborted = controller.signal.aborted;
      error.textContent = aborted
        ? 'The request timed out after 10 seconds. Check your connection and try again.'
        : navigator.onLine
          ? 'Could not reach the Have I Been Pwned API (api.pwnedpasswords.com). It may be blocked by an extension or firewall.'
          : 'You appear to be offline — checking a password against the breach database needs a network connection.';
    }
  }

  toggleBtn.addEventListener('click', () => {
    const reveal = passwordInput.type === 'password';
    passwordInput.type = reveal ? 'text' : 'password';
    toggleBtn.textContent = reveal ? 'Hide' : 'Show';
    toggleBtn.setAttribute('aria-pressed', String(reveal));
    toggleBtn.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
    passwordInput.focus();
  });

  // Explicit action only — each check is a network call, so plain typing never
  // fires one. Enter in the field submits; typing just clears a stale error.
  checkBtn.addEventListener('click', () => void check());
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void check();
    }
  });
  passwordInput.addEventListener('input', () => {
    error.textContent = '';
  });

  showPlaceholder(PLACEHOLDER);
  checkBtn.disabled = false;
}
