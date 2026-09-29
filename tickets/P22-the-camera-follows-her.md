---
id: P22
title: "The camera follows her: zones, a covering set of presets, and Auto in Settings"
status: done
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
  as the pin, mirroring `phase` and `phaseOverride`, and a bookkeeping field `passed`
  (the name of the last node she passed or settled at, as `standFrom` is bookkeeping)
  that every `reached` command and every arrival records whether or not a preset is
  pinned. When nothing is pinned, `camera` follows her: on a new `reached` command
  carrying the node she has just passed, on arrival, and when Auto is chosen, which
  follows the recorded node, never the destination of a walk in progress.
  `setCamera` takes `Camera | 'auto'`. A `tick` never changes it. With motion off,
  `still()` arrives at once and the camera is the destination's zone.
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
  at 0.55 up; and that a ray from the framed camera's position to every node in that
  same set hits no mesh under the cabin root, which is also what holds a retreat that
  would carry the camera behind a wall.
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
| `src/lib/domain/director.ts`, `tests/director.test.ts` | repo | `Camera` from `zones.ts`; `cameraOverride` and the `passed` bookkeeping field; `setCamera(Camera \| 'auto')`; the `reached` command; the follow on arrival |
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
3. **The director, red.** Cases: `reached nav.3` while walking in Auto sets `bowls`
   and records `passed: 'nav.3'`; the same with `cameraOverride` set records the node
   and leaves `camera` alone; `reached` when not walking, or with an unknown node,
   changes nothing; `arrived` at `item.water.approach` sets `bowls` and records the
   spot; motion off, `tap('water')` from the opening state yields `bowls` in one
   `step`; `setCamera('auto')` while idle at the bed sets `hearth` and clears the pin;
   pinned on `chair`, walking to the water and past `nav.3`, `setCamera('auto')` sets
   `bowls` (the recorded node), not the destination and not `nav.0`; pinned, walking
   to the water and not yet past `nav.3`, `setCamera('auto')` keeps the zone of the
   node last recorded; `setCamera('chair')` sets both; a `tick` never changes
   `camera`. Green: one helper `follow(state, node)` used by `arrive()`, `reached` and
   `setCamera('auto')`, which follows `state.passed`; the opening state records
   `nav.0`, so a visit that never walked follows `hearth`.
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
   before a cut); raycast (from the framed camera's position, wherever the retreat
   put it, to every node in the same set, the zone and one step beyond: each `nav.*`
   and `item.*.approach` node at 0.3 and at 0.55 up, so a rim or an arm at knee height
   cannot hide her body, and each `spot.*` node at 0.55 up only, because she is on the
   furniture there and a ray to the seat would graze the cushion;
   `intersectObject(cabin.root, true)` returns nothing; the cabin root holds only
   `cabin.*` meshes). The raycast is what holds a retreat that would carry the camera
   behind a wall, so no bound on the framed position is asserted: hearth's portrait
   retreat under P21 ends above the 2.4 m plane, beyond its edge on the open side,
   and is clear. The bound on the authored empties stays in the checker (step 5).
   Expect `chair` at 36° to retreat past its close crop to hold `nav.2`; resolve as
   open point 1 says. Tune `ZONES` and `layout.py` until green, re-exporting as in
   step 5.
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
      zone and neighbours at the floor and at 0.55 at P21's four sizes; raycast clear
      from the framed camera to the same zone and neighbours, waypoints and approaches
      at 0.3 and 0.55 up and spots at 0.55.
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

Executed on 2026-09-28 on the branch `P22-the-camera-follows-her` (not the `branch:`
field's name: the worktree was created on that branch, as P21's was).

**Decisions the maintainer took on 2026-09-28, before and during the work.**

- **Bowls cuts at the bowl, not at nav.3.** A probe of P21's fit on the ticket's
  starting map, with `bowls` owning `nav.3`, put the bowls camera about 10 m through the
  right wall in portrait (390×844 at (10.2, 3.9, 3.3)), because nav.3's step to nav.7
  and nav.0 had to be held. So `bowls` owns only the two approaches, `hearth` owns
  `nav.3`, and the picture stays wide across the room and cuts as she reaches a bowl.
  Step 3's `reached nav.3` cases became `reached item.water.approach`.
- **Open point 1: chair owns `spot.chair`,** with the looser crop that holding nav.2
  costs. Approved at the gate.
