---
id: P04
title: "Clips, the core set: nine more scripted clips, contact sheets, the maintainer's approval, the stills"
status: open
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
approved poses. The rig (D `models/biscuit/model/rig.json`; `blender/rig.json` is the
byte-identical copy): 33 deform bones — `root`, `pelvis`, `spine`, `chest`, `neck`,
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
| `src/lib/assets/biscuit.glb` | gen | `just assets-build` | replaced |
| `src/lib/assets/biscuit.clips.json` | gen | `just assets-build` | replaced; ten entries |
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
   bone's quaternion mode; `ik_on(rig, limb, side, frame)` and `ik_off(...)` keyframing
   the `IK influence` property; `paw_target(rig, limb, side, frame, offset)` keyframing
   `CTRL.{limb}.paw.{S}`'s location as an offset from its rest position; `ease(fcurves)`
   setting every keyframe's interpolation to `BEZIER` with `AUTO_CLAMPED` handles;
   `strip(rig, action, name, start)` pushing the action onto a new NLA track named `name`
   and returning the frame after the strip. The module is imported by name from
   `blender/clips/`, so `build_clips.py`'s discovery must skip files starting with `_`; if
   P02's discovery does not, hand that back and name the scripts explicitly meanwhile.

2. **`idle.sit`** (120 frames, loop). `preset('sitting')`, `key_all` at 0 and 120 (the
   loop rule, §4.1). Ears settle: `ear.2.L` and `ear.2.R` ±5° about their local X at
   frames 20 and 60, back at 100. One look aside: `neck` yaw +18° and `head` yaw +7°
   from frame 40 to 55, held to 70, back by 85. Nothing on the tail (the runtime sways
   it, §5.4).

