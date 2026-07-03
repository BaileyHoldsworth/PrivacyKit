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

## How to use

1. Type a domain into the **Domain name** field, or paste a full URL — `https://` and any path are stripped for you, and an internationalised name is converted to punycode before it is sent.
2. Tick the **record types** you want. A, AAAA, MX and TXT are on by default; CNAME, NS, SOA and CAA are one click away when you need them.
3. Press **Look up records** (or hit Enter in the field). Nothing is queried until you do.
4. Read the results grouped by type — each row shows the value, its remaining TTL, and a **Copy** button. Use **Copy all** for a tab-separated, zone-file-style dump of everything, or **Clear** to start over.

## How it works

Before a single byte leaves the page, your input is normalised. The browser's `URL` constructor peels off the protocol and path, folds the host to lowercase, drops a trailing dot, and rejects anything that isn't a valid hostname — a bare IP address is refused here, since DNS answers questions about *names*. Each ticked type then becomes one HTTPS request to `cloudflare-dns.com/dns-query`, sent with the header `accept: application/dns-json`. Cloudflare's 1.1.1.1 resolver replies with JSON: a `Status` of 0 means success, 3 means the name does not exist, and the `Answer` array carries each record's name, numeric type, TTL and data.

Two transforms happen on the way to the screen. MX answers arrive in no guaranteed order, so they are sorted by their leading priority number — lowest first, matching the order a mail server would try them. TXT data comes back as one or more quoted strings, which are joined and unescaped into the single value you actually configured.

Say you paste `https://parcelroute.au/status?id=42` and tick MX. Normalisation reduces that to `parcelroute.au`, and the MX query returns two answers — `20 mx-backup.parcelroute.au` with a TTL of 1800, and `10 mx-primary.parcelroute.au` with a TTL of 3600 — in that arbitrary order. The tool reads the priorities, reorders them so `10 mx-primary.parcelroute.au` sits on top, and shows `TTL 1800s` and `TTL 3600s` as Cloudflare's own countdown, which drops each time you repeat the lookup.

## Use cases & limitations

This is the tool you open when a change to your zone isn't behaving: confirming an A record points where you moved a site, checking that an MX swap took before you cut over email, or reading a CAA record to see which certificate authorities a domain permits. Because it accepts underscored hostnames, it doubles as a way to inspect the `_dmarc` and `_domainkey` names that email authentication lives on. Once you have an address, [What Is My IP](/tools/what-is-my-ip/) shows the other side of the connection, and the [subnet calculator](/tools/subnet-calculator/) helps you place that address in a range.

The honest limit: you are seeing one resolver's cached view, not the global truth. Cloudflare's answer for an anycast or geo-steered service can differ from what a user in another region receives, and a record you edited seconds ago may still show its old value until the TTL you see counts down to zero. Split-horizon and internal DNS are invisible from here — only names published to the public internet resolve. There is also a 10-second ceiling per lookup, after which the query is reported as timed out.

## Privacy note

One request per ticked type reaches Cloudflare, carrying only the domain and record type — no cookies, no identifiers, and nothing at all until you press Look up. Everything else, including the URL-stripping that turns a pasted link into a bare hostname, runs in your browser; if you would rather remove tracking parameters from links generally, the [URL cleaner](/tools/url-cleaner/) does that locally without any network call. Cloudflare's stated policy for the 1.1.1.1 resolver is to purge query logs within 25 hours and never sell them.
