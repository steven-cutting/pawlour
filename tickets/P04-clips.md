---
id: P04
title: "Clips, the core set: nine more scripted clips, contact sheets, the maintainer's approval, the stills"
status: done
depends_on: [P03]
parallel_with: [P01, P05, P06, P07a, P08, P09]
branch: ticket/p04-clips
estimated_size: XL
---

# P04: Clips, the core set: nine more scripted clips, contact sheets, the maintainer's approval, the stills

## Context

P02 built the clip pipeline and proved it with one clip: `blender/clips/idle_stand.py`
keyframes the approved rig, `blender/build_clips.py` opens the approved `.blend`, runs
every script under `blender/clips/` in name order, pushes each as an NLA track and saves
`blender/out/biscuit-clips.blend`; `blender/export_animated_glb.py` exports it with
animations and baked morphs; P03's `just assets-build` turns the export into
`src/lib/assets/biscuit.glb` and `src/lib/assets/biscuit.clips.json`. This ticket writes
the other nine clips of the core set (CONVENTIONS.md §1 decision 15, §4.1), the contact
sheet tool that lets the maintainer judge each one, and the eighteen stills that still
mode and context loss show (§3). Nothing in the browser can be judged complete before this
lands: P07b animates against these names and P10 measures with them.

There is no animation tooling in the model package (CONVENTIONS.md §1 fact 3: no script
keyframes anything), so every clip here is written from the rig's bone names and the four
approved poses. The rig (D `models/biscuit/model/rig.json`; `blender/model/rig.json` is
the byte-identical copy): 33 deform bones — `root`, `pelvis`, `spine`, `chest`, `neck`,
`head`, `front.upper.{L,R}`, `front.lower.{L,R}`, `front.paw.{L,R}`, `hind.thigh.{L,R}`,
`hind.shin.{L,R}`, `hind.hock.{L,R}`, `hind.paw.{L,R}`, `ear.1.{L,R}` to `ear.3.{L,R}`,
`tail.1` to `tail.7` — quaternion rotation mode, unconnected, +Y roll; and the optional IK
(D `src/rig.py` lines 238–259: `CTRL.{limb}.paw.{S}` at the paw, `CTRL.{limb}.bend.{S}`
as the pole, an IK constraint "Optional paw IK" on `front.lower.{S}` with `chain_count=2`
and on `hind.hock.{S}` with `chain_count=3`, its influence driven from the control's
`IK influence` property, default 0). `pose_io.apply` (D `src/pose_io.py` lines 82–92)
sets a preset and resets every `IK influence` to 0. Blender is Z-up with −Y forward; her
left is +X (§1 fact 6). She is about 3.11 units tall and 3.3 long in the bind pose; the
runtime scales her (§5.1), so every figure here is in model units.

Sources, at the commits CONVENTIONS.md §0 pins (read-only):

- D `models/biscuit/src/render.py` lines 21–28 (the review camera: orthographic,
  1000×1000, RGBA PNG) and 43–52 (framing: the evaluated bounding box of every
  `base_part` mesh, yaw .85, pitch .32, distance 9, `ortho_scale` fitted with 1.22
  padding). `scripts/contact_sheet.py` reuses this framing.
- D `models/biscuit/src/proof_sheet.py` lines 11–18 (`font()`, the system faces it finds)
  and 21–43 (the sheet: 1920 wide, a warm ground `#f4ede2`, ink `#49382c`, tiles with a
  label and caption, JPEG at quality 94). The contact sheet copies its manner.
- D `models/biscuit/poses/{standing,sitting,lying,paw-raised}.json`: the key poses.
- P02's `blender/clips/idle_stand.py` and `blender/build_clips.py`: the shape every clip
  script follows (`NAME`, `build(rig, start)`), and how a script is discovered.
