/** Small DOM helpers shared by tool clients. */

export function $<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(sel);
}

export function $$<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

/** Attach an input listener, optionally debounced (for heavy computations). */
export function onInput(el: HTMLElement, fn: () => void, debounceMs = 0): void {
  if (debounceMs <= 0) {
    el.addEventListener('input', fn);
    return;
  }
  let t: ReturnType<typeof setTimeout>;
  el.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(fn, debounceMs);
  });
}

/**
 * Wire a `.dropzone` element: click-to-pick, drag-and-drop, and paste.
 * `accept` mirrors the file input's accept attribute.
 */
export function wireDropzone(
  zone: HTMLElement,
  onFiles: (files: File[]) => void,
  accept?: string
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  if (accept) input.accept = accept;
  input.hidden = true;
  zone.appendChild(input);

  const emit = (list: FileList | null) => {
    if (list && list.length) onFiles(Array.from(list));
  };

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
  input.addEventListener('change', () => {
    emit(input.files);
    input.value = '';
  });
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dropzone-active');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dropzone-active'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dropzone-active');
    emit(e.dataTransfer?.files ?? null);
  });
}
