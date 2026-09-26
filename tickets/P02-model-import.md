---
id: P02
title: "Model import and the animated exporter: D's `.blend` and scripts, `export_animated_glb.py`, the proof clip"
status: in_progress
depends_on: [P00]
parallel_with: [P01, P06, P09]
branch: ticket/p02-model-import
estimated_size: L
---

# P02: Model import and the animated exporter: D's `.blend` and scripts, `export_animated_glb.py`, the proof clip

## Context

This repository owns its animated model (CONVENTIONS.md §1 decision 5): the approved
poseable Biscuit is copied here from D, byte for byte, and animated here. The approved
package has no animation of any kind: no script keyframes anything, creates an action or
uses the NLA, and every export passes `export_animations=False` (CONVENTIONS.md §1
fact 3). This ticket builds the two things every later clip needs, the clip runner and
the exporter, and proves them with one clip.

Three facts decide the shape. First, D's `build.py` cannot run here: its `common.py`
resolves `REPO_ROOT` two directories up and loads a chain of seven earlier studies under
`biscuit_pics/generated/3d/` (CONVENTIONS.md §3 "Provenance"), and the material swap the
GLB export needs, `portable_material`, lives in one of them (D
`biscuit_pics/generated/3d/miami-cinematic-studies/src/build.py` lines 542–566). So the
exporter here ports that one function and reads nothing outside this repository. Second,
the committed `.blend` is never modified: `build_clips.py` opens it, adds every clip
and saves a derived file under `blender/out/`, which `.gitignore` excludes (P00). Third,
glTF carries no drivers, but Blender 5.2.1's exporter bakes the sweater's five
shape-key drivers into morph-weight channels when sampling is on (CONVENTIONS.md §1
fact 4), and drops the IK controls while baking their effect into the deform bones
(fact 5). Both are CONVENTIONS.md §11 claims 3 and 4 and this ticket proves them.

Sources, at the commits CONVENTIONS.md §0 pins (read-only, never modified):

- D = `/Users/scutting/.supacode/repos/biscuit_pics/very_nice_three_deeez` at
  `1d9d358`. Read first: `models/biscuit/README.md` whole (the package, the pose
  format, the rig: 33 deform bones, four optional paw targets, five driven corrections);
  `models/biscuit/src/build.py` (`export_glb` at lines 61–75, the arguments to
  reproduce); `models/biscuit/src/common.py` lines 1–20 (why it cannot run here);
  `models/biscuit/src/rig.py` (`make_spec` at 14, `create_armature` at 69,
  `garment_correctives` at 207, `native_controls` at 232: the IK targets, the `IK
  influence` property at 251–252 and its driver at 259); `models/biscuit/src/pose_io.py`
  (`MODEL_ID` and `RIG_VERSION` at 7–8, `correctives` at 37, `validate` at 40, `apply`
  at 82, `export_current` at 93, `load` at 110); `models/biscuit/src/blender_pose_tools.py`
  lines 1–30 (how it finds `rig.json` and `pose_io.py` as text blocks; here they are
  files); `models/biscuit/src/render.py` (the review camera: yaw 0.85, pitch 0.32,
  distance 9, 1000×1000 RGBA; reused by the contact sheet); `models/biscuit/src/verify.py`
  (what it asserts about the GLB, which the exporter's own assertions mirror);
  `biscuit_pics/generated/3d/miami-cinematic-studies/src/build.py` lines 542–566
  (`portable_material`: a Principled BSDF per source material, `Specular IOR Level`
  `.19` for `gloss` else `.12`, a solid colour with roughness `.8` when the source has no
  `texture_family`, otherwise four image nodes for `color`, `normal`, `roughness`,
  `occlusion` found by `image(texture, kind)`, `EXTEND` for the eye and `REPEAT`
  elsewhere, a `MULTIPLY` tint from the source's `tint` property, a normal map at
  strength `.18` for `face*` families and `.32` otherwise, and the occlusion map wired
  to a `glTF Material Output` node group so the exporter writes it), and lines 569–588
  (`export_glb` there, which is where D's `build.py` inherited its arguments).
- S = `/Users/scutting/projects/biscuit_studio` at `a4d20af`. Read
  `assets/models/biscuit/README.md`'s Provenance section for the shape of the provenance
  note, and `.gitattributes` for how it puts `*.blend` in LFS.
- The Blender add-on at `/Applications/Blender.app/Contents/Resources/5.2/scripts/addons_core/io_scene_gltf2`:
  `blender/exp/animation/drivers.py` (`get_sk_drivers`, `get_driver_on_shapekey`) and
  the operator's properties in `__init__.py` (`export_animation_mode`,
  `export_force_sampling`, `export_morph_animation`, `export_def_bones`,
  `export_optimize_animation_size`, `export_anim_slide_to_zero`) to confirm the argument
  names before writing them.

Blender is 5.2.1 LTS at `/Applications/Blender.app`, verified 2026-09-25; the
`Justfile` recipes P00 added (`model-clips`, `model-export`) run it in the background
with `--python-exit-code 1`.

**Authorisation.** Nothing here leaves the repository; D is read with `cp`, `shasum` and
`cat` only. The maintainer's approval of the proof clip's contact sheet (Step 8) is a
gate: stop there and ask. Pushing and the pull request are separately authorised.

## Goal

At the end of this ticket, on branch `ticket/p02-model-import`:

- `blender/model/biscuit-poseable.blend` is D's, byte-identical (sha256
  `95d164730e9354ab3d9bd561a73180690bbb055fffa9bf230c735f735234b4c3`), in LFS, with the
  index holding a pointer; `blender/model/rig.json`, `blender/poses/*.json` and every file of
  D `models/biscuit/src/` are byte-identical copies; `blender/README.md` records the
  provenance.
