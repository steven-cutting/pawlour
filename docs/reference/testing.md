---
title: "Testing"
kind: "reference"
audience: [contributor, maintainer, agent]
canonical_for: [testing_reference]
requires: []
---

# Testing

## Framework

Vitest in two configurations. The unit suite runs in jsdom with `globals: true` so Testing
Library registers its automatic cleanup hook, one setup line in `tests/setup.ts`, and is
configured in `vite.config.ts`. The story suite runs in real Chromium through Playwright
and is configured separately in `vitest.storybook.config.ts`.

A third file, `vitest.config.ts`, names those two as projects and holds nothing else. It
exists because `@storybook/addon-vitest` finds its runner's configuration by filename, and
the Testing Module in the Storybook UI otherwise resolves `vite.config.ts` and fails: the
project it filters for, `storybook:<configDir>`, is declared nowhere the jsdom suite can
see. Both recipes pass `--config` themselves, so neither depends on that discovery.

## Layout

Tests live in `tests/`, never colocated with `src/`. Stories live in `stories/`, also at
the repository root, one file per component.

| Suffix | Runner |
| --- | --- |
| `*.test.ts` | Vitest in jsdom. Everything in `tests/`. |
| `*.stories.svelte` | Vitest in Chromium, driven by Storybook. Everything in `stories/`. |
| `*.spec.ts` | Playwright directly. Reserved. Playwright itself is installed — it supplies the browser the story run drives — but no suite of this kind exists. |

Files are named for what they cover rather than mirroring a source path: `ports.test.ts`,
`platformSpecs.test.ts`, `lockup.test.ts`, `route.test.ts`.

Support files in `tests/` are imported rather than collected. `platform.ts` resolves what the package ships
through its own `exports` subpaths and refuses any path outside `node_modules`, because a
resolve that fell back to a copy in this repository would stay green while proving
nothing about the package this game actually installs. `restated.ts` is this game's table
of the platform clauses its modules restate, empty until it restates one.
`helpers/scene.ts` loads real GLBs and decodes their embedded images locally for
the scene suites. The `include` glob is `tests/**/*.test.ts`.

## Conventions

**Query by accessible role and name.** Never by class, never by test id. A query that
fails because a name is missing has found a real defect: it is the same information a
screen reader uses.

```ts
screen.getByRole('heading', { level: 1 });
screen.getByRole('main');
```

**Inject fakes; never stub a global.** Each port in `src/lib/ports/` exports an in-memory
fake alongside the real adapter, and every adapter takes its platform object as a
defaulted argument. This is not a stylistic preference, and it is not a jsdom workaround:
the story run is a real browser where a global would work, which is exactly why stubbing
one stays forbidden.

**Callbacks are asserted through the props.** Components take callbacks as props, so a
test passes `vi.fn()` and asserts on the call.

**A new component lands with its test and its story in the same change.**

## Story tests

`just storybook-test` renders every story in `stories/` in real Chromium and runs axe over
each one. A violation fails the run, because `.storybook/preview.ts` sets the accessibility
addon's test mode to error; the addon's own default only reports. Play functions run in the
same pass, which is where a guarantee about interaction — tabbing to a key and activating
it — becomes executable rather than described.

Stories are fixtures, not assertions. The evidence and the coverage floor stay in `tests/`.
And axe is not exhaustive: it skips what it cannot attribute, including anything behind
`aria-hidden`, so a guarantee resting on such an element still has to be measured by hand.
The procedure is in [Work in the component workshop](../how-to/work-in-the-component-workshop.md).

The lockup is the worked example of the split. The platform's `Wordmark` draws a mark
beside the words and hides it with `aria-hidden`, so the role-and-name convention cannot
reach it; `tests/lockup.test.ts` queries the mark by its text and asserts it is hidden,
and queries the words to assert they read `biscuit games /` followed by this game's name.
jsdom holds that the mark is there and silent. That the words leave the layout below
about 26rem is the platform's rule and a width, which jsdom has no layout engine to take,
so the story framed at the narrowest supported width measures it in Chromium. What this
repository holds is what it renders.

