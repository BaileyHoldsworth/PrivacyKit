---
title: "Compress and Convert Images Without Uploading Them"
description: How canvas re-encoding lets your browser compress, convert and resize images locally — plus the format choices and resize-first order that shed the most bytes.
tools:
  - image-compressor
  - image-converter
  - image-resizer
  - exif-remover
relatedGuides:
  - exif-data-privacy
updated: 2026-07-07
---

A photo editor that runs in a browser tab once meant one thing: your file went up to a server, was processed there, and came back down. That round trip is no longer necessary. Every current browser ships a small imaging pipeline — `createImageBitmap`, the `<canvas>` element, and `canvas.toBlob()` — capable of decoding, redrawing and re-encoding a photo entirely in memory on the device in front of you. PrivacyKit's image tools are thin wrappers over exactly those calls, which is why not one of them uploads your pixels to do its job.

## The three calls that do the work

Behind the [image converter](/tools/image-converter/), the [compressor](/tools/image-compressor/) and the [resizer](/tools/image-resizer/) sits the same short pipeline:

1. **Decode.** `createImageBitmap(file)` reads the compressed JPEG, PNG or WebP and hands back a raw bitmap — the pixels with the compression undone, ready to draw. It runs off the main thread, so a large file does not freeze the tab.
2. **Draw.** The bitmap is painted onto an off-screen `<canvas>`, either at native size or scaled down through `drawImage`.
3. **Re-encode.** `canvas.toBlob('image/webp', 0.8)` asks the browser's own encoder to turn the canvas back into a compressed file, at the format and quality you picked.

Two of the tools push the heavy step into a Web Worker — the compressor leans on the `browser-image-compression` library, the resizer runs a Lanczos3 filter through `pica` — so even a batch of 20-megapixel frames processes without stalling the page. What none of the three does is open a network connection carrying image data. Every byte stays in the tab. You can prove it the honest way: with the network panel of your developer tools open, drop a file and watch — no request carries it off the machine. Load the page once and the tools keep working with the connection cut entirely.

## Lossy formats throw detail away; lossless formats don't

The single most useful distinction across all of these tools is how a format stores pixels.

- **JPEG and WebP are lossy.** They discard detail the eye is least likely to miss — mostly fine, high-frequency variation — and how much they discard is what the **quality** slider governs. A value of 0.80 keeps far more than it drops; 0.40 is visibly rough in hair, foliage and text.
- **PNG is lossless.** It records every pixel exactly, so lowering the quality value changes nothing about the result at all. That is why a photograph stored as PNG barely moves when you drag the slider down — there is no lossy knob for the encoder to turn.
- **WebP does both.** It has a lossy mode that beats JPEG by roughly 25–35% at the same visible quality, a lossless mode, and an alpha (transparency) channel. Every up-to-date browser can render it.

## When PNG is the wrong container — and the transparency trap

PNG earns its place for screenshots, logos and line art, where sharp edges and small text must stay pixel-exact. It is the wrong choice for a photograph: storing a continuous-tone image losslessly can produce a file five to ten times larger than a lossy encoder would. A phone photo trapped in a 9 MB PNG usually becomes a 700 KB WebP that nobody could pick apart from the original. When you meet a photographic PNG, converting it is the biggest single saving on the table.

One trap lurks in that conversion, and it catches everyone exactly once. JPEG carries no alpha channel at all; each pixel it stores has to be fully opaque. A blank canvas, meanwhile, begins fully transparent — technically transparent black. So when a PNG with a see-through background is drawn onto a canvas and asked to encode as JPEG, those empty pixels have nowhere to go but black, and a logo that looked clean on the page arrives sitting on an ugly black rectangle. The cure in the [image converter](/tools/image-converter/) is the **Fill transparency with white** option: tick it and the canvas is painted white before the image lands, so the gaps come out white. Converting to WebP or PNG instead sidesteps the whole thing, because both keep the alpha channel — the option only bites when the destination is JPEG.

## Resize first, then compress — it is the bigger lever

Quality and dimensions both shrink a file, but they are nowhere near equal. Quality trims the bytes spent per pixel; resizing removes pixels outright, and area falls with the *square* of the scale factor. Halve the width and height together and you have thrown away three-quarters of the pixels before the encoder even runs. For anything headed to a screen, this is where the real savings live, because almost every source image carries far more resolution than its destination will ever show — a blog column 1200 pixels wide gains nothing from a 6000-pixel original.

