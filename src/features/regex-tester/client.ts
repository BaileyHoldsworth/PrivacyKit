import { $, onInput } from '../../lib/dom';

interface MatchGroup {
  name: string | null;
  value: string | null;
}

interface MatchInfo {
  index: number;
  end: number;
  text: string;
  groups: MatchGroup[];
}

interface WorkerResult {
  id: number;
  error?: string;
  matches?: MatchInfo[];
  truncated?: boolean;
  replaced?: string | null;
  timeMs?: number;
}

/**
 * Matching runs off the main thread so a catastrophically backtracking
 * pattern can be killed by a watchdog instead of freezing the page.
 * Plain ES5-ish JS — this string is the whole worker.
 */
const WORKER_SOURCE = `
'use strict';
// Ordered names of capturing groups (null for unnamed), so numbered groups
// can be labelled by name. Skips \\-escapes, [...] classes, (?: (?= (?! and
// lookbehinds (?<= (?<!.
function groupNames(pattern) {
  var names = [];
  var inClass = false;
  for (var i = 0; i < pattern.length; i++) {
    var ch = pattern[i];
    if (ch === '\\\\') { i++; continue; }
    if (inClass) { if (ch === ']') inClass = false; continue; }
    if (ch === '[') { inClass = true; continue; }
    if (ch !== '(') continue;
    if (pattern[i + 1] !== '?') { names.push(null); continue; }
    if (pattern[i + 2] === '<' && pattern[i + 3] !== '=' && pattern[i + 3] !== '!') {
      var end = pattern.indexOf('>', i + 3);
      names.push(end === -1 ? null : pattern.slice(i + 3, end));
    }
  }
  return names;
}
self.onmessage = function (e) {
  var d = e.data;
  try {
    var re = new RegExp(d.pattern, d.flags);
    var names = groupNames(d.pattern);
    var serialize = function (m) {
      var groups = [];
      for (var gi = 1; gi < m.length; gi++) {
        groups.push({
          name: names[gi - 1] != null ? names[gi - 1] : null,
          value: m[gi] === undefined ? null : m[gi],
        });
      }
      return { index: m.index, end: m.index + m[0].length, text: m[0], groups: groups };
    };
    var t0 = performance.now();
    var matches = [];
    var truncated = false;
    if (re.global || re.sticky) {
      var m;
      while ((m = re.exec(d.text)) !== null) {
        matches.push(serialize(m));
        if (matches.length >= d.maxMatches) {
          truncated = re.lastIndex < d.text.length;
          break;
        }
        if (m[0].length === 0) {
          // Advance one code point past an empty match so the loop terminates.
          var cp = d.text.codePointAt(re.lastIndex);
          re.lastIndex += re.unicode && cp !== undefined && cp > 65535 ? 2 : 1;
          if (re.lastIndex > d.text.length) break;
        }
      }
    } else {
      var single = re.exec(d.text);
      if (single) matches.push(serialize(single));
    }
    var replaced = null;
    if (d.replacement !== null) {
      re.lastIndex = 0;
      replaced = d.text.replace(re, d.replacement);
    }
    var timeMs = performance.now() - t0;
    self.postMessage({ id: d.id, matches: matches, truncated: truncated, replaced: replaced, timeMs: timeMs });
  } catch (err) {
    self.postMessage({ id: d.id, error: err && err.message ? err.message : String(err) });
  }
};
`;

const FLAG_ORDER = ['g', 'i', 'm', 's', 'u', 'y'] as const;
/** Worker stops collecting past this many matches (truncation is flagged). */
const MAX_MATCHES = 5000;
/** Match-detail list renders at most this many entries. */
const LIST_LIMIT = 500;
/** Above this many characters the highlighted mirror is skipped (DOM cost). */
const HIGHLIGHT_LIMIT = 200_000;
/** A pattern that has not finished within this budget gets terminated. */
const WATCHDOG_MS = 2000;

const root = document.querySelector<HTMLElement>('[data-tool="regex-tester"]');

