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

<!-- content-pending: round2 content -->
