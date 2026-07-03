---
title: What EXIF Data Reveals About You — and How to Strip It
description: Photos carry hidden EXIF metadata — GPS coordinates, camera serials, timestamps and software tags. Here is what gets embedded, who strips it, and how to remove it.
tools:
  - exif-viewer
  - exif-remover
relatedGuides:
  - url-tracking-parameters
  - browser-fingerprinting
updated: 2026-07-03
---

Every JPEG your phone produces is two files stitched into one. There is the picture you see, and in front of it sits a small header of structured text describing how, when and where the picture was made. That header is EXIF — Exchangeable Image File Format — and most people share it by accident thousands of times without ever opening it.

## Where the data comes from

EXIF was designed for photographers, not for privacy. A camera writes down its own settings so an editor can later read the aperture, the shutter speed and the lens. Phones inherited that container and quietly filled it with more: a satellite position from the GPS chip, a device serial, the exact firmware build, the app that last touched the file. None of it is malicious by design. The problem is that the container travels with the pixels, and the fields useful to a photographer are the same fields that place you at an address on a Tuesday morning.

Here are the categories a typical smartphone frame carries:

| EXIF group | Example tags | What it discloses |
|---|---|---|
| Camera | `Make`, `Model`, `BodySerialNumber` | The exact device, sometimes uniquely |
| Capture | `DateTimeOriginal`, `ExposureTime`, `ISO` | The second the shutter fired |
| GPS | `GPSLatitude`, `GPSLongitude`, `GPSAltitude` | Your position, often to a few metres |
| Software | `Software`, `HostComputer` | OS version and the editor used |
| Authorship | `Artist`, `Copyright`, XMP/IPTC blocks | A name, sometimes a full contact |

The serial number matters more than it looks. Photographers have been de-anonymised because a body serial in an EXIF tag matched the serial in listing photos on a for-sale forum under their real name. The camera never lied; it just kept a diary.

## From rational numbers to a street address

The GPS block is the field worth understanding in detail, because it is the one that turns a casual photo into a home address. EXIF does not store a tidy decimal. It stores latitude and longitude as three *rational numbers* — degrees, minutes and seconds — plus a single-letter reference for the hemisphere.

Suppose a viewer parses a photo and finds:

```
GPSLatitudeRef  = N
GPSLatitude     = 51, 30, 26.4
GPSLongitudeRef = W
GPSLongitude    = 0, 7, 39.6
```

To recover a usable coordinate you collapse the three parts into decimal degrees:

```
decimal = degrees + minutes/60 + seconds/3600

lat = 51 + 30/60 + 26.4/3600 = 51 + 0.5 + 0.007333 = 51.507333
lon =  0 +  7/60 + 39.6/3600 =  0 + 0.116667 + 0.011 = 0.127667
```

The reference letters apply the sign. `N` and `E` are positive; `S` and `W` are negative. So `W` flips the longitude, and the pair becomes **51.507333, -0.127667**. Drop that into any map and it does not land on a suburb or a postcode — it lands on a single building. A phone's GPS fix is typically accurate to 5–10 metres outdoors, which is the width of a house. That is the whole risk in two numbers. The [EXIF viewer](/tools/exif-viewer/) does this conversion for you and links the exact point on a map, so you can see what a stranger would see before you decide to post.

## Which platforms strip it — and which don't

A common assumption is that uploading a photo scrubs its metadata. Sometimes it does, and sometimes it very much does not. The rough state of play:

| Destination | EXIF on the shared/displayed file |
|---|---|
| Instagram, Facebook, X (public post) | Stripped from the displayed copy |
| WhatsApp, Signal (photo, not "document") | Stripped |
| Email attachment | Kept, in full |
| Cloud-drive share link (Drive, Dropbox) | Kept |
| Marketplace / classifieds listing | Usually kept |
| Direct file transfer (AirDrop, USB) | Kept |

Two traps hide in that table. First, "stripped from the displayed copy" is not the same as deleted — the platform still received your original file, GPS and all, and its retention is its own business. Second, sending a photo as a *document* rather than as a *photo* in a messaging app bypasses the app's downsizing path entirely, so the full EXIF sails through. The safe assumption is the pessimistic one: if you did not remove the metadata yourself, treat it as present.

## How re-encoding removes everything

There are two ways to clean a file. A byte-level editor such as `exiftool` surgically rewrites only the metadata segments and leaves the compressed pixels untouched — precise, but it depends on knowing every segment a format allows. The browser approach is blunter and, for a general audience, safer: throw the metadata away instead of editing it.

The mechanism is a canvas round-trip. The image is decoded into raw pixels, those pixels are painted onto a blank `<canvas>`, and the canvas is re-encoded to a new file. A canvas is nothing but a grid of colour values — it has no slot for an EXIF block, an XMP packet or an embedded thumbnail — so everything wrapped around the original pixels is simply left behind in the discarded source.

A concrete run through the [EXIF remover](/tools/exif-remover/): a listing photo, `bike-for-sale.jpg`, 4.1 MB at 4032 × 3024, parses to 27 populated fields including a GPS pair. After the canvas round-trip, JPEG output re-encodes at quality 0.95 and lands at about 2.9 MB. The tool re-parses that output and gets zero fields back — the empty result is what earns the confirmation badge. The 27 fields are gone not because each was deleted but because none was carried across.

This is where honesty matters, because the method has a real cost. Re-encoding a JPEG at 0.95 recompresses the pixels, so the output is **not** bit-identical to the original — a barely perceptible quality loss in exchange for a guarantee that no hidden segment survives. The ICC colour profile is metadata too, so it goes with the rest and the output is assumed to be plain sRGB; wide-gamut shots can lose a touch of saturation. PNG re-encodes losslessly and keeps its pixels exact. And an empty EXIF result on a file you *received* proves nothing about the original — absence of metadata usually means an earlier step already stripped it, not that it was never there.

## What to do next

A workable habit is two steps, both entirely on your own device. Before sharing anything sensitive — a rental photo, a marketplace listing, an image emailed to someone you do not fully trust — pass it through the [EXIF viewer](/tools/exif-viewer/) to see what is actually inside. If the GPS panel lights up, or a serial and full timestamp are present, run the file through the [EXIF remover](/tools/exif-remover/) and confirm the clean result. Screenshots and platform-downsized images are usually already bare, so you can save the effort for camera-original files, which is where the risk lives.

Metadata is one channel of quiet disclosure among several. The links you paste beside a photo leak their own trail — worth a read on [what utm_, fbclid and gclid actually do](/guides/url-tracking-parameters/) — and your browser gives away a surprising amount before you upload anything at all, which is the subject of [browser fingerprinting](/guides/browser-fingerprinting/). EXIF is just the one you can see, count, and delete in under a minute.
