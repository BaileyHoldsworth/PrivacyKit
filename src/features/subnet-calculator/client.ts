import { $, $$, onInput } from '../../lib/dom';

/* ---------- IPv4: 32-bit unsigned math with >>> ---------- */

function parseIPv4(s: string): number | null {
  const parts = s.split('.');
  if (parts.length !== 4) return null;
  let v = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = parseInt(part, 10);
    if (n > 255) return null;
    v = ((v << 8) | n) >>> 0;
  }
  return v;
}

function ipv4ToString(v: number): string {
  return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

function maskFromPrefix4(p: number): number {
  // << 32 is a no-op in JS, so /0 needs its own branch.
  return p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
}

/** Prefix length for a contiguous netmask, or null if the mask has holes. */
function prefixFromMask4(m: number): number | null {
  const inv = ~m >>> 0;
  if ((inv & (inv + 1)) !== 0) return null;
  return inv === 0 ? 32 : Math.clz32(inv);
}

/* ---------- IPv6: 128-bit math with BigInt ---------- */

const ALL_ONES_128 = (1n << 128n) - 1n;

function parseIPv6(s: string): bigint | null {
  let str = s;
  if (str.includes('.')) {
    // Embedded IPv4 tail, e.g. ::ffff:192.168.0.1 — fold into two hex groups.
    const lastColon = str.lastIndexOf(':');
    if (lastColon === -1) return null;
    const v4 = parseIPv4(str.slice(lastColon + 1));
    if (v4 === null) return null;
    str = `${str.slice(0, lastColon + 1)}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const dbl = str.split('::');
  if (dbl.length > 2) return null;
  const head = dbl[0] ? dbl[0].split(':') : [];
  const tail = dbl.length === 2 && dbl[1] ? dbl[1].split(':') : [];
  let groups: string[];
  if (dbl.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null; // "::" must stand for at least one zero group
    groups = [...head, ...(new Array(fill).fill('0') as string[]), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;
  let v = 0n;
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    v = (v << 16n) | BigInt(parseInt(g, 16));
  }
  return v;
}

function ipv6Groups(v: bigint): number[] {
  const groups: number[] = [];
  for (let i = 7; i >= 0; i--) groups.push(Number((v >> BigInt(i * 16)) & 0xffffn));
  return groups;
}

/** RFC 5952-style compression: longest zero run of >= 2 groups, leftmost wins. */
function ipv6ToString(v: bigint): string {
  const groups = ipv6Groups(v);
  let best = -1;
  let bestLen = 0;
  let cur = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === 0) {
      if (cur === -1) cur = i;
      curLen++;
      if (curLen > bestLen) {
        best = cur;
        bestLen = curLen;
      }
    } else {
      cur = -1;
      curLen = 0;
    }
  }
  if (bestLen < 2) return groups.map((g) => g.toString(16)).join(':');
  const head = groups.slice(0, best).map((g) => g.toString(16)).join(':');
  const tail = groups.slice(best + bestLen).map((g) => g.toString(16)).join(':');
  return `${head}::${tail}`;
}

function ipv6Expanded(v: bigint): string {
  return ipv6Groups(v).map((g) => g.toString(16).padStart(4, '0')).join(':');
}

/* ---------- Formatting ---------- */

function formatCount(c: bigint): string {
  if (c <= 9007199254740991n) return Number(c).toLocaleString();
  const s = c.toString();
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
}

/* ---------- Wiring ---------- */

const root = document.querySelector<HTMLElement>('[data-tool="subnet-calculator"]');

if (root) {
  const input = $<HTMLInputElement>('#net-input', root)!;
  const error = $('#net-error', root)!;
  const note = $('#net-note', root)!;
  const statPrefix = $('#net-prefix', root)!;
  const statTotal = $('#net-total', root)!;
  const statUsable = $('#net-usable', root)!;
  const binary = $('#net-binary', root)!;

  const rows = {
    cidr: $('#net-cidr', root)!,
    network: $('#net-network', root)!,
    expanded: $('#net-expanded', root)!,
    first: $('#net-first', root)!,
    last: $('#net-last', root)!,
    broadcast: $('#net-broadcast', root)!,
    mask: $('#net-mask', root)!,
    wildcard: $('#net-wildcard', root)!,
  };
  const expandedRow = $('#net-expanded-row', root)!;
  const broadcastRow = $('#net-broadcast-row', root)!;
  const wildcardRow = $('#net-wildcard-row', root)!;

  function fail(message: string): void {
    error.textContent = message;
    note.textContent = '';
    statPrefix.textContent = '–';
    statTotal.textContent = '–';
    statUsable.textContent = '–';
    binary.textContent = '–';
    for (const el of Object.values(rows)) el.textContent = '–';
    expandedRow.hidden = true;
    broadcastRow.hidden = false;
    wildcardRow.hidden = false;
  }

  /** Render the mask bits into highlighted network/host spans. */
  function renderBinary(prefix: number, totalBits: number, groupSize: number, sep: string): void {
    let netStr = '';
    let hostStr = '';
    for (let i = 0; i < totalBits; i++) {
      if (i > 0 && i % groupSize === 0) {
        if (i <= prefix) netStr += sep;
        else hostStr += sep;
      }
      if (i < prefix) netStr += '1';
      else hostStr += '0';
    }
    binary.textContent = '';
    if (netStr) {
      const netSpan = document.createElement('span');
      netSpan.className = 'bin-net';
      netSpan.textContent = netStr;
      binary.appendChild(netSpan);
    }
    if (hostStr) {
      const hostSpan = document.createElement('span');
      hostSpan.className = 'bin-host';
      hostSpan.textContent = hostStr;
      binary.appendChild(hostSpan);
    }
  }

  function calcIPv4(ip: number, prefix: number, inputWasHost: boolean): void {
    const mask = maskFromPrefix4(prefix);
    const wildcard = ~mask >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix === 32 ? 1 : prefix === 31 ? 2 : total - 2;
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;

    error.textContent = '';
    statPrefix.textContent = `/${prefix}`;
    statTotal.textContent = total.toLocaleString();
    statUsable.textContent = usable.toLocaleString();

    rows.cidr.textContent = `${ipv4ToString(network)}/${prefix}`;
    rows.network.textContent = ipv4ToString(network);
    rows.first.textContent = ipv4ToString(first);
    rows.last.textContent = ipv4ToString(last);
    rows.broadcast.textContent =
      prefix === 31 ? 'none (RFC 3021)' : ipv4ToString(broadcast);
    rows.mask.textContent = ipv4ToString(mask);
    rows.wildcard.textContent = ipv4ToString(wildcard);
    expandedRow.hidden = true;
    broadcastRow.hidden = false;
    wildcardRow.hidden = false;

    const notes: string[] = [];
    if (inputWasHost && ip !== network) {
      notes.push(`${ipv4ToString(ip)} is a host inside ${ipv4ToString(network)}/${prefix}.`);
    }
    if (prefix === 31) {
      notes.push('RFC 3021 point-to-point link: both addresses are usable and there is no broadcast address.');
    } else if (prefix === 32) {
      notes.push('A /32 is a single host route — network, host and broadcast are the same address.');
    }
    note.textContent = notes.join(' ');

    renderBinary(prefix, 32, 8, '.');
  }

  function calcIPv6(ip: bigint, prefix: number): void {
    const hostMask = prefix === 128 ? 0n : (1n << BigInt(128 - prefix)) - 1n;
    const mask = ALL_ONES_128 ^ hostMask;
    const network = ip & mask;
    const last = network | hostMask;
    const total = 1n << BigInt(128 - prefix);

    error.textContent = '';
    statPrefix.textContent = `/${prefix}`;
    statTotal.textContent = formatCount(total);
    statUsable.textContent = formatCount(total);

    rows.cidr.textContent = `${ipv6ToString(network)}/${prefix}`;
    rows.network.textContent = ipv6ToString(network);
    rows.expanded.textContent = ipv6Expanded(network);
    rows.first.textContent = ipv6ToString(network);
    rows.last.textContent = ipv6ToString(last);
    rows.mask.textContent = ipv6ToString(mask);
    expandedRow.hidden = false;
    broadcastRow.hidden = true;
    wildcardRow.hidden = true;

    const notes: string[] = [];
    if (ip !== network) {
      notes.push(`${ipv6ToString(ip)} is an address inside ${ipv6ToString(network)}/${prefix}.`);
    }
    notes.push('IPv6 has no broadcast address, so every address in the prefix is assignable.');
    note.textContent = notes.join(' ');

    renderBinary(prefix, 128, 16, ':');
  }

  function calculate(): void {
    const raw = input.value.trim();
    if (raw === '') {
      fail('');
      return;
    }
    if (raw.length > 100) {
      fail('That input is too long to be an IP address and mask.');
      return;
    }

    // Normalise "addr / 24" and "addr 255.255.255.0" into two clean tokens.
    const normalised = raw.replace(/\s*\/\s*/, '/');
    const slash = normalised.split('/');
    let addrPart: string;
    let maskPart: string;
    if (slash.length === 2) {
      addrPart = slash[0]!.trim();
      maskPart = slash[1]!.trim();
    } else if (slash.length > 2) {
      fail('Only one "/" is allowed — use address/prefix, e.g. 10.0.0.0/8.');
      return;
    } else {
      const tokens = normalised.split(/\s+/);
      if (tokens.length !== 2) {
        fail('Add a prefix length or netmask, e.g. 192.168.1.0/24 or 192.168.1.0 255.255.255.0.');
        return;
      }
      addrPart = tokens[0]!;
      maskPart = tokens[1]!;
    }
    if (!addrPart || !maskPart) {
      fail('Enter both an address and a prefix length, e.g. 2001:db8::/32.');
      return;
    }

    if (addrPart.includes(':')) {
      const ip = parseIPv6(addrPart);
      if (ip === null) {
        fail(`"${addrPart}" is not a valid IPv6 address.`);
        return;
      }
      if (!/^\d{1,3}$/.test(maskPart)) {
        fail('IPv6 networks take a numeric prefix length (0–128), e.g. 2001:db8::/48.');
        return;
      }
      const prefix = parseInt(maskPart, 10);
      if (prefix > 128) {
        fail('An IPv6 prefix length can be at most /128.');
        return;
      }
      calcIPv6(ip, prefix);
      return;
    }

    const ip = parseIPv4(addrPart);
    if (ip === null) {
      fail(`"${addrPart}" is not a valid IPv4 address — four octets, each 0–255.`);
      return;
    }
    let prefix: number;
    if (maskPart.includes('.')) {
      const mask = parseIPv4(maskPart);
      if (mask === null) {
        fail(`"${maskPart}" is not a valid dotted netmask.`);
        return;
      }
      const p = prefixFromMask4(mask);
      if (p === null) {
        const flipped = prefixFromMask4(~mask >>> 0);
        fail(
          flipped !== null && mask !== 0
            ? `"${maskPart}" looks like a wildcard mask — the netmask form is ${ipv4ToString(~mask >>> 0)} (/${flipped}).`
            : `"${maskPart}" is not a contiguous netmask — its 1-bits must all sit at the left.`
        );
        return;
      }
      prefix = p;
    } else {
      if (!/^\d{1,2}$/.test(maskPart)) {
        fail('The prefix length must be a number from 0 to 32, e.g. /26.');
        return;
      }
      prefix = parseInt(maskPart, 10);
      if (prefix > 32) {
        fail('An IPv4 prefix length can be at most /32. For IPv6, write the address with colons.');
        return;
      }
    }
    calcIPv4(ip, prefix, true);
  }

  onInput(input, calculate);
  for (const btn of $$<HTMLButtonElement>('[data-net-example]', root)) {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.netExample ?? '';
      input.focus();
      calculate();
    });
  }
}
