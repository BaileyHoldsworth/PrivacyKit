---
name: Number Base Converter
title: Number Base Converter — Binary, Hex, Decimal | PrivacyKit
description: Convert between binary, octal, decimal, hexadecimal and any base from 2 to 36. Edit any field and the rest update live; BigInt keeps very large values exact.
category: math
keywords:
  - number base converter
  - binary to decimal
  - hex to decimal
  - base converter
  - octal
icon: calculator
related:
  - color-converter
  - subnet-calculator
  - hash-generator
  - base64-encoder-decoder
privacy: local
popular: false
updated: 2026-07-03
jsonLdCategory: DeveloperApplication
faqs:
  - q: How do I convert binary to decimal with this tool?
    a: >-
      Type or paste the binary digits into the **Binary** field — say
      `11111101010` — and the **Decimal** field updates to `2026` as you type,
      along with octal, hex and your custom base. There is no convert button
      and no direction to choose: every field is both an input and an output,
      so the same box converts decimal back to binary just as readily.
  - q: Does it handle negative numbers?
    a: >-
      Yes. Put a leading `-` on any field and it carries across every base:
      `-42` in decimal shows as `-101010` in binary and `-2a` in hex. Note that
      negatives are displayed in sign-and-magnitude form (a minus sign in
      front), not two's-complement, because two's-complement only has meaning
      once you fix a width like 8 or 32 bits — which a base converter doesn't.
  - q: What is the largest number I can convert?
    a: >-
      Every field is parsed with JavaScript `BigInt`, so there is no 2⁵³ limit
      and no floating-point rounding — a 200-digit decimal converts to binary
      exactly. Input is capped at 10,000 characters per field to keep
      conversion instant; past that you'll see an inline length error rather
      than a frozen tab.
  - q: Can I use 0x, 0o and 0b prefixes?
    a: >-
      Prefixed input is always accepted: `0xFF`, `0o777` and `0b1010` parse
      correctly no matter which field you paste them into. Turn on **Show base
      prefixes** to also emit them on output, so the hex field reads `0x7ea`
      instead of `7ea`. The prefix is stripped again automatically if you edit
      that field.
  - q: What does base 36 mean, and why stop there?
    a: >-
      Bases above 10 borrow letters as digits: `a`=10, `b`=11, up to `z`=35.
      Base 36 is the largest that fits in the digits 0–9 plus a–z, which is why
      the custom-base row runs 2 to 36. As an example, decimal `1295` is `zz`
      in base 36. Letter digits are case-insensitive on input and shown in
      lowercase on output.
  - q: What does the digit-grouping toggle do?
    a: >-
      It inserts thin separators so long strings stay readable: binary and hex
      are grouped in fours (nibbles), octal and decimal in threes. Binary
      `11111101010` becomes `111 1110 1010`, and decimal `1000000` becomes
      `1 000 000`. Grouping is display only — the separators are stripped when
      you paste a grouped value back into a field, so nothing breaks.
---
<!-- content-pending: Phase C -->
