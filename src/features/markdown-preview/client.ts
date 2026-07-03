import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="markdown-preview"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#md-input', root)!;
  const preview = $('#md-preview', root)!;
  const hint = $('#md-hint', root)!;
  const error = $('#md-error', root)!;
  const renderBtn = $('#md-render', root)!;
  const clearBtn = $('#md-clear', root)!;
  const copyBtn = $('#md-copy-html', root)!;
  const downloadBtn = $('#md-download', root)!;

  /** Parse + sanitise stays around ~40ms at this size (measured) — safe to run live. */
  const LIVE_LIMIT = 200_000;
  /** 10MB takes over a second of main-thread parse time; refuse beyond this. */
  const HARD_LIMIT = 5_000_000;

  const DEFAULT_HINT = hint.textContent ?? '';
  const EMPTY_MESSAGE = 'Nothing to preview yet — type some Markdown on the left.';

  // Lazy-load parser + sanitiser together on first render. On failure
  // (offline before the chunks were cached) reset so a later attempt retries.
  type Engine = { toHtml: (src: string) => string };
  let enginePromise: Promise<Engine | null> | null = null;
  function loadEngine(): Promise<Engine | null> {
    enginePromise ??= Promise.all([import('marked'), import('dompurify')])
      .then(([m, d]) => {
        const purify = d.default;
        // Links inside the preview must not hijack this page.
        purify.addHook('afterSanitizeAttributes', (node) => {
          if (node.tagName === 'A' && node.hasAttribute('href')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        });
        return {
          // REQUIRED order: marked emits raw HTML from user markdown; DOMPurify
          // must sanitise it before it can ever reach innerHTML.
          toHtml: (src: string) =>
            purify.sanitize(m.marked.parse(src, { gfm: true, async: false }), {
              USE_PROFILES: { html: true },
            }),
        };
      })
      .catch(() => {
        enginePromise = null;
        return null;
      });
    return enginePromise;
  }

  /** Sanitised HTML of the current preview, for Copy/Download. The initial
   *  value is the build-time-rendered sample (trusted, our own content). */
  let lastHtml = preview.innerHTML;
  let runId = 0;

  function setPlaceholder(message: string): void {
    const p = document.createElement('p');
    p.className = 'field-hint';
    p.textContent = message;
    preview.replaceChildren(p);
    lastHtml = '';
  }

  async function render(): Promise<void> {
    const id = ++runId;
    const src = input.value;
    error.textContent = '';

    if (!src.trim()) {
      setPlaceholder(EMPTY_MESSAGE);
      return;
    }
    if (src.length > HARD_LIMIT) {
      error.textContent = `Input is ${src.length.toLocaleString()} characters — the preview is capped at ${HARD_LIMIT.toLocaleString()} to keep this page responsive. Split the document and render it in parts.`;
      return;
    }

    const engine = await loadEngine();
    if (id !== runId) return; // superseded while the engine loaded
    if (!engine) {
      error.textContent =
        'Could not load the Markdown renderer — it downloads from this site once on first use. Check your connection and try again.';
      return;
    }

    try {
      const clean = engine.toHtml(src);
      if (id !== runId) return;
      if (!clean.trim()) {
        setPlaceholder('That input produced no visible output — script tags and other unsafe HTML are removed by sanitisation.');
        return;
      }
      preview.innerHTML = clean;
      lastHtml = clean;
    } catch {
      error.textContent = 'Rendering failed on this input — trim the document down and try again.';
    }
  }

  function updateHint(): void {
    const n = input.value.length;
    hint.textContent =
      n > LIVE_LIMIT
        ? `${n.toLocaleString()} characters — live preview pauses above ${LIVE_LIMIT.toLocaleString()}. Press Render preview (or Ctrl+Enter in the editor).`
        : DEFAULT_HINT;
  }

  /** Re-render live only while it is cheap; large documents wait for the button. */
  function renderIfLive(): void {
    updateHint();
    if (input.value.length <= LIVE_LIMIT) void render();
  }

  onInput(input, renderIfLive, 150);
  renderBtn.addEventListener('click', () => void render());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void render();
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    error.textContent = '';
    setPlaceholder(EMPTY_MESSAGE);
    updateHint();
    input.focus();
  });

  copyBtn.addEventListener('click', () => {
    if (!lastHtml) {
      showToast('Nothing to copy — the preview is empty', 'error');
      return;
    }
    void copyText(lastHtml);
  });

  downloadBtn.addEventListener('click', () => {
    if (!lastHtml) {
      showToast('Nothing to download — the preview is empty', 'error');
      return;
    }
    downloadText(lastHtml, 'markdown.html', 'text/html');
  });
}
