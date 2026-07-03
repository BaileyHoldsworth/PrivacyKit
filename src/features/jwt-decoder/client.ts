import { $, onInput } from '../../lib/dom';
import { base64ToBytes, bytesToBase64, formatBytes, textToBase64 } from '../../lib/bytes';
import { randomBytes } from '../../lib/random';

const root = document.querySelector<HTMLElement>('[data-tool="jwt-decoder"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#jwt-input', root)!;
  const error = $('#jwt-error', root)!;
  const algEl = $('#jwt-alg', root)!;
  const statusEl = $('#jwt-status', root)!;
  const sigInfoEl = $('#jwt-sig-info', root)!;
  const claimsList = $<HTMLUListElement>('#jwt-claims', root)!;
  const claimsEmpty = $('#jwt-claims-empty', root)!;
  const headerOut = $<HTMLTextAreaElement>('#jwt-header', root)!;
  const payloadOut = $<HTMLTextAreaElement>('#jwt-payload', root)!;
  const signatureOut = $<HTMLInputElement>('#jwt-signature', root)!;
  const sampleBtn = $<HTMLButtonElement>('#jwt-sample', root)!;
  const clearBtn = $<HTMLButtonElement>('#jwt-clear', root)!;

  const SEGMENT_NAMES = ['header (segment 1)', 'payload (segment 2)', 'signature (segment 3)'] as const;
  const NOT_B64URL = /[^A-Za-z0-9_\-+/=]/;
  // No real-world JWT approaches this; larger pastes are almost certainly not tokens.
  const MAX_INPUT = 262_144;
  // NumericDate is seconds; values this large are almost certainly milliseconds.
  const LIKELY_MILLISECONDS = 1e12;

  type Claims = Record<string, unknown>;
  type SegmentResult = { ok: true; value: Claims } | { ok: false; error: string };

  /** exp/nbf/iat currently on display; the 1s ticker re-renders these. */
  interface LiveClaim {
    claim: 'exp' | 'nbf' | 'iat';
    seconds: number;
    badge: HTMLSpanElement;
  }
  let liveClaims: LiveClaim[] = [];
  let ticker: ReturnType<typeof setInterval> | undefined;
  let statusText = '';

  function normaliseToken(raw: string): string {
    let t = raw.trim();
    // Tolerate a pasted Authorization header and surrounding quotes from JSON/logs.
    t = t.replace(/^(?:Authorization:\s*)?Bearer\s+/i, '');
    if (/^["'][^]*["']$/.test(t)) t = t.slice(1, -1);
    // JWTs contain no whitespace; drop line breaks added by mail/chat clients.
    return t.replace(/\s+/g, '');
  }

  function decodeJsonSegment(seg: string, which: 0 | 1): SegmentResult {
    const name = SEGMENT_NAMES[which];
    if (seg.length === 0) return { ok: false, error: `The ${name} is empty.` };
    const bad = seg.match(NOT_B64URL);
    if (bad) {
      return { ok: false, error: `The ${name} contains “${bad[0]}”, which is not a Base64URL character.` };
    }
    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(seg);
    } catch {
      return { ok: false, error: `The ${name} is not valid Base64URL — the token may be truncated.` };
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return { ok: false, error: `The ${name} decodes, but not to UTF-8 text — this is not a standard JWS segment.` };
    }
    try {
      const value: unknown = JSON.parse(text);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { ok: false, error: `The ${name} decodes to JSON, but not to an object as RFC 7519 requires.` };
      }
      return { ok: true, value: value as Claims };
    } catch {
      return { ok: false, error: `The ${name} decodes to text, but the text is not valid JSON.` };
    }
  }

  function formatRelative(deltaSeconds: number): string {
    const abs = Math.abs(Math.round(deltaSeconds));
    const units: [number, string][] = [
      [31_557_600, 'y'],
      [86_400, 'd'],
      [3_600, 'h'],
      [60, 'm'],
      [1, 's'],
    ];
    const parts: string[] = [];
    let rest = abs;
    for (const [size, label] of units) {
      if (rest >= size || (label === 's' && parts.length === 0)) {
        parts.push(`${Math.floor(rest / size)}${label}`);
        rest %= size;
      }
      if (parts.length === 2) break;
    }
    return deltaSeconds >= 0 ? `in ${parts.join(' ')}` : `${parts.join(' ')} ago`;
  }

  function setBadge(el: HTMLElement, kind: '' | 'ok' | 'warn' | 'danger', text: string): void {
    el.className = kind ? `badge badge-${kind}` : 'badge';
    el.textContent = text;
  }

  function renderClaimBadge(entry: LiveClaim, nowSec: number): void {
    const delta = entry.seconds - nowSec;
    const rel = formatRelative(delta);
    switch (entry.claim) {
      case 'exp':
        if (delta <= 0) setBadge(entry.badge, 'danger', `Expired · ${rel}`);
        else setBadge(entry.badge, 'ok', `Not expired · ${rel}`);
        break;
      case 'nbf':
        if (delta > 0) setBadge(entry.badge, 'danger', `Not yet valid · ${rel}`);
        else setBadge(entry.badge, 'ok', `Active · ${rel}`);
        break;
      case 'iat':
        if (delta > 60) setBadge(entry.badge, 'warn', `Issued in the future · ${rel}`);
        else setBadge(entry.badge, '', `Issued · ${rel}`);
        break;
    }
  }

  /** Overall stat badge; textContent only rewritten on change so aria-live stays quiet. */
  function renderStatus(nowSec: number): void {
    const exp = liveClaims.find((c) => c.claim === 'exp');
    const nbf = liveClaims.find((c) => c.claim === 'nbf');
    let kind: '' | 'ok' | 'danger' = '';
    let text = 'No expiry (exp) claim';
    if (nbf && nowSec < nbf.seconds) {
      kind = 'danger';
      text = 'Not yet valid';
    } else if (exp && nowSec >= exp.seconds) {
      kind = 'danger';
      text = 'Expired';
    } else if (exp) {
      kind = 'ok';
      text = 'Not expired';
    }
    if (text !== statusText) {
      statusText = text;
      statusEl.replaceChildren();
      const badge = document.createElement('span');
      setBadge(badge, kind, text);
      statusEl.appendChild(badge);
    }
  }

  function tick(): void {
    const nowSec = Date.now() / 1000;
    for (const entry of liveClaims) renderClaimBadge(entry, nowSec);
    renderStatus(nowSec);
  }

  function stopTicker(): void {
    if (ticker !== undefined) {
      clearInterval(ticker);
      ticker = undefined;
    }
  }

  function buildClaimsList(payload: Claims): void {
    liveClaims = [];
    const items: HTMLLIElement[] = [];
    const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' });

    for (const claim of ['exp', 'nbf', 'iat'] as const) {
      if (!(claim in payload)) continue;
      const value = payload[claim];
      const li = document.createElement('li');
      const label = document.createElement('span');
      const badge = document.createElement('span');
      li.append(label, badge);
      items.push(li);

      if (typeof value !== 'number' || !Number.isFinite(value)) {
        label.textContent = `${claim} · ${JSON.stringify(value)}`;
        setBadge(badge, 'warn', 'Not a NumericDate (should be seconds since the Unix epoch)');
        continue;
      }
      const date = new Date(value * 1000);
      if (Number.isNaN(date.getTime()) || value >= LIKELY_MILLISECONDS) {
        label.textContent = `${claim} · ${value}`;
        setBadge(badge, 'warn', 'Looks like milliseconds — NumericDate is seconds');
        continue;
      }
      label.textContent = `${claim} · ${dateFmt.format(date)}`;
      label.title = date.toISOString();
      const entry: LiveClaim = { claim, seconds: value, badge };
      liveClaims.push(entry);
    }

    if (items.length === 0) {
      claimsEmpty.textContent = 'This token carries no exp, nbf or iat claims.';
      claimsList.replaceChildren(claimsEmpty);
    } else {
      claimsList.replaceChildren(...items);
    }

    tick();
    stopTicker();
    if (liveClaims.length > 0) ticker = setInterval(tick, 1000);
  }

  function reset(message = ''): void {
    stopTicker();
    liveClaims = [];
    statusText = '';
    error.textContent = message;
    headerOut.value = '';
    payloadOut.value = '';
    signatureOut.value = '';
    algEl.textContent = '–';
    sigInfoEl.textContent = '–';
    statusEl.replaceChildren();
    const badge = document.createElement('span');
    setBadge(badge, '', message ? 'Invalid token' : 'No token');
    statusEl.appendChild(badge);
    claimsEmpty.textContent = 'Registered time claims appear here as readable dates with live expiry badges.';
    claimsList.replaceChildren(claimsEmpty);
  }

  function decode(): void {
    const raw = input.value;
    if (raw.trim() === '') {
      reset();
      return;
    }
    if (raw.length > MAX_INPUT) {
      reset(
        `That is ${raw.length.toLocaleString()} characters — no JWT is anywhere near this large. Paste a single token (three dot-separated Base64URL segments).`
      );
      return;
    }

    const token = normaliseToken(raw);
    const parts = token.split('.');
    if (parts.length === 5) {
      reset(
        'This token has five segments, which makes it a JWE (encrypted token). Its payload cannot be read without the decryption key — this tool decodes signed JWS tokens only.'
      );
      return;
    }
    if (parts.length !== 3) {
      const found = parts.length === 1 ? 'no dots' : `${parts.length} segments`;
      reset(
        `A JWT has exactly three dot-separated segments (header.payload.signature); this input has ${found}. Check that the whole token was copied.`
      );
      return;
    }

    const header = decodeJsonSegment(parts[0]!, 0);
    if (!header.ok) {
      reset(header.error);
      return;
    }
    const payload = decodeJsonSegment(parts[1]!, 1);
    if (!payload.ok) {
      reset(payload.error);
      return;
    }

    const sig = parts[2]!;
    let sigBytes: Uint8Array | null = null;
    if (sig.length > 0) {
      if (NOT_B64URL.test(sig)) {
        reset('The signature (segment 3) contains characters outside the Base64URL alphabet.');
        return;
      }
      try {
        sigBytes = base64ToBytes(sig);
      } catch {
        reset('The signature (segment 3) is not valid Base64URL — the token may be truncated.');
        return;
      }
    }

    error.textContent = '';
    headerOut.value = JSON.stringify(header.value, null, 2);
    payloadOut.value = JSON.stringify(payload.value, null, 2);
    signatureOut.value = sig;

    const alg = header.value['alg'];
    algEl.textContent = typeof alg === 'string' && alg ? alg : '(missing)';
    if (sigBytes === null) {
      sigInfoEl.textContent = alg === 'none' ? 'empty (unsecured JWT)' : 'empty — but alg is not "none"';
    } else {
      sigInfoEl.textContent = `${formatBytes(sigBytes.length)} — not verified`;
    }

    buildClaimsList(payload.value);
  }

  /** Built locally: real structure, honest random-noise signature (never verified anyway). */
  function sampleToken(): string {
    const nowSec = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      iss: 'https://auth.sample.invalid',
      sub: 'user_4821',
      aud: 'privacykit-demo',
      iat: nowSec - 120,
      nbf: nowSec - 120,
      exp: nowSec + 900,
      scope: 'reports:read',
    };
    const signature = bytesToBase64(randomBytes(32), true);
    return `${textToBase64(JSON.stringify(header), true)}.${textToBase64(JSON.stringify(payload), true)}.${signature}`;
  }

  onInput(input, decode, 150);

  sampleBtn.addEventListener('click', () => {
    input.value = sampleToken();
    decode();
    input.focus();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    reset();
    input.focus();
  });

  decode();
}