Take a photo straight off a mirrorless camera, `market-stall.jpg`: 6000 × 4000 pixels (24 megapixels, 3:2 frame), 8.6 MB, bound for a blog whose content column is 1200 px wide. Two orders of operation, very different results:

| Approach | Dimensions | Megapixels | Output | File size |
|---|---|---|---|---|
| Camera original | 6000 × 4000 | 24.0 | JPEG (high) | 8.6 MB |
| Compress only | 6000 × 4000 | 24.0 | WebP 0.80 | ~2.4 MB |
| Resize, then compress | 1600 × 1067 | 1.71 | WebP 0.80 | ~180 KB |

Re-encoding the full frame to WebP does cut it to roughly 2.4 MB — a genuine improvement — but you are still shipping 24 million pixels to fill a space that shows maybe two million. Resizing first rewrites the arithmetic:

```
scale       = 1600 / 6000     = 0.2667
new height  = 4000 × 0.2667   ≈ 1067 px
pixel count = 1600 × 1067     = 1,707,200   (7.1% of 24 MP)
```

Hand those 1.7 million pixels to the same WebP encoder at quality 0.80 and the file settles near 180 KB — about 98% smaller than the original, roughly one-forty-eighth of what came off the camera, with nothing visibly lost at the size it will actually be seen. The [image compressor](/tools/image-compressor/) folds both steps into a single pass: its **Max dimension (longest side)** field caps resolution while the quality slider sets the encode, so one drop does the resize and the re-encode at once. When you need the resize on its own — a batch of screenshots forced to one exact width, say — the [image resizer](/tools/image-resizer/) handles it with a Lanczos filter that keeps text legible where a plain browser stretch would smear it.

## Re-encoding quietly strips EXIF

There is a privacy dividend to this pipeline that is easy to overlook. A canvas keeps nothing except the raw colour values of the image — it has no slot for the EXIF block a camera writes into a JPEG, so the GPS coordinates, the capture timestamp, the device serial and the rest never make it onto the canvas and never reach the re-encoded output. Compress a photo, convert it, or resize it, and the metadata falls away as a by-product.

Treat that as a bonus rather than a guarantee you have checked. "I compressed it, so it must be clean" is not the same as verifying it is clean. When stripping metadata is the whole point — before listing something for sale, or emailing a photo taken at your front door — the [EXIF remover](/tools/exif-remover/) is the tool built for that one job: it re-encodes for exactly this reason and then parses the output a second time to confirm the fields are gone. For the full account of what those fields disclose, how a GPS pair resolves to a single building, and which apps strip metadata for you, read [what EXIF data reveals about you](/guides/exif-data-privacy/).

## Picking a format: a short decision table

Match the format to the *content* of the image, not to the file you happened to receive.

| What you're saving | Reach for | Why |
|---|---|---|
| A photograph — people, scenery, product shots | WebP, or JPEG for maximum compatibility | Continuous tone hides lossy compression; both encoders are built for it |
| A screenshot with text or UI | PNG, or lossless WebP | Sharp edges and small type turn to mush under JPEG's lossy pass |
| A logo, icon or line art with transparency | PNG or WebP | Flat colour compresses tiny losslessly, and both keep the alpha channel |
| A photo that has to open in old software | JPEG | Universally supported where WebP still is not |

The rule underneath the table: a screenshot someone handed you as a JPEG is worth converting back to PNG to sharpen the text, and a photo someone handed you as a PNG is worth converting to WebP to shed the bulk. The container should follow the pixels.

## What to do next

Pick the tool by the problem in front of you. Over an upload limit? Drop the file into the [image compressor](/tools/image-compressor/), set a sensible max dimension, and let the resize do most of the work. Wrong format for a form or a slow-loading page? The [image converter](/tools/image-converter/) swaps it across a whole batch. Need a specific pixel size for a CMS field or a bug report? The [image resizer](/tools/image-resizer/) fits each image to a box without stretching it. And before any camera-original photo leaves your device, run it through the [EXIF remover](/tools/exif-remover/) and wait for the green badge — the [EXIF privacy guide](/guides/exif-data-privacy/) explains why that last ten seconds is worth spending. All four do their work inside the tab, so the file you started with stays the only copy that ever existed.
