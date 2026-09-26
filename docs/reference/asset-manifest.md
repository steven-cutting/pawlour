---
title: "Asset manifest"
kind: "reference"
audience: [contributor, maintainer, agent]
canonical_for: [asset_manifest_format]
requires: []
---

# Asset manifest

`src/lib/assets/manifest.json` records every file the site serves from
`src/lib/assets/`: its size, its hash, where it came from, under what licence, and how
large it may grow. `just check-assets` holds the directory to it on every `just check`,
so a file cannot be added, swapped or grown without the manifest saying so.

## The format

Strict JSON, one entry per line, sorted by `path`, with one trailing newline. Prettier
leaves it alone and the checker refuses any other layout.

```json
{"schema_version": 1, "assets": [
  {"path": "src/lib/assets/biscuit.glb", "bytes": 2525000, "sha256": "…", "source": "built:2026-09-25", "licence": "platform", "budget": 6291456},
  …
]}
```

Every file under `src/lib/assets/` has an entry except the manifest itself. Each entry
carries exactly these six fields, in this order:

| Field | Meaning | Written by |
| --- | --- | --- |
| `path` | The file, from the repository root. | the tool |
| `bytes` | Its size. | the tool |
| `sha256` | Its hash, so a changed byte is caught. | the tool |
| `source` | Where it came from, in one of the four forms below. | hand |
| `licence` | One of the three values below. | hand |
| `budget` | The most bytes it may have; `0` for none. | hand |

`bytes` and `sha256` are only ever the tool's. `source`, `licence` and `budget` are the
only fields anyone edits, and they are set in the same commit that adds the file.

## `source`

| Form | For |
| --- | --- |
| `biscuit_pics@<commit>:<path>` | A file copied unchanged from the `biscuit_pics` repository. |
| `built:<date>` | A file a recipe wrote: `just assets-build`, or the Blender recipes that render the stills. |
| `made:<date>` | A file made by hand, or by a script in this repository. |
| `cc0:<url>` | A public-domain download, with the page it came from. |

## `licence`

| Value | Meaning |
| --- | --- |
| `platform` | Derived from the approved model of Biscuit, whose licence is the platform's own open question. The game records it and does not resolve it. Every file made from the model — the served GLB, its clip table, every still — carries this. |
| `cc0` | Public domain: downloaded under CC0, or this repository's own work, such as the room. |
| `unsettled` | Not yet decided. Allowed for anything but audio. |

An audio file whose licence is `unsettled` is refused, because no sound ships without a
licence recorded beside it.

## Budgets

Per file, in bytes. There is no total: the budgets deliberately sum past the first-load
figure, because a visit fetches audio and most stills only on demand.
[Performance budget](budget.md) owns that figure.

| File | Budget |
| --- | --- |
| `biscuit.glb` | 6,291,456 |
| `cabin.glb` | 3,145,728 |
| each `stills/<activity>.<phase>.webp` | 262,144 |
| `fire.webp` | 262,144 |
| each file under `audio/` | 524,288 |
| `biscuit.clips.json` | none |

## The checker

`scripts/check_assets.py`, standard library only, with three subcommands. Every one runs
`self-test` first and stops if it fails, so the checker proves itself on each run.

| Recipe | Subcommand | What it does |
| --- | --- | --- |
| `just check-assets` | `check` | Walks `src/lib/assets/` and prints one summary line, or every finding as `<path>: <reason>` and exits 1. |
| `just assets-manifest` | `write` | Recomputes `bytes` and `sha256` for every file, keeps each existing entry's `source`, `licence` and `budget`, gives a new file `made:<today>`, `unsettled` and `0`, then runs `check`. |
| — | `self-test` | Builds a temporary tree with one deliberate fault of each kind and asserts each is refused by name. |

`check` refuses: a file with no entry; an entry with no file; an entry without exactly
the six fields in order; a size or hash that does not match; a size over a non-zero
budget; a licence that is not one of the three; an audio file with `unsettled`; a source
in none of the four forms; a duplicate path; and a manifest not in the layout above.

## Related pages

- [Build assets](../how-to/build-assets.md)
- [Performance budget](budget.md)
- [Decision 0012: Served assets are blobs, and blends are LFS](../decisions/0012-served-assets-are-blobs-and-blends-are-lfs.md)
- [Commands](commands.md)
