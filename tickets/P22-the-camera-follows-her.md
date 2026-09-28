---
id: P22
title: "The camera follows her: zones, a covering set of presets, and Auto in Settings"
status: open
depends_on: [P19, P21]
parallel_with: [P12, P13, P16, P17, P18]
branch: ticket/p22-the-camera-follows-her
estimated_size: L
---

# P22: The camera follows her: zones, a covering set of presets, and Auto in Settings

## Context

The camera is a manual choice among three presets. `src/lib/domain/director.ts` types
`Camera` as `hearth | window | chair`, keeps `camera` in `SceneState` and sets it only
through `setCamera`; the page persists the choice under `pawlour.camera` and reads it
back on opening; `src/lib/components/CameraControl.svelte` lists the three;
`src/routes/scene/cabin.ts` `CAMERA_NAMES` lists them again. The runtime places the
camera at `cabin.cameras[state.camera]` on every `apply` (`src/routes/scene/scene.ts`,
`camera.ts`), and `camera` is a redraw trigger (`src/lib/drawn.ts`); neither
`sentence.ts` nor `cues.ts` reads it, so a cut is silent.

Her position during a walk is known only to `src/routes/scene/walk.ts`: `pathTo` does
a breadth-first search over `nav.*` and returns bare points, `update` advances an index
through them, and `motion.ts` reports one `arrived` at the end; nothing reports the
waypoints she passes. With motion off, `step` resolves a walk instantly through
`arrive()` and the still is redrawn once per drawn field.

