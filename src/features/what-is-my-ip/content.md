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

## How to use

1. Load the page. The check starts on its own, so both panes read "Checking…" for a moment before the addresses appear (JavaScript has to be enabled).
2. Read the two results: your public IPv4 address in the top pane, your public IPv6 address below it. If a family isn't routed on your connection, that pane says so rather than showing a value.
3. Use the **Copy** button above either pane to put that address on your clipboard — handy when you're pasting it into a support ticket or a firewall rule.
4. Glance at **Connection details** for the TLS version your browser negotiated, whether Cloudflare **WARP** is carrying your traffic, and which service **answered** the check.
5. Press **Check again** after switching your VPN on or off, or restarting your router, to confirm the address actually changed.

## How it works

Every packet your browser sends already carries a source address, because the reply has to find its way home. This page just asks a server to read that address back to you. The primary source is Cloudflare's trace endpoint at `one.one.one.one/cdn-cgi/trace`, which returns plain `key=value` lines. The page splits each line on its first `=` and keeps the pairs it recognises.

Say the trace comes back like this:

```
ip=198.51.100.73
ts=1751587200.482
tls=TLSv1.3
warp=off
```

The `ip` value `198.51.100.73` is tested first as IPv4: split on dots gives four parts, each a number from 0 to 255, so it qualifies and lands in the IPv4 pane. `tls` and `warp` fill the connection details for free — they arrived in the same response, so displaying them costs no extra request. Because the trace reached Cloudflare over IPv4, no IPv6 was echoed, so the page then queries ipify's dual-stack endpoint (`api64.ipify.org`). If that answers with something containing a colon and passing the IPv6 shape check — say `2001:db8:1f0a:2c::9e4` — it fills the IPv6 pane; if it merely repeats the IPv4, the page reports no IPv6 detected. A separate IPv4-only ipify endpoint backfills the top pane whenever Cloudflare is unreachable, and the "Answered by" line records which combination did the work.

## Use cases & limitations

The everyday reasons to check are practical: whitelisting your address for a remote database, confirming a VPN is routing your traffic through a different exit, or grabbing the IPv6 you need to set up a firewall rule. It also settles the common confusion between the `192.168.x.x` address in your settings and the address the internet actually sees.

The honest limit is that this tells you *which* address you present, not *where* it points or what else it belongs to. To resolve a hostname to an address or read its records, use the [DNS lookup](/tools/dns-lookup/); to work out the network and host portions of an IP block, the [subnet calculator](/tools/subnet-calculator/) does the bitmasking. And your IP is only one of many signals a site can join together — the [browser fingerprint](/tools/browser-fingerprint/) tool shows the rest, which is why a VPN alone doesn't make you anonymous.

## Privacy note

Reading your own IP is impossible without a round trip, so this page makes one: a request to Cloudflare's trace endpoint, with ipify as a fallback. Those requests necessarily leave your browser — that's how any site sees your address. Nothing beyond the bare request is sent: no identifiers, no query parameters about you, and no results are stored or logged by this page. No geolocation lookup happens here either; the city-level mapping a site could do from your address is something this tool deliberately doesn't perform.
