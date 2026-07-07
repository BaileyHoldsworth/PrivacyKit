/**
 * Programmatic /convert/<slug>/ pages — one per common "X in binary/hex/decimal"
 * search. The four base representations are computed at build time with BigInt;
 * each `note` is unique hand-written copy.
 */
export interface BasePreset {
  slug: string;
  /** The number as written in `fromBase`. */
  value: string;
  fromBase: 2 | 8 | 10 | 16;
  note: string;
}

export const BASE_PRESETS: BasePreset[] = [
  { slug: '255-in-binary', value: '255', fromBase: 10, note: '255 is the largest value a single byte (8 bits) can hold, which is why it turns up everywhere from RGB colour channels to subnet masks. In binary every one of those eight bits is set.' },
  { slug: '255-in-hex', value: '255', fromBase: 10, note: 'In hexadecimal 255 is FF — two hex digits, each covering four bits. That neat one-byte-to-two-hex-digits mapping is exactly why colour codes and memory dumps use hex.' },
  { slug: 'ff-in-decimal', value: 'ff', fromBase: 16, note: 'FF is hex for the maximum byte value. Reading it out: F is 15, so FF is 15x16 + 15 = 255. You meet it constantly as the fully-on channel in a colour like #FF0000.' },
  { slug: '100-in-binary', value: '100', fromBase: 10, note: 'One hundred in binary needs seven bits. It is a handy reminder that decimal round numbers are nothing special to a computer — 100 has no tidy binary form.' },
  { slug: '1010-in-decimal', value: '1010', fromBase: 2, note: 'The binary pattern 1010 is decimal 10 — bits set at the 8s and 2s places (8 + 2). It is a common gotcha because it also looks like the decimal number 1010.' },
  { slug: '10-in-binary', value: '10', fromBase: 10, note: 'Ten in binary is 1010: 8 + 2. Beginners often expect "10" to stay "10", but in base two the digit 2 does not exist, so counting rolls over much sooner.' },
  { slug: '16-in-binary', value: '16', fromBase: 10, note: 'Sixteen is 10000 in binary — a single 1 followed by four zeros. Powers of two are the round numbers of binary, each one just shifting that lone bit left.' },
  { slug: '64-in-binary', value: '64', fromBase: 10, note: 'Sixty-four is 2 to the 6th, so in binary it is a 1 with six trailing zeros: 1000000. It shows up in bit widths, tile sizes and audio sample maths.' },
  { slug: '128-in-hex', value: '128', fromBase: 10, note: '128 is 80 in hex and marks the halfway point of a byte — the bit that flips a signed 8-bit number negative. That is why it recurs in low-level and character-encoding work.' },
  { slug: '256-in-hex', value: '256', fromBase: 10, note: '256 is 100 in hex: the first value that needs a third hex digit, because a byte tops out at 255. It is the count of distinct values one byte can represent.' },
  { slug: '1000-in-binary', value: '1000', fromBase: 10, note: 'One thousand in binary is ten bits long. The gap between the decimal "kilo" (1000) and the binary "kibi" (1024) starts exactly here and causes endless storage-size confusion.' },
  { slug: '11111111-in-decimal', value: '11111111', fromBase: 2, note: 'Eight ones in binary sum to 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. It is the "all bits on" byte, the binary twin of hex FF.' },
  { slug: '512-in-binary', value: '512', fromBase: 10, note: '512 is 2 to the 9th — binary 1000000000, a 1 with nine zeros. Disk sectors were 512 bytes for decades, which is why the number feels so familiar to system programmers.' },
  { slug: '7f-in-decimal', value: '7f', fromBase: 16, note: '7F is 127 in decimal — the highest value of a signed byte and the last code point of 7-bit ASCII (the DEL character). One more and an 8-bit signed number goes negative.' },
  { slug: 'a-in-decimal', value: 'a', fromBase: 16, note: 'Hex borrows letters once it runs out of digits, so A is simply 10. B through F carry on to 15, after which the next place value (16) begins.' },
  { slug: '2048-in-hex', value: '2048', fromBase: 10, note: '2048 is 800 in hex and 2 to the 11th in binary. Beyond the puzzle game, it is a common key length and buffer size precisely because it is a clean power of two.' },
];
