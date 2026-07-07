import { $ } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="webrtc-leak-test"]');

if (root) {
  const runBtn = $<HTMLButtonElement>('#rtc-run', root)!;
  const copyBtn = $<HTMLButtonElement>('#rtc-copy', root)!;
  const errorEl = $('#rtc-error', root)!;
  const verdictEl = $('#rtc-verdict', root)!;
  const publicEl = $<HTMLUListElement>('#rtc-public', root)!;
  const localEl = $<HTMLUListElement>('#rtc-local', root)!;
  const reportEl = $('#rtc-report', root)!;

  const STUN_URL = 'stun:stun.l.google.com:19302';
  const STUN_LABEL = 'stun.l.google.com:19302';
  // Hard ceiling so a filtered UDP path (STUN never answers) can't hang the UI.
  const TIMEOUT_MS = 6000;

  type IpClass =
    | 'public'
    | 'private'
    | 'cgnat'
    | 'linklocal'
    | 'loopback'
    | 'unspecified'
    | 'unknown';

  interface ParsedCandidate {
    ip: string;
    type: string; // host | srflx | prflx | relay
    isMdns: boolean;
  }

  /**
   * Pull the connection-address and type out of an ICE candidate line.
   * Grammar: candidate:<foundation> <comp> <transport> <priority>
   *          <connection-address> <port> typ <type> ...
   * The address is always the token two before the `typ` keyword.
   */
  function parseCandidate(candidate: string): ParsedCandidate | null {
    const parts = candidate.trim().split(/\s+/);
    const typIdx = parts.indexOf('typ');
    if (typIdx < 2 || typIdx + 1 >= parts.length) return null;
    const address = parts[typIdx - 2];
    const type = parts[typIdx + 1];
    if (!address || !type) return null;
    return { ip: address, type, isMdns: /\.local$/i.test(address) };
  }

  function classifyIp(ip: string): IpClass {
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      const [a = 0, b = 0, c = 0, d = 0] = ip.split('.').map(Number);
      if (a > 255 || b > 255 || c > 255 || d > 255) return 'unknown';
      if (a === 10) return 'private';
      if (a === 172 && b >= 16 && b <= 31) return 'private';
      if (a === 192 && b === 168) return 'private';
      if (a === 169 && b === 254) return 'linklocal';
      if (a === 127) return 'loopback';
      if (a === 100 && b >= 64 && b <= 127) return 'cgnat';
      if (a === 0) return 'unspecified';
      return 'public';
    }
    if (ip.includes(':')) {
      const lower = ip.toLowerCase();
      if (lower === '::1') return 'loopback';
      if (lower === '::') return 'unspecified';
      if (lower.startsWith('fe80')) return 'linklocal';
      if (/^f[cd][0-9a-f]{2}/.test(lower)) return 'private';
      return 'public';
    }
    return 'unknown';
  }

  const family = (ip: string): string => (ip.includes(':') ? 'IPv6' : 'IPv4');

  function makeLi(main: string, badgeText: string, badgeClass: string): HTMLLIElement {
    const el = document.createElement('li');
    const s = document.createElement('span');
    s.textContent = main;
    const b = document.createElement('span');
    b.className = `badge ${badgeClass}`;
    b.textContent = badgeText;
    el.append(s, b);
    return el;
  }

  function placeholder(text: string): HTMLLIElement {
    const el = document.createElement('li');
    const s = document.createElement('span');
    s.textContent = text;
    el.appendChild(s);
    return el;
  }

  function setVerdict(badgeText: string, badgeClass: string, paragraphs: string[]): void {
    verdictEl.replaceChildren();
    const badge = document.createElement('span');
    badge.className = `badge ${badgeClass}`;
    badge.textContent = badgeText;
    verdictEl.appendChild(badge);
    paragraphs.forEach((line, i) => {
      const p = document.createElement('p');
      p.textContent = line;
      if (i === 0) p.style.marginTop = 'var(--s-3)';
      else p.style.marginTop = 'var(--s-2)';
      verdictEl.appendChild(p);
    });
  }

  interface Address {
    ip: string;
    label: string; // description of the candidate kind
    badge: string;
    badgeClass: string;
  }

  function render(candidates: ParsedCandidate[]): void {
    const externals = new Map<string, Address>();
    const locals = new Map<string, Address>();
    let mdnsCount = 0;
    let reflexiveSeen = false;

    for (const c of candidates) {
      const t = c.type.toLowerCase();
      if (t === 'srflx' || t === 'prflx' || t === 'relay') {
        reflexiveSeen = true;
        const cls = classifyIp(c.ip);
        if (cls === 'unspecified' || cls === 'unknown') continue;
        const cgnat = cls === 'cgnat';
        externals.set(c.ip, {
          ip: c.ip,
          label: `${family(c.ip)}, ${t === 'relay' ? 'relayed' : 'server-reflexive'}${cgnat ? ', carrier-grade NAT' : ''}`,
          badge: cgnat ? 'CGNAT' : 'PUBLIC',
          badgeClass: 'badge-warn',
        });
      } else if (c.isMdns) {
        mdnsCount++;
      } else {
        const cls = classifyIp(c.ip);
        if (cls === 'public') {
          externals.set(c.ip, {
            ip: c.ip,
            label: `${family(c.ip)}, host (direct public address)`,
            badge: 'PUBLIC',
            badgeClass: 'badge-warn',
          });
        } else if (cls === 'private' || cls === 'linklocal' || cls === 'cgnat') {
          locals.set(c.ip, {
            ip: c.ip,
            label: `${family(c.ip)}, host (${cls === 'linklocal' ? 'link-local' : cls})`,
            badge: 'LOCAL',
            badgeClass: 'badge-danger',
          });
        }
        // loopback/unspecified/unknown host addresses reveal nothing and are dropped
      }
    }

    // ---- Public / externally-visible list ----
    publicEl.replaceChildren();
    if (externals.size > 0) {
      for (const a of externals.values()) publicEl.appendChild(makeLi(a.ip, a.label, a.badgeClass));
    } else if (reflexiveSeen) {
      publicEl.appendChild(placeholder('No public address was returned by the STUN server.'));
    } else {
      publicEl.appendChild(
        placeholder('No reflexive candidate — the STUN server was not reached (offline, blocked or UDP filtered).')
      );
    }

    // ---- Local list ----
    localEl.replaceChildren();
    if (locals.size > 0) {
      for (const a of locals.values()) localEl.appendChild(makeLi(a.ip, a.label, a.badgeClass));
    } else if (mdnsCount > 0) {
      localEl.appendChild(
        makeLi(`Masked with an mDNS hostname (${mdnsCount} candidate${mdnsCount === 1 ? '' : 's'})`, 'HIDDEN', 'badge-ok')
      );
    } else {
      localEl.appendChild(placeholder('No local candidates gathered.'));
    }

    // ---- Verdict ----
    const totalUsable = externals.size + locals.size + mdnsCount;
    if (totalUsable === 0) {
      setVerdict('No candidates', 'badge-ok', [
        'WebRTC gathered no ICE candidates on this run. That usually means WebRTC is disabled, blocked by an extension, or filtered by a firewall — in which case it cannot leak your IP address here.',
      ]);
    } else if (externals.size > 0 && locals.size > 0) {
      setVerdict('IP addresses exposed', 'badge-danger', [
        `WebRTC exposed both a publicly-visible address (${[...externals.keys()].join(', ')}) and a local network address (${[...locals.keys()].join(', ')}).`,
        'The public address is what any site running WebRTC can read; on a VPN it should match your VPN exit, not your ISP. The local address should normally be masked behind an mDNS hostname — seeing a real one means that leak is open too.',
      ]);
    } else if (externals.size > 0) {
      setVerdict('Public IP visible via WebRTC', 'badge-warn', [
        `WebRTC exposed a publicly-visible address: ${[...externals.keys()].join(', ')}.`,
        'Any site you visit can read this the moment it starts WebRTC. Without a VPN this is the same address every site already sees. With a VPN, compare it to your VPN exit IP: a match means the tunnel covers WebRTC; your real ISP address means WebRTC is leaking around the VPN.',
      ]);
    } else if (locals.size > 0) {
      const notes = [
        `WebRTC exposed a local network address: ${[...locals.keys()].join(', ')}.`,
        'Modern browsers normally replace this with a random mDNS hostname, so a real address here means the site can see your position on your LAN.',
      ];
      if (!reflexiveSeen)
        notes.push(
          'No reflexive candidate came back, so this run could not test what public address WebRTC would expose — the STUN server was likely unreachable.'
        );
      setVerdict('Local IP exposed', 'badge-danger', notes);
    } else {
      // Only mDNS-masked host candidates.
      const notes = ['No local IP address leaked — your browser masked its host candidates with mDNS hostnames.'];
      if (!reflexiveSeen)
        notes.push(
          'No reflexive candidate came back either, which usually means the STUN server was unreachable, so the public-exposure part of the test could not complete. Try again on a normal connection to confirm.'
        );
      else notes.push('The STUN server returned no public address for your connection.');
      setVerdict('No IP address leaked', 'badge-ok', notes);
    }

    buildReport(externals, locals, mdnsCount);
  }

  function buildReport(externals: Map<string, Address>, locals: Map<string, Address>, mdnsCount: number): void {
    const badge = verdictEl.querySelector('.badge');
    const lines: string[] = [
      'WebRTC Leak Test — result',
      `Verdict: ${badge ? badge.textContent : '—'}`,
      '',
      'Public / externally-visible addresses:',
    ];
    if (externals.size > 0) for (const a of externals.values()) lines.push(`  - ${a.ip} (${a.label})`);
    else lines.push('  - none');
    lines.push('', 'Local network addresses:');
    if (locals.size > 0) for (const a of locals.values()) lines.push(`  - ${a.ip} (${a.label})`);
    else if (mdnsCount > 0) lines.push(`  - masked with mDNS hostname (${mdnsCount})`);
    else lines.push('  - none');
    lines.push('', `STUN server: ${STUN_LABEL}`);
    reportEl.textContent = lines.join('\n');
    copyBtn.disabled = false;
  }

  function unsupported(message: string): void {
    errorEl.textContent = '';
    publicEl.replaceChildren(placeholder('Not tested'));
    localEl.replaceChildren(placeholder('Not tested'));
    setVerdict('WebRTC unavailable', 'badge-ok', [message]);
    reportEl.textContent = `WebRTC Leak Test — result\nVerdict: WebRTC unavailable\n${message}`;
    copyBtn.disabled = false;
  }

  async function runTest(): Promise<void> {
    errorEl.textContent = '';
    copyBtn.disabled = true;
    runBtn.disabled = true;

    if (typeof RTCPeerConnection === 'undefined') {
      unsupported(
        'This browser does not expose RTCPeerConnection, so WebRTC is turned off or unsupported here. That means WebRTC cannot leak your IP address in this browser.'
      );
      runBtn.disabled = false;
      return;
    }

    verdictEl.replaceChildren();
    const running = document.createElement('p');
    running.textContent = 'Running the test — opening a WebRTC connection and collecting candidates…';
    verdictEl.appendChild(running);
    publicEl.replaceChildren(placeholder('Gathering…'));
    localEl.replaceChildren(placeholder('Gathering…'));

    let pc: RTCPeerConnection;
    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_URL }] });
    } catch {
      unsupported(
        'This browser blocked the WebRTC connection (RTCPeerConnection threw). WebRTC appears to be disabled by a policy or extension, so it cannot leak your IP address here.'
      );
      runBtn.disabled = false;
      return;
    }

    const found = new Map<string, ParsedCandidate>();
    const collect = (line: string): void => {
      const c = parseCandidate(line);
      if (c) found.set(`${c.ip}|${c.type}`, c);
    };

    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Backstop: also scan the final SDP for any candidate lines.
      const sdp = pc.localDescription?.sdp ?? '';
      for (const raw of sdp.split(/\r?\n/)) {
        const idx = raw.indexOf('candidate:');
        if (idx >= 0) collect(raw.slice(idx));
      }
      try {
        pc.close();
      } catch {
        /* already closed */
      }
      render([...found.values()]);
      runBtn.disabled = false;
    };

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent): void => {
      if (!event.candidate) {
        finish(); // null candidate => gathering complete
        return;
      }
      collect(event.candidate.candidate);
    };
    pc.onicegatheringstatechange = (): void => {
      if (pc.iceGatheringState === 'complete') finish();
    };

    timer = setTimeout(finish, TIMEOUT_MS);

    try {
      pc.createDataChannel('leak-check');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (offer.sdp) for (const raw of offer.sdp.split(/\r?\n/)) {
        const idx = raw.indexOf('candidate:');
        if (idx >= 0) collect(raw.slice(idx));
      }
    } catch {
      errorEl.textContent =
        'Could not start the WebRTC negotiation. Any candidates gathered before the error are shown below.';
      finish();
    }
  }

  runBtn.addEventListener('click', () => void runTest());
  runBtn.disabled = false; // enable once hydrated
}
