import { $, onInput } from '../../lib/dom';
import { formatBytes } from '../../lib/bytes';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="json-formatter"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#json-input', root)!;
  const output = $<HTMLTextAreaElement>('#json-output', root)!;
  const inputCount = $('#json-input-count', root)!;
  const indentSelect = $<HTMLSelectElement>('#json-indent', root)!;
  const sortBox = $<HTMLInputElement>('#json-sort', root)!;
  const error = $('#json-error', root)!;
  const status = $('#json-status', root)!;
  const statKeys = $('#json-stat-keys', root)!;
  const statDepth = $('#json-stat-depth', root)!;
  const statSize = $('#json-stat-size', root)!;
  const formatBtn = $('#json-format', root)!;
  const minifyBtn = $('#json-minify', root)!;
  const validateBtn = $('#json-validate', root)!;
  const clearBtn = $('#json-clear', root)!;
  const downloadBtn = $('#json-download', root)!;

  let downloadName = 'formatted.json';

  // ---------- error location (three tiers of message parsing) ----------

  function posToLineCol(text: string, pos: number): { line: number; col: number } {
    let line = 1;
    let lineStart = 0;
    const end = Math.min(pos, text.length);
    for (let i = 0; i < end; i++) {
      if (text.charCodeAt(i) === 10) {
        line++;
        lineStart = i + 1;
      }
    }
    return { line, col: end - lineStart + 1 };
  }

  /**
   * Best-effort recovery of the error offset from V8's snippet-style message
   * (`Unexpected token 'x', ..."<context>"... is not valid JSON`), used when
   * the message carries no explicit position. V8 centres the ~20-char context
   * window on the error, showing 10 characters before it when it prints a
   * leading ellipsis.
   */
  function snippetLocate(message: string, text: string): number | null {
    const m = message.match(
      /^Unexpected token '([\s\S]+?)',\s(\.\.\.)?"([\s\S]*)"(?:\.\.\.)? is not valid JSON$/
    );
    if (!m) return null;
    const token = m[1]!;
    const lead = m[2];
    const snippet = m[3]!;
    const idx = text.indexOf(snippet);
    if (idx === -1) return null;
    if (lead) return Math.min(idx + 10, text.length - 1);
    // Snippet starts at the beginning: pick the token occurrence closest to
    // the window centre.
    let best = -1;
    for (let i = snippet.indexOf(token); i !== -1; i = snippet.indexOf(token, i + 1)) {
      if (best === -1 || Math.abs(i - 10) < Math.abs(best - 10)) best = i;
    }
    return best === -1 ? idx : idx + best;
  }

  function locateError(message: string, text: string): { line: number; col: number } | null {
    let m = message.match(/line (\d+) column (\d+)/i);
    if (m) return { line: Number(m[1]), col: Number(m[2]) };
    m = message.match(/position (\d+)/i);
    if (m) return posToLineCol(text, Number(m[1]));
    const pos = snippetLocate(message, text);
    return pos === null ? null : posToLineCol(text, pos);
  }

  /** Select the offending line and scroll the textarea to it. */
  function jumpToLine(line: number): void {
    const text = input.value;
    let start = 0;
    for (let n = 1; n < line; n++) {
      const nl = text.indexOf('\n', start);
      if (nl === -1) break;
      start = nl + 1;
    }
    const nl = text.indexOf('\n', start);
    const end = nl === -1 ? text.length : nl;
    input.focus({ preventScroll: true });
    input.setSelectionRange(start, end);
    const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 20;
    input.scrollTop = Math.max(0, (line - 1) * lineHeight - input.clientHeight / 2);
  }

  // ---------- sorting & stats ----------

  function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeysDeep);
    if (value !== null && typeof value === 'object') {
      const src = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(src).sort()) out[k] = sortKeysDeep(src[k]);
      return out;
    }
    return value;
  }

  /** Iterative walk — survives pathologically deep nesting (100k+ levels). */
  function statsOf(rootValue: unknown): { keys: number; depth: number } {
    let keys = 0;
    let maxDepth = 0;
    const stack: [unknown, number][] = [
      [rootValue, rootValue !== null && typeof rootValue === 'object' ? 1 : 0],
    ];
    while (stack.length) {
      const [v, d] = stack.pop()!;
      if (d > maxDepth) maxDepth = d;
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item !== null && typeof item === 'object') stack.push([item, d + 1]);
        }
      } else if (v !== null && typeof v === 'object') {
        const names = Object.keys(v as Record<string, unknown>);
        keys += names.length;
        for (const k of names) {
          const item = (v as Record<string, unknown>)[k];
          if (item !== null && typeof item === 'object') stack.push([item, d + 1]);
        }
      }
    }
    return { keys, depth: maxDepth };
  }

  function byteSize(s: string): number {
    return new Blob([s]).size;
  }

  // ---------- UI state helpers ----------

  function clearStats(): void {
    statKeys.textContent = '–';
    statDepth.textContent = '–';
    statSize.textContent = '–';
  }

  function showError(message: string): void {
    error.textContent = message;
    status.hidden = true;
  }

  function showParseError(err: unknown, text: string): void {
    const raw = err instanceof Error ? err.message : String(err);
    const loc = locateError(raw, text);
    const clean = raw.replace(/\s+/g, ' ').slice(0, 160);
    showError(loc ? `Invalid JSON at line ${loc.line}, column ${loc.col}: ${clean}` : `Invalid JSON: ${clean}`);
    clearStats();
    if (loc) jumpToLine(loc.line);
  }

  // ---------- actions ----------

  function run(mode: 'format' | 'minify' | 'validate'): void {
    const text = input.value;
    if (!text.trim()) {
      showError('Nothing to process yet — paste JSON above.');
      output.value = '';
      clearStats();
      return;
    }

    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch (err) {
      showParseError(err, text);
      return;
    }
    error.textContent = '';

    if (sortBox.checked && mode !== 'validate') {
      try {
        value = sortKeysDeep(value);
      } catch {
        // Deeper than the call stack allows — keep original order.
        showToast('Too deeply nested to sort keys — output left unsorted', 'error');
      }
    }

    const { keys, depth } = statsOf(value);
    statKeys.textContent = keys.toLocaleString();
    statDepth.textContent = depth.toLocaleString();

    if (mode === 'validate') {
      status.textContent = 'Valid JSON';
      status.hidden = false;
      statSize.textContent = formatBytes(byteSize(text));
      return;
    }

    const out =
      mode === 'format'
        ? JSON.stringify(value, null, Number(indentSelect.value))
        : JSON.stringify(value);
    output.value = out;
    downloadName = mode === 'format' ? 'formatted.json' : 'minified.json';
    status.textContent = mode === 'format' ? 'Formatted' : 'Minified';
    status.hidden = false;
    statSize.textContent = formatBytes(byteSize(out));
  }

  formatBtn.addEventListener('click', () => run('format'));
  minifyBtn.addEventListener('click', () => run('minify'));
  validateBtn.addEventListener('click', () => run('validate'));

  // Ctrl/Cmd+Enter in the input formats.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      run('format');
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    error.textContent = '';
    status.hidden = true;
    inputCount.textContent = '0 characters';
    clearStats();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet — format or minify first', 'error');
      return;
    }
    downloadText(output.value, downloadName, 'application/json');
  });

  // Character count is the only per-keystroke work; byte size is computed in
  // the same debounced pass (Blob is a single UTF-8 copy, fine at 150ms).
  onInput(
    input,
    () => {
      const text = input.value;
      inputCount.textContent = `${text.length.toLocaleString()} characters · ${formatBytes(byteSize(text))}`;
      error.textContent = '';
      status.hidden = true;
    },
    150
  );
}
