---
id: P07b
title: "Scene runtime, motion: the mixer, walking, procedural idle, fire, weather, the wipe"
status: open
depends_on: [P07a, P05, P04]
parallel_with: [P08, P09]
branch: ticket/p07b-scene-motion
estimated_size: L
---

# P07b: Scene runtime, motion: the mixer, walking, procedural idle, fire, weather, the wipe

## Context

P07a draws the room once; this ticket makes it move. Everything here runs only while the
platform's animations are active, through the frame port, and stops the moment they are
not: the `--dur-*` tokens gate CSS and do nothing for a `requestAnimationFrame` loop (H
`docs/explanation/accessibility.md` lines 126–136), so the loop gates itself. What moves
is exactly what `cabin.allium`'s `SheIsTheOnlyThingAlive` allows: her, the fire, the
weather and the steam (CONVENTIONS.md §8).

She moves in three layers. The clips P04 exported (`src/lib/assets/biscuit.glb`, ten
animations named as CONVENTIONS.md §4.1's table) play on an `AnimationMixer` with
crossfades. Walking is the runtime's: no clip translates `root` along the floor (§4.1),
so this ticket moves the model's transform along the room's waypoint graph at the speed
`biscuit.clips.json` states for `walk`, and the feet do not slide. Procedural idle sits
on top of any clip on named bones. The director (P06) decides where she goes and what
she does; this ticket only reports `arrived` back.

Sources, at the commits CONVENTIONS.md §0 pins (read-only, never modified):

- This repository: `src/routes/scene/*` as P07a left it (`createScene`'s `motion?:
  MotionLayer` hook, `cabin.ts`'s `nav` lookups with `userData.edges`, `biscuit.ts`'s bone
  lookup, `lighting.ts`'s three groups, `still.ts`); `src/lib/domain/director.ts` (P06's
  `SceneState`, `Command`, `TICK_MS`); `src/lib/ports/frame.ts`; `src/lib/assets/cabin.glb`
  (P05; the real room, `fire.anchor`, `steam.anchor`, `glass.window` with
  `userData.depth`); `src/lib/assets/biscuit.clips.json` (P03/P04: `name`, `seconds`,
  `loop`, `stride`, `height`); `blender/model/rig.json` (P02; the bone names `chest`,
  `ear.1.L`, `ear.1.R`, `tail.1`, `tail.2`, `tail.3`, `neck`, `head`).
- D `/Users/scutting/.supacode/repos/biscuit_pics/very_nice_three_deeez` at `1d9d358`:
  `models/biscuit/model/rig.json` `coordinateSystem` ("right-handed Z-up, -Y forward,
  +X Biscuit left") for which way the bones bend; `inspiration/catherine/katherine/INDEX.md`
  "The core" (soft masses meet in a sawtooth; small convex objects are graded) for the
  flame's silhouette.
- H `/Users/scutting/projects/biscuit_games` at `575e3dd`: `src/app.css` lines 292–301
  (`--dur-1/2/3` are `0ms` unless `data-animations='on'`; 120, 150, 180 ms then; the
  `--ease`), `docs/design/direction.md` lines 174–179 (no bounce anywhere; the interface
  barely moves so movement means her).
- three.js at P00's pin: `AnimationMixer`, `AnimationAction` (`crossFadeTo`, `timeScale`,
  `setLoop`), `InstancedMesh`, `Sprite`, `CanvasTexture`.

Read first: `PRD.md` ("What she does", "Motion off"); CONVENTIONS.md §4.1 (the rules
every clip obeys and the table), §4.3 (`biscuit.clips.json`), §5.1, §5.2 (the `nav.*`
graph), §5.3 (the overlay register, for the wipe), §5.4 whole; §10 (the maintainer's
eye is a gate); §12 (the scripted walk).

## Goal

At the end of this ticket, on branch `ticket/p07b-scene-motion`:

- `motion.ts` plays the director's `activity` as the named clip with a 250 ms crossfade,
  loops what loops, plays `sit` and `lie` forward and, for `stand`, in reverse from the
  pose she is leaving, layers `pet` additively over the interrupted clip, and reports
  `arrived` through a callback when a walk reaches its target.
- `walk.ts` finds a path from her position to `target.spot` through the nearest
  waypoints, turns her in place first, then moves her at `stride / seconds` of `walk`
  times the model's scale; the feet do not slide on the maintainer's recording.
- `idle.ts` layers breathing, ear twitches, tail sway and the head turn toward
  `state.lookAt` on top of any clip, with CONVENTIONS.md §5.4's figures.
- `fire.ts` draws three flipbook flame planes and embers at `fire.anchor` and flickers
  the fire point light; `weather.ts` draws rain or snow behind the glass and steam at
  `steam.anchor`; the lighting rigs blend over 600 ms on a phase change.
- `wipe.ts` provides the diagonal sweep the page uses on load-in and photo mode.
- Nothing runs when `animations` is false; the still path of P07a is untouched.
- The maintainer has approved a recording of the walk and the fire (the gate), and
  `just check` is green.

## Non-goals

- Deciding anything. Where she goes, what she does, when she wakes, which caption: P06.
  This ticket receives `SceneState` and reports `arrived`.
- Sound. The audio port is the page's to drive (P08); the fire here is silent.
- The v1.1 clips (`yawn`, `stretch`, `circle`, `treat`, `look`). The head turn toward a
  tap is procedural here; the `look` clip replaces it later without a change to the
  director.
- Rooms other than the cabin, and the wipe between rooms. The wipe exists (load-in and
  photo mode) so a second room can use it.
- Any change under `src/lib/` except adding one asset to the manifest through `just
  assets-manifest` (the fire texture). No change to `package.json`.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `src/routes/scene/motion.ts` | repo | new; Step 1 | mixer, actions, crossfades, `arrived` |
| `src/routes/scene/walk.ts` | repo | new; Step 2 | path search, turning, moving |
| `src/routes/scene/idle.ts` | repo | new; Step 3 | the procedural layer |
| `src/routes/scene/fire.ts` | repo | new; Step 5 | flames, embers, the flicker |
| `src/routes/scene/weather.ts` | repo | new; Step 6 | rain, snow, steam |
| `src/routes/scene/wipe.ts` | repo | new; Step 7 | the sweep |
| `src/routes/scene/scene.ts`, `lighting.ts` | repo (P07a's) | Steps 1, 5 | the motion layer wired in; the 600 ms rig blend |
| `scripts/make_fire.py` | repo | new; Step 4 | draws the flipbook with Pillow |
| `src/lib/assets/fire.webp` | asset | Step 4 (`made:`) | new |
| `src/lib/assets/manifest.json` | asset | `just assets-manifest` | one entry added |
| `tickets/P07b-scene-motion.md` | tickets | this file | `status: done` |

`src/routes/scene/scene.ts` and `lighting.ts` are P07a's files; P07a is done before this
ticket starts, so editing them here is this ticket's, not a hand-back (CONVENTIONS.md
§10: a done ticket's work may be changed by a ticket that depends on it, and the change
is named here).

## Steps

1. **`motion.ts`.** `createMotion({ model, clips, table, onArrived })` builds an
   `AnimationMixer` on the model and one `AnimationAction` per clip in `biscuit.glb`,
   refusing a GLB missing any name in CONVENTIONS.md §4.1's core set. `apply(state)`
   maps `state.activity` to an action: loops get `LoopRepeat`, one-shots `LoopOnce` with
   `clampWhenFinished`; `stand` reverses, with `timeScale = -1` from their ends, the
   clips that reach the pose she is leaving: `lie` then `sit` when the action it was
   playing was `sleep` or `lie`, `sit` alone when it was `idle.sit` or `sit` (the
   director's `standFrom` and `TRANSITION` say the same, P06); the director sequences
   `sit` then `lie` on arrival itself, so this layer plays whatever `activity` says and
   never chains clips of its own; `pet` is never crossfaded to: its clip is made additive
   once (`AnimationUtils.makeClipAdditive`, `blendMode: AdditiveAnimationBlendMode`) and,
   while `state.activity === 'pet'`, the action for `state.resume.activity` keeps playing
   and the `pet` action fades in over 250 ms and out on finish (§11 claim 15); every
   other change is `previous.crossFadeTo(next, 0.25, true)`. `update(dt)` advances the
   mixer and, when the activity is `walk`, calls `walk.ts`; when the walk reports done,
   calls `onArrived()` once. Wire it into `scene.ts`'s `motion` hook: with `animations`
   true, `apply` subscribes once to the frame port and each frame computes `dt` (clamped
   to 50 ms), updates motion, idle, fire, weather and the rig blend, then renders; with
   `animations` false it unsubscribes and P07a's render-once path runs. Switching
   `animations` off mid-walk snaps her to the target (the director already moved `at`).

2. **`walk.ts`.** From `cabin.ts`'s waypoints (`nav.*` positions and `userData.edges`),
   `pathTo(from: Vector3, spot: string): Vector3[]` picks the waypoint nearest `from`,
   the waypoint the spot's `userData.nav` names (or nearest to the spot), runs a
   breadth-first search over the edges, and returns the waypoint positions followed by
   the spot's position. `follow(model, path, speed, dt)` first turns the model in place
   toward the next point at 180° per second, then moves along the segment at `speed`
   (units per second; `stride / seconds` of `walk` × the model's scale), turning through
   corners, and at the last point sets the facing to the spot's node facing (its −Z)
   and returns `done`. The `walk` clip's loop is left at its natural rate: if the feet
   slide, the constant to change is `stride` in `blender/clips/walk.py` (P04's), never a
   multiplier here; hand that back rather than compensating.

3. **`idle.ts`.** After the mixer's update each frame, before render: `chest` scale
   `1 + 0.015 * sin(2π · 0.25 · t)`; every 6 to 14 s (drawn once through
   `Math.random` is not allowed: draw the next interval from the director's `random`
   port passed in, or from a fixed sequence the scene seeds from `state.caption?.sequence`)
   one of `ear.1.L`, `ear.1.R` rotates 12° about its local X over 120 ms and back over
   200 ms; while `idle.stand` or `idle.sit`, `tail.1`, `tail.2`, `tail.3` each add `±8°
   · sin(2π · 0.4 · t)` about local Z with a phase lag of 0.15 per bone; when
   `state.lookAt` is set (a floor point, or `{ item }` resolved to `item.<name>`'s world
   position through `cabin.ts`), `neck` and `head` each turn half the yaw toward it,
   clamped to ±40° in total, eased over 400 ms with `--ease`'s curve, and ease back
   when it clears. The layer adds to the clip's pose (multiply the bone's quaternion
   after the mixer), so it works on every clip, and is skipped while `sleep` for the
   ears and tail (the breath stays).

4. **The fire texture.** `scripts/make_fire.py` (Pillow; ruff-clean under §2.2's
   per-file ignores) draws `src/lib/assets/fire.webp`: 256 × 2048, eight frames stacked
   vertically, each a flame silhouette in three flat value steps (a dark orange core
   `#c8501e`, a mid `#f08a2a`, a light `#ffd27a`) with a sawtooth edge where the steps
   meet, transparent outside, no gradient, no blur; the frames vary the tongue heights
   by a seeded sequence so the loop reads. `just assets-manifest`, read the diff (one
   entry, `made:<date>`, `licence: cc0`, `budget: 262144`), `just check-assets`.

5. **`fire.ts` and the flicker.** Three `PlaneGeometry` quads at `fire.anchor` at depths
   −0.05, 0, +0.05, each with a `MeshBasicMaterial` (`transparent`, `depthWrite: false`)
   showing one frame of the flipbook through `map.offset.y` and `map.repeat.y = 1/8`,
   advanced at 8 fps, the three out of phase by 0, 3 and 5 frames, each billboarded to
   the camera about Y. Twenty embers: an `InstancedMesh` of tiny quads rising 0.3 units
   over 1.5 s from the anchor with a slight sideways drift, fading, respawning. The
   rig's `light.fire` point light gets `intensity = base · (1 + 0.15 · noise)` where
   `noise` is a smoothed 3 Hz value (two random targets interpolated), `base` the
   phase's rig value. In `lighting.ts`, replace P07a's cut with a 600 ms linear blend of
   every light's intensity between the outgoing and incoming rig when `animations` is
   true; keep the cut when false.

6. **`weather.ts`.** Behind `glass.window`, in a box the pane's width and height by
   `userData.depth`: rain as up to 300 instanced thin quads falling at 4 units per
   second with a slight slant, snow as up to 200 instanced discs falling at 0.6 units
   per second with a sideways sine drift, both respawning at the top; none when clear;
   the count switches on `state.weather`. Steam: six quads at `steam.anchor`, each
   rising 0.12 units over 2 s while scaling up and fading, staggered. All of it stops
   with the loop.

7. **`wipe.ts`.** A DOM helper, not canvas: `wipe(element: HTMLElement, direction: 'in'
   | 'out'): Promise<void>` sets a `clip-path: polygon(...)` sweep from the top-left to
   the bottom-right across the element over `var(--dur-3)` with `var(--ease)`, resolving
   on `transitionend` or at once when the computed duration is `0s`. The page (P08)
   applies it to the title card on load-in and to the photo frame. It is the graphic
   register's one motion (§5.3) and it is a CSS transition, so it gates on
   `data-animations` by itself.

8. **The recording: the gate.** On the maintainer's phone through `just preview-lan`,
   or on the desktop at 390×844, record a screen capture of: a tap on the bed from the
   hearth camera (turn, walk, arrive, sit, lie, sleep), a tap on the toy, a pet while she
   drinks (§11 claim 15: the lean reads and she does not drop into a sit), the fire at
   night, rain at the window; save under `ai_tmp/motion/` as video or GIF. Stop and ask
   the maintainer to approve the walk (no sliding, no bounce, reads as a dog) and the
   fire (reads as cel, not as a particle effect). Rework before done; if the walk cannot
   pass, hand back to P04 the stride or the clip.

9. **Run the gate**: `just frontend-static`, `just check-assets`, `just frontend-build`,
   `just check`. Set `status: done`. Commit. Pushing and the pull request are
   authorised separately.

## Acceptance criteria

- [ ] Every core clip plays by name with a 250 ms crossfade; `stand` reverses `lie` then
      `sit` from `sleep` and `sit` alone from `idle.sit`; `pet` plays additively over
      `drink` with the drink running underneath; a missing clip is refused by name.
- [ ] A tap on each of the five walkable items (bed, chair, water, food, toy) walks her
      along waypoints, turning first, and `arrived` is reported once per walk (a counter
      in the scratch route, recorded); a tap on the lamp or the lights toggles the light
      and turns her head with no walk.
- [ ] The walking speed equals `stride / seconds × scale` and is not multiplied anywhere
      else (`grep -n stride src/routes/scene/walk.ts` shows the one use).
- [ ] The idle layer runs on every clip and its figures are the constants in §5.4.
- [ ] `fire.webp` is 256 × 2048, eight frames, three flat colours, listed in the manifest
      as `made:` with `cc0`.
- [ ] The rig blend takes 600 ms with animations on and is a cut with them off.
- [ ] With `animations` false, no frame is requested (the fake frame port in the scratch
      route records zero `each` calls) and P07a's render-once path runs.
- [ ] The maintainer has approved the recording (the date in the hand-back).
- [ ] `just check` is green.

## Verification

```sh
uv run --frozen python scripts/make_fire.py && python3 -c "from PIL import Image; im=Image.open('src/lib/assets/fire.webp'); print(im.size, im.mode)"
just check-assets
grep -n 'stride' src/routes/scene/walk.ts
grep -n "animations" src/routes/scene/scene.ts
just frontend-static
just check
```

Expected: `(256, 2048) RGBA`; green with one new entry; one line; the subscribe and
unsubscribe branches visible; clean; green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- The recording paths and the date of the maintainer's approval; what was reworked.
- §11 claim 15: whether the additive `pet` read over `drink`, and what was seen if not.
- The measured walking speed in units per second and whether the feet slid at the
  clip's natural rate; a hand-back to P04 if `stride` should change.
- The frame time on the maintainer's phone with fire and rain on (a first figure for
  P10), read from Safari's Web Inspector timeline.
- The manifest diff for `fire.webp`.
- Which open points below were settled.

## Open points

- **The ear-twitch interval's randomness.** Step 3 forbids `Math.random`; recommend the
  scene receives the director's `random` port as a prop and draws from it, which keeps
  the layer testable in principle even though nothing under `src/routes/scene/` is
  unit-tested.
- **Path corners.** Breadth-first over a small hand-placed graph gives the fewest hops,
  not the shortest distance; if P05's graph makes a visible detour, weight the edges by
  length (Dijkstra) and say so.
- **Snapping when motion goes off mid-walk.** She jumps to the target. Whether she
  should instead finish the walk invisibly and appear at the next state change is a
  product question for P08's still logic.
