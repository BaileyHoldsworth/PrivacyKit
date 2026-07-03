import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';

interface Counts {
  words: number;
  chars: number;
  charsNoSpace: number;
  sentences: number;
  paragraphs: number;
  approximate: boolean;
}

const root = document.querySelector<HTMLElement>('[data-tool="word-counter"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#wc-input', root)!;
  const error = $('#wc-error', root)!;
  const modeHint = $('#wc-mode-hint', root)!;
  const wordsEl = $('#wc-words', root)!;
  const charsEl = $('#wc-chars', root)!;
  const charsNoSpaceEl = $('#wc-chars-nospace', root)!;
  const sentencesEl = $('#wc-sentences', root)!;
  const paragraphsEl = $('#wc-paragraphs', root)!;
  const readingEl = $('#wc-reading', root)!;
  const speakingEl = $('#wc-speaking', root)!;
  const freqDetails = $<HTMLDetailsElement>('#wc-freq', root)!;
  const freqList = $('#wc-freq-list', root)!;
  const freqEmpty = $('#wc-freq-empty', root)!;
  const copyBtn = $('#wc-copy', root)!;
  const clearBtn = $('#wc-clear', root)!;

  const READING_WPM = 215;
  const SPEAKING_WPM = 130;
  /**
   * Above ~2M UTF-16 code units (≈2 MB) Intl.Segmenter takes hundreds of ms
   * on the main thread, so counting falls back to a fast approximate regex
   * pass (measured ~90 ms for 10 MB) and the UI says so.
   */
  const FAST_PATH_LIMIT = 2_000_000;

  const nf = new Intl.NumberFormat();
  const hasSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl;
  const wordSegmenter = hasSegmenter
    ? new Intl.Segmenter(undefined, { granularity: 'word' })
    : null;
  const sentenceSegmenter = hasSegmenter
    ? new Intl.Segmenter(undefined, { granularity: 'sentence' })
    : null;

  /** A run of letters/digits/marks, allowing internal apostrophes and hyphens. */
  const WORD_RUN = /[\p{L}\p{N}\p{M}](?:[\p{L}\p{N}\p{M}'’-]*[\p{L}\p{N}\p{M}])?/gu;
  const SENTENCE_END = /[.!?…‽]+["”')\]]*(?=\s|$)/gu;

  /** Common English function words (3+ letters — shorter ones are filtered by length). */
  const STOPWORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can',
    'had', 'has', 'have', 'her', 'was', 'one', 'our', 'out', 'his', 'him',
    'how', 'its', 'may', 'new', 'now', 'see', 'two', 'who', 'way', 'did',
    'get', 'got', 'use', 'that', 'this', 'with', 'will', 'your', 'from',
    'they', 'been', 'were', 'said', 'each', 'she', 'which', 'their', 'them',
    'then', 'there', 'these', 'those', 'what', 'some', 'would', 'could',
    'should', 'about', 'into', 'than', 'only', 'other', 'over', 'after',
    'also', 'just', 'like', 'very', 'well', 'much', 'many', 'most', 'such',
    'when', 'where', 'while', 'because', 'does', 'doing', 'done', 'being',
    'both', 'more', 'here', 'why', 'before', 'between', 'under', 'again',
    'once', 'off', 'own', 'same', 'too', 'nor', 'yet', 'via', 'per', 'etc',
    'still', 'even', 'ever', 'every', 'without', 'within', 'upon', 'onto',
    'among', 'however', 'though', 'although', 'through', 'during', 'against',
    'above', 'below', 'down', 'back', 'away', 'let', "don't", "can't",
    "won't", "isn't", "aren't", "wasn't", "weren't", "didn't", "doesn't",
    "haven't", "hasn't", "it's", "i'm", "i've", "i'll", "you're", "you've",
    "that's", "there's", "what's", "let's", "he's", "she's", "we're",
    "we've", "they're", "they've",
  ]);

  let latest: Counts = {
    words: 0,
    chars: 0,
    charsNoSpace: 0,
    sentences: 0,
    paragraphs: 0,
    approximate: false,
  };

  function countCodePoints(text: string): number {
    let n = 0;
    for (const _ of text) n++;
    return n;
  }

  function countMatches(text: string, re: RegExp): number {
    let n = 0;
    for (const _ of text.matchAll(re)) n++;
    return n;
  }

  function countParagraphs(text: string): number {
    let n = 0;
    for (const block of text.split(/\n\s*\n/)) {
      if (/\S/.test(block)) n++;
    }
    return n;
  }

  /** Exact counts via the Unicode segmenters. */
  function preciseCounts(text: string): { words: number; sentences: number } {
    let words = 0;
    for (const s of wordSegmenter!.segment(text)) {
      if (s.isWordLike) words++;
    }
    let sentences = 0;
    for (const s of sentenceSegmenter!.segment(text)) {
      if (/\S/.test(s.segment)) sentences++;
    }
    return { words, sentences };
  }

  /** Approximate counts for very large inputs (or missing Intl.Segmenter). */
  function fastCounts(text: string): { words: number; sentences: number } {
    const words = countMatches(text, WORD_RUN);
    let sentences = countMatches(text, SENTENCE_END);
    // A trailing fragment without a terminator is still a sentence.
    const tail = text.trimEnd().slice(-64);
    if (/\S/.test(tail) && !/[.!?…‽]["”')\]]*$/.test(tail)) sentences++;
    return { words, sentences };
  }

  function computeCounts(text: string): Counts {
    const approximate = !hasSegmenter || text.length > FAST_PATH_LIMIT;
    const { words, sentences } = approximate ? fastCounts(text) : preciseCounts(text);
    const chars = countCodePoints(text);
    // Whitespace is always in the BMP, so its code-unit count equals its
    // code-point count — one replace pass gets characters-without-spaces.
    const whitespace = text.length - text.replace(/\s+/gu, '').length;
    return {
      words,
      chars,
      charsNoSpace: chars - whitespace,
      sentences,
      paragraphs: countParagraphs(text),
      approximate,
    };
  }

  function formatTime(words: number, wpm: number): string {
    const secs = Math.round((words / wpm) * 60);
    if (secs < 60) return `${secs} s`;
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
  }

  function render(c: Counts): void {
    wordsEl.textContent = nf.format(c.words);
    charsEl.textContent = nf.format(c.chars);
    charsNoSpaceEl.textContent = nf.format(c.charsNoSpace);
    sentencesEl.textContent = nf.format(c.sentences);
    paragraphsEl.textContent = nf.format(c.paragraphs);
    readingEl.textContent = formatTime(c.words, READING_WPM);
    speakingEl.textContent = formatTime(c.words, SPEAKING_WPM);
    modeHint.hidden = !c.approximate;
  }

  function renderFrequency(text: string): void {
    const counts = new Map<string, number>();
    const add = (raw: string): void => {
      const w = raw.toLocaleLowerCase().replace(/’/g, "'");
      if (w.length < 3 || STOPWORDS.has(w) || !/\p{L}/u.test(w)) return;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    };
    if (hasSegmenter && text.length <= FAST_PATH_LIMIT) {
      for (const s of wordSegmenter!.segment(text)) {
        if (s.isWordLike) add(s.segment);
      }
    } else {
      for (const m of text.matchAll(WORD_RUN)) add(m[0]);
    }

    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10);

    freqList.textContent = '';
    for (const [word, n] of top) {
      const li = document.createElement('li');
      const wordEl = document.createElement('span');
      wordEl.textContent = word;
      const countEl = document.createElement('span');
      countEl.className = 'badge';
      countEl.textContent = `${nf.format(n)}×`;
      li.append(wordEl, countEl);
      freqList.appendChild(li);
    }
    freqList.hidden = top.length === 0;
    freqEmpty.hidden = top.length > 0;
  }

  function recount(): void {
    try {
      error.textContent = '';
      const text = input.value;
      latest = computeCounts(text);
      render(latest);
      // The frequency table is the heaviest pass — only compute it while
      // its <details> panel is actually open.
      if (freqDetails.open) renderFrequency(text);
    } catch (e) {
      error.textContent = `Could not count this text: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  copyBtn.addEventListener('click', () => {
    const c = latest;
    const summary = [
      `Words: ${nf.format(c.words)}`,
      `Characters: ${nf.format(c.chars)}`,
      `Characters (no spaces): ${nf.format(c.charsNoSpace)}`,
      `Sentences: ${nf.format(c.sentences)}`,
      `Paragraphs: ${nf.format(c.paragraphs)}`,
      `Reading time: ${formatTime(c.words, READING_WPM)}`,
      `Speaking time: ${formatTime(c.words, SPEAKING_WPM)}`,
    ].join('\n');
    void copyText(summary);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    recount();
    input.focus();
  });

  freqDetails.addEventListener('toggle', () => {
    if (freqDetails.open) renderFrequency(input.value);
  });

  // 200 ms debounce keeps 1 MB pastes smooth (full precise recount ≈ 40 ms).
  onInput(input, recount, 200);
  recount();
}
