---
id: P03
title: "Asset pipeline: `build_assets.sh`, the clip table, budgets measured on the proof export"
status: done
depends_on: [P02]
parallel_with: [P01, P06, P09]
branch: ticket/p03-asset-pipeline
estimated_size: M
---

# P03: Asset pipeline: `build_assets.sh`, the clip table, budgets measured on the proof export

## Context

P02 leaves `blender/out/biscuit-raw.glb` (gitignored): the approved model exported from
`blender/out/biscuit-clips.blend` with the portable materials, the 33 deform bones, the
five sweater morph targets and one animation, `idle.stand`. It is the shape D's GLB has
(CONVENTIONS.md §1 fact 1: 148 meshes, 86,828 triangles, 27 materials, 27 PNG images up to
2048², about 16 MB) plus a clip, and it is far too large and far too many draw calls for a
phone. This ticket is the pipeline that turns a raw export into the served asset and proves
the budget, and it does so on P02's proof export so that P04 (the clips) and P05 (the room)
each arrive to a pipeline that already works and P07a has a real clip to animate before P04
lands.

The pipeline is `@gltf-transform/cli` 4.5.0, which P00 pinned with `sharp` (CONVENTIONS.md
§2.1). Its commands and flags, read from `npx gltf-transform <command> --help` on
2026-09-25, are what the script below calls: `prune` (`--keep-attributes`,
`--keep-indices`, `--keep-leaves`, `--keep-solid-textures`), `dedup` (`--accessors`,
`--materials`, `--meshes`, `--skins`, `--textures`, all default true), `flatten` (no
options; "Skeletons and their descendants are left in their original Node structure";
"Animation targeting a Node or its parents will prevent that Node from being moved"),
`join` (`--keepMeshes`, `--keepNamed`; "Implicitly runs `dedup` and `flatten` commands
first"), `resize` (`--width`, `--height`, `--pattern`, `--filter`, `--power-of-two`),
`webp` (`--quality`, `--effort`, `--slots`, `--pattern`, `--formats`, `--lossless`),
`meshopt` (`--level` one of `medium`, `high`, default `high`; `--quantize-*`), and
`inspect` (`--format` one of `pretty`, `csv`, `md`). CONVENTIONS.md §4.3 spells the join
flag as the CLI does, `--keepNamed true`; if any other flag there differs from what the
CLI prints, this ticket uses the CLI's spelling and hands the correction back.

Sources, at the commits CONVENTIONS.md §0 pins (read-only):

- D `models/biscuit/qa/viewer-package.json` and `qa/native-verification.json`: the
  triangle and part counts the before figures are checked against (character 146 parts,
  74,880 triangles; garment 2 parts, 11,948 triangles; 33 bones; 148 GLB skinned meshes).
- D `models/biscuit/src/build.py` lines 61–75 (`export_glb`): the exporter arguments the
  raw file was written with, so the reader knows what `prune` and `dedup` are cleaning.
- S `tickets/C03-threejs-viewer.md` lines 159–176: how three.js is expected to consume
  the skinned meshes and morph targets, which is what `join` must not break.
- P00's `scripts/check_assets.py` and CONVENTIONS.md §3 (the manifest fields, the
  budgets in bytes: `biscuit.glb` 6,291,456; no whole-tree total).
- CONVENTIONS.md §4.3 (the pipeline, the clip table), §5.1 (the scale the runtime
  applies, which `stride` is stated in model units for), §11 claims 5, 6 and 7, §12 (draw
  calls).

**Authorisation.** No step pushes, tags, opens a pull request or touches another
repository. `npx` reads the npm registry only for packages already in `package-lock.json`
(P00 pinned the CLI, so `npx gltf-transform` resolves locally; if it asks to download,
stop, because the pin is missing). Pushing and the pull request are separately authorised.

## Goal

- `scripts/build_assets.sh` runs the CONVENTIONS.md §4.3 sequence for `biscuit` from
  `blender/out/biscuit-raw.glb` to `src/lib/assets/biscuit.glb`, strips normal maps
  through `scripts/strip_normals.mjs`, writes `src/lib/assets/biscuit.clips.json`, and
  ends with `just assets-manifest`; it accepts `cabin` as a second target with the
  variations §4.3 names, and P05 is the first to run that branch.
- `src/lib/assets/biscuit.glb` is committed, built from P02's proof export, under
  6,291,456 bytes, loading in three.js with its skin, its five morph targets and its one
  clip intact (the check is a node script, not the browser: P07a does the browser).
