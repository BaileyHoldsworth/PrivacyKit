/**
 * Command palette: Ctrl/Cmd+K fuzzy search over /search-index.json.
 * Vanilla TS, no dependencies; the index is fetched once on first open.
 */

interface IndexedTool {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  cat: string;
}

const MAX_RESULTS = 10;

const dialog = document.querySelector<HTMLDialogElement>('dialog.palette');
const input = dialog?.querySelector<HTMLInputElement>('.palette-input');
const list = dialog?.querySelector<HTMLUListElement>('.palette-results');

if (dialog && input && list) {
  let tools: IndexedTool[] | null = null;
  let fetching: Promise<void> | null = null;
  let shown: IndexedTool[] = [];
  let selected = 0;

  /**
   * Greedy subsequence match of `query` against `hay` (both lowercase).
   * Returns null on no match; otherwise a score where word-start hits
   * outweigh consecutive runs (exact-prefix bonus is added by the caller).
   */
  function fuzzyScore(query: string, hay: string): number | null {
    let score = 0;
    let from = 0;
    let prev = -2;
    for (const ch of query) {
      if (ch === ' ') continue;
      const idx = hay.indexOf(ch, from);
      if (idx === -1) return null;
      score += 1;
      if (idx === 0 || !/[a-z0-9]/.test(hay[idx - 1]!)) score += 8;
      else if (idx === prev + 1) score += 5;
      prev = idx;
      from = idx + 1;
    }
    return score;
  }

  function rank(query: string): IndexedTool[] {
    const q = query.trim().toLowerCase();
    if (!q) return tools ?? []; // empty query = browse all (index is pre-sorted)
    const scored: [number, IndexedTool][] = [];
    for (const tool of tools ?? []) {
      const name = tool.name.toLowerCase();
      const hay = `${name} ${tool.keywords.join(' ')} ${tool.cat}`.toLowerCase();
      const score = fuzzyScore(q, hay);
      if (score === null) continue;
      scored.push([name.startsWith(q) ? score + 100 : score, tool]);
    }
    scored.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name));
    return scored.slice(0, MAX_RESULTS).map(([, tool]) => tool);
  }

  function render(): void {
    list.textContent = '';
    if (shown.length === 0) {
      const li = document.createElement('li');
      li.className = 'palette-empty';
      li.textContent = tools === null ? 'Couldn’t load the tool index.' : 'No tools match';
      list.appendChild(li);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    shown.forEach((tool, i) => {
      const li = document.createElement('li');
      li.id = `palette-opt-${i}`;
      li.className = 'palette-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');

      const top = document.createElement('div');
      top.className = 'palette-item-top';
      const name = document.createElement('span');
      name.className = 'palette-item-name';
      name.textContent = tool.name;
      const chip = document.createElement('span');
      chip.className = 'badge';
      chip.textContent = tool.cat;
      top.append(name, chip);

      const desc = document.createElement('span');
      desc.className = 'palette-item-desc';
      desc.textContent = tool.description;

      li.append(top, desc);
      li.addEventListener('click', () => go(tool));
      list.appendChild(li);
    });
    select(0);
  }

  function select(i: number): void {
    const items = list.querySelectorAll<HTMLLIElement>('.palette-item');
    if (items.length === 0) return;
    selected = (i + items.length) % items.length;
    items.forEach((el, j) => el.setAttribute('aria-selected', String(j === selected)));
    const active = items[selected]!;
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  }

  function go(tool: IndexedTool): void {
    dialog!.close();
    window.location.href = `/tools/${tool.slug}/`;
  }

  function update(): void {
    shown = rank(input.value);
    render();
  }

  function loadIndex(): Promise<void> {
    fetching ??= fetch('/search-index.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data: IndexedTool[]) => {
        tools = data;
      })
      .catch(() => {
        fetching = null; // allow a retry on the next open
      });
    return fetching;
  }

  function open(): void {
    if (dialog!.open) return;
    dialog!.showModal();
    input.value = '';
    update();
    void loadIndex().then(update);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    }
  });
  document.getElementById('open-palette')?.addEventListener('click', open);

  // Clicks on ::backdrop dispatch with the dialog itself as the target.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      select(selected + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      select(selected - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const tool = shown[selected];
      if (tool) go(tool);
    }
  });
}
