---
name: Cron Expression Builder
title: Cron Expression Builder — Build a Crontab Line | PrivacyKit
description: "Build a valid five-field cron expression from friendly controls: choose a frequency, set the time, and preview the next five run times in your timezone."
category: datetime
keywords:
  - cron builder
  - cron expression builder
  - build cron
  - cron maker
  - cron generator
icon: calendar-time
related:
  - cron-parser
  - unix-timestamp-converter
  - timezone-converter
privacy: local
popular: false
updated: 2026-07-07
jsonLdCategory: DeveloperApplication
faqs:
  - q: How do I build an expression that runs every 15 minutes?
    a: >-
      Choose **Every N minutes** and set the interval to 15. The builder emits
      `*/15 * * * *`, which fires at :00, :15, :30 and :45 past every hour. One
      trap the preview exposes: an interval that does not divide 60 resets at
      the top of the hour. Pick 20 and you get `*/20`, firing at :00, :20 and
      :40 — a 40-minute gap between :40 and the next :00, not the even
      20-minute spacing the wording suggests.
  - q: Why does my monthly job skip some months?
    a: >-
      A day-of-month value that a month does not have is never matched.
      Set **Monthly** to day 31 and the result `0 0 31 * *` runs in January and
      March but never in February, April, June, September or November. The
      next-five-runs list makes this obvious. If you need "the last day of every
      month", pick day 28 for a value every month shares, or reach for a
      scheduler that supports the `L` character — standard cron and this builder
      stick to portable syntax.
  - q: Is Sunday 0 or 7 in the day-of-week field?
    a: >-
      This builder writes Sunday as `0`. Select Saturday and Sunday under
      **Weekly** and you get `0 10 * * 0,6`. Most modern crons also accept 7 for
      Sunday and the names SUN–SAT, but 0 is the value that works everywhere,
      including older System V implementations, so it is what the tool produces.
  - q: Can it schedule something every two weeks or on the last weekday?
    a: >-
      No single five-field cron line can express "every fortnight" — cron has a
      day-of-week field and a day-of-month field but no week-of-year counter, so
      the pattern has nowhere to live. The usual workarounds are two
      complementary crontab entries or a date check inside the script itself.
      This builder deliberately avoids the non-portable `L` (last) and `#`
      (nth weekday) extensions, so it will not offer schedules that break on a
      plain Vixie cron.
  - q: Do the previewed run times match when the job actually fires?
    a: >-
      Treat the next-five list as a preview computed in your browser's local
      timezone, not a guarantee. The machine running the crontab evaluates the
      same expression in its own system timezone and only while the daemon is
      up, so a `0 9 * * *` line on a UTC server fires at 19:00 in Sydney during
      AEST. To line the two zones up before you commit, convert a run through
      the [timezone converter](/tools/timezone-converter/).
  - q: Does it support the seconds field or macros like @daily?
    a: >-
      The output is always a standard five-field expression — minute, hour, day
      of month, month, day of week — with no leading seconds field and no
      `@daily`-style macro, because that is the form crontab, most CI schedulers
      and cloud cron services accept. If you have a six-field or `@`-macro
      expression to read the other way, paste it into the
      [cron parser](/tools/cron-parser/) instead.
---

## How to use

1. Open the **How often should it run?** menu and pick a frequency. The controls beneath it swap to match your choice, so you only ever see the fields that frequency actually needs.
2. Fill in the details for that frequency — an interval in minutes, a minute past the hour, a time of day, a row of weekday checkboxes, or a day of the month. Prefer to write the fields yourself? Choose **Custom** and edit minute, hour, day of month, month, and day of week directly.
3. Read the finished line in the **Cron expression** box, with a plain-English translation printed directly below it.
4. Scan the **Next 5 runs** list to confirm the line fires when you expect. Each entry is stamped in your browser's timezone next to a relative label such as "tomorrow" or "in 6 hours".
5. Press **Copy** on the expression pane to grab the line, or the Copy button above the run list to lift all five timestamps at once.

## How it works

A cron line is five fields separated by single spaces, read left to right as minute, hour, day of month, month, and day of week. An asterisk means "every value"; a bare number pins the field; `*/n` steps in increments; a comma lists values; a hyphen spans a range. The builder never asks you to memorise that grammar — it assembles the five tokens from whichever friendly controls the chosen frequency exposes.

Take a weekday backup at half past two in the morning. Select **Weekly**, set the time to 02:30, then tick Monday through Friday while leaving Saturday and Sunday clear. Behind the scenes the builder collapses the run of consecutive weekday numbers 1, 2, 3, 4, 5 into the compact range `1-5` instead of the longer list `1,2,3,4,5`, and drops your time into the minute and hour slots. The output is `30 2 * * 1-5` — minute 30, hour 2, any day of the month, any month, Monday to Friday.

That finished string is then handed to two small libraries the page loads on demand. One renders it as the sentence "At 02:30 AM, Monday through Friday"; the other computes the next five firing times and formats each against your system clock. Because the preview is generated live, editing any control rebuilds both the line and its schedule in the same keystroke.

## Use cases & limitations

Open this when you are writing a crontab entry, a scheduled GitHub Actions workflow, or a cloud scheduler rule and want the syntax right the first time — plus a concrete list of run times to sanity-check before you commit. The opposite job, reading a line someone else wrote, belongs to the [cron parser](/tools/cron-parser/), which the expression pane links to with your current line already pre-filled.

The honest limit is scope: the builder only emits portable, standard five-field cron. It will not produce a seconds field, an `@reboot`-style macro, or the `L`, `W` and `#` extensions that Quartz and some cloud schedulers add, because those break on a plain Vixie cron. Anything the friendly modes cannot express — a job that runs only during business hours on alternating weeks, say — needs Custom mode or a few separate lines working together. And the run-time preview is drawn against your browser clock: if the server that owns the crontab runs on UTC, line the zones up first with the [timezone converter](/tools/timezone-converter/), or turn a single run into an epoch value with the [unix timestamp converter](/tools/unix-timestamp-converter/).
