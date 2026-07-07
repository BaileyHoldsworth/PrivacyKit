/** Central site configuration. Monetization stays dormant until flipped. */
export const SITE = {
  name: 'PrivacyKit',
  url: 'https://privacykit.dev',
  tagline: 'Free privacy & developer tools that run in your browser',
  description:
    'Free online privacy and developer tools that run entirely in your browser. Generate passwords, decode JWTs, format JSON, strip EXIF data and more — no signup, no uploads.',
  /**
   * Contact address shown on /contact/ and /about/.
   * TODO(owner): confirm — recommended: create the free Cloudflare Email
   * Routing alias support@privacykit.dev and forward it to your inbox.
   */
  contactEmail: 'support@privacykit.dev',

  /**
   * ADS MASTER SWITCH.
   * false → AdSlot components render nothing and the adsbygoogle loader is
   * omitted sitewide. Flip to true only after AdSense approval, fill in the
   * slot IDs below, uncomment the preconnect line in public/_headers, rebuild.
   */
  adsEnabled: false,
  adClient: 'ca-pub-5308109286906812',
  adSlots: {
    /** Below-content slot on tool pages. 336x280 reserved. */
    toolBottom: '',
    /** Mid-article slot on guides. 300x250 reserved. */
    articleMid: '',
    /** Below-content slot on category hubs. 336x280 reserved. */
    hubBottom: '',
  },

  /** Ko-fi profile URL. Empty string → the footer link is not rendered. */
  koFiUrl: 'https://ko-fi.com/privacykit',

  /**
   * Cloudflare Web Analytics beacon token. Cookieless, no consent banner
   * needed. Empty → no beacon rendered (and the privacy policy must not claim
   * analytics). Fill from the Cloudflare Web Analytics dashboard to activate.
   * Alternative: enable Web Analytics on the Pages project for auto-injection,
   * in which case leave this empty.
   */
  analyticsToken: '',
} as const;
