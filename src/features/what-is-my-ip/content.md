---
name: What Is My IP Address
title: What Is My IP Address? — IPv4 & IPv6 Lookup | PrivacyKit
description: Shows the public IPv4 and IPv6 addresses your connection presents to websites, checked via Cloudflare with an ipify fallback, with one-click copy buttons.
category: network
keywords:
  - what is my ip
  - my ip address
  - ip lookup
  - ipv6 test
  - public ip
icon: world
related:
  - dns-lookup
  - subnet-calculator
  - browser-fingerprint
privacy: external-api
apiNote: This tool asks Cloudflare (with ipify as fallback) which IP your request came from — that request necessarily leaves your browser. Nothing else is sent or stored.
affiliateGroup: vpn
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Why is the IP shown here different from the one in my device's network settings?
    a: >-
      Your device settings show a *private* address (usually starting 192.168,
      10, or 172.16–172.31) that your router handed out for use inside your
      network. The router then translates every device's traffic to one shared
      *public* address using NAT — that public address is what websites see,
      and it is the one this page reports.
  - q: What is the difference between the IPv4 and IPv6 results?
    a: >-
      They are two parallel addressing systems. IPv4 addresses are 32-bit
      (like `203.0.113.42`) and scarce, so whole households share one behind a
      router. IPv6 addresses are 128-bit (like `2001:db8::8a2e:370:7334`) and
      plentiful enough that each device typically gets its own. The page tests
      each family separately because a connection can have either one or both.
  - q: Why does it say no IPv6 address was detected?
    a: >-
      Your ISP or router isn't routing IPv6, which is still common — roughly
      half of all connections worldwide reach websites over IPv4 only. Nothing
      is broken; your traffic keeps flowing over IPv4. If you expected IPv6,
      check whether your router has it switched off or whether your ISP offers
      it on your plan at all.
  - q: How does this page know my IP address without asking me anything?
    a: >-
      Every request your browser sends carries a source address so the reply
      can find its way back — servers always see it. The page asks Cloudflare's
      trace endpoint (falling back to ipify) to echo back the address your
      request arrived from. That request is the only thing that leaves your
      browser, and neither service is sent anything beyond the request itself.
  - q: Can someone find my home or hack me from my IP address?
    a: >-
      An IP address resolves to your ISP and usually a city-sized area — not a
      street address. On its own it also isn't enough to break into your
      devices, because your router drops unsolicited incoming traffic. The
      realistic exposure is different: websites and advertisers can use it to
      approximate your location and link visits together, which is exactly the
      linkage a VPN breaks by substituting its own address for yours.
  - q: Why does my public IP keep changing?
    a: >-
      Most ISPs assign dynamic addresses from a shared pool, so a modem
      restart or an expired DHCP lease can hand you a new one. Many mobile and
      some fixed-line ISPs also use carrier-grade NAT, sharing a single public
      IPv4 address across many customers — so an address you don't recognise
      here doesn't mean anything is wrong.
  - q: What do the WARP and TLS lines under the result mean?
    a: >-
      Both come from the same Cloudflare trace response that carries your IP,
      so showing them costs no extra request. WARP reports whether your
      traffic is tunnelled through Cloudflare's WARP/1.1.1.1 app — "on" means
      the address shown belongs to Cloudflare's network, not your ISP. TLS
      shows the encryption protocol your browser negotiated for the check;
      TLSv1.3 is the current version.
---

<!-- content-pending: Phase C -->
