/**
 * Theme toggle behavior. The no-flash inline script in BaseLayout sets the
 * initial data-theme before paint; this module only handles the toggle button
 * and system-preference changes. Tools never touch theming.
 */

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function initThemeToggle(): void {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = (document.documentElement.dataset.theme as Theme) ?? systemTheme();
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      // Storing only an explicit override; no stored value = follow system.
      localStorage.setItem('theme', next);
    } catch {
      /* private mode — session-only toggle is fine */
    }
  });

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem('theme')) apply(e.matches ? 'dark' : 'light');
      } catch {
        apply(e.matches ? 'dark' : 'light');
      }
    });
}
