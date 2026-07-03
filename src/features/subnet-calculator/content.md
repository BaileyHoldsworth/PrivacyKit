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

<!-- content-pending: Phase C -->
