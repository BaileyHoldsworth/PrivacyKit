#!/usr/bin/env node
/**
 * HTML validity gate: html-validate:recommended over every dist/**\/*.html.
 * Always strict — invalid HTML fails the build from day one.
 * Tuning (deliberate, minimal):
 *   - inline styles allowed (provisional pages use them; CSP allows them)
 *   - unknown/custom elements allowed (icon or embed elements may appear)
 *   - long-title raised to 75: the rule counts entity-encoded text ("&amp;"
 *     is 5 chars), while the real cap (65) is enforced by the content schema
 *   - prefer-native-element excludes role="listbox": the command palette's
 *     filtered results list is the standard ARIA combobox pattern and has no
 *     native equivalent (<select> cannot do it)
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HtmlValidate } from 'html-validate';

const DIST = join(process.cwd(), 'dist');

if (!existsSync(DIST)) {
  console.error('check-html: dist/ not found — run `npx astro build` first.');
  process.exit(1);
}

function findHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findHtml(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlvalidate = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    'no-inline-style': 'off',
    'element-name': 'off',
    'no-unknown-elements': 'off',
    'long-title': ['error', { maxlength: 75 }],
    'prefer-native-element': ['error', { exclude: ['listbox'] }],
  },
});

const files = findHtml(DIST);
let errorCount = 0;
let warningCount = 0;

for (const file of files) {
  const report = await htmlvalidate.validateFile(file);
  for (const result of report.results) {
    for (const m of result.messages) {
      const kind = m.severity === 2 ? 'error' : 'warning';
      if (m.severity === 2) errorCount++;
      else warningCount++;
      console.log(`  ${kind} ${result.filePath}:${m.line}:${m.column} [${m.ruleId}] ${m.message}`);
    }
  }
}

console.log(
  `check-html: ${files.length} file(s) validated — ${errorCount} error(s), ${warningCount} warning(s).`,
);
process.exit(errorCount > 0 ? 1 : 0);
