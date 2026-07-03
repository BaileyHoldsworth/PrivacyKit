---
name: DNS Lookup
title: DNS Lookup — A, AAAA, MX, TXT, NS Records | PrivacyKit
description: Query A, AAAA, CNAME, MX, TXT, NS, SOA and CAA records for any domain through Cloudflare's DNS-over-HTTPS resolver, with TTLs shown and copyable results.
category: network
keywords:
  - dns lookup
  - dns checker
  - mx records
  - txt records
  - nslookup online
  - dig online
icon: server
related:
  - what-is-my-ip
  - subnet-calculator
  - url-cleaner
privacy: external-api
apiNote: Queries go to Cloudflare's 1.1.1.1 DNS-over-HTTPS API. The domain you look up is disclosed to Cloudflare; nothing else is.
affiliateGroup: dev
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: Why are these results different from what dig shows on my machine?
    a: >-
      This tool queries Cloudflare's 1.1.1.1 resolver over HTTPS, while `dig`
      uses whatever resolver your network hands it — often your ISP's. Each
      resolver caches answers for the record's TTL, and services behind
      geo-aware or anycast DNS deliberately return different answers to
      different resolvers. If you changed a record recently, the two caches can
      disagree until the old TTL expires.
  - q: What does NXDOMAIN mean?
    a: >-
      NXDOMAIN is the authoritative "this name does not exist" answer — the
      domain's nameservers reported that no records of any type live at that
      exact name. It is different from an empty result: a domain can exist yet
      have no TXT records, say. Check the spelling, and remember lookups are
      literal — `www.example.com` and `example.com` are separate names with
      separate records.
  - q: How do I look up SPF, DKIM and DMARC records?
    a: >-
      All three live in TXT records. SPF sits at the domain itself (tick TXT
      and look up the bare domain), DMARC at `_dmarc.yourdomain.com`, and DKIM
      at `<selector>._domainkey.yourdomain.com` — the selector comes from your
      sending service, e.g. `google` for Google Workspace. The input accepts
      underscored hostnames, so paste those prefixed names directly.
  - q: What is the TTL shown next to each record?
    a: >-
      Time to live — the number of seconds resolvers may cache that answer
      before asking the authoritative server again. A TTL of 300 means a
      change propagates within about five minutes; 86400 means up to a day.
      The figure shown here is Cloudflare's remaining cache time, so it counts
      down between repeated lookups rather than always showing the zone's
      configured value.
  - q: Why does an A lookup sometimes show a CNAME record too?
    a: >-
      When the name is an alias, the resolver returns the whole chain — the
      CNAME pointing at the canonical name, then that name's A or AAAA
      addresses. Each row is labelled with its actual record type so the chain
      is visible, which helps when working out why a subdomain resolves to a
      CDN's address instead of your own server.
  - q: What does Cloudflare learn when I use this?
    a: >-
      One thing per lookup: the domain name and record types you queried, sent
      to `cloudflare-dns.com` over HTTPS. This page attaches no cookies or
      identifiers to the request, and nothing is sent until you press Look up.
      Cloudflare's published policy for the 1.1.1.1 resolver commits to never
      selling query data and to purging query logs within 25 hours.
---

<!-- content-pending: Phase C -->
