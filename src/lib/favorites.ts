/**
 * Favorites + recently-used, stored in localStorage. Purely client-side — no
 * cookies, nothing leaves the browser. The homepage renders empty containers
 * that this hydrates; tool pages record a visit and drive a star toggle.
 */

const FAV_KEY = 'pk_favorites';
const RECENT_KEY = 'pk_recent';
const RECENT_MAX = 8;

interface IndexedTool {
  slug: string;
  name: string;
  description: string;
}

function read(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function write(key: string, value: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — favorites are best-effort */
  }
}

export function getFavorites(): string[] {
  return read(FAV_KEY);
}

export function isFavorite(slug: string): boolean {
  return read(FAV_KEY).includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const favs = read(FAV_KEY);
  const i = favs.indexOf(slug);
  if (i >= 0) favs.splice(i, 1);
  else favs.unshift(slug);
  write(FAV_KEY, favs);
  return i < 0; // true = now a favorite
}

export function recordVisit(slug: string): void {
  const recent = read(RECENT_KEY).filter((s) => s !== slug);
  recent.unshift(slug);
  write(RECENT_KEY, recent.slice(0, RECENT_MAX));
}

/** Wire the tool-page star button: <button data-fav-toggle="<slug>"> */
export function initFavoriteToggle(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-fav-toggle]');
  if (!btn) return;
  const slug = btn.dataset.favToggle!;
  const paint = (on: boolean) => {
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-fav', on);
    const label = btn.querySelector('.fav-label');
    if (label) label.textContent = on ? 'Saved' : 'Save';
  };
  paint(isFavorite(slug));
  btn.addEventListener('click', () => paint(toggleFavorite(slug)));
}

let indexCache: Promise<IndexedTool[]> | null = null;
function loadIndex(): Promise<IndexedTool[]> {
  indexCache ??= fetch('/search-index.json')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return indexCache;
}

function cardHtml(t: IndexedTool): string {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return `<li><a class="tool-card" href="/tools/${encodeURIComponent(t.slug)}/">
    <span class="tool-card-body">
      <span class="tool-card-name">${esc(t.name)}</span>
      <span class="tool-card-desc">${esc(t.description)}</span>
    </span></a></li>`;
}

/** Hydrate the homepage "Your favorites" and "Recently used" sections. */
export async function hydrateHomeSections(): Promise<void> {
  const favSection = document.getElementById('fav-section');
  const recentSection = document.getElementById('recent-section');
  if (!favSection && !recentSection) return;

  const favs = getFavorites();
  const recent = getRecentExcludingFavs(favs);
  if (favs.length === 0 && recent.length === 0) return;

  const index = await loadIndex();
  const bySlug = new Map(index.map((t) => [t.slug, t]));

  const fill = (section: HTMLElement | null, slugs: string[]) => {
    if (!section) return;
    const tools = slugs.map((s) => bySlug.get(s)).filter((t): t is IndexedTool => Boolean(t));
    if (tools.length === 0) return;
    const list = section.querySelector('.tool-grid');
    if (list) list.innerHTML = tools.map(cardHtml).join('');
    section.hidden = false;
  };

  fill(favSection, favs);
  fill(recentSection, recent);
}

function getRecentExcludingFavs(favs: string[]): string[] {
  return read(RECENT_KEY).filter((s) => !favs.includes(s));
}
