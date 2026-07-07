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

## How to use

1. Choose a mode with the three buttons at the top: **Difference** measures the gap between two dates, **Add / subtract** shifts a date by a duration, and **Age** reads a birth date.
2. In Difference, set a **From date** and a **To date** — both start on today. The result list fills in as you type, giving the span as years/months/days alongside total days, weeks, weekdays and hours.
3. In Add / subtract, enter a **Start date**, pick **Add** or **Subtract**, then type any mix of years, months, weeks and days. Blank fields count as zero.
4. In Age, enter a **Date of birth**; the picker refuses future dates. You get an exact age, the number of days lived, and the date of the next birthday.
5. Use the **Copy** button beside any line to lift a single figure without selecting text by hand.

## How it works

Every figure comes from plain calendar arithmetic run in UTC, so each day is a clean 24 hours and no daylight-saving shift can nudge a count. The days-between total counts the steps from one date to the other, while the weekday line instead tallies the Monday-to-Friday dates in the range and includes both ends. Month spans use a clamp-to-month-end rule: the tool advances whole months from the start, and when a target month is too short for the start day, it settles on that month's final day.

Adding a duration follows a fixed order — years and months first, under the same clamp, then weeks and days as a flat run of 24-hour steps. Worked example: begin on **31 August 2025**, choose **Add**, and enter **6 months** and **2 weeks**. Six months on from 31 August reaches February 2026, which holds only 28 days in this non-leap year, so the day clamps back to **28 February 2026**. The 14 days of the two weeks then roll it forward to **14 March 2026** — a Saturday, written **2026-03-14** in ISO form. Apply those days before the months and the answer would drift; fixing the order keeps it repeatable.

## Use cases & limitations

The everyday reasons to open this are counting down to a deadline, sizing a notice period or contract term, checking a warranty window, or reading an exact age off a birth date for a form. The weekday count suits leave requests and delivery estimates where only working days matter, and the add/subtract mode answers "what date is 90 days from now" without a wall calendar.

One honest limit: it works on whole calendar dates, not clock times, so it can't report the hours and minutes between two precise moments or account for the time of day. For arithmetic on exact instants, reach for the [Unix timestamp converter](/tools/unix-timestamp-converter/); to see where a single moment falls across regions, the [timezone converter](/tools/timezone-converter/) fits better. When the question is about a repeating schedule rather than a one-off gap, the [cron parser](/tools/cron-parser/) lays out the coming run times.
