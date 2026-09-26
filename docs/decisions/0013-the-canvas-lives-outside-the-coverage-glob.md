---
title: "Decision 0013: The canvas lives outside the coverage glob"
kind: "decision"
audience: [contributor, maintainer, agent]
canonical_for: [decision_canvas_placement]
requires: []
---

# Decision 0013: The canvas lives outside the coverage glob

## Context

The template measures coverage with v8 over `src/lib/**/*.{ts,svelte}` and fails the
gate below 90% on branches, functions, lines and statements, with no exclude. The unit
tests run in jsdom, which has no WebGL context and no `requestAnimationFrame`. The
three.js code that loads the models, builds materials and lights, raycasts taps and
draws frames therefore cannot run in a unit test at all, let alone to 90%.

Lowering the threshold or adding a coverage exclude would break an invariant `AGENTS.md`
states: lower the code's complexity, not the threshold. The studio's three.js viewer,
ticket C03 in `biscuit_studio`, faced the same problem and kept its WebGL code outside
the measured tree.

## Decision

Everything three.js touches lives under `src/routes/scene/`, which the coverage
`include` does not reach. Everything with a decision in it — what she does next, which
phase it is, which caption to show, how long anything lasts — is a pure module under
`src/lib/` and is tested to the floor like any other. The browser touchpoints the scene
needs are ports under `src/lib/ports/` with fakes: the frame port stands in for
`requestAnimationFrame`, and the clock, timer and random ports for the rest.

`vite.config.ts` is not edited. The split is a rule about where code goes, not a setting.

## Consequences

**No unit test measures the canvas code.** A regression in the materials, the lighting,
the camera or the hit-test is caught by the story build, by the maintainer's eye on a
screenshot, or on the phone, never by the coverage figure. The pressure is to keep the
scene thin: anything that can be a pure function of a state is moved to `src/lib/` and
tested there.

**The story renders only the still.** A snapshot of a live WebGL canvas differs from run
to run, so the `SceneCanvas` story mounts the component with `webgl` set to `false` and
shows the fallback image. Chromatic compares that, and the platform controls around it,
not the scene.

**The layering has one more rule to learn.** A route may import ports and components, as
[Layering](../explanation/layering.md) says; the scene's modules are a route's, and
nothing under `src/lib/` imports from `src/routes/scene/`.

## What would reopen this

A coverage exclude that the template itself sanctions, or a test environment the
template adopts that can create a WebGL context. Either would let the scene move under
`src/lib/` and be measured.

## Related pages

- [Rendering](../explanation/rendering.md)
- [The director](../explanation/the-director.md)
- [Decision 0002: Side effects behind ports](0002-ports-and-fakes.md)
- [Testing](../reference/testing.md)
