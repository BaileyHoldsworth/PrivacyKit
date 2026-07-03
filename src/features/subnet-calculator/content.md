---
name: Subnet Calculator
title: Subnet Calculator — CIDR & IP Range Tool | PrivacyKit
description: Calculate network address, broadcast, usable host range, netmask and wildcard for any IPv4 or IPv6 CIDR block — entirely in your browser, RFC 3021 aware.
category: network
keywords:
  - subnet calculator
  - cidr calculator
  - ip range
  - netmask
  - cidr to range
icon: network
related:
  - what-is-my-ip
  - dns-lookup
  - number-base-converter
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: How many usable hosts does a subnet have?
    a: >-
      For IPv4 prefixes up to /30, usable hosts = 2^(32 − prefix) − 2, because
      the lowest address names the network and the highest is the broadcast. A
      /26 therefore gives 2⁶ − 2 = 62 hosts, a /22 gives 1,022. The two
      exceptions are /31 (2 usable, see below) and /32 (exactly 1 — a host
      route). The calculator applies these rules automatically and shows the
      count in the stats row.
  - q: Why does the tool show a different network address from the IP I typed?
    a: >-
      Any address inside a block identifies the same subnet. Enter
      172.16.9.200/22 and the tool ANDs the address with the /22 mask
      (255.255.252.0) to get the true network, 172.16.8.0 — then flags that
      your input was a host inside it. This is exactly what a router does to
      decide where to forward a packet.
  - q: Why does a /31 show two usable hosts instead of zero?
    a: >-
      The classic formula gives 2 − 2 = 0, but RFC 3021 redefined /31 for
      point-to-point links: with only two endpoints there is no need for a
      network or broadcast address, so both addresses are assigned to hosts.
      Router vendors have supported this for years, and the calculator reports
      it with a note rather than claiming the subnet is unusable.
  - q: What is the difference between a netmask and a wildcard mask?
    a: >-
      They are bitwise inverses. The /24 netmask 255.255.255.0 has 1-bits over
      the network portion; its wildcard 0.0.0.255 has 1-bits over the host
      portion. Cisco ACLs and OSPF network statements expect the wildcard
      form, which is why the tool prints both — copy whichever the config
      syntax wants.
  - q: How do I convert a netmask like 255.255.240.0 to a prefix length?
    a: >-
      Count the leading 1-bits: 255.255.240.0 is sixteen 1s from the first two
      octets plus four from 240 (11110000), so /20. Paste the address and mask
      into the input (e.g. `10.4.0.1 255.255.240.0`) and the tool does the
      count for you — and rejects masks with non-contiguous bits, which are
      not valid netmasks at all.
  - q: Does the calculator work for IPv6 prefixes?
    a: >-
      Yes. Enter any prefix like `2001:db8::/48` and it computes the network,
      first and last addresses, and the address count using full 128-bit
      integer arithmetic. Two differences from IPv4 apply: IPv6 has no
      broadcast address, so every address in the prefix is assignable, and
      counts get astronomically large — a /48 holds 2⁸⁰ (about 1.2 × 10²⁴)
      addresses.
---

A router deciding where to forward a packet performs one operation over and over: it masks the destination address down to a network number and matches that against its table. This calculator runs the same arithmetic in front of you, so a CIDR block becomes a full picture — network, host range, broadcast, netmask and wildcard — the moment you type it.

## How to use

1. Type an address and mask into the single field: CIDR form like `192.168.1.0/24`, an address plus dotted netmask like `172.16.8.1 255.255.252.0`, or an IPv6 prefix such as `2001:db8::/48`.
2. Prefer a running start? Click one of the example chips beneath the field to load a ready-made block, then edit it.
3. Read the stats row for prefix length, total addresses and usable hosts — the last figure already accounts for the network and broadcast reservations.
4. Copy any computed value straight from its row: normalised CIDR, network address, first and last host, broadcast, netmask or wildcard.
5. Glance at the binary panel to see exactly where the network/host boundary sits; the highlighted bits are the network portion.

There is no calculate button — every result recomputes on each keystroke.

## How it works

The core is a bitwise AND between the address and a mask derived from the prefix length. For IPv4 the tool works in 32-bit unsigned integers (using JavaScript's `>>>` to stay unsigned); for IPv6 it switches to 128-bit `BigInt` arithmetic, since the counts overflow ordinary numbers.

Take `198.51.100.164/27`. A /27 sets the first 27 bits as network, leaving 5 host bits, so the mask is `255.255.255.224` — that final `224` is `11100000` in binary. ANDing the last octet, `164` (`10100100`), with `224` (`11100000`) keeps only the top three bits: `10100000`, which is `160`. So the true network is `198.51.100.160`, and because you typed `.164` the tool notes that your input was a host inside that block rather than the network itself.

From there the rest falls out. The wildcard is the mask inverted, `0.0.0.31`; ORing it with the network gives the broadcast, `198.51.100.191`. The usable range is everything between: first host `198.51.100.161`, last host `198.51.100.190`. Total addresses are 2⁵ = 32, and usable hosts are 32 − 2 = 30, subtracting the network and broadcast.

Two edge cases are handled explicitly rather than by the generic formula. A /31 returns two usable addresses under RFC 3021 for point-to-point links, with no broadcast; a /32 is reported as a single host route. The tool also rejects a dotted mask whose 1-bits are not contiguous — `255.255.0.255` is not a valid netmask — and if you paste a wildcard mask by mistake, it tells you the netmask equivalent.

## Use cases & limitations

Reach for a subnet calculator when carving an allocation into VLANs, sizing a DHCP scope, writing a firewall rule, or translating a prefix into the wildcard form that Cisco ACLs and OSPF statements expect. It is equally handy for the reverse question — given a host address and a netmask, which subnet does it belong to? Everything runs in the browser, so it works offline once loaded and against internal ranges you would never paste into a remote service.

The honest limitation: it describes the geometry of one block at a time. It will not split a parent network into a VLSM plan for you, check whether two subnets overlap, or tell you if an address is actually routed or assigned — those are design decisions, not arithmetic. It also computes structure, not reachability; use [DNS Lookup](/tools/dns-lookup/) to resolve names and [What Is My IP](/tools/what-is-my-ip/) to see your own public address. If the binary panel leaves you wanting to convert masks between bases by hand, the [Number Base Converter](/tools/number-base-converter/) handles the decimal-to-binary step directly.
