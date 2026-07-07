---
title: "JSON, YAML and CSV: Choosing a Data Format"
description: JSON, YAML and CSV hold the same records three ways. What each format is built for, where YAML's type guessing bites, and how to convert without losing structure.
tools:
  - json-to-yaml
  - json-to-csv
  - json-formatter
relatedGuides:
  - base64-is-not-encryption
updated: 2026-07-07
---

Reach for a data format and you are really choosing who has to read it next. JSON, YAML and CSV can all hold the same records, yet each was built around a different reader: a parser waiting at the end of an HTTP request, a person editing a config file at 2am, a spreadsheet column that expects one value per cell. Pick the wrong one and the afternoon disappears into escaping commas or hunting an indentation slip that a comment would have prevented. This guide takes one small dataset, shows it in all three, and then walks the conversions where data quietly changes shape.

## One dataset, three shapes

Here are two store records. As JSON they form a tree of objects and arrays:

```json
[
  { "store": "Bergen", "country": "NO", "openWeekends": true,  "coords": { "lat": 60.39,  "lng": 5.32 } },
  { "store": "Darwin", "country": "AU", "openWeekends": false, "coords": { "lat": -12.46, "lng": 130.84 } }
]
```

The identical data as YAML — note the quotes around `NO`, which will matter shortly:

```yaml
- store: Bergen
  country: "NO"
  openWeekends: true
  coords:
    lat: 60.39
    lng: 5.32
- store: Darwin
  country: AU
  openWeekends: false
  coords:
    lat: -12.46
    lng: 130.84
```

And flattened to CSV, where the nested `coords` has nowhere to live except a single stringified cell:

```
store,country,openWeekends,coords
Bergen,NO,true,"{""lat"":60.39,""lng"":5.32}"
Darwin,AU,false,"{""lat"":-12.46,""lng"":130.84}"
```

Same records, three very different documents. The rest follows from what each format was designed to do.

## JSON: strict by design

JSON is the format the rest of the web assumes. Nearly every mainstream API speaks it, and its grammar (RFC 8259) is deliberately tiny: objects, arrays, strings, numbers, `true`, `false`, `null`, and nothing else. That strictness is the point — there is one canonical way to write a given value, so independent parsers agree on what they read. It also has sharp edges. Keys must be double-quoted, a trailing comma after the final element is a syntax error, and there is no comment syntax at all, which is why JSON config files sprout fake `"_comment"` keys. Numbers are IEEE-754 doubles, so an ID above 2⁵³ loses its exact digits unless you carry it as a string. When a payload arrives minified on a single endless line, the [JSON formatter](/tools/json-formatter/) pretty-prints it and points at the character where the grammar first breaks.

## YAML: for humans, sharp underfoot

YAML is what you edit by hand. Indentation carries the structure (two spaces per level, tabs forbidden), comments live after `#`, anchors let you avoid repetition, and because YAML is a superset of JSON, any valid JSON is already valid YAML. That readability is why Kubernetes manifests, CI pipelines and Compose files are written in YAML rather than JSON — a diff of a two-space tree is far kinder to review than a wall of braces.

The price of that convenience is type guessing, and its guesses are the footguns. The best-known is the **Norway problem**: an unquoted `NO` is read as the boolean `false`, so `country: NO` silently becomes `country: false`. The same trap catches `yes`, `on`, `off`, `y` and `n` under the YAML 1.1 rules most parsers still apply. A version like `1.20` loses its trailing zero as the number `1.2`; a value such as `22:60` can be misread as base-60; a leading zero can trip octal parsing. The cure is dull and reliable — quote anything that could be mistaken for another type. That is exactly why the converter wrote `country: "NO"` earlier and left `country: AU` bare: `AU` is unambiguous, `NO` is not.

## CSV: a grid and nothing more

CSV is the least clever of the three, and for the right job that is precisely its strength. It is rows and columns of plain text: a header line of column names, then one line per record, fields separated by commas. Every spreadsheet ever written opens it, which is the whole appeal. What CSV cannot do is nest — there is no way to place an object or a list inside a cell except by serialising it back to a string, which is what became of `coords` above. It also has no native types: `true`, `60.39` and `Bergen` are all just text until some reader decides otherwise, and that decision is where values get mangled. The escaping rule is small but easy to fumble by hand: any field holding a comma, a double quote or a newline is wrapped in double quotes, and literal quotes inside are doubled — hence the `""lat""` in the sample.

## When each format wins

| If the next reader is… | Reach for | Because |
| --- | --- | --- |
| an API or another program | JSON | universal, strict, unambiguous |
| a person editing configuration | YAML | comments, no brackets, readable diffs |
| a spreadsheet or an analyst | CSV | opens everywhere, one row per record |

The rule of thumb: machine-to-machine is JSON, human-to-machine is YAML, and anything destined for a grid is CSV.

## The conversions that bite

Push the two-store array through each converter and the trade-offs surface.

**JSON → YAML** is the safe direction. Since YAML is a superset, nothing is lost, and the [JSON to YAML converter](/tools/json-to-yaml/) parses the JSON into a real value before re-emitting it, quoting `"NO"` for you so the round trip holds. The danger appears later: open that YAML, delete the quotes because they look untidy, and you have hand-fed the Norway bug the tool was shielding you from.

**YAML → JSON** discards everything YAML added for human readers. Comments vanish because JSON has nowhere to store them, anchors are expanded to the value they referenced, and `.inf` or `.nan` collapse to `null`. The data survives; the annotations do not.

**JSON → CSV** is the lossy conversion to watch. The [JSON to CSV converter](/tools/json-to-csv/) collects the columns and writes one row per object, but `coords` is itself an object with no cell-shaped form, so it is serialised to `{"lat":60.39,"lng":5.32}` and dropped into a single `coords` column, exactly as shown. To get `coords.lat` and `coords.lng` as their own columns you must flatten the JSON before converting — the grid cannot express depth at all. Records with different keys are reconciled by collecting every key that appears in any row, so a field one object lacks becomes an empty cell rather than a dropped column.

**CSV → JSON** rebuilds objects from the header line, and the type question returns. With number and boolean parsing switched on, `true` decodes to the boolean and `60.39` to a number; switched off, every field stays a string. Turn it off whenever a column holds codes that only resemble numbers — leading-zero postcodes, phone numbers, ISBNs — or those zeros evaporate on the way in.

One habit worth carrying across all three: a data format is not a security boundary. A YAML config or a JSON body will happily transport an API key, and a Base64 blob tucked inside looks scrambled yet decodes with no key at all — the gap between encoding and encryption is the whole subject of [why Base64 is not encryption](/guides/base64-is-not-encryption/). These formats move and reshape data; they never protect it.

## What to do next

Match the converter to the trip you are making. Feed a program's output to the [JSON to YAML converter](/tools/json-to-yaml/) when it has to become an editable config; send it through the [JSON to CSV converter](/tools/json-to-csv/) when it has to land in a spreadsheet; and run anything that refuses to parse through the [JSON formatter](/tools/json-formatter/) first, which names the line of the error. Each one works inside the tab, so a config full of secrets never travels to a server. Choose the format for whoever reads it next — the parser, the person, or the spreadsheet — and let the converter carry the shape across.
