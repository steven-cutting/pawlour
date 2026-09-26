---
id: P07a
title: "Scene runtime, static: the three.js adapter, materials, lighting rigs, cameras, hit-test, still mode, context loss"
status: open
depends_on: [P03, P06]
parallel_with: [P04, P05, P09]
branch: ticket/p07a-scene-static
estimated_size: L
---

# P07a: Scene runtime, static: the three.js adapter, materials, lighting rigs, cameras, hit-test, still mode, context loss

## Context

The room is drawn by three.js and nothing three.js touches may live under `src/lib/`:
jsdom cannot run it and the coverage floor would measure it at zero (CONVENTIONS.md §1
decision 17, S ticket C03's precedent). So the runtime sits under `src/routes/scene/`,
takes every port and the director's `SceneState` as props, and reads `window` inside
`onMount` and nowhere else. This ticket is the static half: load the two GLBs, check the
room's contract, give Biscuit the cel look and the room the painted one, place the three
lighting rigs and the three cameras, hit-test a tap, draw once per state when motion is
off, show a still before the first frame and when the context is lost, and export the
two functions the page calls (`capture`, `forceContextRestore`). P07b adds everything
that moves.

Two things this ticket builds against are not final. P03's `src/lib/assets/biscuit.glb`
holds one clip, `idle.stand` (P02's proof export through the pipeline); P04 replaces it
and nothing here depends on the other clips. P05's `src/lib/assets/cabin.glb` may not
exist yet: this ticket writes a stub room of boxes carrying every node CONVENTIONS.md
§5.2 requires, under `ai_tmp/stub-cabin/`, and develops against it; when P05 lands, the
real file drops in and the contract check is what proves the two agree.

Sources, at the commits CONVENTIONS.md §0 pins (read-only, never modified):

- D `/Users/scutting/.supacode/repos/biscuit_pics/very_nice_three_deeez` at `1d9d358`:
  `models/biscuit/src/viewer.template.html` lines 55–63 (the two shaders) and 111–118
  (the draw loop). The values the cel look is reproduced from, read on 2026-09-25:
  the light `L = normalize(vec3(-3.5,-4.5,7.))` and fill `F = normalize(vec3(4.,-3.,4.))`
  in Blender's Z-up space; `value = .12 + .76*max(0,N·L) + .18*max(0,N·F)`; the ramp
  `shade = mix(vec3(.32,.26,.245), vec3(.51,.43,.385), smoothstep(0,.28,value))`, then
  `mix(shade, vec3(.82,.74,.66), smoothstep(.28,.48,value))`, then
  `mix(shade, vec3(1.08,1.025,.93), smoothstep(.48,.71,value))`; colour × shade × the
  occlusion map's red channel; the contour pass draws `vec4(.20,.135,.12,1.)` with
  vertices pushed `normal*.002` and `gl.cullFace(gl.FRONT)`; `normalStrength` is `.18`
  for a texture whose name starts `face` and `.32` otherwise; `devicePixelRatio` is
  capped at 2 (`Math.min(devicePixelRatio||1,2)`). Quote these in the hand-back as read.
- S `/Users/scutting/projects/biscuit_studio` at `a4d20af`: `tickets/C03-threejs-viewer.md`
  steps 5 and 6 (the `MeshToonMaterial` with a three-band `gradientMap` and
  `NearestFilter`, the inverted-hull outline as a `BackSide` mesh per part, the
  `webglcontextlost` fallback, the `MutationObserver` on the root for theme changes).
- T (rendered here by P00): `src/routes/+page.svelte` (the comment on `onMount` and
  prerendering), `docs/explanation/layering.md` (routes may import ports, components,
  brand, config; components must not reach for a browser global), `tests/route.test.ts`
  (the shape of a route test), `vite.config.ts` (the coverage `include`).
- H `/Users/scutting/projects/biscuit_games` at `575e3dd`: `src/lib/ports/preferences.ts`
  and `src/lib/domain/appearance.ts` (`animationsActive(animations, prefersReducedMotion)`),
  `docs/explanation/accessibility.md` lines 126–136 (the `--dur-*` gate does nothing for
  a `requestAnimationFrame` loop) and 312–313 (nothing behind `aria-hidden` is checked).
- This repository: `src/lib/domain/director.ts` (P06's `SceneState`), `src/lib/ports/frame.ts`,
  `src/lib/assets/biscuit.clips.json` (P03; `height`), `src/lib/assets/manifest.json`.
- three.js at the version P00 pinned: `three/addons/loaders/GLTFLoader.js`,
  `three/addons/libs/meshopt_decoder.module.js`, `MeshToonMaterial`, `Raycaster`,
  `WebGLRenderer`, `HemisphereLight`, `DirectionalLight`, `PointLight`.

Read first: `PRD.md` ("The room", "Motion off", "Performance budget"); CONVENTIONS.md
§1 decisions 6, 12, 13, 16, 17, 19; §5.1 to §5.4 whole; §11 claims 9 and 11; §12.

## Goal

At the end of this ticket, on branch `ticket/p07a-scene-static`:

- `src/routes/scene/SceneCanvas.svelte` mounts a canvas, loads `biscuit.glb` and
  `cabin.glb` (or the stub) through `GLTFLoader` with `MeshoptDecoder`, reports progress
  through a prop callback, and draws the room from `camera.hearth` with Biscuit standing
  at `nav.0` in `idle.stand`'s first frame.
- `cabin.ts` refuses a room missing any required node of CONVENTIONS.md §5.2 and names
  it in the thrown error; the stub passes; a stub with one node removed fails by name.
- Biscuit wears the cel look (§5.3), the room wears the painted one, a contact disc sits
  under her, and the maintainer has approved a screenshot (the gate, §10).
- The three lighting rigs and the three cameras switch on `SceneState.phase` and
  `SceneState.camera`; a tap reports `item.<name>`, `biscuit` or `floor` with a point.
- With `animationsActive` false the scene draws exactly once per `SceneState` it is
  handed; before the first frame, on `webglcontextlost` and with `webgl: false` an
  `<img>` of the still for the state is shown with the caption as alt text; the loss is
  reported through `onContextLost`; `capture()` returns a PNG data URL of the frame and
  `forceContextRestore()` brings the drawing back.
- `tests/scene-canvas.test.ts` proves the component renders its still and no canvas
  when `WebGL2RenderingContext` is absent, and `just check` is green.

## Non-goals

- Anything that moves: clips, crossfades, walking, procedural idle, the fire's flicker,
  weather, steam, the wipe (P07b). This ticket draws the fire as its fixed middle frame
  from a placeholder quad and the window as the phase's sky colour.
- The page, the controls, the captions' DOM, photo mode (P08). This ticket's component
  is mounted by P08; until then it is exercised from a scratch route the executing agent
  keeps under `ai_tmp/` or from a story that renders the still.
- The real room (P05) and the real clips (P04).
- Editing `vite.config.ts`, `vitest.storybook.config.ts` or `package.json`
  (CONVENTIONS.md §10). `three` and `@types/three` are already pinned by P00.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `src/routes/scene/SceneCanvas.svelte` | repo | new; Step 1 | the component |
| `src/routes/scene/scene.ts` | repo | new; Step 2 | `createScene`, loading, apply, render-once |
| `src/routes/scene/cabin.ts` | repo | new; Step 3 | the contract check and the node lookups |
| `src/routes/scene/biscuit.ts` | repo | new; Step 4 | scale, bone lookup, outline meshes |
| `src/routes/scene/materials.ts` | repo | new; Step 4 | the two ramps, the ink, the disc |
| `src/routes/scene/lighting.ts` | repo | new; Step 5 | the three rigs |
| `src/routes/scene/camera.ts` | repo | new; Step 5 | presets, portrait framing, DPR |
| `src/routes/scene/hit.ts` | repo | new; Step 6 | the raycast |
| `src/routes/scene/still.ts` | repo | new; Step 7 | render-once, the still's URL for a state |
| `scripts/stub_cabin.mjs` | repo | new; Step 3 | writes `ai_tmp/stub-cabin/cabin.glb` with `@gltf-transform/core` |
| `tests/scene-canvas.test.ts` | repo | new; Step 8 | the still without WebGL |
| `tickets/P07a-scene-static.md` | tickets | this file | `status: done` |

`src/lib/assets/` is not touched: this ticket adds no asset. The stills it shows are
P04's; until P04 lands the component shows P03's single placeholder still,
`src/lib/assets/stills/idle.morning.webp`, which P03 ships for exactly this reason.

## Steps

1. **The component's contract.** `SceneCanvas.svelte` takes props `state: SceneState`,
   `animations: boolean` (the page computes `animationsActive(...)` from the hub's port
   and passes the answer), `frames: FramePort`, `assets: { biscuit: string; cabin:
   string; clips: ClipTable; still: (state: SceneState) => string }`, `onProgress:
   (fraction: number) => void`, `onReady: () => void`, `onTap: (hit: Hit) => void`,
   `onContextLost: () => void`, and `webgl: boolean` (default `true`; `false` constructs
   no scene and shows the still, which is what P08's story and any test asks for). It
   exports two functions the page calls on the instance: `capture(): string` (Step 7) and
   `forceContextRestore(): void` (Step 2). Runes only: `$props()`, `$state` for `ready`
   and `lost`, `$effect` to hand every new `state` to the scene. In `onMount` it reads
   `window.devicePixelRatio`, the canvas's client size and `WebGL2RenderingContext` and
   constructs the scene; on destroy it disposes the renderer. The markup is `<div
   class="scene">` holding `<canvas aria-hidden="true" tabindex="-1">` and, while `!ready
   || lost`, `<img alt={state.caption?.text ?? 'Biscuit in the cabin'}
   src={assets.still(state)}>`, whose `onclick` calls
   `forceContextRestore()` (CONVENTIONS.md §5.4, `AContextLossLeavesAStill`). Every
   selector in `<style>`
   names an element the markup carries. `touch-action: manipulation` on the canvas.

2. **`scene.ts`**: `createScene({ canvas, pixelRatio, size, frames, assets, onProgress })`
   returns `{ apply(state, animations): void; hit(x, y): Hit; capture(): string;
   restore(): void; dispose(): void; lost: boolean }`. It creates the `WebGLRenderer`
   (`antialias: true`, `preserveDrawingBuffer: false`; `capture()` renders synchronously
   first, §11 claim 12), sets the pixel ratio to
   `Math.min(pixelRatio, 2)`, loads both files with one `GLTFLoader` whose
   `setMeshoptDecoder(MeshoptDecoder)` is called, reports progress as bytes loaded over
   bytes expected from the manifest's `bytes`, and on both loaded calls `cabin.ts`,
   `biscuit.ts`, `materials.ts`, `lighting.ts`, `camera.ts` in that order. `apply` stores
   the state and, when `animations` is false, renders once through `still.ts`; when
   true it hands the state to P07b's motion layer (this ticket leaves a
   `motion?: MotionLayer` hook that, absent, renders once as well). Listens for
   `webglcontextlost` (calls `preventDefault`, sets `lost`, calls the component's
   `onContextLost`) and `webglcontextrestored` (rebuilds the materials, renders once,
   clears `lost`). `restore()` calls `WEBGL_lose_context.restoreContext()` when the
   extension is present and otherwise disposes the renderer, creates a new one on the
   same canvas and reloads; the component's exported `forceContextRestore()` is this
   function.

3. **`cabin.ts` and the stub.** `requireCabin(root: Object3D): Cabin` walks the loaded
   scene and returns typed lookups for every name in CONVENTIONS.md §5.2's table
   (`items`, `approaches`, `spots`, `nav` with edges from `userData.edges`, `cameras`
   with `userData.fov`, `lights`, `glass`, `fireAnchor`, `steamAnchor`); it throws
   `Error('cabin.glb is missing <name>')` for the first missing node, listing all
   missing names after a colon. Write `scripts/stub_cabin.mjs` with
   `@gltf-transform/core` (`Document`, `NodeIO`): a 5 × 4 floor quad, six boxes for the
   items, every empty at plausible positions, four `nav` nodes in a square with
   `extras.edges`, three cameras with `extras.fov: 40`, written to
   `ai_tmp/stub-cabin/cabin.glb` (gitignored). A unit test is not possible under jsdom;
   the check is exercised from the scratch route and its two outcomes (pass; fail with
   a name) are recorded.

4. **The look.** `biscuit.ts` finds `Biscuit.Rig`'s skeleton, refuses a GLB missing any of
   `rig.json`'s 33 bone names, computes `scale = 0.55 / clips.height` (§5.1) and applies
   it to the model's root, and for every `SkinnedMesh` adds an outline: a clone sharing
   geometry and skeleton with `materials.ink()` (`MeshBasicMaterial`, `side: BackSide`,
   colour `#33221f`, the viewer's `(.20,.135,.12)` in sRGB) and an `onBeforeCompile`
   that pushes the vertex along its normal by `0.004 * scale` in object space (the
   native contour's figure). `materials.ts`: `biscuitRamp()` a 4×1 `DataTexture`
   (`NearestFilter`) whose four texels are the viewer's four shade colours in sRGB
   (`.32,.26,.245` / `.51,.43,.385` / `.82,.74,.66` / `1.0,1.0,.93` clamped), applied as
   `gradientMap` to a `MeshToonMaterial` per material carrying the source's `map`,
   `aoMap` (with `aoMapIntensity` 1) and, if present in the GLB, `normalMap` with
   `normalScale` `.18` for the face material and `.32` elsewhere (P03 strips normals;
   the branch is for the review below); `cabinRamp()` a 6×1 texture of a smoother
   five-step ramp from `#3a2a22` to `#f2e2c8`, applied to every `cabin.*` material as a
   `MeshToonMaterial` with `vertexColors: true` and no map unless the source had one;
   `glass` is `transparent` with `opacity 0.35`; `disc()` a `CircleGeometry` of radius
   `0.18` at `y = 0.002` under the model, `MeshBasicMaterial` colour black, `opacity
   0.4`, which is the 0.6 rule on a lit floor (§5.3). Set `renderer.outputColorSpace`
   to sRGB and `toneMapping` to none: a toon ramp tone-mapped is a different ramp.

5. **Rigs and cameras.** `lighting.ts` builds one `Group` per phase from the cabin's
   light positions and switches visibility on `state.phase` (a cut; P07b adds the
   blend): a `HemisphereLight` (sky, ground, intensity) of `(#f6ead8, #5a3a2a, 0.9)`,
   `(#d9a066, #3a2418, 0.5)`, `(#1a2236, #2a160f, 0.35)`; a `DirectionalLight` at
   `light.window` aimed at the floor's centre of intensity `2.2`, `0.6`, `0` in the
   phase's tint; a `PointLight` at `light.fire` `(#ff9a3c)` of `0.6`, `1.6`, `3.0` with
   `distance 4`; a `PointLight` at `light.lamp` `(#ffd08a, 1.4, distance 3)` on when
   `state.lights.lamp`; one small `PointLight` per `light.strings.*` `(#ffe1a8, 0.25,
   distance 1)` on when `state.lights.strings`. All three window panes' emissive is
   the sky per phase (`#e8f0f8`, `#e69a5a`, `#141a2c`). `camera.ts` creates one
   `PerspectiveCamera` and, for `state.camera`, copies the preset node's position and
   orientation (its −Z is the view) with `fov` from `userData.fov`; on resize it keeps
   the floor's full width in view in portrait by moving the camera back along its −Z,
   never by changing `fov`.

6. **`hit.ts`**: `hitAt(x, y, size, camera, cabin, biscuit): Hit` where `Hit = { kind:
   'item'; item: string } | { kind: 'biscuit' } | { kind: 'floor'; point: { x; z } }`,
   a `Raycaster` over every descendant mesh of every `item.*` node, then Biscuit's
   meshes (not the outlines), then the floor; the nearest wins. The component calls it
   on `pointerup` when the pointer moved less than 8 px since `pointerdown` and hands
   the result to `onTap`. The canvas hit is a convenience: P08's buttons are the
   controls, and this ticket's component works with no tap at all.

7. **Still mode.** `still.ts` exports `renderOnce(renderer, scene, camera)` and
   `stillFor(state): string` mapping `state.activity` and `state.at` to the still's key
   (`idle`, `sleep.bed`, `sleep.chair`, `drink`, `eat`, `play`) and `state.phase` to the
   file, through the `assets.still` prop the page supplies (so the asset URLs are
   imported in the page, where Vite resolves them with `paths.base`). With
   `animations` false, `apply` never subscribes to the frame port; every `apply` renders
   exactly once; the fire quad shows its middle frame. `capture(): string` renders once
   through `renderOnce` and returns `renderer.domElement.toDataURL('image/png')` in the
   same call, so the buffer is read before the browser clears it (§11 claim 12); it
   touches neither the frame loop nor the state, so P08's photo mode sends the director
   nothing.

8. **The route test.** `tests/scene-canvas.test.ts` renders `SceneCanvas` with a fake
   frame port, an `initialState`, `animations: false`, and asset URLs that are plain
   strings, under jsdom (which has no `WebGL2RenderingContext`), and asserts by role
   that an `img` with the state's alt text is present and that no `canvas` is reachable
   (it is `aria-hidden`; assert through the container that it carries the attribute).
   The component must not throw when `getContext('webgl2')` returns `null`: it sets
   `lost` and shows the still. A second case renders with `webgl: false` and asserts the
   same still and no scene construction (the fake frame port records no `each` call).

9. **Check CONVENTIONS.md §11 claim 9.** `BASE_PATH=/pawlour just frontend-build`
   from a scratch route that imports `$lib/assets/biscuit.glb`, then `grep -o
   '/pawlour/_app/immutable/assets/biscuit[^"]*glb' build/index.html` or the route's
   HTML: the URL carries the base. Record the URL.

10. **Check §11 claim 11 and take the screenshot: the gate.** `just preview-lan` and
    open the scratch route on the maintainer's iPhone, or `just preview` in a desktop
    browser with the viewport at 390×844, from `camera.hearth` at each phase; save
    three screenshots under `ai_tmp/look/<phase>.png`. Stop and ask the maintainer to
    approve the look: Biscuit reads as the cel character in D's previews, the room
    reads as a painted plane rather than a flat cartoon, the vignette holds. If the
    maintainer asks for the normal maps back, hand back to P03 the one-line change to
    `scripts/build_assets.sh` and record it; do not edit P03's file.

11. **Run the gate**: `just frontend-static`, `just frontend-build`, `just check`. Set
    `status: done`. Commit. Pushing and the pull request are authorised separately.

## Acceptance criteria

- [ ] `requireCabin` passes on `ai_tmp/stub-cabin/cabin.glb` and fails by name on a copy
      with `camera.window` removed (both outcomes recorded).
- [ ] `biscuit.ts` refuses a GLB missing a `rig.json` bone name and scales the model so
      its bind height is 0.55 units (asserted in the scratch route by reading the
      bounding box and recorded).
- [ ] Biscuit is drawn with a four-texel toon ramp and inverted-hull outlines; the room
      with vertex colours and a six-texel ramp; the disc sits under her.
- [ ] The three rigs and the three cameras switch on the state; `apply` with
      `animations: false` renders once per call (a counter on `renderer.render` in the
      scratch route, recorded).
- [ ] A tap on a box returns `item.<name>`; on Biscuit `biscuit`; on the floor a point.
- [ ] `tests/scene-canvas.test.ts` passes: the still is shown and nothing throws without
      WebGL, and `webgl: false` shows it too.
- [ ] `capture()` returns a non-blank PNG data URL (in the scratch route, drawn to a 2D
      canvas and one lit pixel read; recorded); `WEBGL_lose_context.loseContext()` shows
      the still and fires `onContextLost`; a tap on the still calls
      `forceContextRestore()` and the scene returns (recorded).
- [ ] The maintainer has approved the three screenshots (the date in the hand-back).
- [ ] No file under `src/lib/` changed; `just frontend-coverage` is unchanged from P06.
- [ ] `just check` is green.

## Verification

```sh
node scripts/stub_cabin.mjs && ls -la ai_tmp/stub-cabin/cabin.glb
just frontend-static
npx vitest run tests/scene-canvas.test.ts
BASE_PATH=/pawlour just frontend-build && grep -o '/pawlour/_app/immutable/assets/[a-z]*[.-][A-Za-z0-9_-]*\.glb' build/index.html | sort -u
git status --porcelain src/lib
just check
```

Expected: the stub written; clean; one file, green; two URLs (`biscuit` and `cabin`)
carrying `/pawlour/`; nothing under `src/lib` changed; green.

## Hand-back notes

P05 input update, 2026-09-25: the maintainer moved `item.shelf` to the left wall at
(−2.30, 0, −0.40), facing +X, and added `glass.window.left` and
`glass.window.hearth`. Use CONVENTIONS.md §5.2 and P05's revised Step 2 table when
building the stub and validating the real cabin. All three panes are descendants
of the same `item.window`, bind transparent `cabin.glass`, and receive the phase's
sky colour. Camera presets, bowls, approaches and navigation have not moved.

Filled in by the agent that executes this ticket.

- The viewer's ramp, light, ink and `normalStrength` values as read from D, and the
  three.js values chosen from them.
- The scale factor computed, and the bounding box after scaling.
- The `requireCabin` outcomes on the stub and on the broken copy.
- The render counter figures with `animations: false`.
- The built asset URLs (§11 claim 9).
- The screenshot paths, the date of the maintainer's approval, and whether the normal
  maps were asked for (§11 claim 11; a hand-back to P03 if so).
- Which open points below were settled.

## Open points

- **A story for `SceneCanvas`.** T requires a story per component under
  `src/lib/components/`; this component is under `src/routes/` and has none. Recommend a
  story anyway that renders with `webgl: false`, so Chromatic sees the fallback and axe
  checks the `img`'s name; P08 writes it beside its own stories.
- **`preserveDrawingBuffer`.** Off here for performance; `capture()` re-renders
  synchronously before `toDataURL` (§11 claim 12). If P08 still finds the capture blank,
  the flag goes on for the one render and this ticket's follow-up carries it.
- **Theme changes.** The scene's ground is its own painting, not the platform's
  `--background`, so no `MutationObserver` on `data-theme` is needed; the `.scene`
  wrapper's background is `var(--background)` for the letterbox. Confirm with P08.
