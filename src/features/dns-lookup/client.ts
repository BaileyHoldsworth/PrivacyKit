import { $ } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
}

type TypeOutcome =
  | { kind: 'answers'; answers: DohAnswer[] }
  | { kind: 'empty' }
  | { kind: 'nxdomain' }
  | { kind: 'error'; message: string };

const RECORD_TYPES = [
  { id: 'a', name: 'A' },
  { id: 'aaaa', name: 'AAAA' },
  { id: 'cname', name: 'CNAME' },
  { id: 'mx', name: 'MX' },
  { id: 'txt', name: 'TXT' },
  { id: 'ns', name: 'NS' },
  { id: 'soa', name: 'SOA' },
  { id: 'caa', name: 'CAA' },
] as const;

/** Numeric RR type → mnemonic, for labelling answers (CNAME chains etc.). */
const TYPE_NAMES: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  39: 'DNAME',
  46: 'RRSIG',
  65: 'HTTPS',
  257: 'CAA',
};

const IPV4_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/;
// Underscore allowed: TXT lookups like _dmarc.example.com are a primary use.
const LABEL_RE = /^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/;

/**
 * Normalise free-form input to a queryable hostname: strip protocol/path via
 * the URL constructor (which also converts IDN to punycode), lowercase, drop
 * a trailing dot, then validate label-by-label.
 */
function normaliseDomain(raw: string): { domain: string } | { error: string } {
  const s = raw.trim();
  if (!s) return { error: 'Enter a domain name, e.g. example.com.' };
  let host = '';
  try {
    const url = new URL(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s) ? s : `http://${s}`);
    host = url.hostname;
  } catch {
    return { error: 'That does not look like a valid domain name or URL.' };
  }
  host = host.replace(/\.$/, '').toLowerCase();
  if (host.startsWith('[') || IPV4_RE.test(host)) {
    return { error: 'That is an IP address — DNS lookups need a domain name like example.com.' };
  }
  if (host.length === 0 || host.length > 253) {
    return { error: 'Hostnames are limited to 253 characters in total.' };
  }
  const labels = host.split('.');
  if (labels.length < 2) {
    return { error: 'Enter a full domain including its TLD, e.g. example.com.' };
  }
  for (const label of labels) {
    if (label.length === 0 || label.length > 63 || !LABEL_RE.test(label)) {
      return { error: `"${label}" is not a valid domain label (1–63 letters, digits, hyphens).` };
    }
  }
  return { domain: host };
}

/** Join a TXT record's quoted-string chunks and unescape \" and \\. */
function decodeTxt(data: string): string {
  const parts = data.match(/"(?:[^"\\]|\\.)*"/g);
  if (!parts) return data;
  return parts.map((p) => p.slice(1, -1).replace(/\\(.)/g, '$1')).join('');
}

function mxPriority(data: string): number {
  const m = data.match(/^(\d+)\s+\S+/);
  return m ? parseInt(m[1]!, 10) : Number.MAX_SAFE_INTEGER;
}

function formatAnswerData(answer: DohAnswer): string {
  return answer.type === 16 ? decodeTxt(answer.data) : answer.data;
}

const root = document.querySelector<HTMLElement>('[data-tool="dns-lookup"]');