- **Open point 5: a stored pin stays a pin.** There is no migration.
- **The jar's stand.** From the hearth, the stand at (0.3, 0.45, 1.7) lies in line with
  `item.jar.approach` (at every size) and `nav.5` (in portrait), both at x = 0.3, and
  hides them at 0.3 m; at 0.55 m both are clear. A probe found that moving the hearth to
  (1.2, 1.40, 2.30) would clear them. The maintainer kept the hearth instead, and those
  two nodes are raycast at 0.55 m only, from the hearth only (`HEAD_ONLY` in
  `tests/scene-assets.test.ts`, with the reason). She never stands at either in v1: the
  jar does nothing, and no walk to the five things passes nav.5. This relaxes the
  ticket's raycast rule for two nodes and one preset.
- **The gate** showed both Blender's review PNG and captures of the built app.

**Final `ZONES`** (`src/lib/domain/zones.ts`):

| Preset | Owns | Frame set beyond the zone |
| --- | --- | --- |
| hearth | nav.0, nav.1, nav.3, nav.5, nav.7, item.bed.approach, spot.bed, item.lights.approach, item.jar.approach | nav.2, nav.4, nav.6, item.water.approach, item.food.approach |
| window | nav.2, nav.4, nav.6, item.chair.approach, item.lamp.approach, item.toy.approach | nav.0, spot.chair, nav.5 |
| chair | spot.chair | nav.2 |
| bowls | item.water.approach, item.food.approach | nav.3 |

One step is a waypoint edge, an approach's `extras.nav`, or a spot's nearest waypoint,
taken both ways (`neighbours` in `camera.ts`). Both ways is what puts `spot.chair` in
window's set and holds her over the last segment, nav.2 → spot.chair.

**Presets** (`blender/cabin/layout.py`; only `bowls` is new, none moved):

| Preset | Position | Target | FOV | Retreat 844×390 | 1200×844 | 390×844 | 320×568 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hearth | (0.6, 1.40, 2.30) | (−0.5, 0.5, −1.5) | 42° | 1.74 m (was 1.27) | 1.74 m (was 1.50) | 8.82 m | 6.87 m |
| window | (−0.8, 1.30, 1.60) | (1.8, 0.8, −0.2) | 40° | 1.85 m (was 1.25) | 1.85 m (was 1.25) | 3.66 m | 2.70 m |
| chair | (0.9, 1.00, 0.90) | (1.7, 0.5, 0.0) | 36° | 1.16 m (was 0.22) | 1.16 m (was 0.22) | 1.41 m (was 0.22) | 1.16 m (was 0.22) |
| bowls | (0.5, 1.10, 1.30) | (−1.9, 0.4, 0.8) | 40° | 0 | 0 | 0 | 0 |