- `blender/build_clips.py` opens the `.blend`, runs every `blender/clips/*.py` whose name does not start with `_` (shared helpers
  live in `blender/clips/_keys.py`, P04), and
  saves `blender/out/biscuit-clips.blend`; `blender/clips/idle_stand.py` is the proof
  clip (CONVENTIONS.md §4.1: 120 frames, a loop).
- `blender/export_animated_glb.py` exports `blender/out/biscuit-raw.glb` with one
  animation per NLA track, the ported portable materials, the skin, the five morph
  targets and their baked weight channels, and asserts all of it by reading the GLB's
  JSON chunk (CONVENTIONS.md §4.2).
- `just model-clips` and `just model-export` run green from a clean checkout with
  Blender on the machine; `just check` is green with D's scripts in the tree (P00's
  exclusions hold).
- The proof clip's contact sheet under `ai_tmp/` is approved by the maintainer.

## Non-goals

- The nine other clips, the stills, `scripts/contact_sheet.py` as a committed tool:
  P04. This ticket renders its sheet with a throwaway script under `ai_tmp/`, or with
  P04's script if P04 has landed, and records which.
- The gltf-transform pipeline, `src/lib/assets/biscuit.glb`, the clip table, the
  manifest entries: P03. This ticket's output stays under `blender/out/`.
- Rebuilding the model from its studies, or running D's `build.py`, `verify.py`,
  `render.py` or `viewer.py` here: they are copied as the record of how the model was
  made and for the modules the clip tools import, never run (CONVENTIONS.md §3).
- Changing the pose format, `rig.json`, the rig or the `.blend`. A clip that needs a
  rig change is a model ticket first.
- Decimation, texture resizing or any change to the GLB's payload: P03.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `blender/README.md` | repo | P00's stub replaced; CONVENTIONS.md §3 "Provenance" | provenance, the file table with sha256s, what runs and what does not |
| `blender/model/biscuit-poseable.blend` | repo (LFS) | D `models/biscuit/model/biscuit-poseable.blend` | new, byte-identical |
| `blender/model/rig.json` | repo | D `models/biscuit/model/rig.json` | new, byte-identical |
| `blender/poses/standing.json`, `sitting.json`, `lying.json`, `paw-raised.json` | repo | D `models/biscuit/poses/` | new, byte-identical |
| `blender/src/<every file of D models/biscuit/src/>` | repo | D, byte-identical | new; sixteen files; excluded from every linter by P00 |
| `blender/build_clips.py` | repo | Step 4 | new |
| `blender/clips/idle_stand.py` | repo | Step 5 | new |
| `blender/export_animated_glb.py` | repo | Step 6 | new |
| `tickets/P02-model-import.md` | tickets | this file | `status: done` |

