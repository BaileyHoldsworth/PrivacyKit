---
title: What Your IP Address Reveals — and What a VPN Changes
description: Your IP maps to an ISP and a city-sized area, not your front door. Here is who sees it, how geolocation actually works, and exactly what a VPN moves.
tools:
  - what-is-my-ip
  - dns-lookup
relatedGuides:
  - browser-fingerprinting
  - url-tracking-parameters
affiliateGroup: vpn
updated: 2026-07-03
---

Every reply from a server has to find its way back to you, so every request you
send carries a return address. That return address is your public IP, and it is
the single most misunderstood number in consumer privacy — treated by some as a
harmless routing detail and by others as a home address printed on your
forehead. Neither is right. This guide walks through what an IP genuinely
discloses, who gets to read it, and where a VPN helps versus where it does
nothing at all.

## The number on the envelope

Think of the IP as the sender line on an envelope, not the letter inside. It
exists so packets can be routed and answers returned; it is visible to anyone
who handles the mail. A typical home connection presents a single public IPv4
address — something like `203.0.113.42` — shared by every device in the house
through NAT, plus possibly an IPv6 address per device if your ISP routes it. You
can see exactly which addresses you present with [What Is My
IP](/tools/what-is-my-ip/); the value there is the one the whole internet reads.

What the address is *bound to* matters more than the digits. Public IP ranges
are allocated in blocks to organisations and recorded in regional registry
databases (APNIC for our region, ARIN for North America, RIPE for Europe). A
`whois` on the block returns the holder — nearly always an ISP or hosting
company, occasionally a large employer. That registry link is the honest core of
what your IP reveals: the network you are on, and roughly where that network
terminates you.

## What geolocation can actually resolve

Geolocation providers — MaxMind, IP2Location, IPinfo and friends — build tables
that map address ranges to a location. They do not have a satellite on you. They
infer position from registry data, ISP-published routing hints, latency
triangulation, and correction feedback from apps that also know GPS. The result
is a guess with an explicit confidence radius, and the accuracy collapses as you
zoom in:

| Field resolved | Typical accuracy | Why |
| --- | --- | --- |
| Country | 95–99% | Registry allocation is country-level and reliable |
| Region / state | ~80% | Usually inferable from the ISP's regional POPs |
| City | 50–75% | Depends on ISP density; often the POP, not you |
| Postcode | 20–50% | Mostly a guess extrapolated from city centroid |
| Street address | ~0% | Not encoded anywhere in the IP system |

The trap is the map pin. A provider returns latitude, longitude *and* an
accuracy radius — say 20 km — but consumer maps render only the pin. So a
service confidently drops a marker on a street corner that is really the centre
of a 1,250 km² circle of uncertainty. When you read that an IP "located" someone,
what actually happened is a city-ish centroid dressed up as precision.

## Worked example: one address, three viewers

Take the connection presenting `203.0.113.42` from a customer of a mid-size
Australian ISP. Here is what each party in the chain genuinely learns.

**A geolocation lookup** on that address might return:

```json
{
  "ip": "203.0.113.42",
  "country": "AU",
  "region": "New South Wales",
  "city": "Sydney",
  "latitude": -33.8688,
  "longitude": 151.2093,
  "accuracy_radius_km": 20,
  "asn": "AS7545",
  "org": "TPG Telecom Limited"
}
```

Read that honestly: country and state are solid; "Sydney" is really "somewhere
inside greater Sydney", and the coordinates are the CBD centroid — a placeholder,
not the subscriber. The genuinely certain fields are the last two: the autonomous
system number and the ISP name. That is the real yield.

**The website you visited** sees the raw `203.0.113.42`, runs the same lookup,
and can now (a) show region-appropriate content, (b) apply a geo-block, and
crucially (c) join today's visit to every past visit from the same address. The
IP is a linkage key.

**Your ISP** sees the other half of the picture. It knows exactly which account
`203.0.113.42` was leased to at 14:07, and it sees every destination you connect
to — because even when the *content* is encrypted by HTTPS, the *addresses* and
often the hostnames are not. That last point is why a [DNS
lookup](/tools/dns-lookup/) is worth understanding: unless you use encrypted DNS,
your resolver (often your ISP) watches you translate `my-health-clinic.example`
to an address before any TLS handshake begins.

So one address, three very different disclosures: an approximate location to a
website, a durable tracking key to advertisers, and a full destination log to
your ISP.

## What a VPN moves — and what it doesn't

A VPN routes your traffic through an encrypted tunnel to an exit server and
presents *that server's* IP to the world. Concretely, it swaps the parts of the
example above:

- **Websites now see the exit IP**, not `203.0.113.42`. Geolocation resolves to
  the VPN datacentre's city, and the ISP field reads the VPN's hosting provider.
  Your registry link is broken.
- **Your ISP loses the destination log.** It sees an encrypted tunnel to one VPN
  endpoint and nothing about what flows inside — including your DNS queries, if
  the VPN resolves them.

That is a real and meaningful shift. But a VPN is a proxy for *one signal*, and
sites identify you by many. It does not touch:

- **Logins and cookies.** Signed into an account, you are you regardless of exit
  IP. The VPN changes the envelope, not the fact that you licked the stamp.
- **Browser fingerprinting.** Your screen metrics, fonts, canvas rendering and
  more compose an identifier that survives an IP change entirely — the mechanism
  is covered in [browser fingerprinting](/guides/browser-fingerprinting/).
- **Tracking parameters** stapled to the links you click, which carry identity in
  the URL itself; see [what utm_, fbclid and gclid actually
  do](/guides/url-tracking-parameters/).
- **Trusting the VPN instead of the ISP.** You have not removed the observer; you
  have moved it. A VPN that logs is just an ISP you pay differently.

## Do you actually need one?

Honestly, most people don't need one running all day, and some are sold on fears
a VPN doesn't address. A short decision guide:

- **On public or untrusted Wi-Fi** — genuinely useful, though HTTPS already
  encrypts content; the VPN mainly hides destinations from the network operator.
- **To move your apparent country** (streaming region, travel, testing) — this is
  the one thing a VPN does cleanly and well.
- **To stop your ISP building a browsing profile** — effective, provided you
  trust the VPN more than the ISP and it doesn't log.
- **To "be anonymous"** — no. Anonymity is a fingerprinting and account-hygiene
  problem; a VPN is one layer, not the answer.
- **To stop being hacked "through your IP"** — no. Your router already drops
  unsolicited inbound traffic; this fear is misplaced.

If you do choose one, the property that matters is a credible no-logs stance,
ideally audited, and a business model that isn't reselling your traffic. The
strongest reputations in this space are earned on that point:
[Mullvad](https://mullvad.net) takes cash and account numbers instead of email
and has been audited repeatedly — worth naming precisely because we earn nothing
from it. Weigh any paid pick against that bar rather than against marketing.

## What to do next

Start by seeing your own exposure. Open [What Is My IP](/tools/what-is-my-ip/),
note the address and ISP, then run a geolocation lookup on it to check how close
the "location" really lands — usually a city centroid, not you. Turn a VPN on and
check again: the address, ISP and city should all change, which confirms the
tunnel is carrying your traffic. Then run a [DNS lookup](/tools/dns-lookup/) on a
site you use to see the naming layer your resolver watches, and consider
encrypted DNS so that log closes too. The IP is one signal among many — worth
understanding precisely so you spend effort where it actually moves the needle.