The raycast from the fitted camera holds the portrait hearth and window retreats, which
end past the open side (the hearth's above the 2.4 m box and beyond its edge). Every mesh
under the cabin root is a `cabin.*` material and double-sided, so a ray sees what the
renderer draws, from either side.

**Approvals, 2026-09-28**, all from the maintainer in this session:

- bowls, new: `ai_tmp/cabin/bowls.png`, and `ai_tmp/p22/sheet-bowls.png` from
  `ai_tmp/p22/app-bowls-{844x390,1200x844,390x844,320x568}.png`.
- chair, looser crop: `ai_tmp/p22/sheet-chair.png` and `ai_tmp/cabin/chair.png`.
- window and hearth, bigger frame sets: `ai_tmp/p22/sheet-window.png` and
  `ai_tmp/p22/sheet-hearth.png`.

The captures were taken under Auto with reduced motion, sending her to Water, Toy and
Chair through her control. The `?debug` line read `bowls`, `window` and `chair` in turn,
and Settings still showed Auto checked at every size.

**Seen with motion on**, in Chromium (SwiftShader) at 390×844 on the built app, with
`data-animations` on and no page error or console error. She walked to the water, then
to the chair, and the `?debug` line read hearth → bowls (at the bowl) → hearth (at nav.3
on the way out) → window (at nav.2) → chair (on the seat). So `reached` crossed from the
frame loop, through the page's effect, into `scene.apply` without disturbing the walk.
Captures: `ai_tmp/p22/live-bowls-390x844.png`,
`ai_tmp/p22/live-window-mid-walk-390x844.png`, `ai_tmp/p22/live-chair-390x844.png`.

**A tick and the camera.** The ticket's step 3 says a `tick` never changes `camera`. The
test holds that with motion on, where time alone moves nothing. With motion off, a walk
her own choice starts on a tick arrives on that same tick, and the camera follows her to
the destination's zone, as the guarantee's last sentence asks. `the-director.md` says it
that way.

**Red, each step.**

- Zones: the missing module.
- Director: 12 failing cases (the opening state, the settings case, and ten new).
- Walker: the named path and the order `nav.0, nav.3, item.water.approach, arrived`.
- Checker: the committed file refused with `camera.bowls: expected one required node,
  found 0`.
- Control: four failing page and dialog cases.
- The dialog's narrowest story (below).

**Found at the screenshot of the built workshop.** At 320 px, with `TimeControl`'s
`--s-4` padding, the fifth camera segment (Bowls) ran 3 px past the dialog body and was
clipped. Neither the 44 px check nor the document-scroll check can see that. The
`SettingsDialog` narrowest story now asserts that every radio lies inside every ancestor
that clips: red at `expected 306.64 to be less than or equal to 303.5`, green with
`--s-2` in `CameraControl`. The segments now measure 46, 59, 67, 49 and 52 px in the
frame story, and the platform's 44 px floor holds the short words up. H01 already
carries the fit; a sixth preset would wrap to two rows, as open point 4 says.

**Stub.** `svelte-check` refuses a `.ts` import from the `.mjs` without
`allowImportingTsExtensions`, so `stubCabin(cameras)` takes the names. The test passes
`CAMERA_NAMES`, and `just scene-stub` imports `zones.ts` at runtime, where Node strips
the types. It throws for a preset it has no position for.

**Manifest diff:** `cabin.glb` goes from 586,592 to 586,788 bytes, sha256
`0990eb38…` → `781d8bd5…`, `source` still `built:2026-09-28`. It is still 25,634
triangles and 25 primitives, with all 48 positions within 0.01 m.

**Outside the file table:**

- `docs/how-to/test-on-a-phone.md`: the frame-rate run now pins the hearth, so Auto does
  not cut away mid-measurement.
- `docs/reference/testing.md`: the rows for the changed tests and a `zones.test.ts` row.
- `tests/drawn.test.ts`: `passed` and `cameraOverride` added as fields that draw nothing.
- `stories/Stage.stories.svelte`: `onReached`.
- `stories/SettingsDialog.stories.svelte`: both Autos, and the clipping check.
- `tickets/README.md`: P22's row.

**For whoever merges second of P14, P15 and this ticket.** This ticket edits
`stories/SceneCanvas.stories.svelte` (one `onReached: fn()` line),
`docs/explanation/the-director.md` (the state, the commands, a new "The camera" section
and a sentence under "Motion off"), `tests/director.test.ts` (the opening and settings
cases, and a new `TheCameraFollowsHerUntilPinned` block), and rows of
`docs/reference/testing.md`. `src/lib/assets/manifest.json` changes in the `cabin.glb`
row only.

**P21's two open points handed here.** The ceiling plane: the hearth's portrait retreat
is unchanged at 8.82 and 6.87 m, so the hearth captures show what P21's did, black above
the wall tops; it stays the PRD's open question. Desktop at 2:1 or wider: no viewport
wider than 1200×844 was measured. The guarantee is held zone by zone and bounds nothing
at the walls' ends, so that point stays open in the PRD as well.

**P18.** Under Auto, the runtime may show `bowls` or `chair` where the fallback still
shows the hearth. The stills stay one per activity and phase, as open point 3 says.

**Residual risk.**

- A walk retargeted mid-segment starts from her nearest waypoint, which may lie outside
  the current zone's frame set. The guarantee is held node to node.
- The five segments fit the dialog at 320 px in Chromium with about 10 px to spare, and
  Safari's text metrics were not measured.

**Verification**, run on 2026-09-28:

```text
just check-cabin ai_tmp/cabin-before.glb   camera.bowls: expected one required node, found 0 (rc=1)
just check-specs && just analyse-specs     2 specifications, no diagnostics and no findings
just cabin-export; just check-cabin blender/out/cabin-raw.glb
                                           cabin contract valid; 25,634 triangles, 25 primitives, all 48 positions within 0.01 m
just assets-build cabin                    the same, and check-assets wrote 27 files
just check-cabin-self-test                 valid input accepted, 17 broken contracts refused (was 16)
just frontend-coverage                     Test Files 32 passed (32), Tests 418 passed (418)
                                           100% statements, 97.49% branches, 100% functions, 100% lines
just storybook-test                        Test Files 14 passed (14), Tests 52 passed (52)
just check-docs                            Validated 54 pages and 55 canonical topics.
just check                                 All checks passed and the worktree is unchanged.
```

Pushing and the pull request were not done; each is a separately authorised action.

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
