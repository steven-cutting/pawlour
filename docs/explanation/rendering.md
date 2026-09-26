---
title: "Rendering"
kind: "explanation"
audience: [contributor, maintainer, agent]
canonical_for: [rendering_model]
requires: []
---

# Rendering

The room and Biscuit are drawn by three.js on one canvas
([Decision 0015](../decisions/0015-three-js-is-the-renderer.md)). All of that code lives
under `src/routes/scene/`, outside the coverage floor, and holds no decisions: it is
handed a `SceneState` by the page and draws it
([Decision 0013](../decisions/0013-the-canvas-lives-outside-the-coverage-glob.md)). What
she does next is [the director's](the-director.md) business; what the picture should
look like is [Art direction's](../design/art-direction.md). This page is how the one
becomes the other.

## The parts

| Module | Does |
| --- | --- |
| `SceneCanvas.svelte` | Owns the canvas, reads the device pixel ratio and size inside `onMount`, and shows the still whenever there is no drawn frame. |
| `scene.ts` | Builds the renderer, loads both GLBs with `GLTFLoader` and `MeshoptDecoder`, reports progress, and applies each state. |
| `cabin.ts` | Refuses a room that breaks [the contract](../design/the-room.md) and returns its named nodes. |
| `biscuit.ts` | Refuses a model missing a bone of the rig, scales her to 0.55 units, stands her on the floor, adds her outlines and places her at the thing she is at. |
| `materials.ts` | The toon ramps, the ink, the contact disc, the still fire and the vignette. |
| `lighting.ts` | The three phase rigs and the window glass tint. |
| `camera.ts` | Places the camera at the preset and fits the floor into a portrait screen. |
| `hit.ts` | Turns a tap into an item, Biscuit or a floor point. |
| `still.ts` | Names the still for a state and draws a single frame. |

## Materials

The GLBs arrive with physically based materials, and every one is replaced when the scene
loads. Biscuit's become `MeshToonMaterial` with a four-step colour ramp sampled with
nearest filtering, so light falls in hard bands; her colour and occlusion maps are
carried across and her roughness is dropped. Each of her skinned meshes gets an outline:
a clone drawn from the back faces in a warm near-black ink, `#33221f`, pushed out along
the normal by 0.004 of the model's size. Under her sits a flat, hard-edged disc at about
0.6 of the floor's value. Nothing casts a shadow map.

The room's materials become the same toon material with a six-step ramp from `#3a2a22`
to `#f2e2c8`, multiplied by the vertex colours the room was painted with, and no
outlines. The window panes are made transparent and take the phase's sky colour. A
vignette is drawn last over the whole frame, never inside a shape.

The stock toon shader reads only the red channel of its ramp; the runtime patches it to
read the ramp's full colour, which is where the warm shadows come from.

## Light and camera

Each phase is a fixed rig built once, and a phase change switches rigs:

| Phase | Ambient | Window light | Fire light |
| --- | --- | --- | --- |
| morning | pale, strong | the key | weak |
| evening | amber, dim | weak amber | medium |
| night | blue-black, dim | off | the key |

The floor lamp and each string light are small point lights, shown when the director's
`lights` say so. The camera sits at the preset named by the state's `camera`, looking
along the preset's −Z with its vertical field of view and the horizon held level. On a
portrait screen it backs away along its own axis until all four corners of the floor are
in view; it never changes the field of view. The device pixel ratio is capped at 2.

## When it draws

Only through the frame port, and only while animations are active — the platform's
setting and the device's reduced-motion preference together. Otherwise it draws exactly
one frame each time it is handed a state: the still diorama, with the lights cut rather
than blended and the fire at a fixed frame.

Before the first frame, and whenever drawing is impossible, the component shows the
still for the current activity and phase — `stills/<activity>.<phase>.webp` — as an image
whose alternative text is the caption. When the WebGL context is lost it reports the
loss, and the still becomes a button, "Retry 3D scene", that asks for the context back.
A device without WebGL 2, or the component given `webgl` set to `false`, builds no scene
at all and shows only the still; the story and the unit tests use that.

The component exposes two functions to the page. `capture()` draws one frame
synchronously and returns it as a PNG data URL for photo mode, without touching the
director or the frame loop. `forceContextRestore()` is what the retry button calls.

## Taps on the canvas

A tap — one pointer, primary button, moved less than eight pixels — is raycast against
every mesh under every `item.*` node and against Biscuit, and reported as the item's
node name, `biscuit`, or a point on the floor. The page turns that into a command. The
canvas itself is hidden from assistive technology: the named controls beside it are the
controls, and a tap on the picture offers nothing they do not.

## Motion

With motion on, the motion layer plays her clips on an animation mixer, crossfading
over 250 milliseconds, playing `sit` and `lie` in reverse to stand, and layering `pet`
additively over whatever she was doing. She walks the waypoint graph at the walk clip's
own speed, turning in place before she sets off, and reports `arrived` to the director.
Breathing, an ear twitch, a tail sway and a head turn toward what she is looking at are
layered procedurally on top of any clip. The fire is three flipbook planes with rising
embers and a flickering light; rain or snow falls in the boxes behind the three panes;
the tea steams. A phase change blends the rigs over 600 milliseconds.

## Related pages

- [Art direction](../design/art-direction.md)
- [The room](../design/the-room.md)
- [The director](the-director.md)
- [Performance budget](../reference/budget.md)
- [Decision 0015: three.js is the renderer](../decisions/0015-three-js-is-the-renderer.md)
