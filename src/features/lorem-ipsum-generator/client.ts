import { randomInt } from '../../lib/random';
import { $, onInput } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="lorem-ipsum-generator"]');

if (root) {
  const output = $<HTMLTextAreaElement>('#li-output', root)!;
  const modeSelect = $<HTMLSelectElement>('#li-mode', root)!;
  const countInput = $<HTMLInputElement>('#li-count', root)!;
  const countHint = $('#li-count-hint', root)!;
  const startBox = $<HTMLInputElement>('#li-start', root)!;
  const htmlBox = $<HTMLInputElement>('#li-html', root)!;
  const error = $('#li-error', root)!;
  const generateBtn = $('#li-generate', root)!;
  const wordsEl = $('#li-words', root)!;
  const charsEl = $('#li-chars', root)!;

  type Mode = 'paragraphs' | 'sentences' | 'words';

  // The classic ~70-word lorem ipsum vocabulary (63 unique words of the
  // standard passage). Shipped as a const per the tool plan.
  const WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
    'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
    'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam',
    'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure',
    'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'eu',
    'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
    'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
  ] as const;

  const OPENING = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'] as const;

  const LIMITS: Record<Mode, number> = { paragraphs: 100, sentences: 500, words: 2000 };
  const UNITS: Record<Mode, string> = { paragraphs: 'paragraphs', sentences: 'sentences', words: 'words' };

  function mode(): Mode {
    const v = modeSelect.value;
    return v === 'sentences' || v === 'words' ? v : 'paragraphs';
  }

  /** Random vocabulary word; one redraw avoids immediate repeats ("dolor dolor"). */
  function pickWord(prev: string): string {
    let w = WORDS[randomInt(WORDS.length)]!;
    if (w === prev) w = WORDS[randomInt(WORDS.length)]!;
    return w;
  }

  /** 6–14 words, first capitalised, terminated with a full stop. */
  function sentence(classicOpening: boolean): string {
    const target = 6 + randomInt(9);
    const words: string[] = classicOpening ? [...OPENING] : [];
    while (words.length < target) words.push(pickWord(words[words.length - 1] ?? ''));
    const s = words.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }

  /** 4–8 sentences joined with single spaces. */
  function paragraph(classicOpening: boolean): string {
    const n = 4 + randomInt(5);
    const parts: string[] = [];
    for (let i = 0; i < n; i++) parts.push(sentence(classicOpening && i === 0));
    return parts.join(' ');
  }

  /** Exactly `count` space-separated words, first capitalised, no punctuation. */
  function generateWords(count: number, classicOpening: boolean): string {
    const words: string[] = classicOpening ? OPENING.slice(0, count) : [];
    while (words.length < count) words.push(pickWord(words[words.length - 1] ?? ''));
    const s = words.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function syncCountBounds(): void {
    const m = mode();
    countInput.max = String(LIMITS[m]);
    countHint.textContent = `1–${LIMITS[m]} ${UNITS[m]}`;
  }

  function generate(): void {
    const m = mode();
    const max = LIMITS[m];
    const count = Number(countInput.value.trim());
    if (countInput.value.trim() === '' || !Number.isInteger(count) || count < 1 || count > max) {
      output.value = '';
      wordsEl.textContent = '–';
      charsEl.textContent = '–';
      error.textContent = `Enter a whole number of ${UNITS[m]} between 1 and ${max}.`;
      return;
    }
    error.textContent = '';

    const start = startBox.checked;
    const asHtml = htmlBox.checked;

    let text: string;
    let wordCount: number;
    if (m === 'words') {
      const body = generateWords(count, start);
      text = asHtml ? `<p>${body}</p>` : body;
      wordCount = count;
    } else if (m === 'sentences') {
      const parts: string[] = [];
      for (let i = 0; i < count; i++) parts.push(sentence(start && i === 0));
      const body = parts.join(' ');
      text = asHtml ? `<p>${body}</p>` : body;
      wordCount = body.split(' ').length;
    } else {
      const paras: string[] = [];
      for (let i = 0; i < count; i++) paras.push(paragraph(start && i === 0));
      text = asHtml
        ? paras.map((p) => `<p>${p}</p>`).join('\n')
        : paras.join('\n\n');
      wordCount = paras.reduce((n, p) => n + p.split(' ').length, 0);
    }

    output.value = text;
    wordsEl.textContent = wordCount.toLocaleString();
    charsEl.textContent = text.length.toLocaleString();
  }

  generateBtn.addEventListener('click', generate);
  modeSelect.addEventListener('change', () => {
    syncCountBounds();
    generate();
  });
  onInput(countInput, generate);
  startBox.addEventListener('change', generate);
  htmlBox.addEventListener('change', generate);

  syncCountBounds();
  generate();
}