- The measurements CONVENTIONS.md §4.3 asks for are recorded in the hand-back notes:
  triangles, meshes and draw calls, bytes and texture bytes before and after each stage.
- `just check-assets` is green with the manifest's first real entries.

## Non-goals

- Any clip beyond P02's `idle.stand`: P04. Any room: P05. Drawing anything: P07a.
- Decimation. `gltf-transform simplify` is named as the next lever in Open points and is
  not run here unless the draw-call count or the byte budget fails, in which case the
  ticket runs it, records the error figure, and says so.
- Editing `scripts/check_assets.py`, `Justfile`, `package.json` or the manifest by hand
  (CONVENTIONS.md §10, files no lane touches). A change needed there is a hand-back.
- KTX2 or Basis textures. WebP is the decision (§4.3); KTX2 is an open point for P10 if
  GPU memory is the problem on the device.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `scripts/build_assets.sh` | repo | Step 2 (embedded) | new; mode `100755` |
| `scripts/strip_normals.mjs` | repo | Step 3 (embedded) | new |
| `scripts/clip_table.mjs` | repo | Step 4 (embedded) | new |
| `src/lib/assets/biscuit.glb` | gen | `just assets-build` | new; committed; replaces P00's absence, P04 replaces it |
| `src/lib/assets/biscuit.clips.json` | gen | `just assets-build` | new; committed; P04 replaces it |
| `scripts/placeholder_still.mjs` | repo | Step 5 (embedded) | new |
| `src/lib/assets/stills/idle.morning.webp` | repo | Step 5: D `models/biscuit/previews/standing-hero.png` encoded WebP | new; the placeholder still P07a shows until P04 replaces it (CONVENTIONS.md §3) |
| `src/lib/assets/manifest.json` | gen | `just assets-manifest` | three entries added; `source` set to `built:<date>`, `budget` to §3's figures |
| `tickets/P03-asset-pipeline.md` | tickets | this file | `status: done` |

`ai_tmp/` holds every intermediate (`ai_tmp/biscuit.1.glb` to `ai_tmp/biscuit.6.glb`) and
is gitignored; `just check` fails if any of them lands anywhere else.

## Steps

1. **Read the raw export and record the before figures.** `npx gltf-transform inspect
   blender/out/biscuit-raw.glb --format md > ai_tmp/inspect-before.md`. Record meshes
   (expect 148), primitives, triangles (expect 86,828), materials (27), textures (27
   images), animations (1), the file's bytes, and the sum of texture bytes. Compare the
   triangle and part counts with D `qa/viewer-package.json`; a difference means P02's
   export diverged and this ticket stops and hands it back to P02's follow-up.

2. **Write `scripts/build_assets.sh`.** POSIX `sh`, `set -eu`, one positional argument
   `biscuit` or `cabin`, refusing anything else. For `biscuit`:

   ```sh
   #!/bin/sh
   # The served GLBs from blender/out/, through gltf-transform. CONVENTIONS.md §4.3.
   set -eu
   name="${1:?biscuit or cabin}"
   raw="blender/out/${name}-raw.glb"
   out="src/lib/assets/${name}.glb"
   tmp="ai_tmp"
   mkdir -p "$tmp"
   [ -f "$raw" ] || { echo "missing $raw: run just model-export or just cabin-export" >&2; exit 2; }
   gt="npx gltf-transform"
   $gt prune   "$raw"            "$tmp/$name.1.glb"
   $gt dedup   "$tmp/$name.1.glb" "$tmp/$name.2.glb"
   $gt flatten "$tmp/$name.2.glb" "$tmp/$name.3.glb"
   case "$name" in
     biscuit) $gt join "$tmp/$name.3.glb" "$tmp/$name.4.glb" ;;
     cabin)   $gt join "$tmp/$name.3.glb" "$tmp/$name.4.glb" --keepNamed true ;;
   esac
   node scripts/strip_normals.mjs "$tmp/$name.4.glb" "$tmp/$name.4n.glb"
   $gt resize  "$tmp/$name.4n.glb" "$tmp/$name.5.glb" --width 1024 --height 1024
   $gt resize  "$tmp/$name.5.glb"  "$tmp/$name.5o.glb" --width 512 --height 512 --slots "occlusionTexture"
   $gt webp    "$tmp/$name.5o.glb" "$tmp/$name.6.glb" --quality 82
   $gt meshopt "$tmp/$name.6.glb"  "$out" --level medium
   [ "$name" = biscuit ] && node scripts/clip_table.mjs "$out" "src/lib/assets/biscuit.clips.json"
   just assets-manifest
   ```

   `resize` has `--pattern` but no `--slots`; if the second `resize` line above is refused
   (the flag belongs to `webp`), replace it with `--pattern "*occlusion*"` (the raw export
   names its occlusion images `<part>-occlusion-<part>-roughness`, §1 fact 1) and record
   the substitution. `join --keepNamed true` is the cabin's variation (§5.2 needs `item.*`
   meshes apart); the `biscuit` pass joins everything it can. Commit with mode `100755`.

