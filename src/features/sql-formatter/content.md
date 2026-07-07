---
name: SQL Formatter
title: SQL Formatter — Beautify & Format SQL Queries | PrivacyKit
description: Beautify messy SQL entirely in your browser. Pick the dialect (PostgreSQL, MySQL, SQLite and more), set keyword case and indent width, then copy or download.
category: text
keywords:
  - sql formatter
  - format sql
  - sql beautifier
  - pretty sql
  - sql pretty print
icon: database
related:
  - json-formatter
  - regex-tester
  - case-converter
  - text-diff
privacy: local
popular: false
updated: 2026-07-07
jsonLdCategory: DeveloperApplication
faqs:
  - q: Does this send my SQL to a server?
    a: >-
      No. The formatter is the `sql-formatter` library running inside your
      browser tab; the query never leaves your device and nothing is stored.
      Open your browser's network tab and format away — you will see no request
      go out. Because everything is local, the tool also keeps working offline
      once the page has loaded.
  - q: Why does it show a parse error on valid-looking SQL?
    a: >-
      This formatter parses your query rather than nudging whitespace around, so
      it rejects syntax it cannot understand and points at the line and column
      where it gave up. The usual cause is the dialect: the default "Standard
      SQL" mode does not know vendor extensions like MySQL backticks or
      PostgreSQL `$1` placeholders. Switch the dialect to match your database and
      the error normally clears.
  - q: Does formatting change what my query does?
    a: >-
      It only rewrites whitespace and, if you ask it to, the case of keywords.
      Table names, column names, string literals and numbers are left intact —
      set keyword case to UPPERCASE and `WHERE city = 'São Paulo'` keeps its
      exact value, only `WHERE` and `AND` change. The logic and results of the
      query are never altered.
  - q: Which dialect should I pick?
    a: >-
      Choose the database you actually run. The dialect controls the keyword
      list and the syntax the parser will accept — PostgreSQL understands `$1`
      and `ILIKE`, MySQL and MariaDB use backtick-quoted identifiers, SQL Server
      has `TOP` and square-bracket identifiers. If you are writing portable ANSI
      SQL, "Standard SQL" is the strictest check.
  - q: Can it format several statements at once?
    a: >-
      Yes. Paste a whole script of semicolon-separated statements and each one is
      formatted independently, separated by a blank line. There is no cap on the
      number of statements beyond the overall input-size limit described below.
  - q: Is there a size limit?
    a: >-
      Formatting runs on the page's main thread, so live formatting pauses above
      50,000 characters — past that, keep editing and press Format (or
      Ctrl+Enter in the editor) when you are ready. Input beyond about 2,000,000
      characters is refused with a message instead of freezing the tab; split a
      very large dump and format it in parts.
---

## How to use

1. Paste or type your query into the **SQL input** box. As long as it stays under 50,000 characters, the formatted version updates while you type.
2. Set **Dialect** to the database you actually run — PostgreSQL, MySQL, SQL Server and a dozen others — so the parser accepts that vendor's syntax.
3. Choose a **Keyword case**: UPPERCASE, lowercase, or Preserve to leave `Select` and `select` exactly as you wrote them.
4. Pick an **Indent** unit — two spaces, four spaces, or tabs — to match your project's house style.
5. Read the result in **Formatted SQL**, then **Copy** it or **Download** it as a `.sql` file. For a query over the live limit, press **Format** (or Ctrl+Enter) to run it on demand.

## How it works

Behind the box is the open-source `sql-formatter` library, running in the page. It doesn't nudge your whitespace around; it tokenises the query against the grammar for the dialect you picked, builds a structured list of clauses, keywords, identifiers and literals, then re-prints that structure with consistent spacing and line breaks. Only two things in the output are yours to steer — the case of reserved keywords and the indent unit. Identifiers, string literals and numbers pass through untouched, which is why switching to UPPERCASE never rewrites a table name or a value inside quotes.

Take this one-liner, pasted with lowercase keywords into the Standard SQL dialect:

```sql
select id,email,created_at from subscribers where status='active' and created_at>='2026-01-01' order by created_at desc limit 50;
```

With keyword case set to UPPERCASE and a two-space indent, it comes back as:

```sql
SELECT
  id,
  email,
  created_at
FROM
  subscribers
WHERE
  status = 'active'
  AND created_at >= '2026-01-01'
ORDER BY
  created_at DESC
LIMIT
  50;
```

Each clause keyword lands on its own line, list items are indented one level, operators like `>=` get breathing room, and `'active'` and `2026-01-01` are reproduced exactly. Paste several statements divided by semicolons and each is printed on its own, with a blank line between them.

## Use cases & limitations

Turn to this when you're staring at a wall of SQL someone else wrote: a query pulled from an ORM's debug log, a one-line statement copied out of a stack trace, or a pull request where the indentation went to war with the diff. Laying the clauses out consistently makes the structure jump out, so a missing join condition or a mis-scoped `OR` is far easier to spot. It's also useful for un-minifying generated SQL before you drop two versions into the [text diff](/tools/text-diff/) tool to see what genuinely changed.

The honest catch here: this is a parser, not a linter. It rewrites layout; it does not check your query against a real schema, and it won't rescue broken syntax — if the chosen dialect can't make sense of the tokens, you get a parse error pointing at a line and column rather than a best-effort guess. Parsing also runs on the page's main thread, so very large scripts stop formatting live and wait for a manual Format. And the work is purely cosmetic: it will happily pretty-print an inefficient query without a word about performance. If what you have is actually JSON returned by a query rather than SQL itself, the [JSON formatter](/tools/json-formatter/) is the tool you want; for pulling fields out of raw log lines, try the [regex tester](/tools/regex-tester/).
