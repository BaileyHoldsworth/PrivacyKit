/**
 * Programmatic long-tail pages for /cron/<preset>/ (the crontab.guru pattern).
 * Each has a unique hand-written note so the pages are not thin duplicates.
 * The English explanation is rendered from cronstrue at build time; "next
 * runs" is computed live in the browser.
 */
export interface CronPreset {
  slug: string;
  expr: string;
  /** One unique sentence about when you'd reach for this schedule. */
  note: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { slug: 'every-minute', expr: '* * * * *', note: 'The busiest schedule cron allows: it fires sixty times an hour. Reserve it for short health checks or queue drains, never for anything that might still be running when the next tick arrives.' },
  { slug: 'every-5-minutes', expr: '*/5 * * * *', note: 'A common polling cadence — frequent enough to feel near-real-time, sparse enough that a job comfortably finishes before the next run.' },
  { slug: 'every-10-minutes', expr: '*/10 * * * *', note: 'Ten-minute intervals suit sync jobs and cache warmers where a short delay is invisible to users but the load stays modest.' },
  { slug: 'every-15-minutes', expr: '*/15 * * * *', note: 'Four times an hour, on the quarter hours — a natural fit for metric roll-ups and moderate-frequency imports.' },
  { slug: 'every-30-minutes', expr: '*/30 * * * *', note: 'On the hour and half hour. Good for jobs whose cost you want to keep down while still refreshing twice an hour.' },
  { slug: 'every-hour', expr: '0 * * * *', note: 'Runs once at the top of every hour — the default choice for hourly reports, log rotation and hourly backups.' },
  { slug: 'every-2-hours', expr: '0 */2 * * *', note: 'Twelve runs a day at even hours; a middle ground when hourly is wasteful but daily is too coarse.' },
  { slug: 'every-6-hours', expr: '0 */6 * * *', note: 'Four times a day at midnight, 6am, noon and 6pm — handy for feed refreshes that should track the working day loosely.' },
  { slug: 'every-12-hours', expr: '0 */12 * * *', note: 'Twice daily at midnight and noon; suits jobs that want a morning and an evening pass.' },
  { slug: 'every-day-at-midnight', expr: '0 0 * * *', note: 'The classic nightly job: midnight in the server timezone, when traffic is usually lowest.' },
  { slug: 'every-day-at-1am', expr: '0 1 * * *', note: 'One in the morning — a popular slot for backups, deliberately offset from midnight so it does not collide with every other midnight job.' },
  { slug: 'every-day-at-2am', expr: '0 2 * * *', note: 'Two in the morning is the traditional maintenance window: reindexing, cleanup and vacuum jobs that want quiet and a completed midnight batch upstream.' },
  { slug: 'every-day-at-noon', expr: '0 12 * * *', note: 'Midday, every day — useful for a lunchtime digest or a once-a-day notification that should land while people are awake.' },
  { slug: 'every-weekday', expr: '0 9 * * 1-5', note: 'Nine in the morning, Monday to Friday: the schedule for anything that should follow the working week and skip weekends.' },
  { slug: 'every-weekday-at-8am', expr: '0 8 * * 1-5', note: 'An 8am Monday-to-Friday start, ahead of the working day — good for the report people expect to find waiting for them.' },
  { slug: 'every-weekend', expr: '0 10 * * 6,0', note: 'Ten in the morning on Saturday and Sunday only, for maintenance you deliberately keep off the working week.' },
  { slug: 'every-monday', expr: '0 9 * * 1', note: 'Nine on Monday morning — the natural home for a weekly kickoff summary.' },
  { slug: 'every-friday', expr: '0 17 * * 5', note: 'Five in the afternoon on Friday, a fitting slot for an end-of-week wrap-up before the weekend.' },
  { slug: 'every-sunday', expr: '0 0 * * 0', note: 'Midnight as Sunday begins — a common weekly boundary for rotating logs and resetting counters, and the schedule cron reports for a once-a-week job.' },
  { slug: 'first-day-of-month', expr: '0 0 1 * *', note: 'Midnight on the first of each month — for monthly invoices, statements and counters that reset with the calendar.' },
  { slug: 'every-quarter', expr: '0 0 1 1,4,7,10 *', note: 'Midnight on the first day of January, April, July and October — the quarter starts for financial roll-ups.' },
  { slug: 'every-year', expr: '0 0 1 1 *', note: 'Once a year at midnight on 1 January, for annual archives and yearly resets.' },
  { slug: 'every-3-hours', expr: '0 */3 * * *', note: 'Eight times a day at midnight, 3am, 6am and so on — a lighter cadence than hourly for jobs that can tolerate a few hours of staleness.' },
  { slug: 'every-4-hours', expr: '0 */4 * * *', note: 'Six evenly spaced runs a day. A comfortable interval for feed pulls and reports where hourly would be noise.' },
  { slug: 'every-day-at-6am', expr: '0 6 * * *', note: 'Six in the morning, daily — early enough to have results ready before the working day, after the quiet overnight window.' },
  { slug: 'every-day-at-9am', expr: '0 9 * * *', note: 'Nine each morning, when people arrive at their desks. A natural slot for a daily digest or standup summary.' },
  { slug: 'every-day-at-6pm', expr: '0 18 * * *', note: 'Six in the evening, daily — an end-of-day slot for closing reports or overnight batch preparation.' },
  { slug: 'every-15th-of-month', expr: '0 0 15 * *', note: 'Midnight on the 15th, a mid-month checkpoint that pairs well with a first-of-month job for twice-monthly cycles.' },
  { slug: 'every-tuesday', expr: '0 9 * * 2', note: 'Nine on Tuesday morning. Day-of-week 2 in cron; useful for a weekly task you deliberately keep off Monday.' },
  { slug: 'every-wednesday', expr: '0 9 * * 3', note: 'Nine on Wednesday morning — the mid-week slot, cron day-of-week 3.' },
  { slug: 'every-thursday', expr: '0 9 * * 4', note: 'Nine on Thursday morning, cron day-of-week 4. A common day for pre-weekend reports.' },
  { slug: 'every-saturday', expr: '0 9 * * 6', note: 'Nine on Saturday morning, cron day-of-week 6 — for weekend-only jobs that still want daylight hours.' },
  { slug: 'every-weekday-at-5pm', expr: '0 17 * * 1-5', note: 'Five in the afternoon, Monday to Friday — an end-of-workday trigger that skips the weekend.' },
  { slug: 'twice-a-day', expr: '0 9,17 * * *', note: 'Two runs a day at 09:00 and 17:00 using a comma list in the hour field — a morning and an evening pass without a second cron line.' },
];
