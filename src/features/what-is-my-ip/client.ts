import { $ } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';

const root = document.querySelector<HTMLElement>('[data-tool="what-is-my-ip"]');

if (root) {
  const v4El = $('#ip-v4', root)!;
  const v6El = $('#ip-v6', root)!;
  const copyV4 = $<HTMLButtonElement>('#ip-copy-v4', root)!;
  const copyV6 = $<HTMLButtonElement>('#ip-copy-v6', root)!;
  const refreshBtn = $<HTMLButtonElement>('#ip-refresh', root)!;
  const errorEl = $('#ip-error', root)!;
  const tlsEl = $('#ip-tls', root)!;
  const warpEl = $('#ip-warp', root)!;
  const sourceEl = $('#ip-source', root)!;

  /** The confirmed addresses (empty string = none found). Copy buttons read these. */
  let ipv4 = '';
  let ipv6 = '';

  /** Parse Cloudflare's key=value trace body into a record. */
  function parseTrace(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) out[line.slice(0, eq)] = line.slice(eq + 1).trim();
    }
    return out;
  }

  function isIPv4(s: string): boolean {
    const parts = s.split('.');
    return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
  }

  function isIPv6(s: string): boolean {
    if (!s.includes(':') || !/^[0-9a-fA-F:.]+$/.test(s)) return false;
    const halves = s.split('::');
    if (halves.length > 2) return false;
    const groups = halves.flatMap((h) => (h === '' ? [] : h.split(':')));
    if (groups.some((g) => g === '')) return false;
    let count = 0;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i]!;
      if (i === groups.length - 1 && isIPv4(g)) {
        count += 2;
        continue;
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return false;
      count += 1;
    }
    return halves.length === 2 ? count < 8 : count === 8;
  }

  async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  /** ipify endpoints return {"ip":"..."} with ?format=json. */
  async function fetchIpify(url: string): Promise<string> {
    const body: unknown = JSON.parse(await fetchText(url));
    const ip = (body as { ip?: unknown }).ip;
    if (typeof ip !== 'string' || ip.length === 0) throw new Error('Unexpected response');
    return ip;
  }

  function setResult(el: HTMLElement, copyBtn: HTMLButtonElement, ip: string, emptyMsg: string): void {
    if (ip) {
      el.textContent = ip;
      copyBtn.disabled = false;
    } else {
      el.textContent = emptyMsg;
      copyBtn.disabled = true;
    }
  }

  async function detect(): Promise<void> {
    refreshBtn.disabled = true;
    errorEl.textContent = '';
    v4El.textContent = 'Checking…';
    v6El.textContent = 'Checking…';
    copyV4.disabled = true;
    copyV6.disabled = true;

    ipv4 = '';
    ipv6 = '';
    let checksSucceeded = 0;
    let source = '';

    // Primary: Cloudflare's trace endpoint. Whichever family the browser used
    // to reach it is the one echoed back; warp/tls come along for free.
    try {
      const trace = parseTrace(await fetchText('https://one.one.one.one/cdn-cgi/trace'));
      const ip = trace['ip'] ?? '';
      if (isIPv4(ip)) ipv4 = ip;
      else if (isIPv6(ip)) ipv6 = ip;
      if (ipv4 || ipv6) {
        checksSucceeded++;
        source = 'Cloudflare';
      }
      tlsEl.textContent = trace['tls'] || '–';
      warpEl.textContent = trace['warp'] || '–';
    } catch {
      tlsEl.textContent = '–';
      warpEl.textContent = '–';
    }

    // Fill the missing IPv4 side via ipify's IPv4-only endpoint.
    if (!ipv4) {
      try {
        const ip = await fetchIpify('https://api.ipify.org?format=json');
        if (isIPv4(ip)) ipv4 = ip;
        checksSucceeded++;
        if (!source) source = 'ipify';
        else if (ipv4) source = 'Cloudflare + ipify';
      } catch {
        /* handled by the combined failure check below */
      }
    }

    // Fill the missing IPv6 side via ipify's dual-stack endpoint: it answers
    // with IPv6 when the connection has it, otherwise repeats the IPv4.
    if (!ipv6) {
      try {
        const ip = await fetchIpify('https://api64.ipify.org?format=json');
        if (isIPv6(ip)) ipv6 = ip;
        checksSucceeded++;
        if (!source) source = 'ipify';
        else if (ipv6 && source === 'Cloudflare') source = 'Cloudflare + ipify';
      } catch {
        /* handled by the combined failure check below */
      }
    }

    if (checksSucceeded === 0) {
      setResult(v4El, copyV4, '', 'Check failed');
      setResult(v6El, copyV6, '', 'Check failed');
      sourceEl.textContent = '–';
      errorEl.textContent =
        'Could not reach the IP check services (Cloudflare and ipify). You may be offline, ' +
        'or a content blocker may be blocking the requests. Everything else on this page works without them.';
    } else {
      setResult(v4El, copyV4, ipv4, 'No IPv4 address detected on this connection');
      setResult(v6El, copyV6, ipv6, 'No IPv6 address detected on this connection');
      sourceEl.textContent = source || '–';
      if (!ipv4 && !ipv6) {
        errorEl.textContent =
          'The services answered, but no valid address could be read from the response. Try again in a moment.';
      }
    }

    refreshBtn.disabled = false;
  }

  copyV4.addEventListener('click', () => void copyText(ipv4));
  copyV6.addEventListener('click', () => void copyText(ipv6));
  refreshBtn.addEventListener('click', () => void detect());

  void detect();
}
