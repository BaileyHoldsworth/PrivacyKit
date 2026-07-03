/** Single sitewide toast. BaseLayout renders the container. */

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, kind: 'ok' | 'error' = 'ok'): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.dataset.kind = kind;
  el.classList.add('toast-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => el.classList.remove('toast-visible'), 2200);
}