## Coverage

v8 provider, measured over `src/lib/**`, with a 90% floor on branches, functions, lines
and statements. Below the floor the run fails.

Only the jsdom suite is measured. Vitest 4 has no per-project coverage option and the v8
provider merges every project that ran into one report before it checks the thresholds, so
a story sharing a run with the unit suite would raise the number without adding an
assertion. The separation is the file it is declared in: the floor lives in
`vite.config.ts`, the story configuration has no coverage block at all, and
`npm run coverage` pins `--config vite.config.ts` so the run that measures the floor is the
run that cannot reach a story.

Distinguish an untested branch from an unreachable one. Defensive code no input can reach
should be deleted rather than covered; see
[Quality philosophy](../explanation/quality-philosophy.md).

## What the current suite proves

| Suite | Covers |
| --- | --- |
| `ports.test.ts` | The three ports here, storage, randomness and the clock: real adapter and fake, including the failure paths an unusable store produces. Managed by the template; a port this game adds gets its cases appended at the end. |
| `platformSpecs.test.ts` | The six figures `src/lib/config.ts` mirrors, held equal to the modules `@steven-cutting/biscuit-games` ships and to any module under `docs/specs/` that states them; and every clause `tests/restated.ts` lists, held to the platform's text word for word. |
| `lockup.test.ts` | That the lockup names this game after the platform, with the mark silent. This game's file. |
| `route.test.ts` | The page: the heading the platform header draws for this game, and a main landmark to put the game in. This game's file. |
| `scene-canvas.test.ts` | The scene's captioned still without WebGL, explicit `webgl: false`, state changes, and capture without a drawable frame. No browser global is stubbed. |
| `scene-assets.test.ts` | Real GLB loading, cabin and rig contracts, generated and broken stubs, quantized bind height, shared outline deformation, fixed poses, camera horizons and portrait framing, hit tests, gestures, still selection and resource disposal. Embedded images are decoded through a local GLTFLoader plugin. |
| `scene-motion.test.ts` | Real named clips, 250 ms fades, reverse stand segments, additive pet over drink, natural walking speed, all five destinations, retargeting, single arrivals, procedural offsets without drift and frame subscription lifetime. |
| `scene-effects.test.ts` | Fire atlas dimensions and palette, flipbook cadence, ember lifetime, exterior volumes for all three panes, shared particle budgets, interrupted 600 ms light blends, still cuts and token-gated wipe completion. |
| `scene-debug.test.ts` | The `?debug` hook: on only when the query carries `debug`, one console line a second counted from the renderer's own frame counter with a baseline taken at creation and divided by the time the clock says passed (a late tick reads its true rate, a tick that covered no time is skipped), the first-frame mark, the run's minimum and median, every `window.__pawlour` call forwarded to the scene, and removal on stop. The host and the clock are arguments, so no global is stubbed. |
| `stories/` | Each component rendered in every state its surface names, in Chromium with axe over every one, and the figures only a layout engine can produce: the seed story frames the header at the narrowest supported width and measures every control there. |

The GPU adapter stays in `src/routes/scene/`, outside the unchanged `src/lib/**`
coverage boundary. Its real WebGL checks use a disposable review route and a local
Chromium script, run with `just scene-review <script>`. The renderer factory permits
counting draws without replacing a global. The ticket records capture pixels,
context loss and recovery, pointer hits, keyboard retry, draw calls and the
maintainer's visual review. Motion recordings include bed arrival through sleep,
toy play, petting while drinking, night fire and rain. Walking and reverse clips
retain their natural time scale during fades; other crossfades may warp time.
Disposable probes, screenshots and recordings stay in `ai_tmp/`.

## Related pages

- [Test and debug](../how-to/test-and-debug.md)
- [Quality gates](quality-gates.md)
- [Accessibility](../explanation/accessibility.md)
