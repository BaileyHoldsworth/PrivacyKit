/**
 * Programmatic /colors/<slug>/ pages — one per popular colour people search
 * "X colour hex code" for. Conversions are computed at build time from `hex`
 * via src/lib/color-math.ts; each `note` is unique hand-written copy so the
 * pages are not thin duplicates.
 */
export interface ColorPreset {
  slug: string;
  name: string;
  hex: string;
  note: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { slug: 'teal', name: 'Teal', hex: '#008080', note: 'A blue-green named after the Eurasian teal duck, whose eye-stripe is roughly this shade. It reads as calm and slightly clinical, which is why software and healthcare brands lean on it.' },
  { slug: 'coral', name: 'Coral', hex: '#FF7F50', note: 'A warm pink-orange taken from the marine invertebrate. It sits between salmon and orange and is a favourite for friendly call-to-action buttons.' },
  { slug: 'navy-blue', name: 'Navy Blue', hex: '#000080', note: 'Named for the dark blue-black of 18th-century naval uniforms, chosen because indigo dye was cheap and hid dirt. It is the go-to "serious but not black" background.' },
  { slug: 'maroon', name: 'Maroon', hex: '#800000', note: 'A dark brownish-red from the French marron (chestnut). Deeper than red and less purple than burgundy, it is a staple of academic and sports branding.' },
  { slug: 'olive', name: 'Olive', hex: '#808000', note: 'A dark yellow-green the colour of unripe olives. In the sRGB gamut it is simply red and green at half strength with no blue, which is why it looks muddy on screen.' },
  { slug: 'turquoise', name: 'Turquoise', hex: '#40E0D0', note: 'A bright cyan-green named after the gemstone, itself named after Turkey, the old trade route. It is more vivid and lighter than teal.' },
  { slug: 'lavender', name: 'Lavender', hex: '#E6E6FA', note: 'A pale, slightly blue purple named for the flower. Its very high lightness makes it a soft background that still fails contrast against white text.' },
  { slug: 'salmon', name: 'Salmon', hex: '#FA8072', note: 'A pinkish-orange named after the flesh of the fish. It is warmer and lighter than coral and is common in food and wellness palettes.' },
  { slug: 'crimson', name: 'Crimson', hex: '#DC143C', note: 'A strong, slightly blue red originally made from the kermes insect. It is punchier than plain red and is a common error/alert colour.' },
  { slug: 'indigo', name: 'Indigo', hex: '#4B0082', note: 'The deep blue-purple Newton inserted between blue and violet in the rainbow. The plant dye behind it built entire colonial trade economies.' },
  { slug: 'gold', name: 'Gold', hex: '#FFD700', note: 'A bright metallic yellow. On screen it is pure yellow with a touch less blue; the metallic look comes from gradients and reflection, not this flat value.' },
  { slug: 'silver', name: 'Silver', hex: '#C0C0C0', note: 'A light neutral grey standing in for the metal. As an equal mix of red, green and blue it is perfectly desaturated — a useful UI border or disabled state.' },
  { slug: 'beige', name: 'Beige', hex: '#F5F5DC', note: 'A pale sandy neutral named after undyed wool. Its warmth comes from slightly more red and green than blue, making it a softer alternative to plain off-white.' },
  { slug: 'mint-green', name: 'Mint Green', hex: '#98FF98', note: 'A pale, fresh green named after the herb. Its high lightness suits success states and soft backgrounds but leaves little room for legible text on top.' },
  { slug: 'magenta', name: 'Magenta', hex: '#FF00FF', note: 'A pure red-plus-blue with no green — one of the brightest colours a screen can show. It has no single wavelength; the brain invents it from the red and blue cones.' },
  { slug: 'cyan', name: 'Cyan', hex: '#00FFFF', note: 'Pure green-plus-blue with no red, the C of CMYK printing. On an additive RGB screen it is dazzlingly bright, which is why it rarely works as a large fill.' },
  { slug: 'lime-green', name: 'Lime Green', hex: '#32CD32', note: 'A vivid yellow-green named after the fruit. It is more saturated than most foliage greens and reads as energetic, even slightly synthetic.' },
  { slug: 'tan', name: 'Tan', hex: '#D2B48C', note: 'A light brown named after tanned leather. It is a warm, low-saturation neutral that pairs well with navy and forest green.' },
  { slug: 'ivory', name: 'Ivory', hex: '#FFFFF0', note: 'A barely-off white with a faint yellow cast, named after elephant tusk. It softens the harshness of pure white on large backgrounds.' },
  { slug: 'charcoal', name: 'Charcoal', hex: '#36454F', note: 'A dark blue-grey named after burnt wood. It is the popular "not quite black" dark-mode surface — enough blue to feel cool without going navy.' },
  { slug: 'burgundy', name: 'Burgundy', hex: '#800020', note: 'A dark red with a purple lean, named after the French wine region. It is richer and cooler than maroon and signals a premium, wine-adjacent feel.' },
  { slug: 'peach', name: 'Peach', hex: '#FFE5B4', note: 'A soft, light orange named after the fruit skin. Its gentle warmth makes it a common choice for friendly, approachable backgrounds.' },
  { slug: 'slate-gray', name: 'Slate Gray', hex: '#708090', note: 'A medium blue-grey named after the rock. It is the neutral that quietly carries a hint of blue, useful for muted text and secondary UI.' },
  { slug: 'hot-pink', name: 'Hot Pink', hex: '#FF69B4', note: 'A bright, saturated pink that sits between magenta and rose. It is loud by design and a frequent accent in playful, high-energy branding.' },
];
