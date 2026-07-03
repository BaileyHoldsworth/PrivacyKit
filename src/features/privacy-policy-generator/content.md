---
name: Privacy Policy Generator
title: Privacy Policy Generator — Free Simple Template | PrivacyKit
description: Build a plain-English website privacy policy in your browser. Enter your site details, tick the data you collect, and copy the draft as HTML, Markdown, or text.
category: privacy
keywords:
  - privacy policy generator
  - free privacy policy
  - privacy policy template
  - gdpr policy
  - website privacy policy
icon: file-certificate
related:
  - url-cleaner
  - browser-fingerprint
  - word-counter
privacy: local
affiliateGroup: dev
popular: false
updated: 2026-07-03
jsonLdCategory: UtilitiesApplication
faqs:
  - q: Is the generated privacy policy legally binding or ready to publish?
    a: >-
      Treat it as a first draft, not a finished legal document. It assembles
      sober, plain-English sections from the boxes you tick, but privacy law
      depends on the details of your business, where your visitors live, and
      exactly which third parties you use. Have a qualified professional review
      the wording before you publish it — this tool cannot know your specific
      obligations.
  - q: How do the checkboxes change what the policy says?
    a: >-
      Each option maps to real sections. Ticking **Uses analytics** adds an
      Analytics section and — for cookie-based providers like Google Analytics
      or Matomo — a matching cookie disclosure; picking Plausible or Fathom
      instead states that no cookies or personal data are used. **Takes
      payments** adds a payment-processor section that says card details never
      touch your server. Untick something and its section disappears entirely,
      so the policy only ever claims what you actually do.
  - q: Does this cover GDPR, CCPA, or the Australian Privacy Act?
    a: >-
      The **Your rights** section rewrites itself from the jurisdiction you
      pick. The EU and UK options list the GDPR access, erasure, portability
      and complaint rights; Australia cites the Australian Privacy Principles
      and the OAIC; the US option covers CCPA/CPRA; Canada cites PIPEDA.
      Publishing the text is only step one — you still have to honour those
      rights in practice.
  - q: Do I actually need a privacy policy if I only run Google Analytics or AdSense?
    a: >-
      Yes. Both set cookies and process personal data such as IP addresses, and
      Google's own terms require sites using them to have a privacy policy.
      Tick **Uses analytics** (and **Shows advertising** for AdSense) and the
      generator adds the disclosures those services expect, including how
      visitors can opt out.
  - q: Is anything I type sent to a server?
    a: >-
      No. The whole policy is assembled by JavaScript running on this page —
      your site name, URL, email and choices never leave the browser and
      nothing is stored. You can open your browser's network tab and generate a
      policy to confirm no request is made. That also means the tool works
      offline once the page has loaded.
  - q: Can I edit the wording after generating it?
    a: >-
      Yes — the draft is a starting point. Copy it as Markdown for a CMS or
      README, as HTML to paste into a web page, or as plain text, then adjust
      any clause. If you leave the email or URL blank, the policy inserts a
      `[your contact email]` style placeholder so you can spot and fill the
      gaps before publishing.
---

## How to use

1. Type your site or business name into the first field — it heads the policy and sets the download filename. Add your website URL and a contact email if you have them; leave the email blank and a bracketed placeholder is dropped in for you to fill later.
2. Choose your primary jurisdiction from the dropdown — Australia, the EU, UK, US, Canada, or "not sure". This rewrites the **Your rights** section to match the local law.
3. Tick every box that describes what your site actually does: server logs, cookies, analytics, contact forms, user accounts, a newsletter, payments, advertising.
4. If analytics is ticked, pick your provider. Cookieless options such as Plausible or Fathom produce noticeably different wording than Google Analytics or Matomo.
5. Read the live preview, then copy the draft as Markdown, HTML, or plain text — or download it as a `.md` file.

## How it works

The generator is a deterministic assembler, not a language model, so nothing is invented on the fly. Each control maps to a fixed block of vetted wording, and the finished policy is the sum of the blocks whose conditions are true. Internally it builds an ordered list of typed blocks — each one a heading, a paragraph, or a bullet list — then renders that list three ways: to Markdown, to escaped HTML, and to indented plain text.

Walk through a concrete run. Enter **Harbour City Yoga** as the name and `https://harbourcityyoga.com.au` as the URL, leave the email blank, set the jurisdiction to Australia, and tick server logs, cookies, analytics, contact forms and newsletter, with Plausible as the analytics provider. The header becomes "Privacy Policy for Harbour City Yoga" above a "Last updated: 4 July 2026" line formatted in en-AU. The **Information we collect** list gains one bullet each for enquiry-form details, the newsletter email address, standard server logs and cookies, plus — because Plausible is cookieless — a line describing aggregated, anonymous usage data with no cookies or personal identifiers. Picking Google Analytics instead would swap that bullet for an IP-and-cookie disclosure and add an analytics-cookie line to the **Cookies** section. Since the jurisdiction is Australia, **Your rights** cites the Australian Privacy Principles and sends unresolved complaints to the OAIC; switch to the EU and that same section lists the GDPR access, erasure and portability rights. The blank email leaves a `[your contact email]` placeholder everywhere an address would otherwise sit, so the gaps are easy to spot before you publish.

## Use cases & limitations

Reach for this when a launch checklist says "add a privacy policy" and you want honest, readable text in a couple of minutes — a tradesperson's booking site, a side-project SaaS, a mailing-list landing page, or any site running Google Analytics or AdSense, both of which require a policy under Google's own terms. Because it runs offline once loaded and regenerates as you toggle options, it stays quick to keep in sync when your stack changes.

The limitation is the one the disclaimer above the tool states plainly: this is a starting draft, not legal advice. It cannot know which specific processors you use, where each of your visitors lives, or the obligations peculiar to your industry, so a qualified professional should review the wording before it goes live. It also only ever claims what you tick — helpful, but it means an inaccurate checkbox yields an inaccurate policy. Once you have a draft, paste it into the [word counter](/tools/word-counter/) to gauge length, and if you want to see what a visitor's browser actually exposes before describing it, the [browser fingerprint](/tools/browser-fingerprint/) tool shows you first-hand.

## Privacy note

Every part of the assembly happens in your browser. It is plain JavaScript — the site name, URL, email and every checkbox stay on this page, no request is sent, and nothing is saved. Confirm it yourself by opening the network tab and generating a policy: no traffic leaves. And if your policy needs to describe the tracking parameters in your outbound links, the [URL cleaner](/tools/url-cleaner/) strips those locally too.