if (root) {
  const domainInput = $<HTMLInputElement>('#dns-domain', root)!;
  const lookupBtn = $<HTMLButtonElement>('#dns-lookup-btn', root)!;
  const copyAllBtn = $<HTMLButtonElement>('#dns-copy-all', root)!;
  const clearBtn = $<HTMLButtonElement>('#dns-clear', root)!;
  const error = $('#dns-error', root)!;
  const status = $('#dns-status', root)!;
  const results = $('#dns-results', root)!;

  const typeBoxes = RECORD_TYPES.map((t) => ({
    ...t,
    box: $<HTMLInputElement>(`#dns-type-${t.id}`, root)!,
  }));

  const PLACEHOLDER =
    'Enter a domain, tick the record types you need, and press Look up — results appear here grouped by type. Nothing is queried until you do.';

  let inFlight: AbortController | null = null;
  let copyAllText = '';

  function setBusy(busy: boolean): void {
    lookupBtn.disabled = busy;
    lookupBtn.textContent = busy ? 'Looking up…' : 'Look up records';
  }

  function showPlaceholder(text: string): void {
    results.textContent = '';
    const p = document.createElement('p');
    p.className = 'field-hint';
    p.textContent = text;
    results.appendChild(p);
  }

  function resetOutput(): void {
    copyAllText = '';
    copyAllBtn.disabled = true;
    clearBtn.disabled = true;
    status.textContent = '';
  }

  function renderGroup(typeName: string, outcome: TypeOutcome): HTMLElement {
    const group = document.createElement('div');
    group.className = 'pane-group';

    const toolbar = document.createElement('div');
    toolbar.className = 'pane-toolbar';
    const label = document.createElement('span');
    label.className = 'pane-label';
    label.textContent = `${typeName} records`;
    toolbar.appendChild(label);
    group.appendChild(toolbar);

    if (outcome.kind === 'answers') {
      const list = document.createElement('ul');
      list.className = 'result-list';
      for (const answer of outcome.answers) {
        const li = document.createElement('li');

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = TYPE_NAMES[answer.type] ?? `TYPE${answer.type}`;
        li.appendChild(badge);

        const value = document.createElement('code');
        value.style.flex = '1';
        value.textContent = formatAnswerData(answer);
        li.appendChild(value);

        const ttl = document.createElement('span');
        ttl.className = 'field-hint';
        ttl.textContent = `TTL ${answer.TTL}s`;
        li.appendChild(ttl);

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'btn btn-ghost btn-sm';
        copyBtn.textContent = 'Copy';
        copyBtn.setAttribute('aria-label', `Copy ${typeName} record value`);
        copyBtn.addEventListener('click', () => void copyText(value.textContent ?? ''));
        li.appendChild(copyBtn);

        list.appendChild(li);
      }
      group.appendChild(list);
    } else {
      const note = document.createElement('p');
      if (outcome.kind === 'error') {
        note.className = 'field-error';
        note.textContent = outcome.message;
      } else {
        note.className = 'field-hint';
        note.textContent =
          outcome.kind === 'nxdomain'
            ? 'NXDOMAIN — the domain does not exist.'
            : `No ${typeName} records found (the domain exists, but has none of this type).`;
      }
      group.appendChild(note);
    }
    return group;
  }

  async function queryType(
    domain: string,
    type: string,
    signal: AbortSignal
  ): Promise<TypeOutcome> {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`;
    const res = await fetch(url, { headers: { accept: 'application/dns-json' }, signal });
    if (!res.ok) return { kind: 'error', message: `Resolver returned HTTP ${res.status}.` };
    const json = (await res.json()) as DohResponse;
    if (json.Status === 3) return { kind: 'nxdomain' };
    if (json.Status !== 0) {
      const names: Record<number, string> = { 2: 'SERVFAIL', 4: 'NOTIMP', 5: 'REFUSED' };
      return {
        kind: 'error',
        message: `Resolver error: ${names[json.Status] ?? `RCODE ${json.Status}`}.`,
      };
    }
    const answers = json.Answer ?? [];
    if (answers.length === 0) return { kind: 'empty' };
    if (type === 'MX') {
      answers.sort((a, b) => mxPriority(a.data) - mxPriority(b.data));
    }
    return { kind: 'answers', answers };
  }

  async function lookup(): Promise<void> {
    error.textContent = '';

    const normalised = normaliseDomain(domainInput.value);
    if ('error' in normalised) {
      error.textContent = normalised.error;
      domainInput.focus();
      return;
    }
    const selected = typeBoxes.filter((t) => t.box.checked);
    if (selected.length === 0) {
      error.textContent = 'Select at least one record type.';
      return;
    }

    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);

    setBusy(true);
    resetOutput();
    status.textContent = `Querying ${normalised.domain}…`;

    const settled = await Promise.allSettled(
      selected.map((t) => queryType(normalised.domain, t.name, controller.signal))
    );
    clearTimeout(timeout);
    if (controller !== inFlight) return; // superseded by a newer lookup
    inFlight = null;
    setBusy(false);

    const outcomes: { name: string; outcome: TypeOutcome }[] = selected.map((t, i) => {
      const result = settled[i]!;
      if (result.status === 'fulfilled') return { name: t.name, outcome: result.value };
      const aborted = controller.signal.aborted;
      return {
        name: t.name,
        outcome: {
          kind: 'error',
          message: aborted ? 'Query timed out after 10 seconds.' : 'Network request failed.',
        },
      };
    });

    // Whole-lookup failure modes get one clear message instead of N copies.
    if (outcomes.every((o) => o.outcome.kind === 'error')) {
      status.textContent = '';
      error.textContent = navigator.onLine
        ? 'Could not reach Cloudflare’s DNS API (cloudflare-dns.com). It may be blocked by an extension or firewall — no records were retrieved.'
        : 'You appear to be offline — DNS lookups need a network connection to reach Cloudflare’s resolver.';
      showPlaceholder(PLACEHOLDER);
      return;
    }
    if (outcomes.every((o) => o.outcome.kind === 'nxdomain')) {
      status.textContent = '';
      error.textContent = `NXDOMAIN — ${normalised.domain} does not exist. Check the spelling; subdomains are looked up literally.`;
      showPlaceholder(PLACEHOLDER);
      return;
    }

    results.textContent = '';
    const copyLines: string[] = [`; ${normalised.domain} — via cloudflare-dns.com`];
    let recordCount = 0;
    for (const { name, outcome } of outcomes) {
      results.appendChild(renderGroup(name, outcome));
      if (outcome.kind === 'answers') {
        recordCount += outcome.answers.length;
        for (const a of outcome.answers) {
          const rr = TYPE_NAMES[a.type] ?? `TYPE${a.type}`;
          copyLines.push(`${a.name}\t${a.TTL}\t${rr}\t${formatAnswerData(a)}`);
        }
      }
    }

    copyAllText = copyLines.join('\n');
    copyAllBtn.disabled = recordCount === 0;
    clearBtn.disabled = false;
    status.textContent = `${recordCount} record${recordCount === 1 ? '' : 's'} for ${normalised.domain}`;
  }

  lookupBtn.addEventListener('click', () => void lookup());
  // Explicit action only — Enter triggers a lookup, plain typing never does.
  domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void lookup();
    }
  });
  domainInput.addEventListener('input', () => {
    error.textContent = '';
  });

  copyAllBtn.addEventListener('click', () => void copyText(copyAllText));
  clearBtn.addEventListener('click', () => {
    inFlight?.abort();
    inFlight = null;
    setBusy(false);
    resetOutput();
    error.textContent = '';
    showPlaceholder(PLACEHOLDER);
    domainInput.focus();
  });

  lookupBtn.disabled = false;
}
