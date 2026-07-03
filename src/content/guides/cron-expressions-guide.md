---
title: A Practical Guide to Cron Expressions
description: Read and write any crontab line with confidence — the five fields, step and range syntax, the day-of-week trap, timezone pitfalls and worked examples.
tools:
  - cron-parser
  - unix-timestamp-converter
relatedGuides:
  - csprng-vs-math-random
updated: 2026-07-03
---

Cron has scheduled Unix jobs since the 1970s, and the syntax has barely changed since — which means the five little fields on a crontab line are worth learning once, properly. The trouble is that most people copy an expression from somewhere, watch it fire at the wrong time, and tweak it by trial and error. A few minutes understanding what each field means turns that guessing game into something you can read at a glance.

## The five fields

A standard cron line is five whitespace-separated fields, followed by the command to run. Left to right, they are:

```
┌───────────── minute        (0–59)
│ ┌─────────── hour          (0–23)
│ │ ┌───────── day of month  (1–31)
│ │ │ ┌─────── month         (1–12)
│ │ │ │ ┌───── day of week   (0–7, where 0 and 7 both mean Sunday)
│ │ │ │ │
* * * * *  command
```

An asterisk in a field means "every value of this field". So `* * * * *` runs the command every minute of every hour of every day — the schedule the [cron expression parser](/tools/cron-parser/) describes as "every minute". Put a concrete number in a field and you pin it: `30 2 * * *` means minute 30, hour 2, every day — half past two in the morning.

## Steps, ranges and lists

Three operators do most of the real work:

| Syntax | Meaning | Example | Reads as |
| --- | --- | --- | --- |
| `,` | a list of values | `0 8,12,17 * * *` | at 08:00, 12:00 and 17:00 |
| `-` | an inclusive range | `0 9-17 * * *` | every hour from 09:00 to 17:00 |
| `/` | a step interval | `*/15 * * * *` | every 15 minutes |

Steps are the one that trips people up. `*/15` in the minute field means "starting at 0, every 15th minute", so it fires at :00, :15, :30 and :45 — four times an hour, not "15 minutes after the job last ran". Steps combine with ranges too: `0-30/10` means minutes 0, 10, 20 and 30 only.

## A worked example

Take `0 9 * * 1-5` and read it field by field. Minute `0`, hour `9`, day-of-month `*` (every day), month `*` (every month), day-of-week `1-5`. Days of the week are numbered from Sunday as 0, so 1–5 is Monday through Friday. The whole line therefore means: **at 09:00, Monday to Friday**. That is the classic "run on weekday mornings" schedule — a daily report that should skip the weekend. Paste it into the parser and it will confirm the reading and show you the next ten fire times in your own timezone.

Now change one field: `0 9 1 * 1-5`. Adding `1` to the day-of-month field does **not** narrow it to "the first weekday". It does something most people find surprising, which is worth its own section.

## The day-of-month / day-of-week trap

When *both* the day-of-month field and the day-of-week field are restricted (neither is `*`), cron treats them as an **OR**, not an AND. So `0 9 1 * 1-5` means "at 09:00 on the 1st of the month, **or** on any weekday" — which is simply every weekday plus the occasional weekend 1st. This is the single most common cron bug. If you want "the first of the month, but only if it's a weekday", cron cannot express it in one line; you check the day inside the job instead. Keep one of the two day fields as `*` whenever you can, and the ambiguity disappears.

## Timezones and DST

A cron daemon runs in a specific timezone — historically the server's local zone, though systemd timers and most managed schedulers now let you set it explicitly. Two consequences follow. First, `0 0 * * *` is midnight *there*, which may be mid-afternoon for you; the parser deliberately shows next-run times in your browser's timezone so you can see the offset. Second, daylight-saving transitions create gaps and repeats: a job scheduled for 02:30 will be skipped on the spring-forward night (02:30 never happens) and run twice on the autumn night (02:30 happens twice). For anything sensitive, schedule outside the 01:00–03:00 window, or run in UTC where DST doesn't exist.

## Non-standard shorthands

Many cron implementations accept named shortcuts: `@hourly` (equivalent to `0 * * * *`), `@daily` / `@midnight` (`0 0 * * *`), `@weekly` (`0 0 * * 0`), `@monthly` (`0 0 1 * *`), `@yearly` (`0 0 1 1 *`) and `@reboot` (once at startup). They read nicely, but they are not portable to every scheduler, so when in doubt spell out the five fields. If you want ready-made expressions for common cases, the [cron parser tool](/tools/cron-parser/) links out to pages for schedules like every 5 minutes, every weekday and the first of the month, each with its own breakdown.

## What to do next

Two habits make cron painless. Always read an unfamiliar expression left to right, field by field, before trusting it — and paste it into the [cron expression parser](/tools/cron-parser/) to check your reading and preview the actual fire times. When those times look like Unix timestamps in logs rather than clock times, the [Unix timestamp converter](/tools/unix-timestamp-converter/) turns them back into readable dates. Cron rewards a few minutes of precision with years of jobs firing exactly when you meant them to.
