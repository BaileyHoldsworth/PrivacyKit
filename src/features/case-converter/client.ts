import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { showToast } from '../../lib/toast';

/** Cap conversion work so a 10 MB paste stays responsive instead of freezing the tab. */
const MAX_CHARS = 1_000_000;
/** On-screen preview cap per row; the copy buttons always copy the full result. */
const DISPLAY_LIMIT = 5_000;
/** Above this size, run one case per macrotask so no single task blocks input. */
const ASYNC_THRESHOLD = 100_000;

/**
 * Tokenise into words: split on anything that isn't a letter or digit, then
 * split the remaining runs at case boundaries. Two boundary rules:
 *   lower/digit → Upper   ("caseConverter" → case | Converter)
 *   ACRONYM → Capitalised ("XMLHttp"       → XML  | Http)
 * Digits with no case change stay attached ("utf8" is one word).
 */
function splitWords(text: string): string[] {
  const runs = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  const out: string[] = [];
  for (const run of runs) {
    out.push(
      ...run
        .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
        .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
        .split(' ')
    );
  }
  return out;
}

/** Lowercase the word, then uppercase its first letter (Unicode-aware). */
const capFirst = (w: string): string => w.toLowerCase().replace(/\p{L}/u, (c) => c.toUpperCase());

/** Minor words kept lowercase in Title Case unless first or last: articles,
 *  coordinating conjunctions, and prepositions of three letters or fewer. */
const MINOR = new Set([
  'a', 'an', 'the',
  'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via',
]);

function titleCase(text: string): string {
  const parts = text.split(/(\s+)/);
  const wordIdx: number[] = [];
  parts.forEach((p, i) => {
    if (p && !/^\s+$/.test(p)) wordIdx.push(i);
  });
  const first = wordIdx[0];
  const last = wordIdx[wordIdx.length - 1];
  return parts
    .map((p, i) => {
      if (!p || /^\s+$/.test(p)) return p;
      const core = p.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      if (i !== first && i !== last && MINOR.has(core)) return p.toLowerCase();
      return capFirst(p);
    })
    .join('');
}

function sentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/([.!?…]\s+|\n\s*|^\s*)(\p{L})/gu, (_m, sep: string, c: string) => sep + c.toUpperCase());
}

interface CaseSpec {
  /** Key used in element ids: #case-out-<key>, #case-copy-<key> */
  key: string;
  label: string;
  fn: (text: string, words: string[]) => string;
}

const lc = (w: string): string => w.toLowerCase();

const CASES: CaseSpec[] = [
  { key: 'upper', label: 'UPPERCASE', fn: (t) => t.toUpperCase() },
  { key: 'lower', label: 'lowercase', fn: (t) => t.toLowerCase() },
  { key: 'title', label: 'Title Case', fn: (t) => titleCase(t) },
  { key: 'sentence', label: 'Sentence case', fn: (t) => sentenceCase(t) },
  {
    key: 'camel',
    label: 'camelCase',
    fn: (_t, w) => w.map((x, i) => (i === 0 ? x.toLowerCase() : capFirst(x))).join(''),
  },
  { key: 'pascal', label: 'PascalCase', fn: (_t, w) => w.map(capFirst).join('') },
  { key: 'snake', label: 'snake_case', fn: (_t, w) => w.map(lc).join('_') },
  { key: 'screaming', label: 'SCREAMING_SNAKE', fn: (_t, w) => w.map(lc).join('_').toUpperCase() },
  { key: 'kebab', label: 'kebab-case', fn: (_t, w) => w.map(lc).join('-') },
  { key: 'dot', label: 'dot.case', fn: (_t, w) => w.map(lc).join('.') },
];

const root = document.querySelector<HTMLElement>('[data-tool="case-converter"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#case-input', root)!;
  const count = $('#case-count', root)!;
  const clearBtn = $('#case-clear', root)!;
  const error = $('#case-error', root)!;
  const notice = $('#case-notice', root)!;

  const outOf = (key: string) => $(`#case-out-${key}`, root)!;

  /** Full conversion results for the current input; copy buttons read these. */
  const results = new Map<string, string>();
  /** Increments to cancel in-flight chunked work when the input changes. */
  let runId = 0;

  function renderRow(key: string, value: string): void {
    outOf(key).textContent = value
      ? value.length > DISPLAY_LIMIT
        ? `${value.slice(0, DISPLAY_LIMIT)} …`
        : value
      : '–';
  }

  function updateNotice(): void {
    const shortened = [...results.values()].some((v) => v.length > DISPLAY_LIMIT);
    notice.textContent = shortened
      ? 'Long results are shortened on screen — Copy still copies the full text.'
      : '';
  }

  function computeCase(spec: CaseSpec, text: string, words: string[]): boolean {
    try {
      const value = spec.fn(text, words);
      results.set(spec.key, value);
      renderRow(spec.key, value);
      return true;
    } catch {
      error.textContent = 'Conversion failed — this input is too large for your browser. Try a smaller chunk.';
      renderRow(spec.key, '');
      return false;
    }
  }

  async function convertChunked(text: string, words: string[], id: number): Promise<void> {
    for (const spec of CASES) {
      if (!computeCase(spec, text, words)) return;
      // Yield between cases so typing and scrolling stay responsive.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (id !== runId) return;
    }
    updateNotice();
  }

  function convert(): void {
    const id = ++runId;
    const raw = input.value;
    error.textContent = '';
    notice.textContent = '';
    results.clear();

    if (raw.length === 0) {
      count.textContent = '';
      for (const spec of CASES) renderRow(spec.key, '');
      return;
    }

    let text = raw;
    if (raw.length > MAX_CHARS) {
      text = raw.slice(0, MAX_CHARS);
      error.textContent = `Input is ${raw.length.toLocaleString('en-AU')} characters — only the first ${MAX_CHARS.toLocaleString('en-AU')} are converted to keep the page responsive.`;
    }

    const words = splitWords(text);
    count.textContent = `${words.length.toLocaleString('en-AU')} ${words.length === 1 ? 'word' : 'words'} · ${raw.length.toLocaleString('en-AU')} characters`;

    if (words.length === 0) {
      error.textContent =
        'No letters or digits found — camelCase, snake_case and the other joined formats need at least one word.';
    }

    if (text.length > ASYNC_THRESHOLD) {
      void convertChunked(text, words, id);
    } else {
      for (const spec of CASES) {
        if (!computeCase(spec, text, words)) return;
      }
      updateNotice();
    }
  }

  // Copy buttons copy the FULL stored result, not the possibly-shortened display.
  for (const spec of CASES) {
    $(`#case-copy-${spec.key}`, root)!.addEventListener('click', () => {
      const value = results.get(spec.key);
      if (value) {
        void copyText(value);
      } else {
        showToast('Nothing to copy yet — type some text first', 'error');
      }
    });
  }

  onInput(input, convert, 150);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    convert();
    input.focus();
  });

  convert();
}
