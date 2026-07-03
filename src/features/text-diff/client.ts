import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';
import type { Change } from 'diff';

type Mode = 'lines' | 'words' | 'chars';

const root = document.querySelector<HTMLElement>('[data-tool="text-diff"]');

if (root) {
  const original = $<HTMLTextAreaElement>('#diff-original', root)!;
  const changed = $<HTMLTextAreaElement>('#diff-changed', root)!;
  const modeSelect = $<HTMLSelectElement>('#diff-mode', root)!;
  const ignoreWs = $<HTMLInputElement>('#diff-ignore-ws', root)!;
  const ignoreCase = $<HTMLInputElement>('#diff-ignore-case', root)!;
  const compareBtn = $('#diff-compare', root)!;
  const swapBtn = $('#diff-swap', root)!;
  const clearBtn = $('#diff-clear', root)!;
  const copyBtn = $('#diff-copy', root)!;
  const downloadBtn = $('#diff-download', root)!;
  const output = $('#diff-output', root)!;
  const hint = $('#diff-hint', root)!;
  const error = $('#diff-error', root)!;
  const status = $('#diff-status', root)!;
  const statAdded = $('#diff-stat-added', root)!;
  const statRemoved = $('#diff-stat-removed', root)!;
  const statSimilarity = $('#diff-stat-similarity', root)!;

  /** Above this many combined characters, live recompute pauses (manifest: 200KB). */
  const LIVE_LIMIT = 200_000;
  /** Word/char tokenisation over inputs this size is O(n) memory per edit step — refuse. */
  const TOKEN_MODE_LIMIT = 2_000_000;
  /** Cap on characters rendered into the DOM; Copy/Download always carry the full diff. */
  const RENDER_CAP = 400_000;
  /** jsdiff gives up (returns undefined) after this many ms of search — bounds main-thread work. */
  const DIFF_TIMEOUT_MS = 1500;

  const DEFAULT_HINT = hint.textContent ?? '';

  // Lazy-load the diff engine on first use; on failure (offline before the
  // chunk was cached) reset so a later attempt can retry.
  let diffModule: Promise<typeof import('diff') | null> | null = null;
  function loadDiff(): Promise<typeof import('diff') | null> {
    diffModule ??= import('diff').catch(() => {
      diffModule = null;
      return null;
    });
    return diffModule;
  }

  let runId = 0;
  /** Marker-text rendition of the last successful diff, for Copy/Download. */
  let lastMarked = '';

  // ---------- preprocessing (manifest: toggles preprocess the inputs) ----------

  function preprocess(text: string): string {
    let t = text.replace(/\r\n?/g, '\n'); // CRLF/CR → LF so line endings never diff
    if (ignoreCase.checked) t = t.toLowerCase();
    if (ignoreWs.checked) {
      t = t
        .split('\n')
        .map((l) => l.replace(/\s+/g, ' ').trim())
        .join('\n');
    }
    return t;
  }

  // ---------- counting & text output ----------

  /** Tokens in a change value, counted independently of jsdiff's internals. */
  function unitCount(value: string, mode: Mode): number {
    if (mode === 'chars') return value.length;
    if (mode === 'words') return (value.match(/\S+/g) ?? []).length;
    const lines = value.split('\n');
    if (lines[lines.length - 1] === '') lines.pop(); // drop the trailing-newline artefact
    return lines.length;
  }

  function unitLabel(n: number, mode: Mode): string {
    const noun = mode === 'chars' ? 'char' : mode === 'words' ? 'word' : 'line';
    return `${n.toLocaleString()} ${noun}${n === 1 ? '' : 's'}`;
  }

  /** Plain-text diff: `+ `/`- ` line prefixes, or wdiff-style {+…+}/[-…-]. */
  function markedText(parts: Change[], mode: Mode): string {
    if (mode === 'lines') {
      const out: string[] = [];
      for (const p of parts) {
        const prefix = p.added ? '+ ' : p.removed ? '- ' : '  ';
        const lines = p.value.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();
        for (const l of lines) out.push(prefix + l);
      }
      return out.join('\n');
    }
    return parts
      .map((p) => (p.added ? `{+${p.value}+}` : p.removed ? `[-${p.value}-]` : p.value))
      .join('');
  }

  // ---------- UI state ----------

  function resetOutput(): void {
    const ph = document.createElement('span');
    ph.className = 'diff-placeholder';
    ph.textContent = 'Differences appear here — removed text in red, added text in green.';
    output.replaceChildren(ph);
    statAdded.textContent = '–';
    statRemoved.textContent = '–';
    statSimilarity.textContent = '–';
    status.hidden = true;
    lastMarked = '';
  }

  function fail(message: string): void {
    error.textContent = message;
    resetOutput();
  }

  function updateHint(): void {
    const total = original.value.length + changed.value.length;
    hint.textContent =
      total > LIVE_LIMIT
        ? `Inputs total ${total.toLocaleString()} characters — live comparison is paused above ${LIVE_LIMIT.toLocaleString()}; press Compare to run it.`
        : DEFAULT_HINT;
  }

  // ---------- rendering ----------

  function render(parts: Change[], mode: Mode): void {
    let added = 0;
    let removed = 0;
    let common = 0;
    for (const p of parts) {
      const n = unitCount(p.value, mode);
      if (p.added) added += n;
      else if (p.removed) removed += n;
      else common += n;
    }
    statAdded.textContent = unitLabel(added, mode);
    statRemoved.textContent = unitLabel(removed, mode);
    const total = added + removed + 2 * common;
    statSimilarity.textContent = total === 0 ? '–' : `${Math.round((200 * common) / total)}%`;

    const frag = document.createDocumentFragment();
    let budget = RENDER_CAP;
    let truncated = false;
    for (const p of parts) {
      const value = p.value.length > budget ? p.value.slice(0, budget) : p.value;
      budget -= value.length;
      if (p.added || p.removed) {
        const el = document.createElement(p.added ? 'ins' : 'del');
        el.textContent = value;
        frag.appendChild(el);
      } else {
        frag.appendChild(document.createTextNode(value));
      }
      if (budget <= 0) {
        truncated = true;
        break;
      }
    }
    if (truncated) {
      const note = document.createElement('p');
      note.className = 'field-hint';
      note.textContent = `Preview truncated at ${RENDER_CAP.toLocaleString()} characters — Copy or Download for the complete diff.`;
      frag.appendChild(note);
    }
    output.replaceChildren(frag);

    if (added === 0 && removed === 0) {
      status.textContent = 'No differences';
      status.hidden = false;
    }
    lastMarked = markedText(parts, mode);
  }

  // ---------- the diff run ----------

  async function runDiff(): Promise<void> {
    const id = ++runId;
    const mode = modeSelect.value as Mode;
    const a = preprocess(original.value);
    const b = preprocess(changed.value);

    error.textContent = '';
    status.hidden = true;

    if (!a && !b) {
      resetOutput();
      return;
    }
    if (mode !== 'lines' && a.length + b.length > TOKEN_MODE_LIMIT) {
      fail(
        `${mode === 'words' ? 'Word' : 'Character'} mode is capped at ${TOKEN_MODE_LIMIT.toLocaleString()} combined characters — switch to line mode for texts this size.`
      );
      return;
    }

    const mod = await loadDiff();
    if (id !== runId) return; // superseded while the engine loaded
    if (!mod) {
      fail('Could not load the diff engine — it downloads from this site once on first use. Check your connection and try again.');
      return;
    }

    let parts: Change[] | undefined;
    try {
      const opts = { timeout: DIFF_TIMEOUT_MS };
      parts =
        mode === 'lines'
          ? mod.diffLines(a, b, opts)
          : mode === 'words'
            ? mod.diffWords(a, b, opts)
            : mod.diffChars(a, b, opts);
    } catch {
      parts = undefined;
    }
    if (id !== runId) return;
    if (!parts) {
      fail(
        `Comparison gave up after ${DIFF_TIMEOUT_MS / 1000} seconds — the texts are too large or too different for ${mode === 'lines' ? 'this' : mode === 'words' ? 'word' : 'character'} mode. Line mode handles big inputs best.`
      );
      return;
    }
    render(parts, mode);
  }

  /** Recompute only when small enough to be free; large inputs wait for Compare. */
  function runIfLive(): void {
    updateHint();
    if (original.value.length + changed.value.length <= LIVE_LIMIT) void runDiff();
  }

  // ---------- wiring ----------

  onInput(original, runIfLive, 200);
  onInput(changed, runIfLive, 200);
  modeSelect.addEventListener('change', runIfLive);
  ignoreWs.addEventListener('change', runIfLive);
  ignoreCase.addEventListener('change', runIfLive);

  compareBtn.addEventListener('click', () => void runDiff());

  for (const area of [original, changed]) {
    area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        void runDiff();
      }
    });
  }

  swapBtn.addEventListener('click', () => {
    const tmp = original.value;
    original.value = changed.value;
    changed.value = tmp;
    runIfLive();
  });

  clearBtn.addEventListener('click', () => {
    original.value = '';
    changed.value = '';
    error.textContent = '';
    resetOutput();
    updateHint();
    original.focus();
  });

  copyBtn.addEventListener('click', () => {
    if (!lastMarked) {
      showToast('Nothing to copy yet — run a comparison first', 'error');
      return;
    }
    void copyText(lastMarked);
  });

  downloadBtn.addEventListener('click', () => {
    if (!lastMarked) {
      showToast('Nothing to download yet — run a comparison first', 'error');
      return;
    }
    downloadText(lastMarked, 'text-diff.txt');
  });
}
