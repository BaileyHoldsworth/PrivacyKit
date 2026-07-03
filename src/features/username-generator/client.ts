import { randomInt, randomItem } from '../../lib/random';
import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="username-generator"]');

if (root) {
  const keywordInput = $<HTMLInputElement>('#ug-keyword', root)!;
  const styleSelect = $<HTMLSelectElement>('#ug-style', root)!;
  const countInput = $<HTMLInputElement>('#ug-count', root)!;
  const countValue = $('#ug-count-value', root)!;
  const error = $('#ug-error', root)!;
  const results = $<HTMLUListElement>('#ug-results', root)!;
  const generateBtn = $('#ug-generate', root)!;
  const copyAllBtn = $('#ug-copy-all', root)!;

  // Curated safe-for-work wordlists: 60 adjectives + 60 nouns, no overlap.
  const ADJECTIVES: readonly string[] = [
    'amber', 'arctic', 'atomic', 'bold', 'brave', 'brisk', 'bronze', 'calm',
    'cobalt', 'copper', 'cosmic', 'crimson', 'curious', 'dapper', 'dusty',
    'eager', 'electric', 'fabled', 'fleet', 'frosty', 'gentle', 'gilded',
    'golden', 'granite', 'hazel', 'hidden', 'humble', 'iron', 'ivory', 'jade',
    'jolly', 'keen', 'lively', 'lunar', 'mellow', 'mighty', 'misty', 'neon',
    'nimble', 'noble', 'obsidian', 'olive', 'plucky', 'polar', 'quantum',
    'quiet', 'rapid', 'royal', 'rustic', 'sable', 'scarlet', 'silent',
    'silver', 'solar', 'sonic', 'stellar', 'stormy', 'swift', 'velvet',
    'vivid',
  ];
  const NOUNS: readonly string[] = [
    'acorn', 'anchor', 'archer', 'aurora', 'badger', 'bandit', 'beacon',
    'bison', 'blossom', 'breeze', 'canyon', 'cascade', 'comet', 'condor',
    'coyote', 'cypress', 'drifter', 'dune', 'falcon', 'fern', 'finch', 'fox',
    'gecko', 'glacier', 'harbour', 'hawk', 'heron', 'horizon', 'jaguar',
    'kestrel', 'lagoon', 'lantern', 'lynx', 'maple', 'meadow', 'meteor',
    'mongoose', 'moth', 'nebula', 'nomad', 'ocelot', 'orbit', 'orchid',
    'osprey', 'otter', 'panther', 'pebble', 'penguin', 'prairie', 'puffin',
    'quasar', 'raven', 'reef', 'ridge', 'rocket', 'sparrow', 'summit',
    'tundra', 'walrus', 'wombat',
  ];

  const STYLES = ['adjective-noun', 'noun-number', 'leetspeak', 'two-words'] as const;
  type Style = (typeof STYLES)[number];

  const LEET_MAP: Readonly<Record<string, string>> = {
    a: '4', e: '3', i: '1', o: '0', s: '5', t: '7',
  };

  let currentNames: string[] = [];

  const capitalise = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

  /**
   * Substitute a random subset (at least one) of eligible letters with their
   * leet digit. The first character is never touched so names keep starting
   * with a letter — some platforms reject digit-first usernames.
   */
  function leetLite(word: string): string {
    const chars = word.split('');
    const eligible: number[] = [];
    for (let i = 1; i < chars.length; i++) {
      const c = chars[i]!;
      if (LEET_MAP[c] !== undefined) eligible.push(i);
    }
    if (eligible.length === 0) return word;
    let chosen = eligible.filter(() => randomInt(2) === 1);
    if (chosen.length === 0) chosen = [randomItem(eligible)];
    for (const i of chosen) chars[i] = LEET_MAP[chars[i]!]!;
    return chars.join('');
  }

  function makeName(style: Style, keyword: string): string {
    switch (style) {
      case 'adjective-noun':
        return capitalise(randomItem(ADJECTIVES)) + capitalise(keyword || randomItem(NOUNS));
      case 'noun-number':
        // 2-4 digit suffix: uniform over 10..9999.
        return (keyword || randomItem(NOUNS)) + String(randomInt(9990) + 10);
      case 'leetspeak':
        return leetLite(randomItem(ADJECTIVES) + (keyword || randomItem(NOUNS)));
      case 'two-words': {
        const first = keyword || randomItem(ADJECTIVES);
        let second = randomItem(NOUNS);
        // Avoid "wolf_wolf" when the keyword happens to be a list word.
        for (let i = 0; second === first && i < 10; i++) second = randomItem(NOUNS);
        return `${first}_${second}`;
      }
    }
  }

  function currentStyle(): Style {
    const v = styleSelect.value;
    return (STYLES as readonly string[]).includes(v) ? (v as Style) : 'adjective-noun';
  }

  function currentCount(): number {
    const n = parseInt(countInput.value, 10);
    return Number.isFinite(n) ? Math.min(20, Math.max(5, n)) : 10;
  }

  function generate(): void {
    const raw = keywordInput.value.trim();
    // Keep letters and digits only; maxlength=24 on the input already blocks
    // giant pastes, the slice is a belt-and-braces cap.
    const keyword = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
    error.textContent =
      raw && !keyword
        ? 'Keyword needs at least one letter or number — generating without it.'
        : '';

    const style = currentStyle();
    const count = currentCount();
    const names = new Set<string>();
    // Dedupe with a retry cap so a keyword-narrowed space can never loop forever.
    let attempts = 0;
    while (names.size < count && attempts < count * 40) {
      names.add(makeName(style, keyword));
      attempts++;
    }
    currentNames = [...names];
    render();
  }

  function render(): void {
    results.textContent = '';
    for (const name of currentNames) {
      const li = document.createElement('li');
      li.style.cursor = 'pointer';
      li.title = 'Click to copy';

      const label = document.createElement('span');
      label.textContent = name;

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-ghost btn-sm';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', `Copy ${name}`);
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        void copyText(name);
      });

      li.addEventListener('click', () => void copyText(name));
      li.append(label, copyBtn);
      results.appendChild(li);
    }
  }

  generateBtn.addEventListener('click', generate);
  styleSelect.addEventListener('change', generate);
  onInput(countInput, () => {
    countValue.textContent = countInput.value;
    generate();
  });
  onInput(keywordInput, generate, 300);
  keywordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generate();
  });
  copyAllBtn.addEventListener('click', () => {
    if (currentNames.length === 0) {
      showToast('Nothing to copy yet — generate some names first', 'error');
      return;
    }
    void copyText(currentNames.join('\n'));
  });

  generate();
}
