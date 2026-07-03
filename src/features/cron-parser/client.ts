import { $, $$, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="cron-parser"]');

if (root) {
  const input = $<HTMLInputElement>('#cron-input', root)!;
  const errorEl = $('#cron-error', root)!;
  const englishEl = $('#cron-english', root)!;
  const runsEl = $('#cron-runs', root)!;
  const tzEl = $('#cron-tz', root)!;
  const utcToggle = $<HTMLInputElement>('#cron-utc', root)!;
  const copyRunsBtn = $<HTMLButtonElement>('#cron-copy-runs', root)!;

  // Both libraries load lazily so the initial page stays light; the promise
  // is shared and awaited on first parse.
  const libs = Promise.all([import('cron-parser'), import('cronstrue')]);

  type FieldKind = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

  interface FieldMeta {
    kind: FieldKind;
    min: number;
    max: number;
    unit: string;
    everyText: string;
  }

  const FIELDS: FieldMeta[] = [
    { kind: 'second', min: 0, max: 59, unit: 'second', everyText: 'every second' },
    { kind: 'minute', min: 0, max: 59, unit: 'minute', everyText: 'every minute' },
    { kind: 'hour', min: 0, max: 23, unit: 'hour', everyText: 'every hour' },
    { kind: 'dayOfMonth', min: 1, max: 31, unit: 'day', everyText: 'every day of the month' },
    { kind: 'month', min: 1, max: 12, unit: 'month', everyText: 'every month' },
    { kind: 'dayOfWeek', min: 0, max: 6, unit: 'day', everyText: 'every day of the week' },
  ];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const localFmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
  const utcFmt = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
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
    const diffSec = (d.getTime() - Date.now()) / 1000;
    const abs = Math.abs(diffSec);
    for (const [unit, size] of REL_UNITS) {
      if (abs >= size || unit === 'second') {
        return relFmt.format(Math.round(diffSec / size), unit);
      }
    }
    return relFmt.format(0, 'second');
  }

  function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] ?? s[v] ?? 'th'}`;
  }

  function nameFor(kind: FieldKind, v: number): string {
    if (kind === 'month') return MONTH_NAMES[v - 1] ?? String(v);
    if (kind === 'dayOfWeek') return DAY_NAMES[v] ?? String(v);
    return String(v);
  }

  /** Compress a sorted numeric list into runs of consecutive values. */
  function compress(vals: number[]): [number, number][] {
    const out: [number, number][] = [];
    let start = vals[0]!;
    let prev = vals[0]!;
    for (const v of vals.slice(1)) {
      if (v === prev + 1) {
        prev = v;
        continue;
      }
      out.push([start, prev]);
      start = prev = v;
    }
    out.push([start, prev]);
    return out;
  }

  function listText(kind: FieldKind, vals: number[]): string {
    const parts = compress(vals).map(([a, b]) => {
      if (a === b) return nameFor(kind, a);
      if (b === a + 1) return `${nameFor(kind, a)} and ${nameFor(kind, b)}`;
      return `${nameFor(kind, a)} through ${nameFor(kind, b)}`;
    });
    if (parts.length === 1) return parts[0]!;
    return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]!}`;
  }

  function describe(meta: FieldMeta, token: string, values: readonly (number | string)[]): string {
    const upper = token.toUpperCase();

    // Special day-of-week forms the numeric values can't express.
    if (meta.kind === 'dayOfWeek' && upper.includes('#')) {
      const nth = Number(upper.split('#')[1]);
      const day = values.find((v): v is number => typeof v === 'number');
      if (Number.isInteger(nth) && day !== undefined) {
        return `on the ${ordinal(nth)} ${DAY_NAMES[day % 7] ?? day} of the month`;
      }
    }
    if (meta.kind === 'dayOfWeek' && upper.endsWith('L')) {
      // The parser stores "last Friday" style values as the string "5L".
      const day = values
        .map((v) => Number.parseInt(String(v), 10))
        .find((n) => Number.isInteger(n) && n >= 0);
      if (day !== undefined) return `on the last ${DAY_NAMES[day % 7] ?? day} of the month`;
    }

    const hasLast = values.some((v) => String(v).toUpperCase() === 'L');
    let nums = values.filter((v): v is number => typeof v === 'number');
    if (meta.kind === 'dayOfWeek') {
      nums = [...new Set(nums.map((v) => v % 7))];
    }
    nums = [...new Set(nums)].sort((a, b) => a - b);

    if (meta.kind === 'dayOfMonth' && hasLast) {
      if (nums.length === 0) return 'on the last day of the month';
      return `on day ${listText(meta.kind, nums)} and the last day of the month`;
    }
    if (nums.length === 0) return `matches ${token}`;
    if (nums.length === meta.max - meta.min + 1) return meta.everyText;

    // Uniform step reaching the end of the range reads as "every N units".
    if (nums.length >= 3) {
      const step = nums[1]! - nums[0]!;
      if (
        step > 1 &&
        nums.every((v, i) => i === 0 || v - nums[i - 1]! === step) &&
        nums[0]! + nums.length * step > meta.max
      ) {
        const from = nums[0]! !== meta.min ? `, starting at ${nameFor(meta.kind, nums[0]!)}` : '';
        return `every ${step} ${meta.unit}s${from}`;
      }
    }

    const list = listText(meta.kind, nums);
    switch (meta.kind) {
      case 'dayOfMonth':
        return `on day ${list} of the month`;
      case 'month':
        return `in ${list}`;
      case 'dayOfWeek':
        return `on ${list}`;
      default:
        return `at ${meta.unit} ${list}`;
    }
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
    if (runDates.length === 0) return;
    const utc = utcToggle.checked;
    const fmt = utc ? utcFmt : localFmt;
    runsEl.textContent = '';
    runDates.forEach((d, i) => {
      const li = document.createElement('li');
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(i + 1);
      const code = document.createElement('code');
      code.style.flex = '1';
      code.textContent = fmt.format(d);
      const rel = document.createElement('span');
      rel.className = 'field-hint';
      rel.textContent = relativeLabel(d);
      li.append(badge, code, rel);
      runsEl.appendChild(li);
    });
    try {
      tzEl.textContent = utc
        ? 'Times shown in UTC.'
        : `Times shown in ${Intl.DateTimeFormat().resolvedOptions().timeZone} (your browser's timezone).`;
    } catch {
      tzEl.textContent = '';
    }
  }

  function clearBreakdown(): void {
    for (const meta of FIELDS) {
      const row = $(`#cron-row-${meta.kind}`, root!)!;
      if (meta.kind === 'second') row.hidden = true;
      $(`#cron-tok-${meta.kind}`, root!)!.textContent = meta.kind === 'second' ? '' : '–';
      $(`#cron-desc-${meta.kind}`, root!)!.textContent = meta.kind === 'second' ? '' : '–';
    }
  }

  function showError(message: string): void {
    errorEl.textContent = message;
    englishEl.textContent = '–';
    runDates = [];
    setRunsMessage('–');
    clearBreakdown();
  }

  async function render(): Promise<void> {
    const my = ++seq;
    const raw = input.value.trim();
    errorEl.textContent = '';

    if (raw === '') {
      showError('Enter a cron expression — for example */5 * * * * runs every five minutes.');
      return;
    }
    if (raw.length > 120) {
      showError('That is far too long for a cron expression — expected 5 or 6 short fields separated by spaces.');
      return;
    }
    if (raw.toLowerCase() === '@reboot') {
      englishEl.textContent = 'Runs once, at system start-up.';
      runDates = [];
      setRunsMessage('@reboot has no calendar schedule — it fires when the machine boots, so there are no run times to predict.');
      clearBreakdown();
      return;
    }
    const inputTokens = raw.split(/\s+/);
    if (!raw.startsWith('@') && (inputTokens.length < 5 || inputTokens.length > 6)) {
      showError(
        `A cron expression has 5 space-separated fields (or 6 with a leading seconds field) — this one has ${inputTokens.length}.`
      );
      return;
    }

    let mods: Awaited<typeof libs>;
    try {
      mods = await libs;
    } catch {
      showError('The cron parsing code could not be loaded — check your connection and reload the page.');
      return;
    }
    if (my !== seq) return;

    const [{ CronExpressionParser }, cronstrueMod] = mods;
    const cronstrue = cronstrueMod.default;

    let parsed: ReturnType<typeof CronExpressionParser.parse>;
    try {
      parsed = CronExpressionParser.parse(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg.replace(/^Error:\s*/, ''));
      return;
    }

    // Plain-English explanation.
    let english = '';
    try {
      english = cronstrue.toString(raw);
    } catch {
      english = '';
    }
    englishEl.textContent = english || 'No plain-English rendering is available for this expression.';

    // Next 10 occurrences, computed in the browser's local timezone.
    try {
      runDates = parsed.take(10).map((d) => d.toDate());
    } catch {
      runDates = [];
    }
    if (runDates.length > 0) {
      renderRuns();
    } else {
      setRunsMessage('No upcoming run times could be computed for this expression.');
    }

    // Field-by-field breakdown. Macros expand via the parser's canonical form.
    const tokens = raw.startsWith('@') ? parsed.stringify().split(' ') : inputTokens;
    const hasSeconds = tokens.length === 6;
    for (const meta of FIELDS) {
      const row = $(`#cron-row-${meta.kind}`, root!)!;
      const tokEl = $(`#cron-tok-${meta.kind}`, root!)!;
      const descEl = $(`#cron-desc-${meta.kind}`, root!)!;
      const index = FIELDS.indexOf(meta) - (hasSeconds ? 0 : 1);
      if (meta.kind === 'second' && !hasSeconds) {
        row.hidden = true;
        tokEl.textContent = '';
        descEl.textContent = '';
        continue;
      }
      row.hidden = false;
      const token = tokens[index] ?? '*';
      tokEl.textContent = token;
      descEl.textContent = describe(meta, token, parsed.fields[meta.kind].values);
    }
  }

  onInput(input, () => void render(), 150);
  utcToggle.addEventListener('change', renderRuns);
  copyRunsBtn.addEventListener('click', () => {
    if (runDates.length === 0) {
      showToast('No run times to copy', 'error');
      return;
    }
    const fmt = utcToggle.checked ? utcFmt : localFmt;
    void copyText(runDates.map((d) => fmt.format(d)).join('\n'));
  });
  for (const btn of $$<HTMLButtonElement>('button[data-expr]', root)) {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.expr ?? '';
      void render();
    });
  }

  // Phase E programmatic pages deep-link here with ?expr=<expression>.
  const preset = new URLSearchParams(location.search).get('expr');
  if (preset && preset.trim()) input.value = preset.trim();

  void render();
}