if (root) {
  const patternEl = $<HTMLInputElement>('#rx-pattern', root)!;
  const textEl = $<HTMLTextAreaElement>('#rx-text', root)!;
  const replacementEl = $<HTMLInputElement>('#rx-replacement', root)!;
  const errorEl = $('#rx-error', root)!;
  const countEl = $('#rx-count', root)!;
  const timeEl = $('#rx-time', root)!;
  const highlightEl = $('#rx-highlight', root)!;
  const statusEl = $('#rx-status', root)!;
  const matchListEl = $('#rx-matches', root)!;
  const replaceGroupEl = $('#rx-replace-group', root)!;
  const outputEl = $<HTMLTextAreaElement>('#rx-output', root)!;
  const clearBtn = $<HTMLButtonElement>('#rx-clear', root)!;
  const flagBoxes = FLAG_ORDER.map((f) => $<HTMLInputElement>(`#rx-flag-${f}`, root)!);

  const workerUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
  let worker: Worker | null = null;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let latestId = 0;

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }

  function getWorker(): Worker | null {
    if (worker) return worker;
    try {
      worker = new Worker(workerUrl);
    } catch {
      return null;
    }
    worker.onmessage = (e: MessageEvent<WorkerResult>) => {
      if (e.data.id !== latestId) return; // stale run — a newer one is queued
      clearTimeout(watchdog);
      render(e.data);
    };
    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      clearTimeout(watchdog);
      showFailure('The matching worker hit an unexpected error — adjust the pattern and try again.');
    };
    return worker;
  }

  /** Clear all derived output, optionally leaving an error message up. */
  function showFailure(message: string): void {
    errorEl.textContent = message;
    countEl.textContent = '–';
    timeEl.textContent = '–';
    highlightEl.textContent = '';
    statusEl.textContent = '';
    matchListEl.textContent = '';
    replaceGroupEl.hidden = true;
    outputEl.value = '';
  }

  function renderHighlight(source: string, matches: MatchInfo[]): string {
    if (source.length > HIGHLIGHT_LIMIT) {
      highlightEl.textContent = '';
      return `Text over ${HIGHLIGHT_LIMIT.toLocaleString()} characters — highlighting is skipped, but the stats and match details below still cover it.`;
    }
    let html = '';
    let pos = 0;
    for (const m of matches) {
      if (m.index < pos) continue;
      html += escapeHtml(source.slice(pos, m.index));
      html += `<mark>${escapeHtml(m.text)}</mark>`;
      pos = m.end;
    }
    html += escapeHtml(source.slice(pos));
    highlightEl.innerHTML = html;
    return '';
  }

  function renderMatchList(matches: MatchInfo[], truncated: boolean): void {
    matchListEl.textContent = '';
    const frag = document.createDocumentFragment();
    matches.slice(0, LIST_LIMIT).forEach((m, i) => {
      const li = document.createElement('li');
      const wrap = document.createElement('div');
      wrap.className = 'rx-match';

      const top = document.createElement('div');
      top.className = 'rx-match-top';
      const textSpan = document.createElement('span');
      textSpan.textContent = m.text === '' ? '(empty match)' : truncate(m.text, 120);
      const posBadge = document.createElement('span');
      posBadge.className = 'badge';
      posBadge.textContent = `#${i + 1} · ${m.index}–${m.end}`;
      top.append(textSpan, posBadge);
      wrap.append(top);

      if (m.groups.length > 0) {
        const groups = document.createElement('div');
        groups.className = 'field-hint';
        groups.textContent = m.groups
          .map((g, gi) => `${g.name ?? `$${gi + 1}`} = ${g.value === null ? '(no match)' : truncate(g.value, 60)}`)
          .join('  ·  ');
        wrap.append(groups);
      }

      li.append(wrap);
      frag.append(li);
    });
    if (matches.length > LIST_LIMIT || truncated) {
      const li = document.createElement('li');
      const note = document.createElement('span');
      note.className = 'field-hint';
      note.textContent = truncated
        ? `Stopped collecting at ${MAX_MATCHES.toLocaleString()} matches — showing details for the first ${LIST_LIMIT}.`
        : `…and ${(matches.length - LIST_LIMIT).toLocaleString()} more matches (details shown for the first ${LIST_LIMIT}).`;
      li.append(note);
      frag.append(li);
    }
    matchListEl.append(frag);
  }

  function render(result: WorkerResult): void {
    if (result.error !== undefined) {
      showFailure(`Invalid pattern: ${result.error}`);
      return;
    }
    const matches = result.matches ?? [];
    errorEl.textContent = '';
    countEl.textContent = result.truncated
      ? `${matches.length.toLocaleString()}+`
      : matches.length.toLocaleString();
    const ms = result.timeMs ?? 0;
    timeEl.textContent = ms < 0.05 ? '<0.1 ms' : `${ms.toFixed(1)} ms`;

    const highlightNote = renderHighlight(textEl.value, matches);
    statusEl.textContent =
      highlightNote ||
      (matches.length === 0 ? (textEl.value === '' ? 'Test string is empty.' : 'No matches.') : '');

    renderMatchList(matches, result.truncated === true);

    if (result.replaced === null || result.replaced === undefined) {
      replaceGroupEl.hidden = true;
      outputEl.value = '';
    } else {
      replaceGroupEl.hidden = false;
      outputEl.value = result.replaced;
    }
  }

  function run(): void {
    const pattern = patternEl.value;
    const flags = FLAG_ORDER.filter((_, i) => flagBoxes[i]!.checked).join('');
    const id = ++latestId;
    clearTimeout(watchdog);

    if (pattern === '') {
      errorEl.textContent = '';
      countEl.textContent = '–';
      timeEl.textContent = '–';
      highlightEl.textContent = textEl.value.length > HIGHLIGHT_LIMIT ? '' : textEl.value;
      statusEl.textContent = 'Enter a pattern to start matching.';
      matchListEl.textContent = '';
      replaceGroupEl.hidden = true;
      outputEl.value = '';
      return;
    }

    // Syntax-check on the main thread first: construction never backtracks,
    // and this surfaces the browser's own message instantly.
    try {
      new RegExp(pattern, flags);
    } catch (err) {
      showFailure(`Invalid pattern: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const w = getWorker();
    if (!w) {
      showFailure('This browser blocked the background matching worker, so the tester cannot run safely.');
      return;
    }
    w.postMessage({
      id,
      pattern,
      flags,
      text: textEl.value,
      replacement: replacementEl.value === '' ? null : replacementEl.value,
      maxMatches: MAX_MATCHES,
    });
    watchdog = setTimeout(() => {
      worker?.terminate();
      worker = null;
      showFailure(
        `Stopped after ${WATCHDOG_MS / 1000} seconds — this pattern backtracks catastrophically on this text. Make quantified parts more specific (e.g. [^"]* instead of .*) and avoid nesting quantifiers like (a+)+.`
      );
    }, WATCHDOG_MS);
  }

  for (const el of [patternEl, textEl, replacementEl]) onInput(el, run, 150);
  for (const box of flagBoxes) box.addEventListener('change', run);
  clearBtn.addEventListener('click', () => {
    textEl.value = '';
    run();
    textEl.focus();
  });

  run();
}
