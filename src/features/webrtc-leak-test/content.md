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
<!-- content-pending: round2 content -->
