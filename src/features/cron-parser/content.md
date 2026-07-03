---
name: Cron Expression Parser
title: Cron Expression Parser — Explain Any Crontab | PrivacyKit
description: Type a cron expression to see it explained in plain English, with the next 10 run times in your timezone or UTC and a field-by-field breakdown.
category: datetime
keywords:
  - cron
  - crontab
  - cron expression
  - cron parser
  - cron schedule
  - every 5 minutes
icon: calendar-time
related:
  - unix-timestamp-converter
  - timezone-converter
  - regex-tester
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: What do the five fields in a cron expression mean?
    a: >-
      Reading left to right: minute (0–59), hour (0–23), day of month (1–31),
      month (1–12 or JAN–DEC), and day of week (0–7 or SUN–SAT, where 0 and 7
      both mean Sunday). A `*` matches every value, `*/n` means "every n",
      `1-5` is a range, and `1,15` is a list. Some schedulers (Quartz, many
      CI systems) add a sixth leading field for seconds — this parser accepts
      that form too.
  - q: How do I write a cron expression for every 5 minutes?
    a: >-
      `*/5 * * * *`. The `*/5` in the minute field matches every minute value
      divisible by 5, so the job fires at :00, :05, :10 and so on through :55.
      To stagger it away from the top of the hour — useful when many jobs pile
      up at :00 — write `2-59/5` instead, which fires at :02, :07, :12 …
  - q: Why does my job run on days I didn't expect?
    a: >-
      Usually because day-of-month and day-of-week are combined with OR in
      standard cron when both are restricted. `0 0 1 * MON` runs on the 1st of
      every month *and* on every Monday — not only on Mondays that fall on the
      1st. Paste the expression here and scan the next-10-runs list; the
      surprise dates show up immediately.
  - q: Does the parser understand @daily, @hourly and the other macros?
    a: >-
      Yes. `@hourly`, `@daily`, `@weekly`, `@monthly` and `@yearly` expand to
      their five-field equivalents (`@daily` becomes `0 0 * * *`) and get the
      same explanation, run times and breakdown. `@reboot` is the exception:
      it fires at system start-up, not on a calendar, so there are no run
      times to predict for it.
  - q: Are the run times shown in my timezone or the server's?
    a: >-
      In your browser's local timezone by default — flip the UTC toggle to
      compare. Treat the list as a preview, not a promise: the machine that
      actually runs the crontab evaluates it in its own system timezone, so a
      `0 9 * * *` job on a UTC server fires at 19:00 in Sydney during AEST,
      not at 9 am.
  - q: Is Sunday 0 or 7 in the day-of-week field?
    a: >-
      Both. Vixie cron and most modern implementations accept either, along
      with the names SUN–SAT, and this parser treats 0 and 7 as the same day.
      If a crontab has to run on very old System V-style crons, stick to 0—
      some of those only understood 0–6.
  - q: Can cron run something every 90 minutes or every other week?
    a: >-
      Not in one expression. Cron fields reset at their natural boundary, so
      `*/90` in the minute field just means "at minute 0" of every hour, and
      there is no fortnight field at all. The usual workarounds are two
      complementary entries (e.g. `0 0,3,6,9,12,15,18,21 * * *` plus
      `30 1,4,7,10,13,16,19,22 * * *`) or a guard in the script itself.
---

A line like `0 3 * * 0` is unambiguous to the cron daemon and opaque to almost everyone else. Paste one in and this parser turns it into a sentence, a list of the next ten moments it will actually fire, and a table showing exactly what each field matched — so you can catch a mistake before it ships to a server.

## How to use

1. Type or paste a cron expression into the input. Five fields is standard; six is accepted when the first one is a seconds field. The default `*/5 * * * *` is there to edit over.
2. In a hurry, press a preset — Hourly, Weekdays 9 am, 1st of the month — to load a known-good expression and watch it decode.
3. Read the plain-English line, then scan the **Next 10 runs** list and check the dates against what you meant to schedule.
4. Toggle **Show in UTC** to line your local run times up against the timezone the server most likely uses.
5. Hit **Copy** beside either pane to lift the explanation or the whole run list onto your clipboard.

## How it works

Every keystroke (debounced by 150 ms) kicks off two passes. First the expression is checked for the right shape — five or six space-separated fields, or a macro such as `@daily`, which expands to its canonical form (`0 0 * * *`). Then `cron-parser` walks the calendar forward from the current instant to collect the next ten matches, while `cronstrue` renders the summary sentence. The field-by-field table is built separately: each token is expanded to the concrete set of numbers it matches, consecutive values are compressed into ranges, and a uniform step that overshoots the field's maximum collapses back into an "every N" phrase.

Take `30 6 * * 1,4`. The summary reads *At 06:30 AM, only on Monday and Thursday*. In the breakdown, the minute token `30` becomes "at minute 30" and the hour `6` becomes "at hour 6". The day-of-month and month fields are both `*`, so they read "every day of the month" and "every month". The day-of-week field `1,4` expands to the set {1, 4}; those are not consecutive, so they stay listed — "on Monday and Thursday". The runs list then shows the coming Monday and Thursday at 06:30, each tagged with a relative label like "in 2 days". Contrast that with a step field: `*/20` in the minute slot expands to {0, 20, 40}, and because 20 is a uniform step that runs past 59, the table shortens it to "every 20 minutes" rather than spelling out all three values.

## Use cases & limitations

This is the fastest way to review a colleague's crontab, work out why a job fired at 3 am, or draft a schedule before you commit it. The next-ten list is especially good at exposing the classic trap where a restricted day-of-month and a restricted day-of-week are combined with OR, so the job runs on far more days than intended.

The honest limitation: the run times are a preview computed in your browser, not a promise. The real machine evaluates the crontab in its own system timezone and only while the daemon is up, so daylight-saving shifts, downtime and clock drift all move the true fire times. To convert a predicted UTC run into another zone, reach for the [timezone converter](/tools/timezone-converter/); to turn an epoch value pulled from a log into a readable date, use the [Unix timestamp converter](/tools/unix-timestamp-converter/). And if the range-and-step syntax feels familiar, the [regex tester](/tools/regex-tester/) rewards the same paste-and-watch approach.
