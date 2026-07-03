import { $, onInput } from '../../lib/dom';
import type { ZxcvbnFactory, ZxcvbnResult } from '@zxcvbn-ts/core';

/**
 * zxcvbn analyses at most this many characters. Its cost grows superlinearly
 * with length (the repeat matcher dominates on pathological pastes: ~4s at
 * 256 chars, ~0.6s at 72 in local benchmarks), so we slice before checking.
 * 72 covers every realistic password — bcrypt itself truncates at 72 bytes —
 * and a truncation note is shown when input is longer.
 */
const ANALYSE_CAP = 72;

const SCORE_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
// 0-1 red, 2-3 amber (score 3 still falls to an offline rig in under a
// second — the meter shouldn't glow green when the offline stat says that),
// 4 green.
const SCORE_BADGES = ['badge-danger', 'badge-danger', 'badge-warn', 'badge-warn', 'badge-ok'] as const;

const root = document.querySelector<HTMLElement>('[data-tool="password-strength-checker"]');

if (root) {
  const input = $<HTMLInputElement>('#psc-input', root)!;
  const toggle = $<HTMLButtonElement>('#psc-toggle', root)!;
  const meter = $('#psc-meter', root)!;
  const scoreBadge = $('#psc-score', root)!;
  const status = $('#psc-status', root)!;
  const error = $('#psc-error', root)!;
  const guessesEl = $('#psc-guesses', root)!;
  const onlineEl = $('#psc-online', root)!;
  const offlineEl = $('#psc-offline', root)!;
  const feedbackPane = $('#psc-feedback', root)!;
  const warningEl = $('#psc-warning', root)!;
  const suggestionsEl = $<HTMLUListElement>('#psc-suggestions', root)!;

  let checker: ZxcvbnFactory | null = null;
  let loading: Promise<ZxcvbnFactory> | null = null;

  /**
   * The dictionaries weigh ~800 KB, so they load on the first keystroke via
   * dynamic import rather than with the page. Memoised; reset on failure so
   * the next keystroke retries.
   */
  function loadChecker(): Promise<ZxcvbnFactory> {
    if (!loading) {
      loading = Promise.all([
        import('@zxcvbn-ts/core'),
        import('@zxcvbn-ts/language-common'),
        import('@zxcvbn-ts/language-en'),
      ])
        .then(([core, common, en]) => {
          checker = new core.ZxcvbnFactory({
            translations: en.translations,
            graphs: common.adjacencyGraphs,
            dictionary: { ...common.dictionary, ...en.dictionary },
          });
          return checker;
        })
        .catch((err: unknown) => {
          loading = null;
          throw err;
        });
    }
    return loading;
  }

  function resetOutputs(): void {
    delete meter.dataset.score;
    scoreBadge.textContent = 'Not rated';
    scoreBadge.className = 'badge';
    guessesEl.textContent = '–';
    onlineEl.textContent = '–';
    offlineEl.textContent = '–';
    feedbackPane.hidden = true;
    status.textContent = '';
  }

  function render(result: ZxcvbnResult): void {
    const score = result.score;
    meter.dataset.score = String(score);
    scoreBadge.textContent = SCORE_LABELS[score];
    scoreBadge.className = `badge ${SCORE_BADGES[score]}`;

    guessesEl.textContent = `~10^${result.guessesLog10.toFixed(1)}`;
    onlineEl.textContent = result.crackTimes.onlineThrottlingXPerHour.display;
    offlineEl.textContent = result.crackTimes.offlineFastHashingXPerSecond.display;

    warningEl.textContent = result.feedback.warning ?? '';
    warningEl.hidden = !result.feedback.warning;
    suggestionsEl.textContent = '';
    const suggestions = result.feedback.suggestions.slice();
    if (!result.feedback.warning && suggestions.length === 0 && score === 4) {
      suggestions.push('No weak patterns found — length and unpredictability are doing the work.');
    }
    for (const suggestion of suggestions) {
      const li = document.createElement('li');
      li.textContent = suggestion;
      suggestionsEl.appendChild(li);
    }
    feedbackPane.hidden = warningEl.hidden && suggestions.length === 0;
  }

  async function analyse(): Promise<void> {
    error.textContent = '';
    if (input.value === '') {
      resetOutputs();
      return;
    }

    let engine = checker;
    if (!engine) {
      status.textContent = 'Analysing…';
      try {
        engine = await loadChecker();
      } catch {
        status.textContent = '';
        error.textContent =
          'Could not load the analysis engine — check your connection, then type again to retry.';
        return;
      }
    }

    // The value may have changed (or been cleared) while dictionaries loaded.
    const value = input.value;
    if (value === '') {
      resetOutputs();
      return;
    }
    status.textContent =
      value.length > ANALYSE_CAP
        ? `Long input — only the first ${ANALYSE_CAP} characters are analysed.`
        : '';
    render(engine.check(value.slice(0, ANALYSE_CAP)));
  }

  onInput(input, () => void analyse(), 150);

  toggle.addEventListener('click', () => {
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    toggle.textContent = reveal ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(reveal));
    toggle.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
  });

  // Analyse a value the browser restored (e.g. back navigation).
  if (input.value !== '') void analyse();
}
