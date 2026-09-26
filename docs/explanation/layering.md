---
title: "Layering and dependency direction"
kind: "explanation"
audience: [contributor, maintainer, agent]
canonical_for: [dependency_boundaries]
requires: []
---

# Layering and dependency direction

Three layers, and imports only ever run downwards.

| Layer | May import | Must not |
| --- | --- | --- |
| `src/routes/` | components, ports, brand, config, the platform package | be imported by anything below it |
| `src/routes/scene/` | the director's state and types, injected ports, three.js | decide game behaviour or subscribe to frames while motion is off |
| `src/lib/components/` | components, brand, config, platform components and types | import a port adapter or reach for a browser global |
| `src/lib/ports/` | config | import a component or a route |
| `@steven-cutting/biscuit-games` | nothing here | be copied back into `src/` |

`src/lib/config.ts` and `src/lib/brand.ts` sit below everything and import nothing. The
package is below every layer: it is a dependency, so anything may name it and it names
nothing here.

The pure rules live under `src/lib/domain/`. A component may name their types, render
their values and call the callbacks it was handed. It may not construct a port, reach
for a browser global, or keep a fact the rules own as view state of its own.

The three.js adapter is a route-level boundary, including `SceneCanvas.svelte`.
It receives `SceneState`, asset URLs (including the fire atlas), the frame port,
a separate visual random port and callbacks, including `onArrived`. Browser setup
runs inside `onMount`; the director owns every activity, phase and camera choice.
Static drawing samples a fixed pose and never subscribes to frames. Animated
drawing has one frame subscription, clamps elapsed time to 50 ms, and updates
clips, walking, procedural idle, fire, weather, steam and the light blend before
drawing. Reapplying state or resizing preserves the live pose and walk position.
Motion off, context loss, rendering failure and disposal stop the subscription;
recovery starts it once. The scene's GPU resources and listeners are disposed
when the component is destroyed.

The page forwards `onArrived` as the director's `arrived` command. It passes the
director's settled motion-off state to the still renderer, including a walk's
destination. Visual random draws must not consume the director's stream: frame
rate and weather density cannot change her next choice or caption. The `wipe`
helper uses the platform's duration and easing tokens and resolves immediately
when the duration is zero; it does not start another frame loop.

## Why the direction matters

The rule is not tidiness. It is what makes the claim below true, and that claim is
load-bearing:

**Components are testable without the platform.** A component that read `localStorage`
directly could only be tested where `localStorage` exists. Under Node 26 and jsdom it does
not — Node's own experimental global shadows jsdom's and stays undefined. Because the
storage adapter takes its backing store as an argument, that costs nothing: the test
passes a store in, and the real code path still runs.

## Where a side effect goes

If something new needs the outside world, it needs a port. A port is three things in one
file:

1. An interface naming what the application needs, in the application's vocabulary.
2. A real adapter, with the platform object as a defaulted argument rather than a global
   read.
3. An in-memory fake with the same interface.

The game supplies storage, randomness, the clock and frames. The
device's preferences and the device's keyboard are the platform's, taken from
`@steven-cutting/biscuit-games` with the fakes it ships, because what a surface reads
from a device is not one game's question.

Both of those take their platform object as an argument for the usual reason — jsdom
supplies a `window` without `matchMedia`, so the adapter has to answer for its absence
itself rather than being stubbed around — and a game's route is where the ports are
constructed, because that is where a window exists.

The rule that follows: **tests inject fakes, they never stub globals.** A stubbed global
leaks between tests and hides the fact that the code reached outside its layer.

## Enforcement

There is no import-boundary checker here: a three-directory frontend does not earn the
machinery. The direction is enforced by review, by the `svelte-change` and `review-change`
skills, and by the shape of the tests: code in the wrong layer is usually code that is
hard to test.

## Related pages

- [Architecture](architecture.md)
- [Testing](../reference/testing.md)
- [Decision 0002](../decisions/0002-ports-and-fakes.md)
