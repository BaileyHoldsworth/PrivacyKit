/**
 * Lazy-load AdSense units: the async loader script is in <head>, but each
 * unit's push() only fires when the reserved container approaches the
 * viewport (400px early). Below-fold-only ads keep LCP/CLS clean and
 * viewability high.
 */

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let observer: IntersectionObserver | undefined;

export function initLazyAds(): void {
  const slots = document.querySelectorAll<HTMLElement>('[data-ad-lazy]:not([data-ad-loaded])');
  if (!slots.length) return;

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer!.unobserve(el);
        if (el.dataset.adLoaded) continue;
        el.dataset.adLoaded = 'true';
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          /* blocked or offline — the reserved container simply stays empty */
        }
      }
    },
    { rootMargin: '400px 0px' }
  );

  slots.forEach((el) => observer!.observe(el));
}