3. **`walk`** (30 frames, loop; `STRIDE = 1.6`, a module-level constant with a comment
   that it is model units of ground travel per cycle and that the runtime multiplies it
   by its scale). `preset('standing')`, `ik_on` for all four paws at frame 0 with
   influence 1 across the strip and a final `ik_off` key at frame 31, outside the loop
   (§4.1: "sets influence back to 0 on its last frame", read as the first frame after
   the loop so the loop's frames 0 and 30 still match). A lateral-sequence walk: paw
   phase offsets `hind.L` 0, `front.L` 0.25, `hind.R` 0.5, `front.R` 0.75 of the cycle.
   Each paw target, over its cycle: stance for 60% of the cycle, moving on the ground from
   `−STRIDE/2` to `+STRIDE/2` along local Y (forward is −Y, so the paw travels backward
   under the body while she moves forward); swing for 40%, lifting 0.18 units at
   mid-swing and returning to `−STRIDE/2`. Keys every 3 frames on the targets, eased.
   `root` bobs on its local Y (world Z) by ±0.03 at twice the cycle frequency; `root`'s
   local X and Z never move (authored in place, §4.1). `neck` steady; `tail.1` +10° up
   and held. `spine` yaw ±3° in counter-phase with the hind paws.

4. **`sit`** (30 frames, one-shot) and **`lie`** (36 frames, one-shot). `sit`:
   `preset('standing')` keyed at 0, `preset('sitting')` keyed at 30, `ease`; the head
   keys delayed 4 frames so it settles last. `lie`: `preset('sitting')` at 0,
   `preset('lying')` at 36, `neck` and `head` keys delayed 8 frames ("head coming down
   last", §4.1). Both are played in reverse by the runtime for standing up (§5.4), so
   nothing in them depends on direction.

5. **`sleep`** (180 frames, loop). `preset('lying')` at 0 and 180. The head tucked: `neck`
   yaw −55° and pitch −20°, `head` pitch −15°, keyed at 0 and 180 (held, part of the
   pose), so the face turns down toward her left flank and away from any camera
   (`PRD.md`, "Her face"). A slow breath is the runtime's (§5.4); the clip adds only one
   settling: `ear.1.L` +6° from 60 to 120 and back.

6. **`drink`** and **`eat`** (60 frames each, loop). `preset('standing')`; `ik_on` on
   both front paws so they stay planted while the body dips; `spine` pitch +8° and
   `chest` pitch +6° down from 0 to 12, held to 50, back by 60; `neck` pitch −45° and
   `head` pitch −25° over the same frames. `drink`: three lapping nods of `head` ±6° at
   frames 18, 26, 34, 42. `eat`: a chewing motion, `head` roll ±4° every 4 frames from
   16 to 44, and one glance up, `neck` pitch back +20° from 46 to 52 and down again by
   58. `ik_off` at 61.

7. **`play`** (90 frames, loop) and **`pet`** (60 frames, one-shot). `play`:
   `preset('standing')`, `ik_on` front paws; a shake, `neck` yaw ±20° at 6 Hz from frame
   6 to 30 with `head` following at ±10°; a drop, `neck` pitch −35° from 34 to 44, held to
   50, back by 58; a paw, `paw_target('front','L',...)` lifting 0.25 and forward 0.3 from
   62 to 70, down at 78; back to the preset by 90; `ik_off` at 91. `pet`:
   `preset('sitting')` at 0; a lean, `pelvis` roll +5° and `spine` roll +3° from 8 to 20,
   `tail.1` +25° up over the same frames, `ear.1.L` and `ear.1.R` −12° back from 10 to
   24; settle: everything back by 60, ears last.

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
   findings are kept in the notes. The walk is the one most likely to be refused (§12):
   if it reads as sliding or as a trot, halve `STRIDE`, lengthen the stance to 65%, and
   keep the head level before anything else.

10. **Export, build, stills.** `just model-export`; `just assets-build`; then the
    eighteen stills (`for a in idle sleep.bed sleep.chair drink eat play; do for p in
    morning evening night; do ...; done; done`); `just assets-manifest`; read the diff:
    ten clips in `biscuit.clips.json` with `walk`'s `stride` 1.6, `biscuit.glb` under
    6,291,456 bytes, eighteen new manifest entries with `source` `built:<today>`,
    `licence` `platform`, `budget` `262144`. `just check-assets` green.

11. **Prove the export carries what the runtime needs.** With P03's assertion script
    (or a copy under `ai_tmp/`): ten animations named exactly as §4.1, durations within a
    frame of the table (`walk` 1.0 s, `sit` 1.0, `lie` 1.2, `sleep` 6.0, `drink` 2.0,
    `eat` 2.0, `play` 3.0, `pet` 2.0, both idles 4.0); morph-weight channels present in
    `sit`, `lie`, `walk`, `drink`, `eat` and `play` (the ones that move the corrective
    bones); no animation moves `root`'s X or Z (authored in place); the joined skin still
    has 33 joints.

12. **`just check`**, `status: done`, commit. Pushing and the pull request are
    authorised separately.

## Acceptance criteria

- [ ] Ten scripts under `blender/clips/` (P02's plus nine), each with `NAME`, `build`,
      and, for `walk.py`, `STRIDE`; `just model-clips` runs them all without error.
- [ ] Every loop clip's first and last frames are identical on every deform bone
      (asserted by a small check in `contact_sheet.py` that prints the maximum
      difference; expected 0).
- [ ] No clip keys `root`'s local X or Z; `walk` keys `root`'s local Y only.
- [ ] One approved contact sheet per clip, recorded with a date in the hand-back notes.
- [ ] `biscuit.clips.json` lists ten clips with the §4.1 durations and `walk`'s
      `stride`; `biscuit.glb` is under 6,291,456 bytes.
- [ ] Eighteen stills exist, each under 262,144 bytes, and `just check-assets` is green.
- [ ] `just check` is green.

## Verification

```sh
ls blender/clips/
just model-clips
uv run --frozen python scripts/contact_sheet.py walk && ls -la ai_tmp/clips/
just model-export && just assets-build
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

Filled in by the agent that executes this ticket.

- Per clip: the sheet path, the date the maintainer approved it, and what was reworked.
- `STRIDE`'s final value and why, if it moved from 1.6.
- The durations and morph-channel presence from Step 11.
- The final bytes of `biscuit.glb` and of the largest still, and any quality step taken.
- Whether `build_clips.py` skipped `_keys.py` on its own (Step 1).
- Which open points below were settled.

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
