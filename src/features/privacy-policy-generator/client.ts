import { $, onInput } from '../../lib/dom';
import { copyText } from '../../lib/clipboard';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="privacy-policy-generator"]');

if (root) {
  const nameInput = $<HTMLInputElement>('#ppg-name', root)!;
  const urlInput = $<HTMLInputElement>('#ppg-url', root)!;
  const emailInput = $<HTMLInputElement>('#ppg-email', root)!;
  const countrySel = $<HTMLSelectElement>('#ppg-country', root)!;
  const providerSel = $<HTMLSelectElement>('#ppg-analytics-provider', root)!;
  const errorEl = $('#ppg-error', root)!;
  const preview = $('#ppg-preview', root)!;
  const generateBtn = $('#ppg-generate', root)!;

  const boxes = {
    logs: $<HTMLInputElement>('#ppg-logs', root)!,
    cookies: $<HTMLInputElement>('#ppg-cookies', root)!,
    analytics: $<HTMLInputElement>('#ppg-analytics', root)!,
    contact: $<HTMLInputElement>('#ppg-contact', root)!,
    accounts: $<HTMLInputElement>('#ppg-accounts', root)!,
    newsletter: $<HTMLInputElement>('#ppg-newsletter', root)!,
    payments: $<HTMLInputElement>('#ppg-payments', root)!,
    ads: $<HTMLInputElement>('#ppg-ads', root)!,
  };

  const copyMdBtn = $<HTMLButtonElement>('#ppg-copy-md', root)!;
  const copyHtmlBtn = $<HTMLButtonElement>('#ppg-copy-html', root)!;
  const copyTextBtn = $<HTMLButtonElement>('#ppg-copy-text', root)!;
  const downloadBtn = $<HTMLButtonElement>('#ppg-download', root)!;

  // Guardrails against pathological pasted input.
  const MAX_NAME = 200;
  const MAX_URL = 2000;
  const MAX_EMAIL = 254;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const today = new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  type Block =
    | { tag: 'h1' | 'h2' | 'p'; text: string }
    | { tag: 'ul'; items: string[] };

  interface Config {
    name: string;
    url: string | null;
    email: string;
    country: string;
    provider: string;
    date: string;
    logs: boolean;
    cookies: boolean;
    analytics: boolean;
    contact: boolean;
    accounts: boolean;
    newsletter: boolean;
    payments: boolean;
    ads: boolean;
  }

  function providerName(p: string): string {
    return (
      {
        google: 'Google Analytics',
        plausible: 'Plausible',
        fathom: 'Fathom',
        matomo: 'Matomo',
        other: 'a third-party analytics provider',
      } as Record<string, string>
    )[p] ?? 'a third-party analytics provider';
  }

  function buildPolicy(cfg: Config): Block[] {
    const b: Block[] = [];
    const name = cfg.name;
    const email = cfg.email || '[your contact email]';
    const url = cfg.url;
    const pName = providerName(cfg.provider);
    const cookieAnalytics =
      cfg.analytics &&
      (cfg.provider === 'google' || cfg.provider === 'matomo' || cfg.provider === 'other');

    b.push({ tag: 'h1', text: `Privacy Policy for ${name}` });
    b.push({ tag: 'p', text: `Last updated: ${cfg.date}` });
    b.push({
      tag: 'p',
      text: url
        ? `This Privacy Policy explains how ${name} ("we", "us") collects, uses, and protects your information when you visit ${url}. By using the site you agree to the practices described below.`
        : `This Privacy Policy explains how ${name} ("we", "us") collects, uses, and protects your information when you use our website and services. By using the site you agree to the practices described below.`,
    });

    // Information we collect
    const collect: string[] = [];
    if (cfg.accounts)
      collect.push('Account details you provide when you register — such as your name, email address, and a password (stored only as a secure hash).');
    if (cfg.contact)
      collect.push('Information you submit through contact or enquiry forms, including your name, email address, and the content of your message.');
    if (cfg.newsletter)
      collect.push('The email address you give us when subscribing to our newsletter or mailing list.');
    if (cfg.payments)
      collect.push('Order and billing details needed to process a purchase. Card payments are handled by a third-party payment processor (such as Stripe or PayPal); we do not see or store full card numbers.');
    if (cfg.logs)
      collect.push('Standard server log data your browser sends automatically — your IP address, browser type, referring page, and the date and time of each request.');
    if (cfg.cookies)
      collect.push('Information stored in cookies and similar technologies on your device (see the Cookies section below).');
    if (cfg.analytics)
      collect.push(
        cfg.provider === 'plausible' || cfg.provider === 'fathom'
          ? `Aggregated, anonymous usage data collected by ${pName} — such as pages viewed and general device type — with no cookies or personal identifiers.`
          : `Usage data collected by ${pName} to understand how visitors use the site, such as pages viewed, approximate location, and device and browser type.`
      );
    if (collect.length === 0)
      collect.push('Only the information you actively choose to send us, such as messages you send us by email.');
    b.push({ tag: 'h2', text: 'Information we collect' });
    b.push({ tag: 'p', text: 'We collect the following, depending on how you interact with the site:' });
    b.push({ tag: 'ul', items: collect });

    // How we use it
    const use = ['To operate, maintain, and improve the site and its content.'];
    if (cfg.accounts) use.push('To create and manage your account and provide the features you sign up for.');
    if (cfg.contact) use.push('To respond to your enquiries and provide support.');
    if (cfg.newsletter) use.push('To send the newsletters or updates you subscribed to. Every email includes an unsubscribe link.');
    if (cfg.payments) use.push('To process your orders, take payment, and provide receipts.');
    if (cfg.analytics) use.push('To measure traffic and understand which content is useful, using aggregated statistics.');
    if (cfg.ads) use.push('To display advertising and measure how it performs.');
    use.push('To keep the site secure and detect abuse or fraud.');
    use.push('To meet our legal obligations.');
    b.push({ tag: 'h2', text: 'How we use your information' });
    b.push({ tag: 'ul', items: use });

    // Cookies
    if (cfg.cookies) {
      b.push({ tag: 'h2', text: 'Cookies' });
      b.push({ tag: 'p', text: 'We use cookies — small text files stored by your browser — to keep the site working and to remember your preferences.' });
      const ck = [`Essential cookies required for core features such as ${cfg.accounts ? 'signing in and ' : ''}security.`];
      if (cookieAnalytics) ck.push(`Analytics cookies set by ${pName} that count visits and measure usage.`);
      if (cfg.ads) ck.push('Advertising cookies set by our ad partners to show and measure ads.');
      b.push({ tag: 'ul', items: ck });
      b.push({ tag: 'p', text: 'You can block or delete cookies in your browser settings, though some features may stop working. Where the law requires it, we ask for your consent before setting non-essential cookies.' });
    }

    // Analytics
    if (cfg.analytics) {
      b.push({ tag: 'h2', text: 'Analytics' });
      const map: Record<string, string> = {
        google: "We use Google Analytics to see how visitors use the site. It sets cookies and sends usage data — including a shortened version of your IP address — to Google, which processes it under its own privacy policy. You can opt out by installing Google's browser add-on.",
        plausible: 'We use Plausible, a privacy-focused analytics service. It does not use cookies, does not collect personal data, and does not track you across other websites.',
        fathom: 'We use Fathom Analytics, a privacy-focused service that does not use cookies or collect personal data, and does not track you across other sites.',
        matomo: 'We use Matomo for analytics, configured to anonymise IP addresses. Aggregated usage data is stored on our behalf and is not shared with third parties for advertising.',
        other: 'We use a third-party analytics service to collect aggregated statistics about site usage. It may set cookies and processes limited data under its own privacy policy.',
      };
      b.push({ tag: 'p', text: map[cfg.provider] ?? map.other! });
    }

    // Advertising
    if (cfg.ads) {
      b.push({ tag: 'h2', text: 'Advertising' });
      b.push({ tag: 'p', text: 'We show advertising through third-party ad networks such as Google AdSense. These partners may use cookies and device identifiers to show ads based on your visits to this and other sites. You can manage ad personalisation through your Google Ads settings and aboutads.info.' });
    }

    // Payments
    if (cfg.payments) {
      b.push({ tag: 'h2', text: 'Payments' });
      b.push({ tag: 'p', text: 'Purchases are processed by a third-party payment processor. Your card details are sent directly to that processor over an encrypted connection and are not stored on our servers. The processor handles your payment data under its own privacy policy and PCI-DSS obligations.' });
    }

    // Sharing
    const share = [
      'Service providers who host the site, send our email' +
        (cfg.payments ? ', process payments' : '') +
        (cfg.analytics ? ', and provide analytics' : '') +
        ' on our behalf.',
    ];
    if (cfg.ads) share.push('Advertising partners, as described above.');
    share.push('Authorities or other parties where we are legally required to disclose it.');
    b.push({ tag: 'h2', text: 'How we share your information' });
    b.push({ tag: 'p', text: 'We do not sell your personal information. We share it only with:' });
    b.push({ tag: 'ul', items: share });

    // Retention
    const ret: string[] = [];
    if (cfg.accounts) ret.push('Account data for as long as your account is active, and for a reasonable period afterwards.');
    if (cfg.contact) ret.push('Enquiry messages for as long as needed to resolve them and keep a support record.');
    if (cfg.logs) ret.push('Server logs for a limited period — typically weeks to a few months — before deletion or anonymisation.');
    b.push({ tag: 'h2', text: 'How long we keep it' });
    if (ret.length) {
      b.push({ tag: 'p', text: 'We keep personal information only as long as we need it:' });
      b.push({ tag: 'ul', items: ret });
      b.push({ tag: 'p', text: 'When we no longer need information, we delete it or remove anything that identifies you.' });
    } else {
      b.push({ tag: 'p', text: 'We keep personal information only as long as we need it for the purposes above, then delete it or remove anything that identifies you.' });
    }

    // Rights
    b.push({ tag: 'h2', text: 'Your rights' });
    if (cfg.country === 'eu' || cfg.country === 'uk') {
      const law = cfg.country === 'uk' ? 'UK GDPR' : 'the General Data Protection Regulation (GDPR)';
      const auth = cfg.country === 'uk' ? "the UK's Information Commissioner's Office (ICO)" : 'your local data protection authority';
      const region = cfg.country === 'uk' ? 'the United Kingdom' : 'the European Union';
      b.push({ tag: 'p', text: `Because we handle personal data of people in ${region}, ${law} gives you the right to:` });
      b.push({
        tag: 'ul',
        items: [
          'Access the personal data we hold about you.',
          'Ask us to correct data that is wrong or incomplete.',
          'Ask us to delete your data ("right to be forgotten").',
          'Restrict or object to how we use your data.',
          'Receive your data in a portable format.',
          'Withdraw consent at any time, where we rely on it.',
          `Lodge a complaint with ${auth}.`,
        ],
      });
      b.push({ tag: 'p', text: `To exercise any of these rights, contact us at ${email}.` });
    } else if (cfg.country === 'au') {
      b.push({ tag: 'p', text: 'We handle personal information in line with the Australian Privacy Principles under the Privacy Act 1988 (Cth). You can:' });
      b.push({
        tag: 'ul',
        items: [
          'Request access to the personal information we hold about you.',
          'Ask us to correct information that is wrong or out of date.',
          'Make a complaint about how we handle your information.',
        ],
      });
      b.push({ tag: 'p', text: `Contact us at ${email}. If you are not satisfied with our response, you can complain to the Office of the Australian Information Commissioner (OAIC).` });
    } else if (cfg.country === 'us') {
      b.push({ tag: 'p', text: 'If you are a California resident, the CCPA/CPRA gives you the right to know what personal information we collect, to request its deletion or correction, and to opt out of its sale or sharing — we do not sell your personal information. Several other US states now have similar laws. We will not discriminate against you for exercising these rights.' });
      b.push({ tag: 'p', text: `To make a request, contact us at ${email}.` });
    } else if (cfg.country === 'ca') {
      b.push({ tag: 'p', text: "Under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA), you can ask to access the personal information we hold about you and request corrections." });
      b.push({ tag: 'p', text: `Contact us at ${email}. If a concern is unresolved, you can contact the Office of the Privacy Commissioner of Canada.` });
    } else {
      b.push({ tag: 'p', text: `Depending on where you live, you may have the right to access, correct, or delete the personal information we hold about you, and to object to certain uses. To exercise any rights available to you, contact us at ${email}.` });
    }

    // Children
    b.push({ tag: 'h2', text: "Children's privacy" });
    b.push({ tag: 'p', text: 'The site is not directed at children, and we do not knowingly collect personal information from them. If you believe a child has given us their information, contact us and we will delete it.' });

    // Security
    b.push({ tag: 'h2', text: 'Security' });
    b.push({ tag: 'p', text: `We take reasonable technical and organisational measures to protect your information, including encrypted (HTTPS) connections${cfg.accounts ? ' and hashed passwords' : ''}. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.` });

    // Changes
    b.push({ tag: 'h2', text: 'Changes to this policy' });
    b.push({ tag: 'p', text: 'We may update this policy from time to time. We will post the new version here and change the "last updated" date above. Where changes are significant, we will make them clear.' });

    // Contact
    b.push({ tag: 'h2', text: 'Contact us' });
    b.push({
      tag: 'p',
      text: url
        ? `If you have questions about this policy or your personal information, contact us at ${email} or through ${url}.`
        : `If you have questions about this policy or your personal information, contact us at ${email}.`,
    });

    return b;
  }

  // ---- Serialisers ----
  function toMarkdown(blocks: Block[]): string {
    return (
      blocks
        .map((bl) => {
          if (bl.tag === 'h1') return `# ${bl.text}`;
          if (bl.tag === 'h2') return `## ${bl.text}`;
          if (bl.tag === 'ul') return bl.items.map((i) => `- ${i}`).join('\n');
          return bl.text;
        })
        .join('\n\n') + '\n'
    );
  }

  function toPlain(blocks: Block[]): string {
    return (
      blocks
        .map((bl) => {
          if (bl.tag === 'h1' || bl.tag === 'h2') return bl.text;
          if (bl.tag === 'ul') return bl.items.map((i) => `  - ${i}`).join('\n');
          return bl.text;
        })
        .join('\n\n') + '\n'
    );
  }

  function esc(s: string): string {
    return s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
    );
  }

  function toHtml(blocks: Block[]): string {
    return blocks
      .map((bl) => {
        if (bl.tag === 'h1') return `<h1>${esc(bl.text)}</h1>`;
        if (bl.tag === 'h2') return `<h2>${esc(bl.text)}</h2>`;
        if (bl.tag === 'ul') return `<ul>\n${bl.items.map((i) => `  <li>${esc(i)}</li>`).join('\n')}\n</ul>`;
        return `<p>${esc(bl.text)}</p>`;
      })
      .join('\n');
  }

  /** Render blocks into the preview via the DOM — user input reaches the page
   *  only as textContent, so there is no injection surface here. */
  function renderPreview(blocks: Block[]): void {
    const frag = document.createDocumentFragment();
    for (const bl of blocks) {
      if (bl.tag === 'ul') {
        const ul = document.createElement('ul');
        for (const item of bl.items) {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        }
        frag.appendChild(ul);
      } else {
        const el = document.createElement(bl.tag);
        el.textContent = bl.text;
        frag.appendChild(el);
      }
    }
    preview.replaceChildren(frag);
  }

  function setPlaceholder(message: string): void {
    const p = document.createElement('p');
    p.className = 'field-hint';
    p.textContent = message;
    preview.replaceChildren(p);
  }

  // Current serialised output, refreshed on every successful generate.
  let current: { md: string; html: string; text: string; slug: string } | null = null;

  function setOutputsEnabled(on: boolean): void {
    for (const btn of [copyMdBtn, copyHtmlBtn, copyTextBtn, downloadBtn]) btn.disabled = !on;
    if (!on) current = null;
  }

  function normaliseUrl(raw: string): string | null {
    const v = raw.trim();
    if (!v) return null;
    const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    try {
      const u = new URL(withScheme);
      if (!u.hostname.includes('.')) return null;
      return u.origin + (u.pathname === '/' ? '' : u.pathname);
    } catch {
      return null;
    }
  }

  function generate(): void {
    const name = nameInput.value.trim();
    const rawEmail = emailInput.value.trim();
    const rawUrl = urlInput.value.trim();
    const problems: string[] = [];

    if (name.length > MAX_NAME) {
      errorEl.textContent = `Site name is ${name.length} characters — keep it under ${MAX_NAME}.`;
      setPlaceholder('Shorten the site name to generate a policy.');
      setOutputsEnabled(false);
      return;
    }
    if (!name) {
      errorEl.textContent = '';
      setPlaceholder('Enter your site name above and tick what applies — your draft policy appears here.');
      setOutputsEnabled(false);
      return;
    }

    let email = '';
    if (rawEmail) {
      if (rawEmail.length > MAX_EMAIL || !EMAIL_RE.test(rawEmail)) {
        problems.push('That contact email does not look valid — the policy uses a placeholder until it is fixed.');
      } else {
        email = rawEmail;
      }
    } else {
      problems.push('Add a contact email so visitors can reach you — a placeholder is used meanwhile.');
    }

    let url: string | null = null;
    if (rawUrl) {
      if (rawUrl.length > MAX_URL) {
        problems.push('The URL is unusually long and was ignored.');
      } else {
        url = normaliseUrl(rawUrl);
        if (!url) problems.push('That URL does not look valid — use something like https://example.com.');
      }
    }

    const cfg: Config = {
      name,
      url,
      email,
      country: countrySel.value,
      provider: providerSel.value,
      date: today,
      logs: boxes.logs.checked,
      cookies: boxes.cookies.checked,
      analytics: boxes.analytics.checked,
      contact: boxes.contact.checked,
      accounts: boxes.accounts.checked,
      newsletter: boxes.newsletter.checked,
      payments: boxes.payments.checked,
      ads: boxes.ads.checked,
    };

    const blocks = buildPolicy(cfg);
    renderPreview(blocks);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'privacy';
    current = { md: toMarkdown(blocks), html: toHtml(blocks), text: toPlain(blocks), slug };
    setOutputsEnabled(true);

    errorEl.textContent = problems.join(' ');
  }

  // Live regeneration: text inputs debounced, options immediate.
  onInput(nameInput, generate, 200);
  onInput(urlInput, generate, 200);
  onInput(emailInput, generate, 200);
  for (const el of [countrySel, providerSel, ...Object.values(boxes)]) {
    el.addEventListener('change', generate);
  }
  generateBtn.addEventListener('click', generate);

  copyMdBtn.addEventListener('click', () => {
    if (current) void copyText(current.md);
    else showToast('Fill in your site name first', 'error');
  });
  copyHtmlBtn.addEventListener('click', () => {
    if (current) void copyText(current.html);
    else showToast('Fill in your site name first', 'error');
  });
  copyTextBtn.addEventListener('click', () => {
    if (current) void copyText(current.text);
    else showToast('Fill in your site name first', 'error');
  });
  downloadBtn.addEventListener('click', () => {
    if (current) downloadText(current.md, `privacy-policy-${current.slug}.md`, 'text/markdown');
    else showToast('Fill in your site name first', 'error');
  });

  generate();
}
