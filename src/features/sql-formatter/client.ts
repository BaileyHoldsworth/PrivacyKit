import { $, onInput } from '../../lib/dom';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';
// Type-only imports are erased at build time, so they do not defeat the lazy
// dynamic import of the (grammar-heavy) formatter below.
import type { SqlLanguage, KeywordCase } from 'sql-formatter';

const root = document.querySelector<HTMLElement>('[data-tool="sql-formatter"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#sql-input', root)!;
  const output = $<HTMLTextAreaElement>('#sql-output', root)!;
  const inputCount = $('#sql-input-count', root)!;
  const dialectSelect = $<HTMLSelectElement>('#sql-dialect', root)!;
  const caseSelect = $<HTMLSelectElement>('#sql-keyword-case', root)!;
  const indentSelect = $<HTMLSelectElement>('#sql-indent', root)!;
  const error = $('#sql-error', root)!;
  const status = $('#sql-status', root)!;
  const formatBtn = $('#sql-format', root)!;
  const clearBtn = $('#sql-clear', root)!;
  const downloadBtn = $('#sql-download', root)!;

  // Formatting is synchronous parsing on the main thread. Measured cost is
  // ~160ms at 100k chars, ~4.7s at 1.25M chars, so: format live only while it
  // stays cheap, and refuse pathological input rather than freeze the tab.
  const LIVE_LIMIT = 50_000;
  const HARD_LIMIT = 2_000_000;
  const EMPTY_MESSAGE = 'Nothing to format yet — paste a query above.';

  // sql-formatter ships a full tokenizer + grammar per dialect. Load it on the
  // first format and cache the module; reset the promise on failure so a later
  // attempt (e.g. after coming back online) can retry.
  type FormatterModule = typeof import('sql-formatter');
  let libPromise: Promise<FormatterModule | null> | null = null;
  function loadLib(): Promise<FormatterModule | null> {
    libPromise ??= import('sql-formatter').catch(() => {
      libPromise = null;
      return null;
    });
    return libPromise;
  }

  function setStatus(text: string): void {
    status.textContent = text;
    status.hidden = false;
  }

  function updateCount(): void {
    const n = input.value.length;
    inputCount.textContent =
      n > LIVE_LIMIT
        ? `${n.toLocaleString()} characters — live formatting pauses above ${LIVE_LIMIT.toLocaleString()}. Press Format (or Ctrl+Enter).`
        : `${n.toLocaleString()} characters`;
  }

  // Guards against a slow load or a superseding keystroke writing stale output.
  let runId = 0;

  async function format(explicit: boolean): Promise<void> {
    const id = ++runId;
    const text = input.value;
    error.textContent = '';

    if (!text.trim()) {
      output.value = '';
      status.hidden = true;
      if (explicit) error.textContent = EMPTY_MESSAGE;
      return;
    }

    if (text.length > HARD_LIMIT) {
      status.hidden = true;
      error.textContent = `Input is ${text.length.toLocaleString()} characters — formatting is capped at ${HARD_LIMIT.toLocaleString()} to keep this page responsive. Split it and format in parts.`;
      return;
    }

    const lib = await loadLib();
    if (id !== runId) return; // superseded while the module loaded
    if (!lib) {
      error.textContent =
        'Could not load the SQL formatter — it downloads from this site once on first use. Check your connection and try again.';
      return;
    }

    const useTabs = indentSelect.value === 'tab';
    try {
      const out = lib.format(text, {
        // Every option value below is one this UI controls, so the casts are safe.
        language: dialectSelect.value as SqlLanguage,
        keywordCase: caseSelect.value as KeywordCase,
        useTabs,
        tabWidth: useTabs ? 4 : Number(indentSelect.value),
      });
      if (id !== runId) return;
      output.value = out;
      setStatus('Formatted');
    } catch (err) {
      // The library's parse errors carry a useful first line
      // ("Parse error ... at line X column Y"); the rest is a grammar dump.
      // Keep the last good output rather than blanking the pane on a transient
      // typo mid-edit.
      const raw = err instanceof Error ? err.message : String(err);
      status.hidden = true;
      error.textContent = raw.split('\n')[0]!.slice(0, 200);
    }
  }

  /** Re-format live only while the input is small enough to stay responsive. */
  function formatIfLive(): void {
    updateCount();
    if (input.value.length <= LIVE_LIMIT) void format(false);
  }

  onInput(input, formatIfLive, 200);
  for (const sel of [dialectSelect, caseSelect, indentSelect]) {
    sel.addEventListener('change', formatIfLive);
  }
  formatBtn.addEventListener('click', () => void format(true));

  // Ctrl/Cmd+Enter formats even when the input is above the live threshold.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void format(true);
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    error.textContent = '';
    status.hidden = true;
    updateCount();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet — format a query first', 'error');
      return;
    }
    downloadText(output.value, 'formatted.sql', 'application/sql');
  });

  updateCount();
}
