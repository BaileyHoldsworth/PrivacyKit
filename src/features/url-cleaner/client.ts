import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="url-cleaner"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#ucl-input', root)!;
  const output = $<HTMLTextAreaElement>('#ucl-output', root)!;
  const list = $<HTMLUListElement>('#ucl-list', root)!;
  const listHint = $('#ucl-list-hint', root)!;
  const countEl = $('#ucl-count', root)!;
  const statUrls = $('#ucl-stat-urls', root)!;
  const statRemoved = $('#ucl-stat-removed', root)!;
  const error = $('#ucl-error', root)!;
  const clearBtn = $<HTMLButtonElement>('#ucl-clear', root)!;
  const downloadBtn = $<HTMLButtonElement>('#ucl-download', root)!;

  /** Keep a single pass comfortably under the INP budget. */
  const MAX_INPUT_CHARS = 2_000_000;
  /** Cap DOM rows; the "Copy all" output still contains every cleaned line. */
  const MAX_RENDERED_ROWS = 300;

  /**
   * Tracking parameters, grouped by the platform that sets them. Two kinds of
   * rule: exact key names, and key prefixes (a whole family, e.g. every `utm_`
   * or `vero_` key). Matching is case-insensitive.
   *
   * A handful of trackers use short, ambiguous keys that legitimate sites also
   * use for real content (`?s=` is WordPress search; `?t=` appears widely).
   * Those are HOST-scoped so they are only stripped on the platform that owns
   * them — never guessed off an arbitrary link.
   */
  interface Group {
    readonly label: string;
    readonly exact?: readonly string[];
    readonly prefix?: readonly string[];
    /** If set, the group's keys are stripped only on these hosts (or subdomains). */
    readonly hosts?: readonly string[];
  }

  const GROUPS: readonly Group[] = [
    { label: 'UTM campaign tags', prefix: ['utm_'] },
    { label: 'Google Ads / DoubleClick', exact: ['gclid', 'gclsrc', 'dclid', 'wbraid', 'gbraid'] },
    { label: 'Facebook', exact: ['fbclid'] },
    { label: 'Microsoft / Bing Ads', exact: ['msclkid'] },
    { label: 'Mailchimp', exact: ['mc_cid', 'mc_eid'] },
    { label: 'HubSpot', exact: ['__hstc', '__hssc', '__hsfp', '_hsenc', '_hsmi'] },
    { label: 'Instagram', exact: ['igshid'] },
    { label: 'Yandex', exact: ['yclid'] },
    { label: 'WickedReports', exact: ['wickedid'] },
    { label: 'Vero', prefix: ['vero_'] },
    { label: 'Omeda / Olytics', prefix: ['oly_'] },
    { label: 'Twitter / X', exact: ['t', 's', 'ref_src', 'ref_url'], hosts: ['twitter.com', 'x.com'] },
    { label: 'Spotify / YouTube share', exact: ['si'], hosts: ['spotify.com', 'youtu.be', 'youtube.com'] },
  ];

  function hostMatches(host: string, hosts: readonly string[]): boolean {
    const h = host.toLowerCase();
    return hosts.some((base) => h === base || h.endsWith(`.${base}`));
  }

  /** Return the platform label if `key` is a tracker on `host`, else null. */
  function classify(key: string, host: string): string | null {
    const k = key.toLowerCase();
    for (const g of GROUPS) {
      if (g.hosts && !hostMatches(host, g.hosts)) continue;
      if (g.exact?.includes(k)) return g.label;
      if (g.prefix?.some((p) => k.startsWith(p))) return g.label;
    }
    return null;
  }

  interface Removed {
    readonly key: string;
    readonly value: string;
    readonly label: string;
  }
  type Result =
    | { readonly kind: 'blank' }
    | { readonly kind: 'invalid'; readonly raw: string }
    | { readonly kind: 'clean'; readonly url: string; readonly removed: Removed[] };

  const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
  /** Rough "looks like host.tld/..." test for scheme-less pastes. */
  const HOSTLIKE_RE = /^[^\s./]+\.[^\s]/;

  function parse(line: string): URL | null {
    try {
      return new URL(line);
    } catch {
      // Convenience: accept "example.com/x?utm_source=y" without a scheme.
      if (!SCHEME_RE.test(line) && HOSTLIKE_RE.test(line)) {
        try {
          return new URL(`https://${line}`);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  function cleanLine(rawLine: string): Result {
    const line = rawLine.trim();
    if (line === '') return { kind: 'blank' };

    const url = parse(line);
    if (!url) return { kind: 'invalid', raw: line };

    const removed: Removed[] = [];
    // Snapshot keys first — deleting while iterating searchParams is unsafe,
    // and a repeated key only needs classifying once.
    const keys = [...new Set(url.searchParams.keys())];
    for (const key of keys) {
      const label = classify(key, url.hostname);
      if (label === null) continue;
      for (const value of url.searchParams.getAll(key)) removed.push({ key, value, label });
      url.searchParams.delete(key);
    }

    // Only hand back the re-serialised URL when we actually changed it — that
    // way an already-clean link is echoed back byte-for-byte, without the URL
    // API's cosmetic normalisation (lower-cased host, added trailing slash…).
    const schemeAdded = !SCHEME_RE.test(line);
    const cleaned = removed.length > 0 || schemeAdded ? url.href : line;
    return { kind: 'clean', url: cleaned, removed };
  }

  function makeChip(text: string, kind: 'warn' | 'ok' | 'danger', title?: string): HTMLElement {
    const span = document.createElement('span');
    span.className = `badge badge-${kind}`;
    span.textContent = text;
    if (title) span.title = title;
    return span;
  }

  function makeRow(result: Extract<Result, { kind: 'clean' | 'invalid' }>): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'ucl-item';

    const top = document.createElement('div');
    top.className = 'ucl-item-top';
    const urlEl = document.createElement('code');
    urlEl.className = 'ucl-url';

    if (result.kind === 'invalid') {
      urlEl.textContent = result.raw;
      top.appendChild(urlEl);
      li.append(top, chipsRow([makeChip('Not a valid URL', 'danger')]));
      return li;
    }

    urlEl.textContent = result.url;
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-ghost btn-sm';
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', `Copy cleaned URL ${result.url}`);
    copyBtn.addEventListener('click', () => void copyText(result.url));
    top.append(urlEl, copyBtn);

    const chips =
      result.removed.length === 0
        ? [makeChip('Already clean', 'ok')]
        : result.removed.map((r) =>
            makeChip(r.key, 'warn', `${r.key}=${r.value} — ${r.label}`)
          );
    li.append(top, chipsRow(chips));
    return li;
  }

  function chipsRow(chips: HTMLElement[]): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'ucl-chips';
    wrap.append(...chips);
    return wrap;
  }

  function update(): void {
    const messages: string[] = [];
    let raw = input.value;
    if (raw.length > MAX_INPUT_CHARS) {
      raw = raw.slice(0, MAX_INPUT_CHARS);
      messages.push(
        `Input is longer than ${MAX_INPUT_CHARS.toLocaleString('en-AU')} characters — only the first ${MAX_INPUT_CHARS.toLocaleString('en-AU')} were processed.`
      );
    }

    const lines = raw.split('\n').filter((l) => l.trim() !== '');

    const cleanedUrls: string[] = [];
    let removedTotal = 0;
    let validCount = 0;
    let invalidCount = 0;

    list.textContent = '';
    const fragment = document.createDocumentFragment();
    let rendered = 0;

    for (const line of lines) {
      const result = cleanLine(line);
      if (result.kind === 'blank') continue;
      if (result.kind === 'clean') {
        validCount += 1;
        removedTotal += result.removed.length;
        cleanedUrls.push(result.url);
      } else {
        invalidCount += 1;
      }
      if (rendered < MAX_RENDERED_ROWS) {
        fragment.appendChild(makeRow(result));
        rendered += 1;
      }
    }
    list.appendChild(fragment);

    output.value = cleanedUrls.join('\n');
    statUrls.textContent = validCount.toLocaleString('en-AU');
    statRemoved.textContent = removedTotal.toLocaleString('en-AU');

    const total = validCount + invalidCount;
    countEl.textContent = `${total.toLocaleString('en-AU')} ${total === 1 ? 'URL' : 'URLs'}`;

    if (invalidCount > 0) {
      messages.push(
        `${invalidCount.toLocaleString('en-AU')} ${invalidCount === 1 ? 'line was' : 'lines were'} not a recognisable URL and ${invalidCount === 1 ? 'was' : 'were'} skipped.`
      );
    }
    error.textContent = messages.join(' ');

    if (total === 0) {
      listHint.textContent = 'Paste a link above to see which parameters get stripped and who set them.';
    } else if (lines.length > MAX_RENDERED_ROWS) {
      listHint.textContent = `Showing the first ${MAX_RENDERED_ROWS} of ${lines.length.toLocaleString('en-AU')} lines — “Copy all” still returns every cleaned link.`;
    } else {
      listHint.textContent = '';
    }
  }

  onInput(input, update, 150);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet', 'error');
      return;
    }
    downloadText(output.value, 'cleaned-urls.txt');
  });

  update();
}
