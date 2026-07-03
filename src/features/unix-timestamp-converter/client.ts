import { $, onInput } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="unix-timestamp-converter"]');

if (root) {
  const nowS = $('#ts-now-s', root)!;
  const nowMs = $('#ts-now-ms', root)!;
  const input = $<HTMLInputElement>('#ts-input', root)!;
  const unitSelect = $<HTMLSelectElement>('#ts-unit', root)!;
  const fillNowBtn = $<HTMLButtonElement>('#ts-fill-now', root)!;
  const detectedEl = $('#ts-detected', root)!;
  const errorEl = $('#ts-error', root)!;
  const outLocal = $('#ts-out-local', root)!;
  const outUtc = $('#ts-out-utc', root)!;
  const outIso = $('#ts-out-iso', root)!;
  const outRel = $('#ts-out-rel', root)!;
  const dateInput = $<HTMLInputElement>('#ts-date', root)!;
  const dateNowBtn = $<HTMLButtonElement>('#ts-date-now', root)!;
  const tzEl = $('#ts-tz', root)!;
  const dateErrorEl = $('#ts-date-error', root)!;
  const dateOutS = $('#ts-date-s', root)!;
  const dateOutMs = $('#ts-date-ms', root)!;

  type Unit = 's' | 'ms' | 'us';
  const UNIT_LABELS: Record<Unit, string> = {
    s: 'seconds',
    ms: 'milliseconds',
    us: 'microseconds',
  };
  /** ECMAScript Date range: ±100,000,000 days around the epoch. */
  const MAX_MS = 8.64e15;
  const NUMERIC = /^[+-]?(\d+(\.\d+)?|\.\d+)$/;

  const localFmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'long',
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

  /** Largest Intl.RelativeTimeFormat unit that fits the difference. */
  const REL_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ];

  function relativeLabel(ms: number): string {
    const diffSec = (ms - Date.now()) / 1000;
    const abs = Math.abs(diffSec);
    for (const [unit, size] of REL_UNITS) {
      if (abs >= size || unit === 'second') {
        return relFmt.format(Math.round(diffSec / size), unit);
      }
    }
    return relFmt.format(0, 'second');
  }

  function detectUnit(n: number): Unit {
    const abs = Math.abs(n);
    // < 1e11 s reaches the year 5138; the same instant in ms is 14 digits.
    return abs < 1e11 ? 's' : abs < 1e14 ? 'ms' : 'us';
  }

  /** Epoch milliseconds of the timestamp on display, for the relative ticker. */
  let shownMs: number | null = null;

  function clearTimestampOutputs(): void {
    shownMs = null;
    for (const el of [outLocal, outUtc, outIso, outRel]) el.textContent = '–';
  }

  function convertTimestamp(): void {
    const raw = input.value.trim();
    errorEl.textContent = '';
    detectedEl.textContent = '';
    if (raw === '') {
      clearTimestampOutputs();
      return;
    }
    // Cheap guard before the regex so a pasted novel can't stall the page.
    if (raw.length > 32) {
      clearTimestampOutputs();
      errorEl.textContent =
        'That is too long to be a timestamp — even microseconds only need 19 digits.';
      return;
    }
    if (!NUMERIC.test(raw)) {
      clearTimestampOutputs();
      errorEl.textContent =
        'Enter a plain number: digits, an optional leading minus and an optional decimal point.';
      return;
    }

    const n = Number(raw);
    const choice = unitSelect.value as Unit | 'auto';
    const unit = choice === 'auto' ? detectUnit(n) : choice;
    const digits = raw.replace(/^[+-]/, '').split('.')[0]!.length;
    detectedEl.textContent =
      choice === 'auto'
        ? `Interpreted as ${UNIT_LABELS[unit]} (${digits} digit${digits === 1 ? '' : 's'}) — use the unit selector to override.`
        : `Reading the value as ${UNIT_LABELS[unit]}.`;

    const ms = unit === 's' ? n * 1000 : unit === 'ms' ? n : n / 1000;
    if (!Number.isFinite(ms) || Math.abs(ms) > MAX_MS) {
      clearTimestampOutputs();
      errorEl.textContent = `Out of range: as ${UNIT_LABELS[unit]} this falls outside the ±275,760 years JavaScript dates can represent. Check the unit.`;
      return;
    }

    const date = new Date(ms);
    shownMs = date.getTime();
    outLocal.textContent = localFmt.format(date);
    outUtc.textContent = utcFmt.format(date);
    outIso.textContent = date.toISOString();
    outRel.textContent = relativeLabel(shownMs);
  }

  function pad(n: number, width = 2): string {
    return String(n).padStart(width, '0');
  }

  function toLocalInputValue(d: Date): string {
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  }

  function convertDate(): void {
    dateErrorEl.textContent = '';
    const value = dateInput.value;
    if (value === '') {
      dateOutS.textContent = '–';
      dateOutMs.textContent = '–';
      return;
    }
    // datetime-local values parse in the browser's local timezone.
    const date = new Date(value);
    const ms = date.getTime();
    if (Number.isNaN(ms)) {
      dateOutS.textContent = '–';
      dateOutMs.textContent = '–';
      dateErrorEl.textContent = 'Enter a complete date and time, including the year.';
      return;
    }
    dateOutS.textContent = String(Math.floor(ms / 1000));
    dateOutMs.textContent = String(ms);
  }

  function tick(): void {
    const now = Date.now();
    nowS.textContent = String(Math.floor(now / 1000));
    nowMs.textContent = String(now);
    if (shownMs !== null) outRel.textContent = relativeLabel(shownMs);
  }

  fillNowBtn.addEventListener('click', () => {
    input.value = String(Math.floor(Date.now() / 1000));
    unitSelect.value = 'auto';
    convertTimestamp();
    input.focus();
  });
  dateNowBtn.addEventListener('click', () => {
    dateInput.value = toLocalInputValue(new Date());
    convertDate();
    dateInput.focus();
  });
  onInput(input, convertTimestamp);
  unitSelect.addEventListener('change', convertTimestamp);
  onInput(dateInput, convertDate);
  dateInput.addEventListener('change', convertDate);

  try {
    tzEl.textContent = `Timezone from your browser: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`;
  } catch {
    tzEl.textContent = '';
  }

  tick();
  setInterval(tick, 1000);
}
