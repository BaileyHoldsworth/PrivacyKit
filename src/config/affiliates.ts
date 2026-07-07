/**
 * Affiliate offers, grouped by audience intent.
 *
 * An offer renders ONLY when its `url` is non-empty, so the whole system is
 * dormant until the owner signs up to a program and pastes the tracking URL.
 * AffiliateBox shows at most the first two configured offers of a group and
 * always includes the disclosure line + link to /affiliate-disclosure/.
 *
 * Mullvad is deliberately absent: they ban affiliate marketing. Mention them
 * editorially in guides where relevant — honesty is the brand.
 */
export interface AffiliateOffer {
  name: string;
  /** Tracking URL from the affiliate program. Empty = offer hidden. */
  url: string;
  /** One honest sentence. No superlatives, no "world's best". */
  blurb: string;
  cta: string;
}

// Program status (2026-07-07):
//   Proton     — APPROVED. aff_id=18914. Link format:
//                https://go.getproton.me/aff_c?offer_id={OFFER}&aff_id=18914
//                Known offer_id: Lumo=68. STILL NEED Pass + VPN offer_ids
//                (Offers → All Offers in the Proton partner dashboard).
//                (Owner: add a payout method + tax form before payouts work.)
//   1Password  — PENDING review via CJ. No link yet.
//   NordPass / NordVPN — signed up (NordPass B2C); check the Nord partner
//                dashboard for the tracking link once approved.
//   Namecheap  — DECLINED on manual review. Can reapply later.
//   DigitalOcean — needs a separate Awin account; not started.
export const AFFILIATES: Record<'passwords' | 'vpn' | 'dev', AffiliateOffer[]> = {
  passwords: [
    {
      name: 'Proton Pass',
      // TODO(owner): paste Proton Pass link — offer_id from the dashboard:
      // https://go.getproton.me/aff_c?offer_id={PASS_OFFER}&aff_id=18914
      url: '',
      blurb:
        'Open-source password manager from the Proton (Switzerland) team, with end-to-end encryption and a solid free tier.',
      cta: 'Try Proton Pass',
    },
    {
      name: '1Password',
      url: '',
      blurb:
        'Polished password manager for families and teams, with strong audited security and travel mode.',
      cta: 'Try 1Password',
    },
    {
      name: 'NordPass',
      url: '',
      blurb:
        'Straightforward password manager from the Nord Security team with breach monitoring built in.',
      cta: 'Try NordPass',
    },
  ],
  vpn: [
    {
      name: 'Proton VPN',
      // TODO(owner): paste Proton VPN link — offer_id from the dashboard:
      // https://go.getproton.me/aff_c?offer_id={VPN_OFFER}&aff_id=18914
      url: '',
      blurb:
        'VPN from the Proton team with a genuinely free tier, open-source apps and independently audited no-logs policy.',
      cta: 'Try Proton VPN',
    },
    {
      name: 'NordVPN',
      url: '',
      blurb: 'Large, fast VPN network with audited no-logs policy and consistent independent test results.',
      cta: 'Try NordVPN',
    },
  ],
  dev: [
    {
      name: 'Namecheap',
      url: '',
      blurb: 'Domain registrar with fair renewal pricing and free WHOIS privacy on every domain.',
      cta: 'Search domains',
    },
    {
      name: 'DigitalOcean',
      url: '',
      blurb: 'Developer-friendly cloud hosting with predictable pricing — good first home for side projects.',
      cta: 'Get started',
    },
  ],
};
