---
title: "Decision 0015: three.js is the renderer"
kind: "decision"
audience: [contributor, maintainer, agent]
canonical_for: [decision_renderer]
requires: []
---

# Decision 0015: three.js is the renderer

## Context

The platform ships no renderer: its play surface is cells and keys in the DOM. Pawlour's
surface is a lit diorama with a skinned, animated model in it, which needs WebGL and a
scene graph, a glTF loader that understands skins, morph targets and meshopt
compression, and an animation mixer that crossfades clips and layers an additive one.

The studio has already chosen for the same model. Ticket C03 in `biscuit_studio`
(`tickets/C03-threejs-viewer.md`) builds its viewer on three.js, and its steps 5 and 6
specify the cel look this game reproduces: a toon material with a three-band gradient
map, and an inverted-hull outline per part.

## Decision

three.js is the renderer, pinned exactly in `package.json` with `@types/three` at the
same minor. `GLTFLoader` and `MeshoptDecoder` come from `three/addons`. All of it is
imported only under `src/routes/scene/`, as
[Decision 0013](0013-the-canvas-lives-outside-the-coverage-glob.md) requires.

Because a story that imports the scene pulls three.js into the story test run,
`vitest.storybook.config.ts` names `'three'` in `optimizeDeps.include` beside the
platform package. That file is managed by the template, so the line is a deviation that
`AGENTS.md` records.

## Consequences

**A dependency that moves monthly.** three.js releases a minor version most months and
treats minors as breaking; the pin is 0.186. Moving it is a deliberate upgrade that
re-checks the look on the phone, not a routine bump.

**The look is reproduced, not exported.** The cel shading in Blender is a node graph
that glTF cannot carry, so the GLB arrives with physically based materials and the
runtime replaces each with a toon material in code. The two can drift apart, and only
the maintainer's eye on a screenshot catches it. [Rendering](../explanation/rendering.md)
records the values the runtime uses.

**A copier update conflicts in one place.** `copier update` will show a conflict in
`vitest.storybook.config.ts` whenever the template changes that line; the resolution is
to keep the template's change and re-append `'three'`.

## What would reopen this

A renderer the platform adopts for every game. If Biscuit Games takes a 3D surface into
the package, this game moves onto it and the pin here is removed.

## Related pages

- [Rendering](../explanation/rendering.md)
- [Art direction](../design/art-direction.md)
- [Decision 0013: The canvas lives outside the coverage glob](0013-the-canvas-lives-outside-the-coverage-glob.md)
- [Maintain dependencies](../how-to/maintain-dependencies.md)