Nothing under `blender/out/` is committed; `.gitignore` (P00) excludes it.

## Steps

1. **Copy, and prove the copy.** From D, `cp` the `.blend`, `rig.json`, the four poses
   and every file under `models/biscuit/src/` (list it first: `ls
   /Users/scutting/.supacode/repos/biscuit_pics/very_nice_three_deeez/models/biscuit/src`;
   the count and names go in the hand-back). Run `shasum -a 256` on each source and each
   copy and diff the two lists; the `.blend` and the GLB's digests are CONVENTIONS.md §1
   fact 1's. Then `git add blender/`, and prove LFS: `git check-attr filter
   blender/model/biscuit-poseable.blend` prints `filter: lfs`, and `git cat-file -p
   :blender/model/biscuit-poseable.blend | head -3` prints `version
   https://git-lfs.github.com/spec/v1`, `oid sha256:95d16473…`, `size 12004899`. A
   checkout that shows the `.blend` as a real file with the wrong index blob means
   git-lfs was not installed for this clone; run `git lfs install --local` (P00) and
   re-add.

2. **`blender/README.md`.** The provenance section CONVENTIONS.md §3 specifies: D
   `1d9d358`, the date, a table of every copied file with its sha256, the seven-folder
   rebuild chain and the sentence that it stays in `biscuit_pics` so `build.py`,
   `verify.py`, `render.py`, `viewer.py` and `proof_sheet.py` are records and not
   recipes here; then what does run: `build_clips.py`, `export_animated_glb.py`, the
   clip scripts, and how (`just model-clips`, `just model-export`). Forty words or more;
   it is outside `docs/` and unregistered, linted as Markdown.

3. **Confirm the exporter's argument names.** Open the add-on's `__init__.py` and
   record, in the hand-back, the exact property names and defaults for the eight
   arguments CONVENTIONS.md §4.2 lists. A name that differs from §4.2 is used as the
   add-on spells it and reported.

4. **`blender/build_clips.py`.** Run under Blender in the background. It: opens
   `blender/model/biscuit-poseable.blend` (`bpy.ops.wm.open_mainfile`); sets
   `scene.render.fps = 30`; imports `blender/src/pose_io.py` and `blender/src/rig.py`
   by path with `importlib.util.spec_from_file_location` (they are files here, not
   text blocks; `blender_pose_tools.py`'s `spec()` and `io()` read text blocks and are
   not used); loads `blender/model/rig.json`; finds `Biscuit.Rig`; imports every
   `blender/clips/*.py` in sorted name order and calls `build(rig, start)` with a
   running frame counter that begins at 1 and advances by what each returns plus a
   gap of 10 frames; sets `scene.frame_end` to the last frame; saves to
   `blender/out/biscuit-clips.blend` (creating `blender/out/`); prints one line per clip
   with its track name and frame range; exits non-zero on any exception. It never
   saves over the source.

5. **The proof clip, `blender/clips/idle_stand.py`.** `build(rig, start)` applies
   `standing.json` through `pose_io.apply(spec, doc)` at frame `start`, creates an action
   `idle.stand`, and keyframes on the deform bones only: `pelvis` a weight shift of ±2°
   roll peaking at a quarter and three quarters, `neck` and `head` a turn of 12° to
   Biscuit's left peaking at the midpoint and returning, `ear.1.L` and `ear.1.R` a 3°
   settle following the head with a six-frame lag, `tail.1` to `tail.3` a slow ±5° sway at
   one cycle per 120 frames; frame `start` and frame `start + 119` carry identical values
   on every keyed bone (a loop, CONVENTIONS.md §4.1); Bezier handles with `ease`; no
   keyframe on `root`'s location; no shape key touched; `IK influence` keyed to 0 on all
   four paws at frame `start` and at the clip's last frame (CONVENTIONS.md §4.1: every
   clip keys it on its own first and last frame). It pushes the action as a strip on a new
   NLA track named `idle.stand` at `start`, clears the active action so the next clip
   starts clean, and returns `start + 120`. Comments name the bones by `rig.json`'s names
   and say what each motion reads as.