The asset: `blender/cabin/layout.py` authors the presets as `(position, target, fov)`;
`blender/cabin/build.py` renders a review PNG per preset into `ai_tmp/cabin/` on
`just cabin-export`; `scripts/check_cabin.py` holds an independent table of positions,
facings and fields of view (`CONVENTIONS.md` §5.2; `docs/design/the-room.md` "What
checks what"). The three walls are the logs at z = −2 and x = ±2.5 and the plane at
y = 2.405 (`blender/cabin/props.py`); the +Z side is open and the cameras sit there.
The bowls are `item.water` (−2.15, 0, 0.60) and `item.food` (−2.15, 0, 1.00), both
approached from x = −1.70 facing the left wall, nearest waypoint `nav.3`; no preset
looks at them.

The specs exclude camera positions as "assets, not behaviour" (`docs/specs/cabin.allium`,
Excludes). A camera that follows her is behaviour the player sees, so the spec moves
first (`AGENTS.md` invariant 1; the `spec-change` skill).

Decisions the maintainer took on 2026-09-27: the room is divided into zones, each owned
by a preset, and the picture cuts to a zone's preset as she walks into it, so she is in
frame before and after; it never cuts while she is still, and never pans. From the
preset in use she is in frame with nothing between her and the eye, walls and props
alike, and presets sit inside the walls so no wall can intervene. The presets are a
covering set derived from the zones, with `hearth`, `window`, `chair` and a new `bowls`
as the floor; the maintainer approves each new preset's framing by screenshot. In
Settings, `Auto` is a new first segment and the default; a named preset pins the camera
until Auto is chosen again, and while pinned she may walk out of frame.

P21 lands first: the bigger box, the landscape layout, and `frameCamera(camera, preset,
size, framed)`, which fits the points it is given by the least retreat along the
authored axis, from a per-preset table in `camera.ts` that this ticket replaces with
its zones. P21's four test sizes are what this ticket measures at. P19 is open and
edits `blender/cabin/*.py`, `scripts/check_cabin.py` and rebuilds `cabin.glb`, the same
files as this ticket, so this ticket waits for it (`CONVENTIONS.md` §10). P14 lists
`stories/SceneCanvas.stories.svelte` and P15 lists `docs/explanation/the-director.md`
and `tests/director.test.ts`, which this ticket edits, so neither runs beside it;
whichever merges second re-applies its hunk and says so. `src/lib/assets/manifest.json`
is the shared file §10 already provides for: re-run `just assets-manifest` on the
merged tree.

Read first: `docs/specs/cabin.allium` (the guarantee register under `surface Cabin`);
`src/lib/domain/director.ts` (`phase` beside `phaseOverride`, `arrive`, `still`,
`arrived`); `src/routes/scene/walk.ts`, `motion.ts`, `scene.ts` (`SceneOptions`,
`onArrived`), `SceneCanvas.svelte`; `src/routes/+page.svelte` (`chooseCamera`, the
stored-value guard, `time` derived beside `phase`); `src/lib/components/TimeControl.svelte`
(the Auto pattern and its four-segment padding); `tests/director.test.ts`,
`tests/route.test.ts`, `tests/scene-motion.test.ts`, `tests/scene-assets.test.ts`;
`blender/cabin/layout.py`, `scripts/check_cabin.py`, `scripts/stub_cabin.mjs`;
`docs/design/the-room.md`; `docs/explanation/the-director.md`; P21's hand-back notes.

## Goal

- `cabin.allium` gains `@guarantee TheCameraFollowsHerUntilPinned` under `surface Cabin`
  and its Excludes sentence says that where a position is and what it frames is an
  asset while which position is in use is behaviour; `just check-specs` and
  `just analyse-specs` clean.
- A pure module `src/lib/domain/zones.ts`: `CAMERAS` (the preset names, `hearth`,
  `window`, `chair`, `bowls` and any the map needs), `Camera`, `ZONES` (preset → the
  `nav.*`, `item.*.approach` and `spot.*` node names it owns, each named exactly once)
  and `zoneOf(node)`. Tested to the floor.
- The director keeps `camera` as the preset shown and adds `cameraOverride?: Camera`
  as the pin, mirroring `phase` and `phaseOverride`. When nothing is pinned, `camera`
  follows her: on a new `reached` command carrying the node she has just passed, on
  arrival, and when Auto is chosen. `setCamera` takes `Camera | 'auto'`. A `tick`
  never changes it. With motion off, `still()` arrives at once and the camera is the
  destination's zone.
- The walker reports every point it passes by name; the scene carries it up as
  `onReached` beside `onArrived`; the page dispatches `{ kind: 'reached', node }`.
- `cabin.glb` carries `camera.bowls` and whatever the zone map needs; every `camera.*`
  lies inside the three walls (|x| < 2.5, z > −2, 0 < y < 2.4; the +Z side is open),
  and `scripts/check_cabin.py` refuses one that does not, with a self-test case.
- `framedFor(cabin, name)` reads the zone: the frame set of a preset is every node in
  its zone and every node one edge beyond it, so P21's fit keeps her in frame along
  every segment she walks before a cut; P21's per-preset table goes.
- `tests/scene-assets.test.ts` proves on the real room that the zone map names every
  reachable node exactly once; that from every preset, framed at P21's four sizes,
  every node in its zone and one edge beyond it is inside the frustum at the floor and
  at 0.55 up; that the framed camera has not retreated behind a wall or above the
  plane; and that a ray from the framed camera's position to every reachable node at
  0.55 up hits no mesh under the cabin root.
- `CameraControl` offers Auto first and one segment per preset; Auto is the default;
  choosing Auto removes `pawlour.camera`; a stored name that is not a preset falls
  back to Auto.
- The docs, `PRD.md` and `CONVENTIONS.md` say the new thing where they say "three
  presets" and "the control moves between them".
- The maintainer approves every new or moved preset's PNG before the ticket is done.

## Non-goals

- Pans, dollies, orbit or scene zoom: `CONVENTIONS.md` §1 decision 6 keeps "cut, never
  panned".
- Per-wall fading or cut-away walls: presets sit inside the room instead.
- A swipe or edge tap to change camera (`PRD.md`, still v1.1).
- Announcing a cut: the hidden sentence and the cues do not read `camera`.
- Any change to P21's fit in `frameCamera` beyond swapping its per-preset table for the
  zones.
- New stills: `stillFor` keys on activity and phase; P18's wording is an open point.
- `extras.zone` in the asset: the checker keeps an independent table by design and the
  director cannot read the glb, so the map lives in TypeScript and the test holds it
  to the real room.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `docs/specs/cabin.allium` | spec | the tenth guarantee; the Includes count; the Excludes sentence |
| `src/lib/domain/zones.ts`, `tests/zones.test.ts` | repo, new | the table and `zoneOf` |
| `src/lib/domain/director.ts`, `tests/director.test.ts` | repo | `Camera` from `zones.ts`; `cameraOverride`; `setCamera(Camera \| 'auto')`; `reached`; the follow on arrival |
| `src/routes/scene/walk.ts`, `motion.ts`, `scene.ts`, `SceneCanvas.svelte`, `cabin.ts`, `camera.ts` | repo | named path points; `onReached` threaded; `CAMERA_NAMES` from `zones.ts`; `framedFor` reads the zones and P21's table goes |
| `src/routes/+page.svelte` | repo | `onReached` dispatch; Auto clears the key; the guard reads `CAMERAS`; `cameraChoice` derived beside `time` |
| `src/lib/components/CameraControl.svelte`, `SettingsDialog.svelte` | repo | `Camera \| 'auto'`; Auto first; labels as `Record<Camera, string>`; the four-plus-segment padding as `TimeControl` |
| `tests/camera-control.test.ts`, `tests/settings-dialog.test.ts`, `tests/route.test.ts`, `tests/scene-motion.test.ts`, `tests/scene-canvas.test.ts`, `tests/scene-assets.test.ts` | tests | Auto and the fallback; queries scoped by group (two radios are now named Auto); waypoint order; zone coverage, frustum and raycast |
| `stories/CameraControl.stories.svelte`, `stories/SceneCanvas.stories.svelte` | stories | an Auto story; `onReached` |
| `blender/cabin/layout.py`, `scripts/check_cabin.py`, `scripts/stub_cabin.mjs` | repo | `bowls` and any preset the map needs; the inside-the-walls check and its self-test case; the stub's cameras from `CAMERA_NAMES` |
| `src/lib/assets/cabin.glb`, `src/lib/assets/manifest.json` | repo | rebuilt; `source` `built:<date>` |
| `docs/design/the-room.md`, `docs/explanation/rendering.md`, `docs/explanation/the-director.md`, `docs/project/purpose-and-scope.md` | docs | the presets row and fields of view; the checker row; the follow and the pin; "cuts between" in place of "the player cuts between in Settings" |
| `tickets/PRD.md`, `tickets/CONVENTIONS.md` | tickets | "The room"; §1 decision 6, §5.2 camera row, §5.4, §6.1 (`setCamera`, `reached`, `cameraOverride`), §7 `CameraControl`; each "(corrected by P22)" |
| `tickets/P22-the-camera-follows-her.md` | tickets | `status: done` |

Coverage: `zones.ts` and the director changes are under `src/lib/**` at the 90 floor;
the scene files are outside the glob (decision 0013) and are proved by
`tests/scene-motion.test.ts` and `tests/scene-assets.test.ts` on the real assets.

## Steps

1. **Spec first** (`spec-change` skill). Under `surface Cabin`, after
   `MotionOffIsAStillDiorama`, add, in the register of the guarantees around it:

   ```text
   @guarantee TheCameraFollowsHerUntilPinned
       -- The room is seen from one of a few fixed positions, and the picture
       -- moves between them only by a cut, never by a pan. Until the player
       -- pins one, the room is divided among them: every place she can stand
       -- belongs to one position, and the picture cuts to it as she walks
       -- into its part of the room, so she is in frame before the cut and
       -- after it. The picture never cuts of its own accord while she is
       -- still; only the player's choice moves it then. From the
       -- position in use she is in frame, with nothing between her and the
       -- eye, at every place its part of the room reaches and every place
       -- one step beyond it. A position the player pins holds, in this visit
       -- and the ones after it, until the player hands the choice back;
       -- while it holds she may walk out of frame, and the room says nothing
       -- about it. While motion is off there is no walk to cut during: the
       -- still is drawn from the position her destination belongs to.
   ```

   Amend the Includes count (nine → ten) and the Excludes sentence. `tests/restated.ts`
   is untouched (platform clauses only). `just check-specs`, `just analyse-specs`.
2. **The zone module, red.** `tests/zones.test.ts`: `CAMERAS` begins
   `hearth, window, chair, bowls`; every node in `ZONES` appears exactly once across
   presets; `zoneOf('nav.0')` is `hearth` (the opening camera, and she opens at
   `nav.0`); `zoneOf('nowhere')` is `undefined`. Green with a starting map the visibility
   test then tunes, for example `hearth`: `nav.0`, `nav.1`, `nav.5`, `nav.7`,
   `item.bed.approach`, `spot.bed`, `item.lights.approach`, `item.jar.approach`;
   `bowls`: `nav.3`, `item.water.approach`, `item.food.approach`; `window`: `nav.2`,
   `nav.4`, `nav.6`, `item.chair.approach`, `item.lamp.approach`, `item.toy.approach`;
   `chair`: `spot.chair`. `director.ts` re-exports `Camera`; `cabin.ts` imports
   `CAMERAS`.
3. **The director, red.** Cases: `reached nav.3` while walking in Auto sets `bowls`;
   the same with `cameraOverride` set returns the state unchanged; `reached` when not
   walking, or with an unknown node, changes nothing; `arrived` at
   `item.water.approach` sets `bowls`; motion off, `tap('water')` from the opening state
   yields `bowls` in one `step`; `setCamera('auto')` while idle at the bed sets `hearth`
   and clears the pin; `setCamera('chair')` sets both; a `tick` never changes `camera`.
   Green: one helper `follow(state, node)` used by `arrive()`, `reached` and
   `setCamera('auto')` (which follows `nav.0` on the floor, else the activity's spot).
4. **The walker, red.** `tests/scene-motion.test.ts`: a walk from the opening position
   to `item.water.approach` reports `nav.0`, `nav.3`, `item.water.approach` in order
   through `onReached`, then one `arrived`. Green: `pathTo` returns named points;
   `createWalk` takes `onReached` and calls it at both advances; `createMotion`,
   `createScene`, `SceneCanvas`, the page and the two fixtures thread it. A `reached`
   dispatched from the frame loop reaches `scene.apply` through the page's effect, and
   `motion.ts` re-plans only when `target.spot` changes, so the walk is undisturbed.
5. **The checker and the asset, red.** `scripts/check_cabin.py` gains a check that every
   `camera.*` world position has |x| < 2.5, z > −2 and 0 < y < 2.4, and a self-test
   case placing `camera.hearth` behind the hearth wall; `POSITIONS` and `CAMERAS` gain
   `bowls`. `just check-cabin` on the committed file must refuse the missing `bowls`.
   Green: `layout.py` gains `bowls` (a starting point: position (0.5, 1.10, 1.30),
   target (−1.9, 0.4, 0.8), 40°) and any preset the map needs; `scripts/stub_cabin.mjs`
   iterates `CAMERA_NAMES`; `just cabin-export`, `just check-cabin
   blender/out/cabin-raw.glb`, `just assets-build cabin`, read the manifest diff.
   Empties add no triangles or primitives, so the cabin budget is untouched.
6. **The visibility tests, red then tuned.** Replace P21's per-preset table with
   `framedFor` reading `ZONES` plus one edge (a `nav` edge from `cabin.nav`, an
   approach's `extras.nav`, a spot's nearest waypoint as `walk.ts` picks it). In
   `tests/scene-assets.test.ts`, on the real room: coverage (the names in `ZONES` equal
   every `nav.*`, every `item.*.approach` and both `spot.*`, each once); frustum (for
   each preset, `frameCamera` at P21's four sizes, then a `Frustum` from the projection
   and inverse world matrices must contain every node in the zone and one edge beyond
   it, at the floor and at 0.55 up; convexity then covers every segment she walks
   before a cut); placement (the framed camera's position has |x| < 2.5, z > −2 and
   0 < y < 2.4, so a retreat never carries it behind a wall); raycast (from the framed
   camera's position to every `nav.*` and `item.*.approach` node at 0.3 and at 0.55 up,
   so a rim or an arm at knee height cannot hide her body, and to the two `spot.*`
   nodes at 0.55 up only, because she is on the furniture there and a ray to the seat
   would graze the cushion; `intersectObject(cabin.root, true)` returns nothing; the
   cabin root holds only `cabin.*` meshes). Expect `chair` at 36° to retreat past its close crop to hold
   `nav.2`; resolve as open point 1 says. Tune `ZONES` and `layout.py` until green,
   re-exporting as in step 5.
7. **The control, red.** `tests/camera-control.test.ts`: the group offers Auto, Hearth,
   Window, Chair, Bowls; Auto checked for `auto`; reports by value.
   `tests/route.test.ts`: nothing stored → Auto; a stored `chair` pins Chair; a stored
   nonsense value → Auto; choosing Auto removes `pawlour.camera`; every Auto query
   scoped to its group. Green: `CameraControl` builds `OPTIONS` from `CAMERAS` with a
   `Record<Camera, string>` of labels so a missing label fails `svelte-check`, and takes
   `TimeControl`'s padding treatment; `SettingsDialog` prop types; the page's
   `chooseCamera`, guard and `cameraChoice`. The story gains Auto and keeps the
   narrowest-width play.
8. **Docs, PRD and conventions**, as the Files-touched table lists; `just check-docs`.
9. **The screenshot gate.** `just cabin-export` writes `ai_tmp/cabin/<camera>.png` for
   every preset. Stop and ask the maintainer to approve `bowls.png` and every preset
   added or moved; record the paths and the date in the hand-back
   (`CONVENTIONS.md` §10, "The maintainer's eye is a gate").
10. `just check`.

## Acceptance criteria

- [ ] `just check-specs` and `just analyse-specs` clean with the tenth guarantee.
- [ ] `tests/zones.test.ts` and the director cases of step 3 pass; `just
      frontend-coverage` at or above 90 on all four figures with `zones.ts` measured.
- [ ] `tests/scene-motion.test.ts` reports the path's nodes by name in order and still
      one `arrived`.
- [ ] `just check-cabin` refuses the pre-P22 file (no `camera.bowls`) and the checker's
      self-test refuses a camera behind a wall; the rebuilt file passes.
- [ ] `tests/scene-assets.test.ts`: zone coverage exact; frustum true for every preset's
      zone and neighbours at the floor and at 0.55 at P21's four sizes; the framed
      camera inside the walls at every size; raycast clear from it to every waypoint
      and approach at 0.3 and 0.55 up and to both spots at 0.55.
- [ ] Settings: Auto first and checked with nothing stored; stored nonsense → Auto; a
      stored `chair` → Chair; choosing Auto removes `pawlour.camera`.
- [ ] The narrowest-width story passes with five segments: no sideways scroll, every
      segment at least 44 px.
- [ ] The maintainer's approval of every new or moved preset's PNG recorded with the
      date.
- [ ] `just check` green.

## Verification

```sh
git show main:src/lib/assets/cabin.glb > ai_tmp/cabin-before.glb && just check-cabin ai_tmp/cabin-before.glb; echo "rc=$?"
just check-specs && just analyse-specs
just frontend-coverage
just cabin-export && just check-cabin blender/out/cabin-raw.glb && just assets-build cabin
just check-cabin && just check-cabin-self-test
just storybook-test
just check
```

Expected: the old file refused naming `camera.bowls`; the specs clean; coverage at the
floor; the new file accepted with one more refused contract in the self-test; green.

## Hand-back notes

Filled in by the agent that executes this ticket: the final `ZONES` table, every
preset's position, target and field of view, the approval paths and dates, the manifest
diff, and the outcome of open point 1.

## Open points

- **`chair` as a zone owner.** A 36° close-up cannot hold `nav.2`, which every walk
  from `spot.chair` passes first, without retreating out of its crop. Either it owns
  `spot.chair` alone and is widened or re-aimed at the screenshot gate, or it owns
  nothing and is pinnable only (its frame set then `spot.chair`, as P21 left it). The
  maintainer decides at the gate.
- **The frustum reading.** "In frame at every place she can be" is held zone-locally
  (the zone and one step beyond), which is what the cut-at-the-boundary rule needs. A
  global reading would forbid any close-up; the maintainer says if that is wanted.
- **P18.** Its stills "at the hearth camera" stay one per activity and phase; under
  Auto the runtime may show `bowls` where the fallback still shows hearth. Handed back
  to P18's executing agent; not a dependency.
- **H01.** A fifth segment stretches `SegmentedControl` further past the hub's
  two-or-three design; H01 already carries the four-choice fit. If the covering set
  grows past five, the control wraps to two rows rather than shrinking below 44 px.
- **The pin's persistence.** A visitor who chose a preset before this ticket now has it
  pinned, which honours their choice and switches the guarantee off for them. If the
  maintainer would rather every visitor start on Auto once, the migration is to drop
  the stored key on first read.
