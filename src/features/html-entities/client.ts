import { $, onInput } from '../../lib/dom';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

/** The `he` package ships no type declarations; the surface used here is typed locally. */
interface HeModule {
  encode(text: string, options?: { useNamedReferences?: boolean; decimal?: boolean }): string;
  decode(html: string, options?: { strict?: boolean }): string;
}

const root = document.querySelector<HTMLElement>('[data-tool="html-entities"]');

if (root) {
  const direction = $<HTMLSelectElement>('#ent-direction', root)!;
  const scope = $<HTMLSelectElement>('#ent-scope', root)!;
  const namedRefs = $<HTMLInputElement>('#ent-named', root)!;
  const scopeHint = $('#ent-scope-hint', root)!;
  const swapBtn = $<HTMLButtonElement>('#ent-swap', root)!;
  const input = $<HTMLTextAreaElement>('#ent-input', root)!;
  const output = $<HTMLTextAreaElement>('#ent-output', root)!;
  const inputLabel = $('#ent-input-label', root)!;
  const outputLabel = $('#ent-output-label', root)!;
  const inputCount = $('#ent-input-count', root)!;
  const outputCount = $('#ent-output-count', root)!;
  const error = $('#ent-error', root)!;
  const clearBtn = $<HTMLButtonElement>('#ent-clear', root)!;
  const downloadBtn = $<HTMLButtonElement>('#ent-download', root)!;

  const HINTS = {
    special:
      'Encodes only the five characters HTML treats specially — & < > " \' — and leaves ' +
      'accents, dashes and emoji untouched.',
    all:
      'Also converts every non-ASCII character (é, —, emoji) to an entity, so the output ' +
      'is plain ASCII and survives any legacy charset.',
    decode:
      'Decoding recognises named (&eacute;), decimal (&#233;) and hex (&#xE9;) references, ' +
      'including legacy names written without a trailing semicolon.',
  };

  // The five specials need no library. Values match he.encode output exactly:
  // named uses &apos; (valid HTML5), numeric uses decimal references.
  const NAMED_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  const NUMERIC_MAP: Record<string, string> = {
    '&': '&#38;',
    '<': '&#60;',
    '>': '&#62;',
    '"': '&#34;',
    "'": '&#39;',
  };
  const SPECIALS_RE = /[&<>"']/g;

  let he: HeModule | null = null;
  let loading: Promise<HeModule> | null = null;

  /**
   * The entity tables are the bulk of `he`, so the library loads on first use
   * via dynamic import rather than with the page. Memoised; reset on failure
   * so the next keystroke retries (e.g. after coming back online).
   */
  function loadHe(): Promise<HeModule> {
    if (!loading) {
      // @ts-ignore -- `he` has no bundled or @types declarations; typed via HeModule below.
      loading = import('he')
        .then((mod: unknown) => {
          he = ((mod as { default?: unknown }).default ?? mod) as HeModule;
          return he;
        })
        .catch((err: unknown) => {
          loading = null;
          throw err;
        });
    }
    return loading;
  }

  // Encoding a 10 MB paste in one go would block the main thread for close to
  // a second, so large inputs are processed in ~256k-character slices with a
  // yield between them. A generation counter cancels superseded runs.
  const CHUNK_CHARS = 262_144;
  let runId = 0;

  async function inChunks(
    text: string,
    fn: (slice: string) => string,
    id: number
  ): Promise<string | null> {
    if (text.length <= CHUNK_CHARS) return fn(text);
    const parts: string[] = [];
    let i = 0;
    while (i < text.length) {
      let end = Math.min(i + CHUNK_CHARS, text.length);
      // Never split a surrogate pair (e.g. an emoji) across two slices.
      const cc = text.charCodeAt(end - 1);
      if (end < text.length && cc >= 0xd800 && cc <= 0xdbff) end += 1;
      parts.push(fn(text.slice(i, end)));
      i = end;
      if (i < text.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (id !== runId) return null;
      }
    }
    return parts.join('');
  }

  function setCount(el: HTMLElement, chars: number): void {
    el.textContent = `${chars.toLocaleString()} ${chars === 1 ? 'character' : 'characters'}`;
  }

  function fail(message: string): void {
    output.value = '';
    setCount(outputCount, 0);
    error.textContent = message;
  }

  async function convert(): Promise<void> {
    const id = ++runId;
    const raw = input.value;
    setCount(inputCount, raw.length);
    error.textContent = '';

    if (raw === '') {
      output.value = '';
      setCount(outputCount, 0);
      return;
    }

    const encoding = direction.value === 'encode';
    const specialOnly = scope.value === 'special';

    // Special-chars-only encoding runs off the local map; decoding and
    // non-ASCII encoding need the full entity tables.
    let lib: HeModule | null = he;
    if (!lib && !(encoding && specialOnly)) {
      try {
        lib = await loadHe();
      } catch {
        if (id === runId) {
          fail(
            'Could not load the entity tables (a one-off static file) — you may be offline. ' +
              'Check your connection and type again to retry.'
          );
        }
        return;
      }
      if (id !== runId) return;
    }

    let result: string | null;
    try {
      if (!encoding) {
        // he.decode is lenient by design: unknown names pass through, legacy
        // semicolon-less references decode per the HTML spec. It never throws
        // in non-strict mode, so no error path is needed for broken entities.
        result = lib!.decode(raw);
      } else if (specialOnly) {
        const map = namedRefs.checked ? NAMED_MAP : NUMERIC_MAP;
        result = await inChunks(raw, (s) => s.replace(SPECIALS_RE, (ch) => map[ch]!), id);
      } else {
        const opts = { useNamedReferences: namedRefs.checked, decimal: true };
        result = await inChunks(raw, (s) => lib!.encode(s, opts), id);
      }
    } catch {
      if (id === runId) {
        fail('Conversion failed — the input contains a character sequence that could not be processed. Re-paste the text and try again.');
      }
      return;
    }

    if (result === null || id !== runId) return;
    output.value = result;
    setCount(outputCount, result.length);
  }

  function applyDirection(): void {
    const encoding = direction.value === 'encode';
    scope.disabled = !encoding;
    namedRefs.disabled = !encoding;
    scopeHint.textContent = encoding
      ? HINTS[scope.value === 'all' ? 'all' : 'special']
      : HINTS.decode;
    inputLabel.textContent = encoding ? 'Text input' : 'Encoded input';
    outputLabel.textContent = encoding ? 'Encoded output' : 'Decoded text';
    input.placeholder = encoding
      ? 'Type or paste text to encode'
      : 'Paste text with HTML entities to decode';
    output.placeholder = encoding
      ? 'Entity-encoded text appears here as you type'
      : 'Decoded text appears here';
  }

  onInput(input, () => void convert(), 150);
  direction.addEventListener('change', () => {
    applyDirection();
    void convert();
  });
  scope.addEventListener('change', () => {
    applyDirection();
    void convert();
  });
  namedRefs.addEventListener('change', () => void convert());

  swapBtn.addEventListener('click', () => {
    direction.value = direction.value === 'encode' ? 'decode' : 'encode';
    if (output.value) input.value = output.value;
    applyDirection();
    void convert();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet', 'error');
      return;
    }
    downloadText(output.value, direction.value === 'encode' ? 'html-encoded.txt' : 'html-decoded.txt');
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    void convert();
    input.focus();
  });

  applyDirection();
  void convert();
}
