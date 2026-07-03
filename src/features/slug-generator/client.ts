import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';

const root = document.querySelector<HTMLElement>('[data-tool="slug-generator"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#slug-input', root)!;
  const separatorSelect = $<HTMLSelectElement>('#slug-separator', root)!;
  const maxLenInput = $<HTMLInputElement>('#slug-maxlen', root)!;
  const clearBtn = $<HTMLButtonElement>('#slug-clear', root)!;
  const copyAllBtn = $<HTMLButtonElement>('#slug-copy-all', root)!;
  const list = $<HTMLUListElement>('#slug-list', root)!;
  const listHint = $('#slug-list-hint', root)!;
  const countEl = $('#slug-count', root)!;
  const error = $('#slug-error', root)!;

  /** Keep a single conversion pass comfortably under the INP budget. */
  const MAX_INPUT_CHARS = 1_000_000;
  /** Cap DOM rows; "Copy all" still includes every line. */
  const MAX_RENDERED_ROWS = 200;

  let allSlugs: string[] = [];

  function slugify(raw: string, sep: string): string {
    // NFKD splits accented letters into base letter + combining marks,
    // which are then stripped: é -> e, ü -> u, ﬁ -> fi.
    let s = raw.normalize('NFKD').replace(/\p{M}+/gu, '');
    s = s.toLowerCase();
    s = s.replace(/&/g, ' and ');
    // Everything that is not a-z / 0-9 collapses into one separator.
    s = s.replace(/[^a-z0-9]+/g, sep);
    const trim = sep === '_' ? /^_+|_+$/g : /^-+|-+$/g;
    return s.replace(trim, '');
  }

  function truncateAtBoundary(slug: string, max: number, sep: string): string {
    if (slug.length <= max) return slug;
    let s = slug.slice(0, max);
    if (slug.charAt(max) !== sep) {
      // The cut landed mid-word: back off to the previous separator.
      // A single word longer than the limit gets hard-cut instead.
      const cut = s.lastIndexOf(sep);
      if (cut > 0) s = s.slice(0, cut);
    }
    const trimEnd = sep === '_' ? /_+$/ : /-+$/;
    return s.replace(trimEnd, '');
  }

  function readMaxLen(): { max: number | null; valid: boolean } {
    const raw = maxLenInput.value.trim();
    if (raw === '') return { max: null, valid: true };
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) return { max: null, valid: false };
    return { max: n, valid: true };
  }

  function makeRow(before: string, after: string): HTMLLIElement {
    const li = document.createElement('li');
    const text = document.createElement('span');
    if (after) {
      text.textContent = `${before} → ${after}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost btn-sm';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', `Copy slug ${after}`);
      btn.addEventListener('click', () => void copyText(after));
      li.append(text, btn);
    } else {
      // Nothing survives stripping (e.g. a fully non-Latin or punctuation-only line).
      text.textContent = `${before} → (no Latin letters or digits left after stripping)`;
      li.append(text);
    }
    return li;
  }

  function update(): void {
    const messages: string[] = [];
    let raw = input.value;
    if (raw.length > MAX_INPUT_CHARS) {
      raw = raw.slice(0, MAX_INPUT_CHARS);
      messages.push(
        `Input is longer than ${MAX_INPUT_CHARS.toLocaleString('en-AU')} characters — only the first ${MAX_INPUT_CHARS.toLocaleString('en-AU')} were converted.`
      );
    }

    const { max, valid } = readMaxLen();
    if (!valid) {
      messages.push('Max length must be a whole number of 1 or more — the limit was ignored.');
    }

    const sep = separatorSelect.value === '_' ? '_' : '-';
    const lines = raw.split('\n').filter((line) => line.trim() !== '');

    allSlugs = [];
    list.textContent = '';
    const fragment = document.createDocumentFragment();
    let rendered = 0;

    for (const line of lines) {
      let slug = slugify(line, sep);
      if (max !== null) slug = truncateAtBoundary(slug, max, sep);
      if (slug) allSlugs.push(slug);
      if (rendered < MAX_RENDERED_ROWS) {
        fragment.appendChild(makeRow(line.trim(), slug));
        rendered += 1;
      }
    }
    list.appendChild(fragment);

    if (lines.length > MAX_RENDERED_ROWS) {
      listHint.textContent = `Showing the first ${MAX_RENDERED_ROWS} of ${lines.length.toLocaleString('en-AU')} lines — “Copy all slugs” includes every one.`;
    } else if (lines.length === 0) {
      listHint.textContent = 'Converted slugs appear here as you type.';
    } else {
      listHint.textContent = '';
    }

    countEl.textContent = `${lines.length.toLocaleString('en-AU')} ${lines.length === 1 ? 'line' : 'lines'} → ${allSlugs.length.toLocaleString('en-AU')} ${allSlugs.length === 1 ? 'slug' : 'slugs'}`;
    copyAllBtn.disabled = allSlugs.length === 0;
    error.textContent = messages.join(' ');
  }

  onInput(input, update, 150);
  separatorSelect.addEventListener('change', update);
  onInput(maxLenInput, update, 150);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  copyAllBtn.addEventListener('click', () => void copyText(allSlugs.join('\n')));

  update();
}
