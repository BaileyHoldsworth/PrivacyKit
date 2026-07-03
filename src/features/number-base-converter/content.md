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
## How to use

1. Click into whichever field matches the notation you already have — Binary, Octal, Decimal, Hexadecimal, or the Custom base row — and start typing. There is no convert button; the other four fields fill in as you type.
2. For an unusual radix, set the number spinner beside the **Custom base** field to anything from 2 to 36, then read the value there or type into it directly.
3. Paste without cleaning up first: `0x`, `0o` and `0b` prefixes are accepted in every field, and separators such as spaces, underscores and commas are ignored on input.
4. Tick **Group digits** to break long outputs into readable chunks, or **Show base prefixes** to stamp `0x`/`0o`/`0b` onto the emitted values.
5. Use **Copy** above any field to lift that one representation, or **Clear** to empty every field and refocus the binary box.

## How it works

Positional notation gives each digit a weight that is a power of the base, so reading a number means multiplying every digit by its place value and adding the results. Rather than track exponents, the tool folds that sum into a single left-to-right accumulator, which is both faster and exact for arbitrarily long input.

Take the hexadecimal value `b1e`. Letter digits carry the values a=10 through f=15, so here `b`=11, `1`=1 and `e`=14. The accumulator begins at 0 and, for each digit, multiplies the running total by the base (16) and adds the new digit: `0 → 0×16+11 = 11 → 11×16+1 = 177 → 177×16+14 = 2846`. That single canonical number, decimal **2846**, is what every other field renders from.

Rendering is the reverse: repeatedly divide the value by the target base and read the remainders from the bottom up. For 2846 that produces `101100011110` in binary (2048 + 512 + 256 + 16 + 8 + 4 + 2), `5436` in octal, and — if you set the custom base to 30 — `34q`, where the trailing `q` is the digit worth 26. Change any one field and the accumulator re-derives from scratch, so the five views never drift out of sync.

## Use cases & limitations

A hex dump, an RGB swatch, a Unix file mode, a subnet mask — much of computing is one integer wearing different clothes, and swapping those outfits is the whole job here. Firmware and embedded work lean on binary and hex constantly, and a quick "is `0x1f` really 31?" check is faster in five live fields than in a mental calculation. When the number is actually a colour like `#b1e`, the [colour converter](/tools/color-converter/) understands its channels; when it is a network mask, the [subnet calculator](/tools/subnet-calculator/) treats it as an address rather than a bare value.

The main limitation is that it converts whole numbers only. Fractions have no field: you cannot ask what 0.1 in decimal is in binary (a question with an endlessly repeating answer anyway), and there is no floating-point or fixed-point mode. Each value is also handled as a pure signed integer, not as a fixed-width register, so it will not draw you the 8-bit two's-complement bit pattern behind a negative number. If your goal is inspecting bytes rather than numbers — an encoded payload, say — reach for the [Base64 encoder/decoder](/tools/base64-encoder-decoder/) instead.
