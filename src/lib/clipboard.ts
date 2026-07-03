import { showToast } from './toast';

/** Copy text to the clipboard with toast feedback. Returns success. */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
    return true;
  } catch {
    showToast('Copy failed — select and copy manually', 'error');
    return false;
  }
}

/**
 * Auto-wiring: any <button data-copy-target="#sel"> copies the value (form
 * fields) or textContent (anything else) of the targeted element.
 * BaseLayout calls this once per page.
 */
export function wireCopyButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector<HTMLElement>(btn.dataset.copyTarget!);
      if (!target) return;
      const text =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
          ? target.value
          : (target.textContent ?? '');
      void copyText(text);
    });
  });
}