- CONVENTIONS.md §4.1 (the rules and the table, which this ticket implements line by
  line), §4.3 (`stride`), §3 (the stills), §5.4 (what the runtime layers on top, so the
  clips do not duplicate it), §10 (the maintainer's eye is a gate), §12 (the walk risk).

**Authorisation.** Blender runs locally; nothing pushes or leaves the machine. The
maintainer's approval of each contact sheet is a gate the agent stops at (§10); it is not
a separately authorised action in the pushing sense, but the agent does not mark a clip
done without it. Pushing and the pull request are separately authorised.

## Goal

- Nine scripts under `blender/clips/`, each obeying §4.1's rules, with the durations,
  kinds and readings of §4.1's table, and `walk.py` exporting `STRIDE`.
- `scripts/contact_sheet.py` rendering any clip to `ai_tmp/clips/<name>.jpg` and any
  still to `src/lib/assets/stills/<activity>.<phase>.webp`.
- One contact sheet per clip approved by the maintainer, the approval recorded.
- `src/lib/assets/biscuit.glb` rebuilt with all ten clips, `biscuit.clips.json` listing
  them with `walk`'s `stride`, the eighteen stills built and listed, `just check-assets`
  green within every budget.

## Non-goals

- The v1.1 clips (`yawn`, `stretch`, `circle`, `treat`, `look`): §1 decision 15. Their
  file names are reserved in Open points and nothing else.
- Facial animation, eyelids, a face break: the rig has none (`PRD.md`, "Her face").
- Playing a clip in the browser, crossfades, root motion, the walk's speed: P07b. This
  ticket only makes the runtime's inputs.
- Changing `blender/build_clips.py`, `blender/export_animated_glb.py` or the committed
  `.blend`. A change needed in the first two is a hand-back to P02's follow-up; the third
  is never modified (§4.1).
- Rendering the stills inside the room: the room is not in the `.blend`. See Open points.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `blender/clips/idle_stand.py` | repo | P02 follow-up | planted paws during the weight shift |
| `blender/clips/idle_sit.py` | repo | Step 2 | new |
| `blender/clips/walk.py` | repo | Step 3 | new; exports `STRIDE` |
| `blender/clips/sit.py` | repo | Step 4 | new |
| `blender/clips/lie.py` | repo | Step 4 | new |
| `blender/clips/sleep.py` | repo | Step 5 | new |
| `blender/clips/drink.py` | repo | Step 6 | new |
| `blender/clips/eat.py` | repo | Step 6 | new |
| `blender/clips/play.py` | repo | Step 7 | new |
| `blender/clips/pet.py` | repo | Step 7 | new |
| `blender/clips/_keys.py` | repo | Step 1 | new; the shared helpers |
| `scripts/contact_sheet.py` | repo | Step 8 | new |
| `scripts/check_model_asset.mjs` | repo | contact follow-up | served whole-sole contact regression |
| `src/lib/assets/biscuit.glb` | gen | `just assets-build biscuit` | replaced |
| `src/lib/assets/biscuit.clips.json` | gen | `just assets-build biscuit` | replaced; ten entries |
| `src/lib/assets/stills/<activity>.<phase>.webp` (18) | gen | Step 10 | new |
| `src/lib/assets/manifest.json` | gen | `just assets-manifest` | eighteen entries added; two updated |
| `tickets/P04-clips.md` | tickets | this file | `status: done` |

`ai_tmp/clips/*.jpg` are the contact sheets and are never committed.

## Steps

1. **Write `blender/clips/_keys.py`**, the helpers every clip imports (ruff-clean under
   §2.2's `blender/**` ignores): `preset(rig, name)` calling `pose_io.apply` with the
   preset JSON from `blender/poses/`; `key_all(rig, frame)` inserting a keyframe on every
   deform bone's location, rotation and scale; `key_bone(rig, bone, frame, rotation=None,
   location=None)` taking Euler degrees about the bone's local axes and converting to the
   bone's quaternion mode; `ik_on(rig, limb, side, frame)` and `ik_off(rig, frame,
   limb=None, side=None)` keyframing the `IK influence` property (`ik_off` with no limb
   keys all four paws to 0; every clip keys every paw on its own first and last frame,
   §4.1, so no key falls outside the strip and no action inherits another's value);
   `paw_target(rig, limb, side, frame, offset)` keyframing `CTRL.{limb}.paw.{S}`'s
   location as an offset from its rest position; `ease(fcurves)` setting every keyframe's
   interpolation to `BEZIER` with `AUTO_CLAMPED` handles; `strip(rig, action, name,
   start)` pushing the action onto a new NLA track named `name` and returning the frame
   after the strip. `finish` keeps torso easing but bakes paw counter-rotation from the
   evaluated lower leg so the complete sole stays level. Planted controls use the
   grounded footprints shared by adjacent clips; transitions lift repositioning feet.
   The module is imported by name from `blender/clips/`, so
   `build_clips.py`'s discovery must skip files starting with `_`; if P02's discovery does
   not, hand that back and name the scripts explicitly meanwhile.

2. **`idle.sit`** (120 frames, loop). `preset('sitting')`, `key_all` and grounded IK on
   all four paws at 0 and 120 (the loop rule, §4.1). Ears settle: `ear.2.L` and
   `ear.2.R` ±5° about their local X
   at frames 20 and 60, back at 100. One look aside: `neck` yaw +18° and `head` yaw +7°
   from frame 40 to 55, held to 70, back by 85. Nothing on the tail (the runtime sways it,
   §5.4).

3. **`walk`** (30 frames, loop; `STRIDE = 1.0`, a module-level constant with a comment
   that it is model units of ground travel per cycle and that the runtime multiplies it
   by its scale). `preset('standing')`, `ik_on` for all four paws at frames 0 and 30
   (influence 1 across the strip and no key outside it, §4.1, so the action's range is
   the loop's and frames 0 and 30 match). A lateral-sequence walk: paw
   phase offsets `hind.L` 0, `front.L` 0.25, `hind.R` 0.5, `front.R` 0.75 of the cycle.
   Each paw target, over its cycle: stance for 65% of the cycle, moving on the ground
   through `STRIDE × 0.65 = 0.65` units along model Y (forward is −Y, so the paw
   travels backward under the body while she moves forward); swing for 35%, lifting
   0.10 units at mid-swing and returning along a quintic curve that matches stance
   velocity at contact. Front target sweeps are centred 0.17 units toward +Y from
   their rest positions, beneath the shoulders. Keys every quarter actual frame plus
   exact landing/liftoff boundaries; linear target travel cancels runtime movement
   over the actual 29-frame interval. Paws have a small toe rotation only in flight;
   their complete soles remain level throughout stance. `root` bobs on its local Y
   (world Z) by ±0.01 about a −0.045 offset at twice the cycle frequency; `root`'s
   local X and Z never move (authored in place, §4.1). `neck` steady; `tail.1` +10° up
   and held. `spine` yaw ±2° in counter-phase with the hind paws.

4. **`sit`** (30 frames, one-shot) and **`lie`** (36 frames, one-shot). `sit`:
   `preset('standing')` keyed at 0, `preset('sitting')` keyed at 30, `ease`; the head
   keys delayed 4 frames so it settles last. `lie`: `preset('sitting')` at 0,
   `preset('lying')` at 36, `neck` and `head` keys delayed 8 frames ("head coming down
   last", §4.1). Both are played in reverse by the runtime for standing up (§5.4), so
   nothing in them depends on direction. Grounded IK on all four paws at each endpoint
   preserves the reference torso poses while correcting sole penetration. Reposition
   the paws with 0.13-unit lifted steps; the same corrected sitting contacts are used by
   `sit`, `idle.sit` and `lie`, and lying contacts by `lie` and `sleep`.

5. **`sleep`** (180 frames, loop). `preset('lying')` and grounded IK on all four paws
   at 0 and 180. The head tucked: `neck` yaw −55° and pitch −20°, `head` pitch −15°,
   keyed at 0 and 180 (held,
   part of the pose), so the face turns down toward her left flank and away from any
   camera (`PRD.md`, "Her face"). A slow breath is the runtime's (§5.4); the clip adds
   only one settling: `ear.1.L` +6° from 60 to 120 and back.

6. **`drink`** and **`eat`** (60 frames each, loop). `preset('standing')`; `ik_on` on
   both front paws at 0 and 60 so they stay planted while the body dips, the hind paws
   `ik_off` at 0 and 60; `spine` pitch +8° and
   `chest` pitch +6° down from 0 to 12, held to 50, back by 60; `neck` pitch −45° and
   `head` pitch −25° over the same frames. `drink`: three lapping nods of `head` ±6° at
   frames 18, 26, 34, 42. `eat`: a chewing motion, `head` roll ±4° every 4 frames from
   16 to 44, and one glance up, `neck` pitch back +20° from 46 to 52 and down again by
   58.

7. **`play`** (90 frames, loop) and **`pet`** (60 frames, one-shot). `play`:
   `preset('standing')`, grounded IK on all four paws at 0 and 90; a shake, `neck` yaw
   ±32° at 6 Hz from frame 5 to 33 with `head` following at ±16° and `spine` countering
   at ±5°. A 0.03-unit pelvis crouch keeps the forelegs in reach during the shake. A
   bow at 43–50 pitches `spine` +13°, `chest` +10°, `neck` −42° and `head` −18°;
   a left paw reach lifts 0.4 and reaches forward 0.55, followed by a second smaller
   tap and a lifted return at 81. The paw returns by 84 and the torso by 86;
   endpoints match. Ear and tail
   follow-through accompany the three phases. `pet`: `preset('standing')`, `key_all`
   and `ik_off` at 0 and 60, so every bone the lean does not move is a constant channel
   (§4.1 makes the clip
   additive: `makeClipAdditive` turns a constant channel into an identity delta, and the
   runtime plays the lean over whatever clip is running, standing or sitting; an unkeyed
   bone would instead export whatever pose the armature held). A nuzzle turns `neck`
   by local Euler `(0, −12, −6)` degrees and `head` by `(0, −6, 8)` from 8 to 20;
   `tail.1` rises +25° over the same frames. These return by 48. `ear.1.L` and `ear.1.R`
   turn −12° back from 10 to 24, settling by 60. Pelvis, spine and all leg channels
   remain constant so additive playback over standing or sitting cannot drag the paws.

8. **Write `scripts/contact_sheet.py`.** Two modes. `contact_sheet.py <clip>` runs
   Blender (`"${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}" --background
   --python-exit-code 1 --python scripts/contact_sheet.py -- <clip>` from inside the
   script re-invoking itself when not running under `bpy`, so one command does both
   halves): opens `blender/out/biscuit-clips.blend`, finds the NLA strip named `<clip>`,
   frames the review camera as D `render.py` lines 43–52 do but on the union of the
   evaluated bounds over all twelve sampled frames (so the framing does not jump between
   tiles), renders twelve evenly spaced frames from the strip's first to its last at
   500×500 RGBA into `ai_tmp/clips/<clip>/`, then under Pillow tiles them four by three
   on a 2100 × 1700 sheet in `proof_sheet.py`'s manner (its ground, ink and `font()`;
   the clip name as the title, the frame number under each tile), saved as
   `ai_tmp/clips/<clip>.jpg` at quality 94. `contact_sheet.py --still <activity>
   <phase>`: opens the same `.blend`, applies the still's frame (`idle`: `idle.stand`
   frame 0; `sleep.bed` and `sleep.chair`: `sleep` frame 0; `drink`: `drink` frame 30;
   `eat`: `eat` frame 30; `play`: `play` frame 40), adds a ground plane in a neutral warm
   `#3a2418`, sets the world colour by phase (`morning` `#f2dcc0`, `evening` `#b8623a`,
   `night` `#1a1220`) and the key light's strength (1.45, 0.9, 0.5), frames a
   perspective camera at 1170×2532 with her in the lower third looking slightly down (a
   stand-in for `camera.hearth`; §5.2's camera is not in Blender), renders PNG, and
   encodes `src/lib/assets/stills/<activity>.<phase>.webp` with Pillow at quality 80,
   asserting the file is under 262,144 bytes and lowering quality in steps of 5 until it
   is. `pillow` is in the dev group (§2.2); the Pillow half runs under `uv run --frozen`.

9. **Build, sheet, and stop for approval, clip by clip.** `just model-clips`, then for
   each clip `uv run --frozen python scripts/contact_sheet.py <clip>`, then show the
   maintainer the sheet path and wait. Record the date and the verdict per clip in the
   hand-back notes. A refused clip is reworked and re-sheeted; the earlier sheet's
   findings are kept in the notes. The walk's original 1.6-unit stride was shortened to
   0.8, then revised to 1.0 with a higher stance and lower paw lift after the
   maintainer's gait review; stance is 65% and the head remains level. Review
   planted whole soles under matching runtime travel, including the exported asset.

10. **Export, build, stills.** `just model-export`; `just assets-build biscuit`; then the
    eighteen stills (`for a in idle sleep.bed sleep.chair drink eat play; do for p in
    morning evening night; do ...; done; done`); `just assets-manifest`; read the diff:
    ten clips in `biscuit.clips.json` with `walk`'s `stride` 1.0, `biscuit.glb` under
    6,291,456 bytes, eighteen new manifest entries with `source` `built:<today>`,
    `licence` `platform`, `budget` `262144`. `just check-assets` green.

11. **Prove the export carries what the runtime needs.** With P03's assertion script
    (or a copy under `ai_tmp/`): ten animations named exactly as §4.1, durations within a
    frame of the table (`walk` 1.0 s, `sit` 1.0, `lie` 1.2, `sleep` 6.0, `drink` 2.0,
    `eat` 2.0, `play` 3.0, `pet` 2.0, both idles 4.0; no clip's range runs past its last
    loop frame, so `walk` is 30 frames, not 31); morph-weight channels present in
    `sit`, `lie`, `walk`, `drink`, `eat` and `play` (the ones that move the corrective
    bones); no animation moves `root`'s X or Z (authored in place); the joined skin still
    has 33 joints.

12. **`just check`**, `status: done`, commit. Pushing and the pull request are
    authorised separately.

## Acceptance criteria

- [x] Ten scripts under `blender/clips/` (P02's plus nine), each with `NAME`, `build`,
      and, for `walk.py`, `STRIDE`; `just model-clips` runs them all without error.
- [x] Every loop clip's first and last frames are identical on every deform bone
      (asserted by a small check in `contact_sheet.py` that prints the maximum
      difference; expected 0).
- [x] No clip keys `root`'s local X or Z; `walk` keys `root`'s local Y only.
- [x] One approved contact sheet per clip, recorded with a date in the hand-back notes.
- [x] `biscuit.clips.json` lists ten clips with the §4.1 durations and `walk`'s
      `stride`; `biscuit.glb` is under 6,291,456 bytes.
- [x] Eighteen stills exist, each under 262,144 bytes, and `just check-assets` is green.
- [x] `just check` is green.

## Verification

```sh
ls blender/clips/
just model-clips
uv run --frozen python scripts/contact_sheet.py walk && ls -la ai_tmp/clips/
just model-export && just assets-build biscuit
node -e 'const t=require("./src/lib/assets/biscuit.clips.json");console.table(t.clips)'
ls -la src/lib/assets/stills/ | wc -l
just check-assets
just check
```

Expected: eleven files (ten clips and `_keys.py`); Blender reporting ten tracks and the
saved path; a sheet under `ai_tmp/clips/`; the export and the pipeline each printing their
summary; a table of ten clips; nineteen lines (eighteen stills and the total); green;
green.

## Hand-back notes

The ten scripts and their final contact sheets were built on 2026-09-25 with
Blender 5.2.1 LTS. The maintainer approved all ten clips on the same date with
"I approve", in response to the final review request for the revised walk and
all ten animations, including `idle.stand` as P02's proof. The approved moving
previews and their contact sheets are presented in `ai_tmp/asset-review.html`.

| Clip | Review sheet under `ai_tmp/clips/` | Samples | Export seconds | Approval |
| --- | --- | --- | --- | --- |
| `idle.stand` | `idle.stand.jpg` | 120 | 3.966667 | Approved 2026-09-25 |
| `idle.sit` | `idle.sit.jpg` | 120 | 3.966667 | Approved 2026-09-25 |
| `walk` | `walk.jpg` | 30 | 0.966667 | Approved 2026-09-25 |
| `sit` | `sit.jpg` | 30 | 0.966667 | Approved 2026-09-25 |
| `lie` | `lie.jpg` | 36 | 1.166667 | Approved 2026-09-25 |
| `sleep` | `sleep.jpg` | 180 | 5.966667 | Approved 2026-09-25 |
| `drink` | `drink.jpg` | 60 | 1.966667 | Approved 2026-09-25 |
| `eat` | `eat.jpg` | 60 | 1.966667 | Approved 2026-09-25 |
| `play` | `play.jpg` | 90 | 2.966667 | Approved 2026-09-25 |
| `pet` | `pet.jpg` | 60 | 1.966667 | Approved 2026-09-25 |

On 2026-09-25 the maintainer requested more activity in `play`: "biscuit play
could have more going on". Its first sheet is retained as
`ai_tmp/clips/play-before-review.jpg`. The revised 90-sample loop adds a stronger
head shake with spine counter-motion, ear and tail follow-through, a deeper
play bow, and a high forward paw reach followed by a second tap. Root translation
stays in place and the evaluated loop endpoints match within floating-point
precision. The approved revised sheet is `ai_tmp/clips/play.jpg`. The served
asset and three play stills were rebuilt from this revision before hand-back.

At the maintainer's request, all ten clips also have looping animated WebP
previews at `ai_tmp/clips/<name>-preview.webp`, displayed together in
`ai_tmp/asset-review.html`. One-shot clips repeat only for review. On 2026-09-25
the maintainer identified sliding feet and tilted front paws, naming `pet`, `walk`,
`eat`, `drink` and `idle.stand`, then requested fixes and a check of every clip.
The refreshed previews show a neutral ground grid; walk includes runtime travel
with a following camera. Approval was withheld at that review.

The next review on 2026-09-25 rejected the walk's overall motion as unnatural,
especially the hind-leg bend. The maintainer requested a miniature-poodle walk
and explicitly permitted hind-leg proportion changes if useful. The resulting
gait revision described below received the final approval recorded above.

The first contact-corrected walk used the shorter-stride fallback: `STRIDE = 0.8` model units,
65% stance, and a steady neck. The initial 1.6-unit cycle showed excessive reach
and a triangular sweater deformation; its sheet remains at
`ai_tmp/clips/walk-stride1.6.jpg` for comparison. Shortening the stride alone did
not fix the deformation. The native optional IK poles caused axial shoulder
twist; keying the existing bend controls laterally restored the limb bend plane.
The same correction applies to the planted front paws in `drink`, `eat` and
`play`. No source bone, constraint, mesh, shape key or skin weight was edited.
Walk target heights also compensate for their inherited root bob so the stance
targets stay grounded. Agent review checked the final sheets for that deformation
before the maintainer's final visual approval.

That revision's stance excursion was `STRIDE × STANCE = 0.52`, correcting the original
step 3's full-stride excursion during stance: that wording would move planted paws
1/0.65 times faster than the runtime speed in CONVENTIONS.md §4.3 and §5.1.
Landing and liftoff have explicit keys. Linear target translation and matching
root compensation preserve footprints between keys over the actual 29-frame
interval. A 0.08-unit downward body offset kept the native front-leg IK in
reach, while retaining its ±0.03 bob. The previous sheet is retained as
`ai_tmp/clips/walk-before-stride-fix.jpg`. With runtime travel simulated at
`0.8 / (29/30) = 0.827586207` model units/second, 101 native samples per paw
measured at most 0.000368 whole-sole drift after the contact correction below.
`just model-check-clips` checks evaluated heel, toe and side markers on the sole,
including simulated runtime translation, and permits at most 0.001 model units
of drift or distance from the ground during each planted interval. The original
full-stride stance is retained as an unsaved regression mutation in
`ai_tmp/prove_walk_regression.py`. The walk animation preview is
`ai_tmp/clips/walk-preview.webp` (30 frames over 967 milliseconds).

The gait follow-up centres the front paw sweep beneath the shoulders, allowing
a higher torso with only 0.045 units of downward offset and ±0.01 bob. Stride is
now 1.0 and swing lift 0.10; a smooth return curve and mild toe rotation in flight
replace the stiff return. Quarter-frame target samples retain exact contacts.
The native hind knee's internal angle at the sampled swing peak opens from about
65° to 82°, reducing the folded appearance. Local Biscuit side and rear photographs
in D's `biscuit_pics/raw/full/miami/` informed the silhouette review; their elevated
camera angles do not support precise bone-length measurements. Bone proportions,
rest poses and weights remain unchanged. The moving side comparison is
`ai_tmp/clips/walk-side-before-preview.webp` beside `walk-side-preview.webp` in
the review gallery, alongside the updated three-quarter view and contact sheet.
The revised walk's actual Paw geometry was checked at 401 times: maximum numerical
floor penetration is 0.0000563 model units. The maintainer approved this revision
with the other nine animations on 2026-09-25.

The maintainer's foot-contact review exposed two separate native defects:
optional IK pins the ankle but lets the sole inherit the lower-leg rotation,
and FK body motion drags unpinned paws. The shared helper now bakes level paw
rotations at quarter-frame intervals and control-key boundaries. `idle.stand`
uses planted IK and a 0.012-unit pelvis relaxation during its ±1.5° weight shift;
`play` uses a 0.03-unit relaxation during its shake. `pet` moves only neck, head,
tail and ears, preserving identity additive leg channels. Sitting and lying
retain their source torso poses with clip-level grounded limb corrections and
staggered lifted steps, replacing the original dragging interpolation. Copied
pose JSON, native model, bones, constraints, meshes and weights remain unchanged.
Earlier sheets, previews and the derived blend are retained under
`ai_tmp/clips/before-foot-contact/`.

All ten clips pass the native whole-sole check. Maximum planted drift is 0.000831
for `sit`, 0.000161 for the revised `walk`, 0.000259 for `play`, 0.0000640 for `drink` and
`eat`, 0.0000279 for `idle.stand`, 0.0000197 for `lie`, below 0.0000003 for the
resting loops, and zero for `pet`. `ai_tmp/prove_sole_regression.py` disables only
paw counter-rotation in memory: the unchanged pinned ankle still appears correct,
but the whole-sole check rejects 0.09284 units of drift and ground error. It never
saves the mutation. The served-asset check independently evaluates sole markers
through real Three.js playback after export and compression.

The native verifier also checks floor clearance across each entire clip, including
lifted paws. Linear control travel and a lifted return prevent `play`'s local-axis
Bezier interpolation from dipping below the floor after the second tap. An actual
evaluated Paw-mesh audit at 101 times per clip (`ai_tmp/check_all_paw_clearance.py`)
finds at most 0.000165 model units of numerical penetration across all ten clips.

`just model-sheets` also runs native verification. All seven loops have maximum
evaluated deform-matrix endpoint difference below `0.00000036`. The verifier checks
every paw's explicit IK influence at both endpoints, rejects keys outside strips
and root X/Z translation channels, and requires `pet` channels outside its five
lean bones to remain constant. P02's discovery already skips `_keys.py`.
`just python-check blender/clips scripts/contact_sheet.py` passes.

Durations use P02's N-sample convention: frame zero through N−1 at 30 fps, so each
GLB duration is one frame shorter than the table's rounded seconds. `sit` remains
30 samples and `lie` remains 36; no P06 transition-length change is needed. The
raw export has exactly the ten names above, one skin with 33 ordered deform
joints, and morph-weight channels in every clip. Driven correctives are active
in `sit`, `lie`, `walk`, `drink`, `eat` and `play`, as required.

P02's export follow-up preserves fractional contact frames through temporary
600 Hz sampling. The final compressed asset passes the same planted-span checks
for all ten clips, plus whole-motion floor clearance, through Three.js. Maximum
served sole drift is 0.000986281 model units, below the unchanged 0.003 limit.
The authored blend remains at 30 fps and every clip duration stays unchanged.

The served `biscuit.glb` is 2,525,000 bytes with 86,828 triangles, 14 primitives
and an estimated 28 draw calls. The asset checker loads it through real Three.js
playback and verifies the exact clip set, durations, root channels, 33-joint skin
and five sweater morphs. The table reports bind height `3.11312993250124` and
walk stride `1.0`.

The still renderer uses the six specified activity frames, three phase world
colours and absolute key-light energies 1.45, 0.9 and 0.5. It preserves the native
fill light. All eighteen final stills were regenerated after the IK correction
at 1170 × 2532, WebP quality 80; no quality reduction was needed. The largest is
`idle.morning.webp`, 17,106 bytes, below the 262,144-byte budget. Manifest
verification passes for the twenty character files and P05's cabin. The final
`just check` passed on 2026-09-25: 37 unit tests, three Storybook tests and every
other gate passed; the checks left the worktree unchanged.

The ticket was kept together rather than split. The stills use the specified
neutral ground; runtime capture and a possible sweater-off variant remain the
maintainer decisions described below. No v1.1 clip files were added.

## Open points

- **Split.** This ticket is XL and separable, as the studio's C03 was: P04a (`idle.sit`,
  `walk`, `sit`, `lie`, `sleep`, and `_keys.py` and `contact_sheet.py`'s clip mode) and
  P04b (`drink`, `eat`, `play`, `pet`, the still mode and the eighteen stills). Recommend
  splitting on pickup with P04a's branch merged first, because P07b depends on P04a's
  locomotion and P08's still mode on P04b's stills; the executing agent writes P04b as a
  ticket if it does.
- **Stills from the runtime.** The stills here are rendered on a neutral ground because
  the room is not in Blender. Once P07a draws the room, stills captured from the runtime
  at the hearth camera would match what the player sees; whether P07a or P11 re-renders
  them is the maintainer's call. Recommend: P11, after the look is approved, with the
  same file names so nothing else changes.
- **Reserved names.** `blender/clips/yawn.py`, `stretch.py`, `circle.py`, `treat.py`,
  `look.py` are v1.1's and are not created here.
- **Sweater off at night.** `PRD.md` leaves it open; if the maintainer decides yes, the
  exporter needs a second, undressed export or a visibility toggle in the runtime, and
  that is a P02 follow-up, not a clip.
