---
name: Date Calculator
title: Date Calculator — Days Between Dates & Age | PrivacyKit
description: Find the days, weeks and months between two dates, add or subtract a duration from any date, or work out an exact age and the days until the next birthday.
category: datetime
keywords:
  - date calculator
  - days between dates
  - age calculator
  - date difference
  - add days to date
icon: calendar-stats
related:
  - unix-timestamp-converter
  - timezone-converter
  - cron-parser
privacy: local
popular: true
updated: 2026-07-07
jsonLdCategory: UtilitiesApplication
faqs:
  - q: How does the calculator count months when the two dates have different lengths?
    a: >-
      It advances whole months from the start date until one more month would
      pass the end date, clamping to the last valid day when a month is too
      short, then counts the leftover days. Worked example: 31 January 2024 to
      1 March 2024 reads as 1 month and 1 day, because 31 January plus one month
      lands on 29 February 2024 (a leap year), leaving a single extra day.
  - q: Are both the start and end dates included in the "days between" total?
    a: >-
      The total-days figure is the gap between the two dates, so it counts the
      steps rather than the dates themselves — 6 July to 9 July is 3 days. The
      weekday figure counts dates instead, and includes both ends, so it can
      read one higher than you might expect. Each line says which it is where it
      appears.
  - q: Does daylight saving time change the results?
    a: >-
      No. Every calculation runs on calendar dates in UTC, where each day is
      exactly 24 hours, so a spring-forward or autumn-back clock change never
      adds or drops a day from the count. The dates you enter are read as plain
      calendar dates, not as moments pinned to your local timezone.
  - q: How is the age worked out, and what happens with a 29 February birthday?
    a: >-
      Age uses the same year/month/day breakdown, measured from the birth date
      to today's local date, plus the total days lived. For a 29 February
      birthday in a non-leap year the "next birthday" countdown falls back to
      28 February — so from mid-2026, a 29 February birthday next comes due on
      28 February 2027.
  - q: Why might another date calculator show a slightly different month count?
    a: >-
      The gap between two dates spanning several months has no single agreed
      answer; the disagreement is in how a partial month is split. This tool
      uses the clamp-to-month-end rule (the same convention Python's dateutil
      applies). Calculators that assume fixed 30-day months, or borrow days in
      a different order, can differ by a day or a month at the boundaries.
  - q: Can I count only working days between two dates?
    a: >-
      Yes — the weekdays line counts Monday-to-Friday dates in the range and
      leaves out every Saturday and Sunday. It has no calendar of public
      holidays, which differ by country and state, so subtract those yourself if
      you need an exact working-day figure for leave or delivery estimates.
---

<!-- content-pending: round2 content -->