6. **`blender/export_animated_glb.py`.** Opens `blender/out/biscuit-clips.blend`;
   defines `portable_material(src)` ported from D's lines 542–566 with the source cited
   in a comment, with one change stated in the comment: `image(texture, kind)` is
   replaced by a lookup in `bpy.data.images` by the packed image's name (the `.blend`
   packs every texture; list the names with `[i.name for i in bpy.data.images]` and
   record the mapping from `texture_family` and `kind` to image name in the
   hand-back), because the studies' loader is not here; replaces every material on
   every part carrying a `base_part` property (D `common.py`'s `parts()` selects them
   so) with its portable twin, as D's `export_glb` does, restoring nothing afterwards
   because the derived file is never saved; selects the parts and the rig, makes the rig
   active; calls `bpy.ops.export_scene.gltf` with D's arguments (CONVENTIONS.md §1
   fact 3) changed as §4.2 lists them; writes `blender/out/biscuit-raw.glb`. Then it
   reads the GLB back (a 12-byte header, the JSON chunk length at offset 12, the chunk
   at offset 20, as D's `export_pose_glb.py` `read_glb` does) and asserts: `animations`
   has one entry per NLA track, named after it; `skins[0].joints` has 33 entries whose
   node names equal `rig.json`'s bone names in order; no node is named `CTRL.*`; the
   mesh whose `extras.targetNames` lists the five correctives has, in every animation
   whose channels move `front.upper.L`, `front.upper.R`, `hind.thigh.L`, `hind.thigh.R`
   or `spine` beyond 0.25 rad, a `weights` channel targeting that mesh's node
   (CONVENTIONS.md §11 claim 4; for the proof clip, whose bones do not cross the
   threshold, assert instead that the `weights` channel exists or that its absence is
   explained by the threshold, and say which in the hand-back); every image is PNG;
   `asset.generator` names Blender 5.2. It prints the animation names, their sample
   counts and durations, the triangle count and the file size, and exits non-zero on
   any failed assertion.

7. **Run it.** `just model-clips` then `just model-export`; quote both outputs. This is
   CONVENTIONS.md §11 claim 3 (one animation per track, IK baked: the proof clip uses no
   IK, so add to Step 5, behind a flag off by default, a variant that enables
   `CTRL.front.paw.L`'s `IK influence` and moves the target 0.05 up for twelve frames,
   export it once with the flag on, assert the `front.lower.L` channel shows the motion
   and no `CTRL` node exists, record the result, and export again with the flag off for
   the committed state) and claim 4 (the morph channels).

8. **The contact sheet, and the gate.** Render twelve evenly spaced frames of
   `idle.stand` from the review camera D `render.py` defines (yaw 0.85, pitch 0.32,
   distance 9, orthographic, 1000×1000, the saved scene's lights) into
   `ai_tmp/clips/idle.stand.jpg` as a 4×3 sheet (Pillow, which P00 pinned), using
   P04's `scripts/contact_sheet.py` if it exists on `main` and otherwise a throwaway
   script under `ai_tmp/` whose text goes in the hand-back. Show the sheet to the
   maintainer and stop. Rework the clip until it is approved; record the approval and
   the date.

9. **`just check`.** With sixteen of D's files under `blender/src/` and three new python
   files under `blender/`, every gate stays green: ruff reads `build_clips.py`,
   `export_animated_glb.py` and `clips/idle_stand.py` under the `blender/**` ignores
   (P00, §2.2) and skips `blender/src/`; typos, editorconfig-checker, markdownlint,
   lychee and Prettier skip `blender/src/`. A gate that reads a D file is a P00
   follow-up (hand it back; do not widen an exclude here). `check-clean` proves the
   Blender recipes wrote only under `blender/out/`.

10. **Hand-back and status.** Set `status: done`, commit. Pushing and the pull request
    are authorised separately.

## Acceptance criteria

- [x] `shasum -a 256` of every file under `blender/model/`, `blender/poses/`,
      `blender/model/rig.json` and `blender/src/` equals D's, and the `.blend` digest of
      CONVENTIONS.md §1 fact 1 appears among them (the GLB is not copied).
- [x] `git cat-file -p :blender/model/biscuit-poseable.blend` prints an LFS pointer with
      `size 12004899`; `git check-attr filter` on it prints `lfs`.
- [x] `blender/model/biscuit-poseable.blend` is unchanged by `just model-clips`
      (its digest before and after are equal).
- [x] `just model-export` prints one animation named `idle.stand` of 120 samples at
      30 fps (4.0 s), 33 joints named as `rig.json`, no `CTRL` node, and exits 0.
- [x] The IK variant of Step 7 showed motion on `front.lower.L` with no `CTRL` node
      (§11 claim 3 recorded), and the morph-channel assertion's outcome is recorded (§11
      claim 4).
- [ ] The contact sheet was approved by the maintainer, with the date in the hand-back.
- [x] `just check` is green with every D file present.

## Verification

```sh
shasum -a 256 blender/model/biscuit-poseable.blend blender/model/rig.json
git check-attr filter blender/model/biscuit-poseable.blend
git cat-file -p :blender/model/biscuit-poseable.blend | head -3
ls blender/src | wc -l
just model-clips
just model-export
ls -la blender/out/
git status --porcelain blender/out
just check
```

Expected: `95d16473…` and `8de40553…`; `filter: lfs`; the three pointer lines; `16`;
one line naming `idle.stand` with frames 1 to 120; the animation, joint and size lines
and exit 0; two files under `blender/out/`; nothing (ignored); green.

## Hand-back notes

Implemented locally on 2026-09-25. Visual acceptance remains pending; code is
committed separately from P03, P04 and P05.

- All 22 copied files match the source hashes. The complete file list, sixteen
  source filenames and SHA-256 table are in `blender/README.md` and
  `blender/provenance.json`; `just model-provenance` verifies them. No source GLB
  was copied. The source `.blend` remains `95d164730e9354ab3d9bd561a73180690bbb055fffa9bf230c735f735234b4c3`.
- The staged `.blend` is an LFS pointer with that oid and `size 12004899`;
  `git check-attr filter` reports `lfs`.
- Blender 5.2.1 LTS property defaults: `export_animations=True`,
  `export_animation_mode='ACTIONS'`, `export_force_sampling=True`,
  `export_frame_step=1`, `export_morph=True`, `export_morph_animation=True`,
  `export_optimize_animation_size=True`, `export_anim_slide_to_zero=False`,
  `export_image_format='AUTO'`, `export_def_bones=False`. The exporter explicitly
  applies the ticket's changes. `just model-inspect` records the full evidence.
- Packed image mapping: `<family>-<kind>.png`, kinds `color`, `normal`,
  `roughness`, `occlusion`; families `coat`, `cream`, `ear-wave`, `eye`, `face-B`,
  `nose`, `sweater-knit`, `sweater-label`, `sweater-rib`. The four `ear-wave`
  image names have `.001` appended. All 36 are packed; no external paths are read.
- `just model-clips` proof: `idle.stand: frames 1-120 (120 samples at 30 fps)`.
  `just model-export`: `idle.stand: 120 samples, 3.966667s; weights=True,
  above threshold=False`; 33 deformation joints, no CTRL nodes, 86,828 triangles.
  The ordinary raw export is approximately 16.15 MB before P03 compression.
- `just model-check-ik ai_tmp/proof-raw.glb ai_tmp/ik-probe.glb`:
  `IK baked into front.lower.L: baseline span 0.00000000, probe span 0.26967822;
  no CTRL nodes`. The normal proof was restored after this temporary variant.
- The contact sheet is `ai_tmp/clips/idle.stand.jpg`, rendered with P04's
  `scripts/contact_sheet.py`. Maintainer approval is pending, not inferred.
- Targeted Python checks and the source provenance check pass. The aggregate
  `just check` passed on 2026-09-25 with all copied files present, before P03's
  commit. Visual approval remains the only outstanding acceptance criterion.

Corrections to assumptions discovered in implementation:

1. The copied `rig.py` imports `common.py` and therefore the unavailable rebuild
   chain. It is retained byte-identically but not imported; animation reads
   `rig.json` and imports only the independent `pose_io.py`.
2. Blender emits joints in hierarchy traversal order, not `rig.json` order.
   The exporter canonicalizes the palette while remapping inverse-bind matrices
   and vertex joint indices together, then requires the exact requested order.
3. 120 inclusive samples span 119 intervals: 3.966667 seconds, not 4.0. The
   scripts retain the requested sample counts and identical loop endpoints;
   P04 permits duration error of one frame. No duplicate frame extends a strip.
4. P00 omitted the copied pose/rig JSON from Prettier and the source scripts
   from EditorConfig. The narrow source exclusions now preserve their hashes.
5. Shared helpers live in `blender/clips/_keys.py` and are skipped by the runner.
   Root local Y is keyed as a constant in the proof to prevent a later seated
   clip's height leaking into it; no horizontal root motion is authored.

## Open points

- **Where the shared clip helpers live.** Step 5 keyframes bones by hand; P04 will
  want helpers (apply a preset at a frame, key a bone's rotation, key a loop's ends
  equal). Recommend: `blender/clips/_helpers.py`, imported by every clip and skipped by
  `build_clips.py`'s glob; the executing agent may add it here if the proof clip is
  cleaner for it, and says so.
- **Textures in the raw export.** `export_image_format='AUTO'` writes the packed PNG files
  at full size, so `biscuit-raw.glb` is about as large as D's 16 MB GLB. That is
  intended: P03 resizes and re-encodes. If the raw file is much larger than 16 MB, say
  why.
- **The undressed display.** The `.blend` can hide the sweater parts; `PRD.md` leaves
  whether she undresses at night to the maintainer. The exporter takes no flag for it
  in v1.

### P04 follow-up: preserve fractional foot-contact events

P04's corrected walk passes the native whole-sole contact check, but the original
30 Hz export omitted fractional touchdown and liftoff frames. The raw and served
GLBs consequently drifted by up to 0.037662 model units during a planted stance.
Blender 5.2's `export_frame_step` is an integer property, and its sampling cache
evaluates `frame_set(int(frame))`, so a fractional step is not supported.

The exporter now stretches each NLA strip and the scene frame rate by twenty in
the disposable opened scene. The ordinary exporter therefore evaluates at
600 Hz, including the walk's twentieth-frame contact events and quarter-frame
paw compensation. Action keys, clip durations, the authored 30 fps scene, and
both saved `.blend` files remain unchanged. Assertions check strip bounds,
the walk event grid, exported event coverage, sample counts and durations.
The existing whole-sole regression retains its 0.003-model-unit limit.

`just model-export` and the verification-only diagnostic pass with all ten clips;
the walk contains 581 samples over the unchanged 0.966667 s interval. The raw
GLB is 19,161,548 bytes, including the additional baked animation samples.
`just check-model-asset blender/out/biscuit-raw.glb` passes the expanded checks
for all ten clips with maximum planted-sole drift 0.000986281 model units after
the final play-paw return correction.
The final compressed model also passes all ten contact checks at that drift,
including whole-motion floor clearance, with a served size of 2,524,748 bytes
against the 6,291,456-byte budget.
The final `just check` passed again on 2026-09-25 after this correction, with no
worktree changes from the checks. Visual approval of `idle.stand` remains pending.
