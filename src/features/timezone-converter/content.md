---
name: Timezone Converter
title: Timezone Converter — Compare Times Across Zones | PrivacyKit
description: Convert a date and time between IANA timezones and compare several zones at once, with day-change badges. Runs on your browser's built-in Intl data.
category: datetime
keywords:
  - timezone converter
  - time zone
  - utc converter
  - meeting planner
  - time difference
icon: world-longitude
related:
  - unix-timestamp-converter
  - cron-parser
  - what-is-my-ip
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: How does the converter know when daylight saving starts in each timezone?
    a: >-
      It doesn't ship its own table — it asks your browser. Every browser
      bundles the IANA timezone database through the built-in `Intl` API, with
      past and scheduled DST transitions for every zone. When you convert a
      date, the browser applies the offset in force *at that moment*, so a
      July conversion for Sydney uses AEST (UTC+10) while a January one uses
      AEDT (UTC+11).
  - q: Why are timezones named after cities, like Australia/Sydney, instead of AEST or GMT+10?
    a: >-
      Abbreviations are ambiguous — CST is used for China, Cuba and US Central
      time — and fixed offsets break the moment daylight saving flips. An IANA
      name identifies a region whose clocks have always agreed with each
      other, so `Australia/Sydney` stays correct all year while "+10" is only
      right for half of it.
  - q: What does the +1d or −1d badge on a row mean?
    a: >-
      The same instant falls on a different calendar date in that zone than in
      your source zone. 8 pm Thursday in Los Angeles is already noon *Friday*
      in Tokyo, so Tokyo's row shows +1d. It is the detail that quietly ruins
      meeting invitations, which is why it gets a badge instead of a footnote.
  - q: What happens if I enter a time that doesn't exist, like 2:30 am on a spring-forward night?
    a: >-
      When clocks jump from 2:00 straight to 3:00, 2:30 never happens in that
      zone. The converter resolves it the way calendar apps do — it lands on
      the instant the clock actually reaches (3:30 that morning) and shows a
      note so the adjustment isn't silent. For the opposite case, an ambiguous
      time that occurs twice when clocks fall back, it uses the first
      (pre-transition) occurrence.
  - q: What's the difference between UTC and GMT?
    a: >-
      For converting a meeting time, nothing you will notice — both mean zero
      offset. Technically GMT is a timezone historically tied to solar time at
      Greenwich, while UTC is the atomic-clock standard all zone offsets are
      defined against. Both appear in the zone list; pick UTC when you want to
      be unambiguous in technical contexts.
  - q: Is my zone list saved anywhere, and does the tool work offline?
    a: >-
      The zones you add are kept in your browser's localStorage under a single
      key, so the list is waiting next visit — on this device only, never sent
      to a server. Conversion itself makes no network requests at all: the
      timezone data is already inside your browser, so once the page has
      loaded everything works offline.
---

## How to use

1. Enter the moment you care about in **Date and time**, or press **Set to now** to drop in the current time down to the minute.
2. Choose which zone that reading belongs to under **In timezone**. It defaults to your own, detected from your browser, but you can pick any zone as the source.
3. Type a city or region into **Add a timezone to compare** — suggestions appear as you type — then press **Add zone**. Repeat for each zone you want to see, up to twenty.
4. Read the results below. A **+1d** or **−1d** badge marks any zone that has rolled over to a different calendar date than your source.
5. Copy one row with its **Copy** button, or take the whole comparison with **Copy all**. The ✕ beside a row drops that zone.

## How it works

No timezone table ships with this page. Every offset is read from the IANA database your browser already carries, reached through the `Intl.DateTimeFormat` API. That API is built to turn an instant into a wall-clock reading for a given zone — but a converter needs the opposite: you type a wall-clock time and it has to find the underlying instant. The tool inverts `Intl` by reading the zone's offset at roughly the right moment, subtracting it, then running a second refinement pass so daylight-saving boundaries land on the correct side.

Take 6:00 pm on 21 November 2026, entered as `Australia/Adelaide`. Adelaide observes daylight saving that month, so its offset is UTC+10:30. The converter subtracts it — 18:00 minus 10 h 30 m — to recover 07:30 UTC as the real instant. From there every target is a plain addition. `Asia/Tokyo` runs UTC+9 year-round, so it reads 4:30 pm the same day, no badge. `America/Los_Angeles`, where clocks fell back to UTC−8 on 1 November, reads 11:30 pm — but on 20 November, a day behind the source, so its row shows a **−1d** badge. Change the source date to July and the same cities shift, because the browser applies each zone's offset *as it stood on that date*, not a fixed number.

## Use cases & limitations

The everyday reach for this is scheduling: fixing a call time that lands sanely for a team split across three continents, or working out what "end of business Friday" in one office means for another. It is equally handy when a log line or ticket quotes a time in an unfamiliar zone and you want it in yours — pair it with the [Unix timestamp converter](/tools/unix-timestamp-converter/) when the source is an epoch number rather than a written date, or with the [cron parser](/tools/cron-parser/) when you are reasoning about when a scheduled job actually fires.

The honest limit is that accuracy is only as fresh as your browser. DST rules are politics, not physics — governments change them, sometimes at short notice — and the offsets here come from whatever IANA data your browser was last updated with. A years-out-of-date browser can be wrong about a newly legislated transition. Two edge cases are resolved automatically: a time that never happens on a spring-forward night lands on the instant the clock actually reaches, and a time that happens twice on a fall-back night uses the first occurrence.

## Privacy note

Conversion runs entirely in the page and makes no network requests — the timezone data is already inside your browser, so it works offline once loaded. The list of zones you add is saved in this browser's localStorage under a single key, on this device only; it is never uploaded, and clearing your site data removes it.