3. **Write `scripts/strip_normals.mjs`.** An ES module on `@gltf-transform/core` (a
   dependency of the pinned CLI; import it as `@gltf-transform/core` and, if Node cannot
   resolve it because only the CLI is a direct dependency, hand back a one-line
   `package.json` addition to P11 and import from the CLI's nested copy meanwhile, saying
   so): `NodeIO` with `ALL_EXTENSIONS` registered, read the input, for every material
   `setNormalTexture(null)`, then `prune` from `@gltf-transform/functions` so the orphaned
   images leave, write the output. Print how many materials lost a normal map and how
   many images were pruned. (CONVENTIONS.md §4.3: normal maps are removed unless P07a's
   look review keeps them, in which case P07a hands back a one-line change here.)

4. **Write `scripts/clip_table.mjs`.** Reads the served GLB with `NodeIO`, and for every
   animation writes `{ name, seconds, loop, stride }`: `seconds` is the maximum of the
   last input value over the animation's samplers; `loop` is true for the names §4.1
   marks as loops (`idle.stand`, `idle.sit`, `walk`, `sleep`, `drink`, `eat`, `play`) and
   false otherwise; `stride` is `0` unless a module `blender/clips/<name>.py` exports a
   line matching `^STRIDE\s*=\s*([0-9.]+)` (the script reads the file as text; only
   `walk.py` will ever carry one, and it arrives with P04, so this ticket writes `0` and
   proves the regex on a fixture string). `height` is the Y extent of the skinned meshes'
   POSITION bounds (expect 3.113). Output sorted by name, two-space indented, one trailing
   newline, the shape CONVENTIONS.md §4.3 gives.

5. **Ship the placeholder still.** `src/lib/assets/stills/idle.morning.webp` is D
   `models/biscuit/previews/standing-hero.png` (read-only; copy it under `ai_tmp/`
   first) placed on a 1170×2532 canvas of its own ground colour and encoded WebP at
   quality 80 by `scripts/placeholder_still.mjs`, a few lines on `sharp`, so that P07a's
   still `<img>` has a source before P04 renders the real set (CONVENTIONS.md §3). Its
   manifest entry gets `source`
   `biscuit_pics@1d9d358:models/biscuit/previews/standing-hero.png`, `licence`
   `platform`, `budget` 262144. P04 replaces the file and keeps the entry's shape.

6. **Run the pipeline** with `just assets-build biscuit` (P00's recipe, CONVENTIONS.md
   §2.3, calls `sh scripts/build_assets.sh {{name}}`). After each stage run `npx gltf-transform inspect ai_tmp/biscuit.<n>.glb
   --format md` and record meshes, primitives, triangles, bytes and texture bytes into a
   table in the hand-back notes.

