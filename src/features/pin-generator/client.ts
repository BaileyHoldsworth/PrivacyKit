import { randomChars } from '../../lib/random';
import { $, $$, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';

const root = document.querySelector<HTMLElement>('[data-tool="pin-generator"]');

if (root) {
  const list = $<HTMLUListElement>('#pin-list', root)!;
  const copyAllBtn = $<HTMLButtonElement>('#pin-copy-all', root)!;
  const lengthButtons = $$<HTMLButtonElement>('[data-pin-length]', root);
  const customInput = $<HTMLInputElement>('#pin-length-custom', root)!;
  const countInput = $<HTMLInputElement>('#pin-count', root)!;
  const countValue = $('#pin-count-value', root)!;
  const noRepeatsBox = $<HTMLInputElement>('#pin-no-repeats', root)!;
  const noSequencesBox = $<HTMLInputElement>('#pin-no-sequences', root)!;
  const error = $('#pin-error', root)!;
  const generateBtn = $('#pin-generate', root)!;
  const entropyEl = $('#pin-entropy', root)!;
  const spaceEl = $('#pin-space', root)!;
  const noteEl = $('#pin-note', root)!;

  const DIGITS = '0123456789';
  const LOCKOUT_NOTE = "A PIN's main protection is the device's lockout policy, not its entropy — see the FAQ below.";

  let selectedLength: number | 'custom' = 6;
  let currentPins: string[] = [];

  /** True if any digit appears 3+ times in a row (also catches full repeats like 111111). */
  function hasTripleRepeat(pin: string): boolean {
    for (let i = 2; i < pin.length; i++) {
      if (pin[i] === pin[i - 1] && pin[i] === pin[i - 2]) return true;
    }
    return false;
  }

  /** True if the PIN contains an ascending or descending run of 4+ digits (1234, 9876). */
  function hasSequence(pin: string): boolean {
    let asc = 1;
    let desc = 1;
    for (let i = 1; i < pin.length; i++) {
      const step = pin.charCodeAt(i) - pin.charCodeAt(i - 1);
      asc = step === 1 ? asc + 1 : 1;
      desc = step === -1 ? desc + 1 : 1;
      if (asc >= 4 || desc >= 4) return true;
    }
    return false;
  }

  /**
   * Exact count of PINs of the given length that pass the active filters,
   * via dynamic programming over (last digit, same-digit run, asc run, desc
   * run) — so the entropy stat is the honest log2 of the real keyspace, not
   * the unfiltered 10^n. Verified against brute force for lengths 4-6.
   * Max value is 10^12, comfortably inside Number.MAX_SAFE_INTEGER.
   */
  function countValidPins(length: number, noRepeats: boolean, noSequences: boolean): number {
    if (!noRepeats && !noSequences) return 10 ** length;
    // Runs are capped at the rejection threshold; caps keep the state space at
    // 10 digits x 3 same-run x 4 asc x 4 desc.
    const key = (d: number, same: number, asc: number, desc: number) =>
      ((d * 4 + same) * 5 + asc) * 5 + desc;
    let states = new Map<number, number>();
    for (let d = 0; d < 10; d++) states.set(key(d, 1, 1, 1), 1);
    for (let pos = 1; pos < length; pos++) {
      const next = new Map<number, number>();
      for (const [k, cnt] of states) {
        const desc = k % 5;
        const asc = Math.floor(k / 5) % 5;
        const same = Math.floor(k / 25) % 4;
        const d = Math.floor(k / 100);
        for (let e = 0; e < 10; e++) {
          const same2 = e === d ? Math.min(same + 1, 3) : 1;
          const asc2 = e === d + 1 ? Math.min(asc + 1, 4) : 1;
          const desc2 = e === d - 1 ? Math.min(desc + 1, 4) : 1;
          if (noRepeats && same2 >= 3) continue;
          if (noSequences && (asc2 >= 4 || desc2 >= 4)) continue;
          const k2 = key(e, same2, asc2, desc2);
          next.set(k2, (next.get(k2) ?? 0) + cnt);
        }
      }
      states = next;
    }
    let total = 0;
    for (const cnt of states.values()) total += cnt;
    return total;
  }

  /** Draw one PIN, rejecting filtered patterns; null if 1000 attempts fail. */
  function drawPin(length: number, noRepeats: boolean, noSequences: boolean): string | null {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const pin = randomChars(DIGITS, length);
      if (noRepeats && hasTripleRepeat(pin)) continue;
      if (noSequences && hasSequence(pin)) continue;
      return pin;
    }
    return null;
  }

  /** Resolve the active length, or null (with an inline error) when invalid. */
  function currentLength(): number | null {
    if (selectedLength !== 'custom') return selectedLength;
    const raw = customInput.value.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < 4 || n > 12) {
      error.textContent = 'Custom length must be a whole number from 4 to 12.';
      return null;
    }
    return n;
  }

  function renderList(pins: string[]): void {
    list.textContent = '';
    for (const pin of pins) {
      const li = document.createElement('li');
      const value = document.createElement('span');
      value.textContent = pin;
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-ghost btn-sm';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', `Copy PIN ${pin}`);
      copyBtn.addEventListener('click', () => void copyText(pin));
      li.append(value, copyBtn);
      list.appendChild(li);
    }
    currentPins = pins;
    copyAllBtn.disabled = pins.length === 0;
  }

  function generate(): void {
    error.textContent = '';
    const length = currentLength();
    if (length === null) return; // keep the previous output visible

    const noRepeats = noRepeatsBox.checked;
    const noSequences = noSequencesBox.checked;
    const count = parseInt(countInput.value, 10);

    const pins: string[] = [];
    for (let i = 0; i < count; i++) {
      const pin = drawPin(length, noRepeats, noSequences);
      if (pin === null) {
        // Practically unreachable (filters keep >90% of the keyspace), but the
        // rejection loop is capped so a logic bug can never hang the page.
        error.textContent =
          'No PIN passed the filters after 1,000 attempts — try relaxing a filter.';
        return;
      }
      pins.push(pin);
    }
    renderList(pins);

    const space = countValidPins(length, noRepeats, noSequences);
    entropyEl.textContent = Math.log2(space).toFixed(1);
    spaceEl.textContent = space.toLocaleString('en');
    const removed = 1 - space / 10 ** length;
    noteEl.textContent =
      removed > 0
        ? `The filters exclude ${(removed * 100).toPrecision(2)}% of all ${length}-digit combinations. ${LOCKOUT_NOTE}`
        : LOCKOUT_NOTE;
  }

  for (const btn of lengthButtons) {
    btn.addEventListener('click', () => {
      for (const b of lengthButtons) {
        const active = b === btn;
        b.setAttribute('aria-pressed', String(active));
        b.classList.toggle('btn-primary', active);
      }
      const value = btn.dataset.pinLength!;
      if (value === 'custom') {
        selectedLength = 'custom';
        customInput.hidden = false;
        customInput.focus();
      } else {
        selectedLength = parseInt(value, 10);
        customInput.hidden = true;
      }
      generate();
    });
  }

  onInput(customInput, generate);
  onInput(countInput, () => {
    countValue.textContent = countInput.value;
    generate();
  });
  noRepeatsBox.addEventListener('change', generate);
  noSequencesBox.addEventListener('change', generate);
  generateBtn.addEventListener('click', generate);
  copyAllBtn.addEventListener('click', () => void copyText(currentPins.join('\n')));

  generate();
}
