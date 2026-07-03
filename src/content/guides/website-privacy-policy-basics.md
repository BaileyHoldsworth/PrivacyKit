---
title: "Does Your Website Need a Privacy Policy?"
description: When GDPR, CCPA and the Australian Privacy Act actually reach a small site, which analytics and forms trigger the duty, and what a policy must contain.
tools:
  - privacy-policy-generator
relatedGuides:
  - url-tracking-parameters
  - what-your-ip-reveals
  - browser-fingerprinting
affiliateGroup: dev
updated: 2026-07-03
---

Most people building a small site assume a privacy policy is a formality for big
companies with legal departments. The more useful way to think about it: the
moment your pages collect anything about a visitor — an email, an IP address in
a server log, a cookie set by an analytics script — you have taken on a
disclosure duty in at least one jurisdiction. The question is rarely "do I need
one" in the abstract. It is "which laws reach me, and what did I already switch
on without noticing".

**This is not legal advice.** It is a plain-English map of how the common regimes
work so you can ask a qualified professional the right questions. Thresholds and
exemptions change, and the specifics of your business decide the answer.

## The trigger is data, not size

A privacy policy is a transparency document. Its legal job is to tell a person,
before or at the point you collect their data, what you collect and why. That
duty attaches to the act of collecting — not to your revenue, headcount, or
whether you have ever heard of the relevant statute. A hobby blog that runs
nothing but static HTML and no analytics genuinely has little to disclose. Add
one tracking script and the calculus changes.

Three regimes cover the overwhelming majority of English-language sites. They
overlap, and it is normal for one site to sit under two of them at once.

| Regime | Who it reaches | Threshold to be in scope |
| --- | --- | --- |
| GDPR (EU) / UK GDPR | Anyone processing personal data of people **in** the EU/UK | No revenue or size floor. Offering goods/services to, or monitoring, EU/UK visitors is enough |
| CCPA/CPRA (California) | For-profit businesses handling California residents' data | US$25M+ gross revenue, **or** buys/sells/shares data of 100,000+ consumers, **or** 50%+ of revenue from selling/sharing data |
| Australian Privacy Act | Australian businesses | Annual turnover over A$3M — but several exceptions pull smaller businesses back in |

The trap is reading "US$25M" and relaxing. GDPR has no equivalent floor. If a
single person in Germany can buy from your shop or read your newsletter, the
transparency obligations in Articles 13 and 14 apply to you regardless of where
you or your servers sit.

## What you switched on that counts

You rarely decide to "collect personal data". You add a plugin. Here is what the
usual building blocks actually pull in:

- **Analytics.** Google Analytics 4 processes IP addresses and sets identifiers.
  Under GDPR an IP address is personal data, so this alone puts you in scope.
  Cookieless tools like Plausible or Fathom reduce what you collect but still
  warrant an honest sentence saying so.
- **Advertising pixels.** A Meta or Google Ads pixel shares visitor behaviour
  with a third party for targeting. That sharing is the highest-risk item on
  most small sites and the one most policies describe least accurately.
- **Contact and signup forms.** A name and email typed into a form is textbook
  personal data. A newsletter list is a processing purpose you must state.
- **Server logs and CDNs.** Even with no analytics, your host logs IPs and user
  agents. Cloudflare, Vercel and similar sit in the request path too.

Separately from the law, the vendors themselves require a policy. Google's terms
for Analytics and AdSense, and Meta's for its pixel, all oblige you to publish
one. You can be under the A$3M threshold and still owe a policy purely by
contract.

## Worked example: a bakery side-site

Concrete numbers make this land. Say you run **Loafers & Co**, a sole-trader
bakery in Melbourne. Annual turnover is **A$280,000**. The site is a Squarespace
page with Google Analytics 4, a Mailchimp newsletter (**420 subscribers**), a
Meta pixel for local Instagram ads, and a contact form. You ship to roughly
**30 EU customers a year** who order sourdough starters online.

Walk the table row by row:

| Regime | The maths | In scope? |
| --- | --- | --- |
| Australian Privacy Act | A$280k turnover is well under the A$3M threshold | Exempt **by default** — see the caveat below |
| CCPA/CPRA | ~US$185k revenue ≪ US$25M; nowhere near 100,000 consumers; you don't sell data | **No** |
| GDPR / UK GDPR | You offer goods to people in the EU (the 30 sourdough orders) | **Yes** — Article 3(2) applies |

So the naive read — "tiny Australian business, under every threshold" — is wrong.
The 30 EU orders alone put you squarely under GDPR, which has no small-business
escape hatch for the duty to publish a notice. On top of that, GA4, Mailchimp and
the Meta pixel each independently require a policy under their own terms. The
Australian exemption is also shakier than it looks: running a pixel that shares
customer data for ad targeting can edge you into the "discloses personal
information about another individual for a benefit" exception, and reforms to the
Privacy Act are progressively narrowing the small-business carve-out — so treat
that "exempt" as provisional and check the current position.

Loafers & Co needs a policy. Not because of its size, but because of three EU
customers and three third-party scripts.

## The minimum a policy must contain

Whatever regime you land under, the honest core is the same. A workable policy
states:

1. **Who you are** — the entity and a real contact point for privacy questions.
2. **What you collect** — enumerated: form fields, analytics identifiers, logs,
   payment data.
3. **Why, and on what basis** — the purpose for each item; GDPR wants a lawful
   basis such as consent or legitimate interest.
4. **Who you share it with** — every third party by category or name: the
   analytics provider, the mailer, the ad network, the payment processor.
5. **How long you keep it** and how someone exercises their rights (access,
   deletion, complaint to a regulator).

The single most common failure is under-disclosure: a policy that mentions the
contact form but forgets the Meta pixel quietly shipping behaviour to a third
party. Your policy must claim exactly what your site does — no more, no less.

## Generator, template, or lawyer?

Be honest about what each option buys you. A generator or template gets you
accurate, readable text fast and is genuinely fine for a low-risk brochure site,
a side project, or a mailing-list page. It cannot know your specific processors,
where each visitor lives, or the rules peculiar to your industry — health,
finance and anything involving children carry obligations no template encodes. If
you handle sensitive categories or sell data, that is a lawyer conversation, not
a checkbox.

The [privacy policy generator](/tools/privacy-policy-generator/) sits at the
first tier deliberately. It assembles vetted, plain-English sections from the
boxes you tick — untick the Meta pixel and its disclosure disappears, so the
draft only ever claims what you actually run — and it does the whole assembly in
your browser, sending nothing to a server. Treat its output as a first draft to
hand to a reviewer, not a finished legal document.

## What to do next

Inventory before you generate. Open your site, list every script and form, and
note each third party in the request path — that list is the raw material a good
policy is built from. If your outbound links carry tracking parameters, the
[URL tracking parameters guide](/guides/url-tracking-parameters/) explains what
`utm_`, `fbclid` and `gclid` reveal about the people who click them. To see how
much a visitor's IP alone discloses before you describe it, the
[what your IP reveals guide](/guides/what-your-ip-reveals/) is a grounded start.
Then draft with the [privacy policy generator](/tools/privacy-policy-generator/),
read it against your inventory line by line, and have someone qualified check it
before it goes live.
