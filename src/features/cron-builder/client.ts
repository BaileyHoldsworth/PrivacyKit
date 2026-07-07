import { $, $$, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="cron-builder"]');

if (root) {
  const freq = $<HTMLSelectElement>('#cb-frequency', root)!;
  const interval = $<HTMLInputElement>('#cb-interval', root)!;
  const hourlyMinute = $<HTMLInputElement>('#cb-hourly-minute', root)!;
  const time = $<HTMLInputElement>('#cb-time', root)!;
  const monthlyDay = $<HTMLInputElement>('#cb-monthly-day', root)!;
  const dowBoxes = $$<HTMLInputElement>('.cb-dow', root);
  const custom = {
    min: $<HTMLInputElement>('#cb-c-min', root)!,
    hour: $<HTMLInputElement>('#cb-c-hour', root)!,
    dom: $<HTMLInputElement>('#cb-c-dom', root)!,
    mon: $<HTMLInputElement>('#cb-c-mon', root)!,
    dow: $<HTMLInputElement>('#cb-c-dow', root)!,
  };
  const output = $<HTMLInputElement>('#cb-output', root)!;
  const openParser = $<HTMLAnchorElement>('#cb-open-parser', root)!;
  const errorEl = $('#cb-error', root)!;
  const englishEl = $('#cb-english', root)!;
  const runsEl = $('#cb-runs', root)!;
  const tzEl = $('#cb-tz', root)!;
  const copyRunsBtn = $<HTMLButtonElement>('#cb-copy-runs', root)!;

  // ---------- Which sub-controls a frequency exposes ----------
  const GROUPS = ['interval', 'hourly', 'time', 'weekdays', 'monthly', 'custom'] as const;
  type Group = (typeof GROUPS)[number];
  const groupEls: Record<Group, HTMLElement> = {
    interval: $('#cb-grp-interval', root)!,
    hourly: $('#cb-grp-hourly', root)!,
    time: $('#cb-grp-time', root)!,
    weekdays: $('#cb-grp-weekdays', root)!,
    monthly: $('#cb-grp-monthly', root)!,
    custom: $('#cb-grp-custom', root)!,
  };
  const VISIBLE: Record<string, Group[]> = {
    'every-minute': [],
    'every-n-minutes': ['interval'],
    hourly: ['hourly'],
    daily: ['time'],
    weekly: ['time', 'weekdays'],
    monthly: ['time', 'monthly'],
    custom: ['custom'],
  };

  function syncGroups(): void {
    const show = new Set(VISIBLE[freq.value] ?? []);
    for (const g of GROUPS) groupEls[g].hidden = !show.has(g);
  }

  // ---------- Building the 5-field expression ----------

  /** Parse the <input type="time"> value ("HH:MM") into hour + minute. */
  function parseTime(): { h: number; m: number } | null {
    const parts = time.value.split(':');
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      return null;
    }
    return { h, m };
  }

  /** Collapse a set of weekday numbers into cron list/range syntax (e.g. 1-5). */
  function compressDow(vals: number[]): string {
    const sorted = [...new Set(vals)].sort((a, b) => a - b);
    const runs: [number, number][] = [];
    let start = sorted[0]!;
    let prev = sorted[0]!;
    for (const v of sorted.slice(1)) {
      if (v === prev + 1) {
        prev = v;
        continue;
      }
      runs.push([start, prev]);
      start = prev = v;
    }
    runs.push([start, prev]);
    return runs.map(([a, b]) => (a === b ? String(a) : `${a}-${b}`)).join(',');
  }

  function buildExpression(): { expr: string; error: string } {
    switch (freq.value) {
      case 'every-minute':
        return { expr: '* * * * *', error: '' };
      case 'every-n-minutes': {
        const n = Number(interval.value);
        if (!Number.isInteger(n) || n < 1 || n > 59) {
          return { expr: '', error: 'Enter an interval between 2 and 59 minutes.' };
        }
        return { expr: `*/${n} * * * *`, error: '' };
      }
      case 'hourly': {
        const m = Number(hourlyMinute.value);
        if (!Number.isInteger(m) || m < 0 || m > 59) {
          return { expr: '', error: 'Enter a minute between 0 and 59.' };
        }
        return { expr: `${m} * * * *`, error: '' };
      }
      case 'daily': {
        const t = parseTime();
        if (!t) return { expr: '', error: 'Choose a valid time of day.' };
        return { expr: `${t.m} ${t.h} * * *`, error: '' };
      }
      case 'weekly': {
        const t = parseTime();
        if (!t) return { expr: '', error: 'Choose a valid time of day.' };
        const days = dowBoxes.filter((b) => b.checked).map((b) => Number(b.dataset.dow));
        if (days.length === 0) return { expr: '', error: 'Select at least one day of the week.' };
        return { expr: `${t.m} ${t.h} * * ${compressDow(days)}`, error: '' };
      }
      case 'monthly': {
        const t = parseTime();
        if (!t) return { expr: '', error: 'Choose a valid time of day.' };
        const d = Number(monthlyDay.value);
        if (!Number.isInteger(d) || d < 1 || d > 31) {
          return { expr: '', error: 'Enter a day of the month between 1 and 31.' };
        }
        return { expr: `${t.m} ${t.h} ${d} * *`, error: '' };
      }
      case 'custom': {
        const fields = [custom.min, custom.hour, custom.dom, custom.mon, custom.dow].map(
          (el) => el.value.trim() || '*'
        );
        // A space inside a field would silently change the field count.
        if (fields.some((f) => /\s/.test(f))) {
          return { expr: '', error: 'Each field is a single token — remove any spaces inside a field.' };
        }
        return { expr: fields.join(' '), error: '' };
      }
      default:
        return { expr: '', error: '' };
    }
  }

  // ---------- Rendering runs + explanation ----------

  // Both libraries load lazily so the initial page stays light; the promise is
  // shared and awaited on first render.
  const libs = Promise.all([import('cron-parser'), import('cronstrue')]);

  const localFmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const relFmt = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const REL_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ];

  function relativeLabel(d: Date): string {
    const diff = (d.getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    for (const [unit, size] of REL_UNITS) {
      if (abs >= size || unit === 'second') return relFmt.format(Math.round(diff / size), unit);
    }
    return relFmt.format(0, 'second');
  }

  let runDates: Date[] = [];
  let seq = 0;

  function setRunsMessage(text: string): void {
    runsEl.textContent = '';
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'field-hint';
    span.style.flex = '1';
    span.textContent = text;
    li.appendChild(span);
    runsEl.appendChild(li);
    tzEl.textContent = '';
  }

  function renderRuns(): void {
    runsEl.textContent = '';
    runDates.forEach((d, i) => {
      const li = document.createElement('li');
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(i + 1);
      const code = document.createElement('code');
      code.style.flex = '1';
      code.textContent = localFmt.format(d);
      const rel = document.createElement('span');
      rel.className = 'field-hint';
      rel.textContent = relativeLabel(d);
      li.append(badge, code, rel);
      runsEl.appendChild(li);
    });
    try {
      tzEl.textContent = `Times shown in ${Intl.DateTimeFormat().resolvedOptions().timeZone} (your browser's timezone).`;
    } catch {
      tzEl.textContent = '';
    }
  }

  function showError(message: string): void {
    errorEl.textContent = message;
    englishEl.textContent = '–';
    runDates = [];
    setRunsMessage('–');
  }

  async function render(): Promise<void> {
    const my = ++seq;
    const { expr, error } = buildExpression();
    output.value = expr;
    openParser.href = expr
      ? `/tools/cron-parser/?expr=${encodeURIComponent(expr)}`
      : '/tools/cron-parser/';

    if (error) {
      showError(error);
      return;
    }
    errorEl.textContent = '';

    let mods: Awaited<typeof libs>;
    try {
      mods = await libs;
    } catch {
      showError('The cron libraries could not be loaded — check your connection and reload the page.');
      return;
    }
    if (my !== seq) return;

    const [{ CronExpressionParser }, cronstrueMod] = mods;
    const cronstrue = cronstrueMod.default;

    // Only custom mode can produce an invalid expression; validate the field
    // count ourselves because cron-parser tolerates 4-field input.
    let parsed: ReturnType<typeof CronExpressionParser.parse>;
    try {
      const tokens = expr.split(' ');
      if (tokens.length !== 5) {
        throw new Error(`A cron line has 5 fields — this one has ${tokens.length}.`);
      }
      parsed = CronExpressionParser.parse(expr);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg.replace(/^Error:\s*/, ''));
      return;
    }

    try {
      englishEl.textContent = cronstrue.toString(expr);
    } catch {
      englishEl.textContent = 'No plain-English rendering is available for this expression.';
    }

    try {
      runDates = parsed.take(5).map((d) => d.toDate());
    } catch {
      runDates = [];
    }
    if (runDates.length > 0) renderRuns();
    else setRunsMessage('No upcoming run times could be computed for this expression.');
  }

  // ---------- Wiring ----------
  freq.addEventListener('change', () => {
    syncGroups();
    void render();
  });
  for (const el of [interval, hourlyMinute, time, monthlyDay]) {
    el.addEventListener('input', () => void render());
  }
  for (const b of dowBoxes) b.addEventListener('change', () => void render());
  for (const el of [custom.min, custom.hour, custom.dom, custom.mon, custom.dow]) {
    onInput(el, () => void render(), 150);
  }

  copyRunsBtn.addEventListener('click', () => {
    if (runDates.length === 0) {
      showToast('No run times to copy', 'error');
      return;
    }
    void copyText(runDates.map((d) => localFmt.format(d)).join('\n'));
  });

  syncGroups();
  void render();
}
