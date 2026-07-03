import { randomItem, shuffle } from '../../lib/random';
import { $, onInput } from '../../lib/dom';

const root = document.querySelector<HTMLElement>('[data-tool="password-generator"]');

if (root) {
  const output = $<HTMLInputElement>('#pg-output', root)!;
  const lengthInput = $<HTMLInputElement>('#pg-length', root)!;
  const lengthValue = $('#pg-length-value', root)!;
  const error = $('#pg-error', root)!;
  const entropyEl = $('#pg-entropy', root)!;
  const crackTimeEl = $('#pg-crack-time', root)!;
  const generateBtn = $('#pg-generate', root)!;

  const checkboxes = {
    lower: $<HTMLInputElement>('#pg-lowercase', root)!,
    upper: $<HTMLInputElement>('#pg-uppercase', root)!,
    numbers: $<HTMLInputElement>('#pg-numbers', root)!,
    symbols: $<HTMLInputElement>('#pg-symbols', root)!,
    noAmbiguous: $<HTMLInputElement>('#pg-no-ambiguous', root)!,
  };

  const SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>/?',
  };
  const AMBIGUOUS = /[O0Il1]/g;

  function activePools(): string[] {
    const pools: string[] = [];
    if (checkboxes.lower.checked) pools.push(SETS.lower);
    if (checkboxes.upper.checked) pools.push(SETS.upper);
    if (checkboxes.numbers.checked) pools.push(SETS.numbers);
    if (checkboxes.symbols.checked) pools.push(SETS.symbols);
    if (checkboxes.noAmbiguous.checked) {
      return pools
        .map((p) => p.replace(AMBIGUOUS, ''))
        .filter((p) => p.length > 0);
    }
    return pools;
  }

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

  function generate(): void {
    const pools = activePools();
    if (pools.length === 0) {
      output.value = '';
      error.textContent = 'Select at least one character set.';
      entropyEl.textContent = '–';
      crackTimeEl.textContent = '–';
      return;
    }
    error.textContent = '';

    const length = parseInt(lengthInput.value, 10);
    const charset = pools.join('');

    // Guarantee at least one character from each selected set, fill the rest
    // from the combined pool, then shuffle — all with unbiased randomness.
    const chars: string[] = pools.map((pool) => randomItem(pool));
    while (chars.length < length) chars.push(randomItem(charset));
    shuffle(chars);
    output.value = chars.join('');

    // Entropy of the generation process ≈ length × log2(|charset|).
    const bits = length * Math.log2(charset.length);
    entropyEl.textContent = bits.toFixed(0);
    // Average time to find: half the keyspace at 10^10 guesses per second.
    crackTimeEl.textContent = formatDuration(2 ** bits / 2 / 1e10);
  }

  generateBtn.addEventListener('click', generate);
  onInput(lengthInput, () => {
    lengthValue.textContent = lengthInput.value;
    generate();
  });
  for (const box of [checkboxes.lower, checkboxes.upper, checkboxes.numbers, checkboxes.symbols, checkboxes.noAmbiguous]) {
    box.addEventListener('change', generate);
  }

  generate();
}