7. **Prove CONVENTIONS.md §11 claim 5: `join` keeps the skin and the morphs.** On
   `ai_tmp/biscuit.4.glb` and on the served file, a node script (kept under `ai_tmp/`,
   not committed) asserts with `NodeIO`: one skin with 33 joints in `rig.json`'s order;
   `Sweater.Fabric` (or the joined primitive that carries it) still has five morph targets
   and `extras.targetNames` (or the mesh's `targetNames`) still lists them; one animation
   named `idle.stand` targeting nodes that are still in the scene; every skinned primitive
   has `JOINTS_0` and `WEIGHTS_0`. Record what `join` did to the sweater: if it joined
   the sweater's two primitives with anything else and lost the targets, rerun the
   pipeline with `join --keepNamed true` for `biscuit` too and record the draw-call cost.

8. **Prove §11 claim 6, first half: the byte budget.** The served file is under
   6,291,456 bytes with colour at 1024² and occlusion at 512², normals gone. If it is
   not, in order: `webp --quality 75`; occlusion at 256²; `meshopt --level high`; then
   `gltf-transform simplify --ratio 0.75 --error 0.001` inserted before `meshopt`, with
   the error figure and the triangle count after it recorded and a note that P07a must
   look at the silhouette. Stop at the first that passes and record every figure.

9. **Prove §11 claim 7: the draw-call count.** Draw calls are the number of primitives
   in the served scene, plus one outline primitive per material the runtime will add
   (§5.3), so the figure to record is `primitives × 2`. Expect at most 30 after `join`
   with 27 materials; record the actual number. If it is above 60 with the room's
   allowance of 30, `gltf-transform palette` (merging materials into a palette texture)
   is the next lever: run it before `join`, record the count, and say what it did to the
   toon ramps (a palette texture replaces per-material colour factors, which
   `MeshToonMaterial` reads through `map`, so it should be harmless; the hand-back says).

10. **Read the manifest diff.** `git diff src/lib/assets/manifest.json`: exactly three new
   entries, `src/lib/assets/biscuit.clips.json` and `src/lib/assets/biscuit.glb`, with
   `source` `built:<today>`, `licence` `unsettled` (the model's licence is the platform's
   open question; set it to `platform`, which `check_assets.py write` keeps on later
   runs), and `budget` `0` for the table and `6291456` for the GLB, edited into the
   manifest by re-running `just assets-manifest` after setting them (the tool keeps
   `source`, `licence` and `budget`; it never invents a budget). `just check-assets`
   green.

11. **`just check`**, then set `status: done`, commit on the ticket branch. Pushing and
    the pull request are authorised separately.

## Acceptance criteria

- [x] `scripts/build_assets.sh biscuit` runs from a clean `ai_tmp/` to a served file and
      a clip table, and `scripts/build_assets.sh cabin` refuses a missing
      `blender/out/cabin-raw.glb` with exit 2.
- [x] `src/lib/assets/biscuit.glb` is under 6,291,456 bytes; `npx gltf-transform inspect`
      shows `EXT_meshopt_compression` and `EXT_texture_webp` among the extensions, no
      image wider than 1024, no occlusion image wider than 512, and no `normalTexture`.
- [x] The skin (33 joints, in order), the five sweater morph targets and the `idle.stand`
      animation survive (Step 6's assertions pass on the served file).
- [x] `src/lib/assets/biscuit.clips.json` lists `idle.stand` with `seconds` 4 (120 frames
      at 30 fps; a small rounding is fine and is recorded), `loop` true, `stride` 0, and
      `height` within 0.01 of 3.113.
- [x] The before and after table in the hand-back notes has a row per stage with meshes,
      primitives, triangles, bytes and texture bytes, and a stated draw-call figure.
- [x] `just check-assets` and `just check` are green; `git status` shows nothing under
      `ai_tmp/` tracked.

## Verification

```sh
rm -rf ai_tmp && mkdir ai_tmp
sh scripts/build_assets.sh biscuit
ls -la src/lib/assets/
npx gltf-transform inspect src/lib/assets/biscuit.glb --format md | head -60
node -e 'const t=require("./src/lib/assets/biscuit.clips.json");console.log(t.clips,t.height)'
just check-assets
git diff --stat
just check
```

Expected: the pipeline prints one line per stage and `just assets-manifest`'s summary
line; `biscuit.glb` under 6,291,456 bytes and `biscuit.clips.json` a few hundred bytes;
the inspect report naming the two extensions, 33 joints, one animation, at most 30
primitives; the clip table with one entry; `check-assets` green with two entries; the
diff touching the manifest, the two assets, the three scripts and this ticket; `just
check` green.

## Hand-back notes

Measured on P02's canonical proof export on 2026-09-25, before P04 replaces it with
the complete clip set. Every stage retains 86,828 triangles. Draw calls include the
runtime's duplicate outline geometry (`primitives × 2`). The rebuild records the full
machine-readable measurements in gitignored `ai_tmp/biscuit-pipeline.jsonl`.

| Stage | Meshes | Primitives | Draw calls | File bytes | Texture bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Raw proof | 148 | 154 | 308 | 16,151,816 | 11,418,773 |
| Prune | 148 | 154 | 308 | 15,824,716 | 11,191,407 |
| Deduplicate | 148 | 154 | 308 | 15,685,148 | 11,191,407 |
| Flatten | 148 | 154 | 308 | 15,685,148 | 11,191,407 |
| CLI join | 148 | 154 | 308 | 15,685,148 | 11,191,407 |
| Skin-aware join | 13 | 14 | 28 | 15,770,564 | 11,191,407 |
| Strip normals | 13 | 14 | 28 | 10,263,172 | 6,404,761 |
| Resize colour to 1024 | 13 | 14 | 28 | 7,019,444 | 3,161,040 |
| Resize occlusion to 512 | 13 | 14 | 28 | 6,766,208 | 2,907,813 |
| WebP quality 82 | 13 | 14 | 28 | 3,925,256 | 66,342 |
| Meshopt medium | 13 | 14 | 28 | 1,212,704 | 66,342 |

The raw export matches the 148 parts, 86,828 triangles, 27 materials and 27 images
in the approved package. Its 154 primitives reflect six additional material slots,
so meshes and draw calls were measured separately. Deduplication leaves 14 materials.
No palette, simplification, quality reduction or smaller texture fallback was needed.

The pinned CLI's `join` explicitly skips skinned nodes and morph targets; its output
left all 154 primitives. `scripts/join_assets.mjs` therefore concatenates compatible
primitives with the same skin, parent, bind transform, material and attribute layout,
using the pinned library's `joinPrimitives`. Animated nodes and morph meshes stay
separate. Original named nodes and their extras remain as leaves. The sweater's five
named targets and baked weight channels survive unchanged; no `keepNamed` fallback
is needed for Biscuit. Unit tests exercise preserved weights, morphs, animation targets
and incompatible bind transforms.

Meshopt's default per-mesh quantization clones a skin for every mesh. The pipeline
uses its supported `--quantization-volume scene` option, so deduplication leaves one
skin with the 33 joints in `rig.json` order. Quantization stores the scale and offset
in inverse-bind matrices; the clip table recovers that transform from the stationary
root's bind matrix. The proof's measured height is 3.11312993250124 model units.
`idle.stand` lasts 3.9666666984558105 seconds (120 samples spanning 119 intervals at
30 fps), loops and has stride zero.

`resize` has no `--slots`: the occlusion pass uses `--pattern '*occlusion*'`, a glob
matching every packed occlusion/roughness image. This also corrects the conventions'
regular-expression-shaped pattern. The local CLI is called directly and cannot
download a missing package. `@gltf-transform/core`, extensions and functions resolve
from the pinned CLI dependency tree without a new dependency. Meshopt encoder and
decoder dependencies are registered for every read/write helper.

The cabin branch retains empty leaves, skips flattening, and calls the library's
`join({ keepNamed: true, cleanup: false })` directly: the CLI wrapper implicitly
flattens even with `keepNamed`, which would break item parents and anchor names.
The branch preserves the hierarchy P05's checker consumes.

`just check-model-asset` proves the ordered skin, five named morphs, live animation
targets, weights, bounds, texture limits and byte/draw budgets. It also loads the GLB
with the actual three.js `GLTFLoader` and plays every clip through `AnimationMixer`;
embedded textures decode through an injected sharp loader, with no browser globals
stubbed. Both the joined proof and the served proof pass.

The P03 commit includes `stills/idle.morning.webp`, generated from the approved
`standing-hero.png` preview by `just assets-placeholder`. The helper centres the preview
on a 1170 × 2532 canvas matching its ground colour, encodes WebP at quality 80 and
enforces the 262,144-byte budget. P04 replaces that placeholder with its rendered set.
No source repository was modified and no network operation ran.

`just check-assets` and the full `just check` passed on 2026-09-25: 36 unit tests,
static checks, coverage, builds, browser stories, documentation, agents and specs.
The three-entry manifest records the proof assets and placeholder with their budgets.
No check changed the worktree and no `ai_tmp/` file is tracked.

## Open points

- **Simplification.** No decimation ships today (§1 fact 1) and the PRD's 45,000-triangle
  target is unverified. If the phone holds 60 fps at 86,828 (P10 measures), simplify is
  never run; if not, this script gains a `simplify` stage and the ratio is P10's to set.
  Recommend: leave it out until P10 has a number.
- **Texture memory.** WebP decodes to full RGBA on the GPU; four 1024² colour maps and
  the rest are about 24 MB of texture memory, fine for the device. KTX2 (`uastc`) would
  cut that but needs `toktx` on the PATH and a decoder in the runtime; P10 decides.
- **Where the raw export lives.** `blender/out/` is gitignored, so a contributor without
  Blender cannot rebuild the served file; they can only use the committed one. Whether
  the raw export should be kept in LFS for reproducibility without Blender is a
  maintainer's call; recommend not, because the clips `.blend` is a deterministic product
  of the committed `.blend` and the committed scripts.
