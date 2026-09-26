---
title: "Author a clip"
kind: "how-to"
audience: [contributor, maintainer, agent]
canonical_for: [clip_authoring]
requires: []
---

# Author a clip

Every animation Biscuit plays is a Python script under `blender/clips/` that keyframes
the approved rig. There is no pose tweening in the browser: a clip is authored in
Blender, reviewed on a contact sheet, and exported with the model. This page is how to
write or change one.

## The shape of a clip

One file per clip, named after the clip with the dot as an underscore
(`blender/clips/idle_sit.py` is `idle.sit`). It sets three constants and one function:

```python
from _keys import begin, endpoints, finish, key_bone

NAME = "idle.sit"   # the clip's name, as the runtime asks for it
LOOP = True
FRAMES = 120        # samples at 30 fps; the clip lasts (FRAMES - 1) / 30 seconds


def build(rig, start):
    begin(rig, NAME, "sitting", start, FRAMES)
    endpoints(rig, start, FRAMES, all_ik=True)
    ...
    return finish(rig, start)
```

`build` creates an Action named `NAME`, keyframes it from frame `start`, pushes it as a
strip on an NLA track of the same name, and returns the first free frame after it.
`blender/clips/_keys.py` holds the shared helpers — applying a preset pose, keying a bone
as an offset from it, planting and stepping paws, easing — and `build_clips.py` skips any
file whose name starts with `_`.

## The rules

- **Authored in place.** No clip moves `root` along the floor. `walk` bobs `root`
  vertically and cycles the legs; the runtime moves her. Its forward travel per cycle is
  `STRIDE` in `walk.py`, in model units, which the runtime scales so the feet do not
  slide.
- **Start and end on the approved poses.** `idle.stand`, `walk`, `drink`, `eat`, `play`
  and `pet` start from `standing`; `idle.sit` from `sitting`; `sleep` from `lying`. `sit`
  goes standing to sitting and `lie` sitting to lying; the runtime plays them in reverse
  to stand up. Clip-level limb corrections are allowed so the soles rest on the ground;
  the pose files themselves never change.
- **IK is allowed, and is baked.** A clip may turn on a paw's `IK influence` and key its
  target. Every clip keys every paw's influence on its own first and last frame, so no
  clip inherits a value another left behind. The export bakes the result into the deform
  bones.
- **Loops loop.** Every clip but `sit`, `lie` and `pet` has identical first and last
  frames.
- **`pet` is additive.** It moves only `neck`, `head`, `tail.1`, `ear.1.L` and `ear.1.R`
  and holds every other bone at the preset, so the runtime can layer it over whatever is
  playing. Keep any lean above the legs: a lean through the spine drags planted feet.
- **Leave the sweater alone.** Its corrective shape keys are driven by the bones, and
  the exporter bakes them. No clip keyframes a shape key.

## The clips

| Clip | Samples at 30 fps | Kind | Reads as |
| --- | --- | --- | --- |
| `idle.stand` | 120 | loop | standing, weight shifting once, head turning a little |
| `idle.sit` | 120 | loop | sitting, ears settling, one look aside |
| `walk` | 30 | loop | one four-beat stride cycle, tail up |
| `sit` | 30 | one-shot | standing to sitting |
| `lie` | 36 | one-shot | sitting to lying, head coming down last |
| `sleep` | 180 | loop | lying, head turned away from the hearth camera, because her eyes stay open |
| `drink` | 60 | loop | head down to a bowl, small lapping nods |
| `eat` | 60 | loop | head down, a chewing motion, one glance up |
| `play` | 90 | loop | a shake of the head with the toy, a drop, a paw at it |
| `pet` | 60 | one-shot, additive | a lean into the touch, tail up, ear back, settle |

Yawn, stretch, circling, the treat and a directed look are later clips.

## Change or add a clip

1. Edit or create the script under `blender/clips/`.
2. Build the working copy and check it:

   ```console
   just model-clips
   just model-check-clips
   ```

   The check rejects a loop whose ends differ, root travel along the floor, keys
   outside the clip's own frames, and an additive `pet` that moves any other bone.

3. Render its contact sheet: twelve evenly spaced frames, from a fixed review camera,
   written to `ai_tmp/clips/<name>.jpg`:

   ```console
   just model-sheet idle.sit
   ```

4. **The maintainer approves the sheet.** That approval is the gate for the clip, and a
   refused clip is reworked, not shipped.
5. Export and build the served model, as [Export the model](export-the-model.md) and
   [Build assets](build-assets.md) describe. `just assets-build biscuit` rewrites the
   clip table and runs `just check-model-asset`, which plays every clip in three.js and
   checks its length and the soles' contact with the floor.

A new clip's name also has to be added where the tools list the clips: `CLIPS` in
`scripts/contact_sheet.py`, the loop set in `scripts/clip_table.mjs` if it loops, and the
expected durations in `scripts/check_model_asset.mjs`.

## Related pages

- [Export the model](export-the-model.md)
- [Build assets](build-assets.md)
- [The director](../explanation/the-director.md)
- [Terminology](../project/terminology.md)
