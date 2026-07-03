import { randomInt, randomItem } from '../../lib/random';
import { $, onInput } from '../../lib/dom';

const WORDLIST_URL = '/data/eff-wordlist.json';
const WORDLIST_LENGTH = 7776; // EFF long list: 6^5 diceware entries

// Module-scope cache: the wordlist is fetched at most once per page life.
let wordlist: string[] | null = null;
let pending: Promise<string[]> | null = null;

function loadWordlist(): Promise<string[]> {
  if (wordlist) return Promise.resolve(wordlist);
  pending ??= fetch(WORDLIST_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<unknown>;
    })
    .then((data) => {
      if (
        !Array.isArray(data) ||
        data.length !== WORDLIST_LENGTH ||
        data.some((w: unknown) => typeof w !== 'string' || w.length === 0)
      ) {
        throw new Error('unexpected wordlist format');
      }
      wordlist = data as string[];
      return wordlist;
    })
    .catch((err: unknown) => {
      pending = null; // clear so the next generate retries the fetch
      throw err;
    });
  return pending;
}

const root = document.querySelector<HTMLElement>('[data-tool="passphrase-generator"]');

if (root) {
  const output = $<HTMLInputElement>('#pp-output', root)!;
  const wordsInput = $<HTMLInputElement>('#pp-words', root)!;
  const wordsValue = $('#pp-words-value', root)!;
  const separatorSelect = $<HTMLSelectElement>('#pp-separator', root)!;
  const capitalise = $<HTMLInputElement>('#pp-capitalise', root)!;
  const digit = $<HTMLInputElement>('#pp-digit', root)!;
  const error = $('#pp-error', root)!;
  const entropyEl = $('#pp-entropy', root)!;
  const crackTimeEl = $('#pp-crack-time', root)!;
  const generateBtn = $('#pp-generate', root)!;

  function formatDuration(seconds: number): string {
    if (seconds < 1) return 'instant';
    const units: [number, string][] = [
      [60, 'seconds'],
      [60, 'minutes'],
      [24, 'hours'],
      [365, 'days'],
      [1000, 'years'],
      [1000, 'thousand years'],
      [1000, 'million years'],
      [1000, 'billion years'],
    ];
    let value = seconds;
    let label = 'seconds';
    for (const [div, next] of units) {
      if (value < div) break;
      value /= div;
      label = next;
    }
    if (label === 'billion years' && value >= 1000) return 'longer than the universe';
    return `${value >= 100 ? Math.round(value) : value.toPrecision(2)} ${label}`;
  }

  // Monotonic ticket so a slow wordlist fetch can never clobber the output
  // of a generate() triggered later.
  let run = 0;

  async function generate(): Promise<void> {
    const ticket = ++run;

    let list: string[];
    try {
      list = await loadWordlist();
    } catch {
      if (ticket !== run) return;
      output.value = '';
      entropyEl.textContent = '–';
      crackTimeEl.textContent = '–';
      error.textContent =
        'Could not load the word list — check your connection, then press Generate to retry.';
      return;
    }
    if (ticket !== run) return;
    error.textContent = '';

    const count = Math.min(10, Math.max(3, parseInt(wordsInput.value, 10) || 5));
    let words = Array.from({ length: count }, () => randomItem(list));
    if (capitalise.checked) {
      words = words.map((w) => w[0]!.toUpperCase() + w.slice(1));
    }
    let phrase = words.join(separatorSelect.value);

    // Entropy of the process: count × log2(7776) ≈ 12.92 bits per word.
    // The capitalise option is deterministic and adds nothing; the appended
    // digit is a uniform random draw worth log2(10) ≈ 3.32 bits.
    let bits = count * Math.log2(list.length);
    if (digit.checked) {
      phrase += String(randomInt(10));
      bits += Math.log2(10);
    }

    output.value = phrase;
    entropyEl.textContent = bits.toFixed(1);
    // Average time to find: half the keyspace at 10^10 guesses per second.
    crackTimeEl.textContent = formatDuration(2 ** bits / 2 / 1e10);
  }

  generateBtn.addEventListener('click', () => void generate());
  onInput(wordsInput, () => {
    wordsValue.textContent = wordsInput.value;
    void generate();
  });
  separatorSelect.addEventListener('change', () => void generate());
  capitalise.addEventListener('change', () => void generate());
  digit.addEventListener('change', () => void generate());

  void generate();
}
