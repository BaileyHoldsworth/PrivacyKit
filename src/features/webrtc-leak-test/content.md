---
name: WebRTC Leak Test
title: WebRTC Leak Test — Is Your VPN Leaking Your IP? | PrivacyKit
description: Runs a WebRTC test against Google's public STUN server to reveal the local and public IP addresses your browser exposes — the ones a VPN should hide.
category: privacy
keywords:
  - webrtc leak test
  - webrtc leak
  - ip leak test
  - vpn leak test
  - webrtc ip
icon: shield-x
related:
  - what-is-my-ip
  - browser-fingerprint
  - dns-lookup
  - url-cleaner
privacy: external-api
apiNote: This test opens a WebRTC connection to a public STUN server (Google's) to discover the IP addresses your browser would reveal. That connection leaves your device; nothing is stored.
affiliateGroup: vpn
ads: false
popular: false
updated: 2026-07-07
jsonLdCategory: SecurityApplication
faqs:
  - q: What is a WebRTC leak?
    a: >-
      WebRTC is the browser feature behind video calls and peer-to-peer data. To
      set up a direct connection it runs an ICE negotiation, and part of that is
      asking a STUN server "what address did my packet arrive from?" The answer
      is your public IP, returned as a *server-reflexive* candidate. Any script
      on a page can start this process and read the candidates back — no
      permission prompt, no click — which is how a site can learn the real
      address you thought a VPN or proxy was hiding.
  - q: Why does WebRTC leak my real IP even when my VPN is on?
    a: >-
      A VPN reroutes your traffic, but WebRTC's STUN request can slip outside the
      tunnel. It happens with split-tunnel configurations, when the VPN only
      routes IPv4 and WebRTC reaches the STUN server over IPv6, or when a browser
      extension hands WebRTC the raw interface. The reflexive candidate then
      carries your ISP address instead of the VPN's exit. If the public address
      this test shows differs from your VPN's exit IP, that is the leak — fix it
      with a VPN that blocks WebRTC or by disabling WebRTC in the browser.
  - q: The test shows a “.local” hostname instead of my IP — is that good?
    a: >-
      Yes. Since Chrome 74 (and matching versions of Edge, Firefox and Safari)
      browsers replace the local candidate's real address with a random mDNS
      hostname like `8a2c1e4f-…-abcdef012345.local`. It lets a genuine peer on
      your network still reach you while hiding your `192.168.x.x` or `10.x.x.x`
      address from the remote site. Seeing a `.local` name here means that local
      leak is already closed on your setup.
  - q: How do I disable WebRTC in my browser?
    a: >-
      In Firefox, open `about:config`, find `media.peerconnection.enabled` and
      set it to `false`. Chrome and Edge have no built-in switch, so use an
      extension — uBlock Origin has a "Prevent WebRTC from leaking local IP"
      toggle, and Google's own WebRTC Network Limiter restricts it. Brave exposes
      a WebRTC IP handling policy under Shields. The trade-off is real: turning
      WebRTC off breaks video calls and any site that relies on peer-to-peer.
  - q: Does this test send my IP address to a server?
    a: >-
      The only thing that leaves your device is the STUN request to
      `stun.l.google.com:19302`. That request is how a reflexive candidate is
      discovered at all — the STUN server reads the source address your packet
      arrived with and echoes it back. Everything after that (parsing the
      candidate strings, classifying addresses, writing the verdict) happens in
      your browser. No result is uploaded, logged or stored by this page.
  - q: It shows my public IP but I'm not using a VPN — is that a problem?
    a: >-
      No. Without a VPN, the public address WebRTC reports is the same one every
      site already sees from your connection, because that address is on every
      packet you send. WebRTC only becomes a *leak* when you expect an address to
      be masked — by a VPN, proxy or Tor — and your real one surfaces anyway.
      With no tunnel in place, there is nothing for it to bypass.
---
## How to use

1. If you're checking a VPN, proxy or Tor, switch it on first — the test only reflects the network path exactly as it stands the moment you run it.
2. Press **Run the test**. Nothing is gathered until you click: the page then opens a single WebRTC connection and waits up to six seconds for addresses to arrive.
3. Read the **Verdict** badge at the top. Green means nothing leaked, amber flags a publicly-visible address, red marks a raw local address or both exposed at once.
4. Look at the two lists beneath it — **Public / externally-visible addresses** and **Local network addresses** — for the actual values and how each one was classified.
5. To compare against the address the rest of the web already sees, open the [what is my IP](/tools/what-is-my-ip/) tool in a second tab; on a working VPN the two should match.
6. Press **Copy results** for a plain-text summary you can paste into a bug report or a support thread.

## How it works

The test builds an `RTCPeerConnection` aimed at one STUN server, `stun.l.google.com:19302`, opens a throwaway data channel to force ICE gathering, and creates an SDP offer. As the browser works out how a peer could reach you, it emits *candidates* — one line per address it might use. A single line looks like this:

```
candidate:842163049 1 udp 1677729535 198.51.100.23 54993 typ srflx
```

The parser splits the line on spaces, finds the `typ` keyword, and reads the connection address from two tokens before it (`198.51.100.23`) and the candidate kind from the token straight after (`srflx`). It then sorts that address by range. `198.51.100.23` sits outside every private block — 10/8, 172.16/12, 192.168/16, 169.254/16, 127/8 and 100.64/10 — so it is tagged **PUBLIC**, and because it is a *server-reflexive* (`srflx`) candidate it lands in the externally-visible list. That value is what a site reads as "your" address. A host candidate carrying `192.168.1.42` would instead be reported as a local-network leak, whereas a browser that rewrote that host address to a random `.local` mDNS name is scored **HIDDEN**. From this mix — one public reflexive address plus a masked local one — the tool writes the verdict "Public IP visible via WebRTC".

## Use cases & limitations

Most people reach for this straight after enabling a VPN, wanting proof the tunnel actually covers browser peer-to-peer traffic and not just ordinary page loads — a genuine failure mode with split-tunnel configs and IPv6 routing. It is equally useful for auditing a hardened browser profile or a privacy extension: run it before and after a change to see whether the address a site would read has moved.

The honest limits. The result describes one browser, on one network, at one instant. A different profile, an incognito window with other extensions, or a change of Wi-Fi can each produce a different answer, so a clean pass here is not a standing guarantee. The check also depends on reaching that single STUN server over UDP; if a firewall filters the path, no reflexive candidate returns and the tool marks the public part as inconclusive rather than "safe". Finally, it only measures the leak — closing one is a browser or VPN setting, not something this page changes. Your IP is one signal among many a site can read, so for the wider picture the [browser fingerprint](/tools/browser-fingerprint/) tool covers what else is on show.

## Privacy note

One packet leaves your device: the STUN binding request to `stun.l.google.com:19302`, which is the mechanism that surfaces a reflexive address at all. Google's server sees the source address that packet arrived from and reflects it back to you; it receives no other payload. Everything afterwards — splitting candidate lines, matching IP ranges, choosing badges, writing the verdict and the copyable report — runs inside your browser. No address or result is uploaded, logged or retained by this page.
