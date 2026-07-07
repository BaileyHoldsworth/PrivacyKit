import { $ } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="date-calculator"]');

if (root) {
  const DAY = 86_400_000;

  interface CalDate {
    y: number;
    /** 1-12 */
    m: number;
    d: number;
  }

  // ---------- Calendar math (all in UTC so day counts ignore DST) ----------

  const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const daysInMonth = (y: number, m: number): number =>
    m === 2 && isLeap(y) ? 29 : MONTH_LENGTHS[m - 1]!;

  /** Milliseconds at UTC midnight for a calendar date, correct for years 1-99. */
  function ymdToMs(c: CalDate): number {
    const ms = Date.UTC(c.y, c.m - 1, c.d);
    if (c.y >= 0 && c.y <= 99) {
      // Date.UTC maps 0-99 to 1900-1999; undo that mapping.
      const dt = new Date(ms);
      dt.setUTCFullYear(c.y);
      return dt.getTime();
    }
    return ms;
  }

  const msToYmd = (ms: number): CalDate => {
    const dt = new Date(ms);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  };

  const epochDay = (c: CalDate): number => Math.floor(ymdToMs(c) / DAY);

  /** Add whole months, clamping the day to the target month's length. */
  function addMonthsCal(c: CalDate, delta: number): CalDate {
    const total = c.y * 12 + (c.m - 1) + delta;
    const ny = Math.floor(total / 12);
    const nm = ((total % 12) + 12) % 12; // 0-11
    return { y: ny, m: nm + 1, d: Math.min(c.d, daysInMonth(ny, nm + 1)) };
  }

  /** Year/month/day breakdown from start to end, assuming start <= end. */
  function diffYMD(s: CalDate, e: CalDate): { years: number; months: number; days: number } {
    let totalMonths = (e.y - s.y) * 12 + (e.m - s.m);
    let cand = addMonthsCal(s, totalMonths);
    if (ymdToMs(cand) > ymdToMs(e)) {
      totalMonths -= 1;
      cand = addMonthsCal(s, totalMonths);
    }
    const days = Math.round((ymdToMs(e) - ymdToMs(cand)) / DAY);
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days };
  }

  // day 0 (1970-01-01) is a Thursday, so 0=Sun … 6=Sat.
  const dowOf = (dn: number): number => (((dn + 4) % 7) + 7) % 7;

  /** Count Mon-Fri dates in the inclusive epoch-day range [a, b]. */
  function weekdaysInclusive(a: number, b: number): number {
    if (b < a) return 0;
    const total = b - a + 1;
    const fullWeeks = Math.floor(total / 7);
    let count = fullWeeks * 5;
    const rem = total % 7;
    for (let i = 0; i < rem; i++) {
      const w = dowOf(a + i);
      if (w !== 0 && w !== 6) count++;
    }
    return count;
  }

  // ---------- Parsing & formatting ----------

  function parseDate(value: string): CalDate | null {
    const m = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
    return { y, m: mo, d };
  }

  const pad = (n: number, len: number): string => String(Math.abs(n)).padStart(len, '0');
  const toISO = (c: CalDate): string =>
    `${c.y < 0 ? '-' : ''}${pad(c.y, 4)}-${pad(c.m, 2)}-${pad(c.d, 2)}`;

  const todayLocal = (): CalDate => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
  };

  const longFmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const dowFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' });

  const plural = (n: number, unit: string): string => `${n} ${unit}${n === 1 ? '' : 's'}`;
  const num = (n: number): string => n.toLocaleString();

  // ---------- Elements ----------

  const el = <T extends HTMLElement = HTMLElement>(id: string): T => $<T>(`#${id}`, root)!;

  const tabDiff = el('dc-tab-diff');
  const tabAdd = el('dc-tab-add');
  const tabAge = el('dc-tab-age');
  const panelDiff = el('dc-panel-diff');
  const panelAdd = el('dc-panel-add');
  const panelAge = el('dc-panel-age');

  const diffFrom = el<HTMLInputElement>('dc-diff-from');
  const diffTo = el<HTMLInputElement>('dc-diff-to');
  const diffError = el('dc-diff-error');
  const diffNote = el('dc-diff-note');
  const diffDuration = el('dc-diff-duration');
  const diffDays = el('dc-diff-days');
  const diffWeeks = el('dc-diff-weeks');
  const diffWeekdays = el('dc-diff-weekdays');
  const diffHours = el('dc-diff-hours');

  const addStart = el<HTMLInputElement>('dc-add-start');
  const addOp = el<HTMLSelectElement>('dc-add-op');
  const addYears = el<HTMLInputElement>('dc-add-years');
  const addMonths = el<HTMLInputElement>('dc-add-months');
  const addWeeks = el<HTMLInputElement>('dc-add-weeks');
  const addDays = el<HTMLInputElement>('dc-add-days');
  const addError = el('dc-add-error');
  const addResult = el('dc-add-result');
  const addIso = el('dc-add-iso');
  const addDow = el('dc-add-dow');

  const ageBirth = el<HTMLInputElement>('dc-age-birth');
  const ageError = el('dc-age-error');
  const ageAge = el('dc-age-age');
  const ageDays = el('dc-age-days');
  const ageNext = el('dc-age-next');

  const setCells = (pairs: [HTMLElement, string][]): void => {
    for (const [node, text] of pairs) node.textContent = text;
  };

  const intVal = (input: HTMLInputElement): number => {
    const n = Math.floor(Number(input.value));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  // ---------- Difference ----------

  function renderDiff(): void {
    diffError.textContent = '';
    diffNote.textContent = '';
    const from = parseDate(diffFrom.value);
    const to = parseDate(diffTo.value);
    if (!from || !to) {
      setCells([
        [diffDuration, '–'],
        [diffDays, '–'],
        [diffWeeks, '–'],
        [diffWeekdays, '–'],
        [diffHours, '–'],
      ]);
      if (diffFrom.value && diffTo.value) diffError.textContent = 'Enter two valid dates.';
      else if (diffFrom.value || diffTo.value) diffNote.textContent = 'Pick both dates to see the difference.';
      return;
    }

    let s = from;
    let e = to;
    let reversed = false;
    if (ymdToMs(from) > ymdToMs(to)) {
      s = to;
      e = from;
      reversed = true;
    }

    const totalDays = Math.round((ymdToMs(e) - ymdToMs(s)) / DAY);
    const ymd = diffYMD(s, e);
    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;
    const weekdays = weekdaysInclusive(epochDay(s), epochDay(e));

    setCells([
      [diffDuration, `${plural(ymd.years, 'year')}, ${plural(ymd.months, 'month')}, ${plural(ymd.days, 'day')}`],
      [diffDays, plural(totalDays, 'day')],
      [diffWeeks, remDays ? `${plural(weeks, 'week')}, ${plural(remDays, 'day')}` : plural(weeks, 'week')],
      [diffWeekdays, `${num(weekdays)} (Mon–Fri, both dates counted)`],
      [diffHours, plural(totalDays * 24, 'hour')],
    ]);

    if (reversed) diffNote.textContent = 'The second date is earlier than the first — showing the span between them.';
    else if (totalDays === 0) diffNote.textContent = 'Both dates fall on the same day.';
  }

  // ---------- Add / subtract ----------

  function renderAdd(): void {
    addError.textContent = '';
    const start = parseDate(addStart.value);
    if (!start) {
      setCells([[addResult, '–'], [addIso, '–'], [addDow, '–']]);
      if (addStart.value) addError.textContent = 'Enter a valid start date.';
      return;
    }

    const sign = addOp.value === 'sub' ? -1 : 1;
    const monthsDelta = sign * (intVal(addYears) * 12 + intVal(addMonths));
    const afterMonths = addMonthsCal(start, monthsDelta);
    const resultMs = ymdToMs(afterMonths) + sign * (intVal(addWeeks) * 7 + intVal(addDays)) * DAY;

    if (!Number.isFinite(resultMs) || Math.abs(resultMs) > 8.64e15) {
      setCells([[addResult, '–'], [addIso, '–'], [addDow, '–']]);
      addError.textContent = 'That duration lands outside the supported date range.';
      return;
    }

    const r = msToYmd(resultMs);
    setCells([
      [addResult, longFmt.format(resultMs)],
      [addIso, toISO(r)],
      [addDow, dowFmt.format(resultMs)],
    ]);
  }

  // ---------- Age ----------

  function renderAge(): void {
    ageError.textContent = '';
    const birth = parseDate(ageBirth.value);
    if (!birth) {
      setCells([[ageAge, '–'], [ageDays, '–'], [ageNext, '–']]);
      if (ageBirth.value) ageError.textContent = 'Enter a valid date of birth.';
      return;
    }

    const today = todayLocal();
    if (ymdToMs(birth) > ymdToMs(today)) {
      setCells([[ageAge, '–'], [ageDays, '–'], [ageNext, '–']]);
      ageError.textContent = 'That date is in the future — enter a past date of birth.';
      return;
    }

    const age = diffYMD(birth, today);
    const lived = Math.round((ymdToMs(today) - ymdToMs(birth)) / DAY);

    const clampDay = (yr: number): number => Math.min(birth.d, daysInMonth(yr, birth.m));
    let nb: CalDate = { y: today.y, m: birth.m, d: clampDay(today.y) };
    if (ymdToMs(nb) < ymdToMs(today)) nb = { y: today.y + 1, m: birth.m, d: clampDay(today.y + 1) };
    const until = Math.round((ymdToMs(nb) - ymdToMs(today)) / DAY);

    setCells([
      [ageAge, `${plural(age.years, 'year')}, ${plural(age.months, 'month')}, ${plural(age.days, 'day')}`],
      [ageDays, plural(lived, 'day')],
      [ageNext, until === 0 ? `${toISO(nb)} · today` : `${toISO(nb)} · in ${plural(until, 'day')}`],
    ]);
  }

  // ---------- Tabs ----------

  type Mode = 'diff' | 'add' | 'age';
  function setMode(next: Mode): void {
    const tabs: [Mode, HTMLElement, HTMLElement][] = [
      ['diff', tabDiff, panelDiff],
      ['add', tabAdd, panelAdd],
      ['age', tabAge, panelAge],
    ];
    for (const [mode, tab, panel] of tabs) {
      const active = mode === next;
      tab.classList.toggle('btn-primary', active);
      tab.setAttribute('aria-pressed', String(active));
      panel.hidden = !active;
    }
    if (next === 'diff') renderDiff();
    else if (next === 'add') renderAdd();
    else renderAge();
  }

  tabDiff.addEventListener('click', () => setMode('diff'));
  tabAdd.addEventListener('click', () => setMode('add'));
  tabAge.addEventListener('click', () => setMode('age'));

  const bind = (input: HTMLElement, fn: () => void): void => {
    input.addEventListener('input', fn);
    input.addEventListener('change', fn);
  };
  for (const input of [diffFrom, diffTo]) bind(input, renderDiff);
  for (const input of [addStart, addOp, addYears, addMonths, addWeeks, addDays]) bind(input, renderAdd);
  bind(ageBirth, renderAge);

  // ---------- Initial state ----------

  const today = todayLocal();
  diffFrom.value = toISO(today);
  diffTo.value = toISO(today);
  addStart.value = toISO(today);
  ageBirth.max = toISO(today); // stop the picker offering future dates

  setMode('diff');
}
