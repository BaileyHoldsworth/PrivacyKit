import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';

const root = document.querySelector<HTMLElement>('[data-tool="timezone-converter"]');

if (root) {
  const dtInput = $<HTMLInputElement>('#tz-datetime', root)!;
  const nowBtn = $<HTMLButtonElement>('#tz-now', root)!;
  const sourceSelect = $<HTMLSelectElement>('#tz-source', root)!;
  const timeHint = $('#tz-time-hint', root)!;
  const timeError = $('#tz-time-error', root)!;
  const searchInput = $<HTMLInputElement>('#tz-zone-search', root)!;
  const addBtn = $<HTMLButtonElement>('#tz-add', root)!;
  const addError = $('#tz-add-error', root)!;
  const results = $<HTMLUListElement>('#tz-results', root)!;
  const copyAllBtn = $<HTMLButtonElement>('#tz-copy-all', root)!;
  const zoneList = $<HTMLDataListElement>('#tz-zone-list', root)!;

  const STORAGE_KEY = 'pk-tz-zones';
  const MAX_ZONES = 20;
  const DT_RE = /^(\d{4,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

  /** For browsers without Intl.supportedValuesOf (pre-2022). */
  const FALLBACK_ZONES = [
    'UTC', 'America/Los_Angeles', 'America/Denver', 'America/Chicago',
    'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris',
    'Europe/Berlin', 'Europe/Madrid', 'Europe/Moscow', 'Africa/Johannesburg',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Shanghai',
    'Asia/Tokyo', 'Asia/Seoul', 'Australia/Perth', 'Australia/Sydney',
    'Pacific/Auckland',
  ];

  function listZones(): string[] {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
    if (typeof intl.supportedValuesOf === 'function') {
      try {
        return intl.supportedValuesOf('timeZone');
      } catch {
        /* fall through to the static list */
      }
    }
    return FALLBACK_ZONES.slice();
  }

  const localZone = ((): string => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  })();

  const zones = listZones();
  if (!zones.includes(localZone)) zones.push(localZone);
  zones.sort();
  const zoneSet = new Set(zones);

  // ---------- Wall-clock <-> epoch math (pure Intl, no timezone tables) ----------

  interface WallParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }

  const partsFmtCache = new Map<string, Intl.DateTimeFormat>();
  function partsFormatter(zone: string): Intl.DateTimeFormat {
    let fmt = partsFmtCache.get(zone);
    if (!fmt) {
      fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      });
      partsFmtCache.set(zone, fmt);
    }
    return fmt;
  }

  /** The wall-clock reading a given instant produces in a zone. */
  function wallParts(epochMs: number, zone: string): WallParts {
    const parts: Record<string, number> = {};
    for (const p of partsFormatter(zone).formatToParts(epochMs)) {
      if (p.type !== 'literal') parts[p.type] = parseInt(p.value, 10);
    }
    return {
      year: parts.year ?? 0,
      month: parts.month ?? 1,
      day: parts.day ?? 1,
      hour: parts.hour ?? 0,
      minute: parts.minute ?? 0,
      second: parts.second ?? 0,
    };
  }

  /** Wall-clock parts read *as if they were UTC* (setUTCFullYear avoids the 2-digit-year trap). */
  function partsToUTC(p: WallParts): number {
    const d = new Date(Date.UTC(2000, p.month - 1, p.day, p.hour, p.minute, p.second));
    d.setUTCFullYear(p.year);
    return d.getTime();
  }

  /** UTC offset of a zone at a given instant, in milliseconds. */
  function offsetMs(epochMs: number, zone: string): number {
    return partsToUTC(wallParts(epochMs, zone)) - epochMs;
  }

  /**
   * Invert Intl: find the instant whose wall clock in `zone` reads `wallUTC`
   * (the desired wall time encoded via Date.UTC). Two refinement passes
   * converge for every real offset; a third handles DST-gap edge cases.
   * Nonexistent times resolve past the gap; ambiguous times take the first
   * (pre-transition) occurrence.
   */
  function wallToEpoch(wallUTC: number, zone: string): number {
    let epoch = wallUTC - offsetMs(wallUTC, zone);
    const second = offsetMs(epoch, zone);
    epoch = wallUTC - second;
    if (offsetMs(epoch, zone) !== second) epoch = wallUTC - offsetMs(epoch, zone);
    return epoch;
  }

  // ---------- Display formatting ----------

  const displayFmtCache = new Map<string, Intl.DateTimeFormat>();
  function displayFormatter(zone: string): Intl.DateTimeFormat {
    let fmt = displayFmtCache.get(zone);
    if (!fmt) {
      fmt = new Intl.DateTimeFormat(undefined, {
        timeZone: zone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });
      displayFmtCache.set(zone, fmt);
    }
    return fmt;
  }

  /** Whole days since the epoch for a wall-clock date — for the +1d/−1d badge. */
  function dayNumber(p: WallParts): number {
    const d = new Date(Date.UTC(2000, p.month - 1, p.day));
    d.setUTCFullYear(p.year);
    return Math.floor(d.getTime() / 86_400_000);
  }

  // ---------- Persisted target-zone list ----------

  function defaultZones(): string[] {
    return [...new Set([localZone, 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'])].filter(
      (z) => zoneSet.has(z)
    );
  }

  function loadZones(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (z): z is string => typeof z === 'string' && zoneSet.has(z)
          );
          if (valid.length > 0) return [...new Set(valid)].slice(0, MAX_ZONES);
        }
      }
    } catch {
      /* corrupt JSON or storage blocked — fall back to defaults */
    }
    return defaultZones();
  }

  function saveZones(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targetZones));
    } catch {
      /* private mode / quota — the list just won't persist */
    }
  }

  let targetZones = loadZones();

  // ---------- Rendering ----------

  interface Converted {
    zone: string;
    formatted: string;
    dayDiff: number;
  }

  let lastConverted: Converted[] = [];

  function sourceZone(): string {
    return zoneSet.has(sourceSelect.value) ? sourceSelect.value : localZone;
  }

  function renderRows(converted: Converted[] | null): void {
    lastConverted = converted ?? [];
    results.textContent = '';
    for (let i = 0; i < targetZones.length; i++) {
      const zone = targetZones[i]!;
      const row = converted?.[i];
      const li = document.createElement('li');

      const name = document.createElement('span');
      name.textContent = zone;
      name.style.flex = '1';
      li.appendChild(name);

      const time = document.createElement('code');
      time.textContent = row ? row.formatted : '–';
      li.appendChild(time);

      if (row && row.dayDiff !== 0) {
        const badge = document.createElement('span');
        badge.className = row.dayDiff > 0 ? 'badge badge-warn' : 'badge';
        badge.textContent = `${row.dayDiff > 0 ? '+' : '−'}${Math.abs(row.dayDiff)}d`;
        badge.title = `${Math.abs(row.dayDiff)} calendar day${Math.abs(row.dayDiff) === 1 ? '' : 's'} ${row.dayDiff > 0 ? 'ahead of' : 'behind'} the source date`;
        li.appendChild(badge);
      }

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-ghost btn-sm';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', `Copy time in ${zone}`);
      copyBtn.disabled = !row;
      copyBtn.addEventListener('click', () => {
        if (row) void copyText(`${row.formatted} (${zone})`);
      });
      li.appendChild(copyBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-ghost btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', `Remove ${zone} from the list`);
      removeBtn.addEventListener('click', () => {
        targetZones = targetZones.filter((z) => z !== zone);
        saveZones();
        convert();
      });
      li.appendChild(removeBtn);

      results.appendChild(li);
    }
    if (targetZones.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No zones yet — add one above.';
      results.appendChild(li);
    }
  }

  function convert(): void {
    timeError.textContent = '';
    timeHint.textContent = '';
    const raw = dtInput.value;
    if (raw === '') {
      renderRows(null);
      timeHint.textContent = 'Pick a date and time above (or press "Set to now").';
      return;
    }
    const m = DT_RE.exec(raw);
    if (!m) {
      renderRows(null);
      timeError.textContent = 'Enter a complete date and time, including the year.';
      return;
    }
    const year = parseInt(m[1]!, 10);
    if (year < 1 || year > 9999) {
      renderRows(null);
      timeError.textContent = 'Enter a year between 1 and 9999.';
      return;
    }
    const wall: WallParts = {
      year,
      month: parseInt(m[2]!, 10),
      day: parseInt(m[3]!, 10),
      hour: parseInt(m[4]!, 10),
      minute: parseInt(m[5]!, 10),
      second: m[6] ? parseInt(m[6], 10) : 0,
    };

    const zone = sourceZone();
    const wallUTC = partsToUTC(wall);
    const epoch = wallToEpoch(wallUTC, zone);

    // Spring-forward gap: the requested wall time never appears on the clock.
    const roundTrip = wallParts(epoch, zone);
    if (partsToUTC(roundTrip) !== wallUTC) {
      timeHint.textContent =
        `Daylight saving skips that local time in ${zone} — ` +
        `converted from the moment the clock actually reaches, ${displayFormatter(zone).format(epoch)}.`;
    }

    const srcDay = dayNumber(wall);
    const converted = targetZones.map((target): Converted => {
      return {
        zone: target,
        formatted: displayFormatter(target).format(epoch),
        dayDiff: dayNumber(wallParts(epoch, target)) - srcDay,
      };
    });
    renderRows(converted);
  }

  // ---------- Add-zone flow ----------

  function resolveZoneQuery(query: string): string | { error: string } {
    if (zoneSet.has(query)) return query;
    const lower = query.toLowerCase();
    const exact = zones.find((z) => z.toLowerCase() === lower);
    if (exact) return exact;
    const partial = zones.filter((z) => z.toLowerCase().includes(lower));
    if (partial.length === 1) return partial[0]!;
    if (partial.length === 0) {
      return { error: `No IANA timezone matches "${query}". Try a region or city, like Europe/Berlin.` };
    }
    return { error: `"${query}" matches ${partial.length} zones — pick one from the suggestions.` };
  }

  function addZone(): void {
    addError.textContent = '';
    const query = searchInput.value.trim();
    if (query === '') {
      addError.textContent = 'Type a zone name — suggestions appear as you type.';
      return;
    }
    if (query.length > 64) {
      addError.textContent = 'Timezone names are short — the longest is under 40 characters.';
      return;
    }
    const resolved = resolveZoneQuery(query);
    if (typeof resolved !== 'string') {
      addError.textContent = resolved.error;
      return;
    }
    if (targetZones.includes(resolved)) {
      addError.textContent = `${resolved} is already in the list.`;
      return;
    }
    if (targetZones.length >= MAX_ZONES) {
      addError.textContent = `The list is capped at ${MAX_ZONES} zones — remove one first.`;
      return;
    }
    targetZones = [...targetZones, resolved];
    saveZones();
    searchInput.value = '';
    convert();
  }

  function copyAll(): void {
    if (lastConverted.length === 0) return;
    const lines = lastConverted.map((r) => `${r.zone}\t${r.formatted}`);
    void copyText(lines.join('\n'));
  }

  // ---------- Init ----------

  function populateZonePickers(): void {
    const selectFrag = document.createDocumentFragment();
    const listFrag = document.createDocumentFragment();
    for (const zone of zones) {
      const opt = document.createElement('option');
      opt.value = zone;
      opt.textContent = zone === localZone ? `${zone} (your local zone)` : zone;
      selectFrag.appendChild(opt);
      const suggestion = document.createElement('option');
      suggestion.value = zone;
      listFrag.appendChild(suggestion);
    }
    sourceSelect.textContent = '';
    sourceSelect.appendChild(selectFrag);
    sourceSelect.value = localZone;
    zoneList.appendChild(listFrag);
  }

  function setToNow(): void {
    const p = wallParts(Date.now(), sourceZone());
    const pad = (n: number, w = 2): string => String(n).padStart(w, '0');
    dtInput.value = `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
    convert();
  }

  nowBtn.addEventListener('click', () => {
    setToNow();
    dtInput.focus();
  });
  onInput(dtInput, convert);
  dtInput.addEventListener('change', convert);
  sourceSelect.addEventListener('change', convert);
  addBtn.addEventListener('click', addZone);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addZone();
    }
  });
  onInput(searchInput, () => {
    addError.textContent = '';
  });
  copyAllBtn.addEventListener('click', copyAll);

  populateZonePickers();
  setToNow();
}
