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

<!-- content-pending: Phase C -->
