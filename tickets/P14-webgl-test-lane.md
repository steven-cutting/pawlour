---
id: P14
title: "A WebGL2 test lane: the scene runtime and its page wiring proved in real Chromium, inside the gate"
status: open
depends_on: [P07b, P08]
parallel_with: [P09, P10]
branch: ticket/p14-webgl-test-lane
estimated_size: M
---

# P14: A WebGL2 test lane: the scene runtime and its page wiring proved in real Chromium, inside the gate

## Context

Everything under `src/routes/scene/` and every prop the page hands `SceneCanvas` is
proved today by one of three things, none of which is a test the gate runs:

- `tests/scene-canvas.test.ts` renders the component under jsdom, where
  `window.WebGL2RenderingContext` is undefined, so `boot()` never runs and the
  component's WebGL branches (`ready`, `lost`, `failed`, `onError`, `onArrived`,
  `forceContextRestore` against a live scene) are unreachable. Invariant 3 (`AGENTS.md`)
  forbids stubbing the global to reach them, and rightly: a stubbed context proves
  nothing about a real one.
- `tests/scene-assets.test.ts`, `scene-motion.test.ts` and `scene-effects.test.ts` drive
  the three.js objects in Node with a renderer factory the test supplies. They prove the
  runtime's arithmetic, not that a canvas draws, loses its context, or recovers.
- Disposable review routes. P07a and P07b each wrote a temporary route, drove it with a
  local Chromium script (`just scene-review <script>`), recorded the evidence under
  `ai_tmp/`, and removed the route (`P07a-scene-static.md` and `P07b-scene-motion.md`,
  hand-back notes). P08's adversarial review did the same for the failed-first-load path:
  the fix that hides the loading card and surfaces the retry button is verified only by a
  Playwright script against the preview build (`P08-interface.md`, "Codex adversarial
  review", finding 2), and that script is scratch.

The pattern is the problem. Each ticket rebuilds a throwaway harness, the evidence rots
in `ai_tmp/`, and a regression in any of these paths is caught by nobody until a device
pass. `docs/reference/testing.md` ("What the current suite proves") records the stance
honestly, and the `SceneCanvas` story's own note still points at a review route that no
longer exists.

The repository already runs real Chromium inside the gate: `vitest.storybook.config.ts`
renders every story in Chromium through `@vitest/browser-playwright`, with axe over each,
and `scripts/check_playwright_browsers.js` fails fast when the browser is missing. On
2026-09-26 that same Playwright Chromium, launched with `--use-gl=angle
--use-angle=swiftshader`, loaded the real scene, walked her to the water bowl, reported
the arrival and drew the failure path (the memory note in the maintainer's Claude
project records it; the P08 hand-back has the run). So the browser, the provider and the
install check exist; what is missing is a test lane that points them at the scene with
WebGL on.

Read first: `AGENTS.md` (invariants 3 and 7; "Tests inject fakes; they never stub a
global"); `docs/reference/testing.md` whole; `docs/explanation/layering.md` (why the GPU
adapter sits outside `src/lib/**`); `vitest.storybook.config.ts` (its header explains
why a browser run must be a config of its own, to keep the coverage floor honest);
`CONVENTIONS.md` §10 (the files reserved from the lanes: `Justfile`,
`vitest.storybook.config.ts` and the prek configs are among them, so this ticket, like
P11, runs after the lanes have merged and may edit them); `src/routes/scene/scene.ts`
(`createScene`'s options and the `rendererFactory` argument); `src/routes/scene/SceneCanvas.svelte`;
`src/routes/+page.svelte` (the `onProgress`/`onReady`/`onError`/`onArrived` handlers).

## Goal

At the end of this ticket, on branch `ticket/p14-webgl-test-lane`:

- A browser test lane exists that runs `tests/browser/**/*.test.ts` in real Chromium
  with a WebGL2 context, through the same `@vitest/browser-playwright` provider the
  story run uses, in a config of its own (`vitest.browser.config.ts`) so that it
  contributes nothing to the `src/lib/**` coverage measurement — the same reasoning
  `vitest.storybook.config.ts` states in its header.
- The lane covers, without stubbing any global and without a review route:
  1. `SceneCanvas` with `webgl: true` and the real assets: `onProgress` climbs,
     `onReady` fires once, a canvas is in the document, and `capture()` returns a PNG
     data URL of the drawn size.
  2. A failed first load: assets pointing at URLs that do not resolve (a bad path, or
     a served fixture the test controls — not a stubbed `fetch`). `onError` fires, the
     retry button is in the tree, and a click on it reports progress again. This is the
     path P08's finding 2 could not test.
  3. Context loss and recovery through the real `WEBGL_lose_context` extension on the
     canvas the component made: `onContextLost` fires, the still and the retry button
     take the canvas's place, `forceContextRestore()` brings the drawing back and
     `onRestored`'s effect (the still leaves) is observed.
  4. A walk: with `animations: true` and a state whose `target` is a walk item, the
     runtime calls `onArrived` exactly once, and the arrival lands within the time the
     measured walking speed in `P07b-scene-motion.md` predicts plus a margin.
  5. The page itself, mounted with fake ports as `tests/route.test.ts` mounts it but
     with real WebGL underneath: the loading card is shown while the assets load and
     gone once `onReady` fires; with the assets unreachable, the card is gone, the
     notice "The room could not be drawn." is announced, and the retry button is
     reachable by a real pointer click (Playwright's actionability check is the
     assertion: the review's complaint was that the fixed card sat over it).
  6. The `?debug` hook's isolation, through `SceneHandle.diagnostics()` on a drawn
     scene: after `hideRoom()`, an `apply()` with the other `animations` value, an
     `apply()` that starts a walk and a `resize()` each leave `read().calls` and
     `read().triangles` at the Biscuit-only figures, and `showRoom()` raises them
     again. P10's adversarial review found the room coming back on the next
     `update()`; the fix (`roomHidden` in `scene.ts`) is evidenced today only by a
     Chromium probe recorded in `P10-device-verification.md`, because `createScene`
     loads through the browser's loaders and no jsdom test can reach it without a
     seam this ticket's non-goals rule out.
- `just browser-test` runs the lane; `just check` includes it; `docs/reference/testing.md`
  and `docs/reference/commands.md` describe it; the `SceneCanvas` story note no longer
  points at a review route. `just scene-review` stays for one-off visual work, and the
  testing page says which of the two to reach for.
- The lane is deterministic: no wall-clock sleeps for readiness (wait on the callbacks),
  a frame port the test drives where a frame count matters, and the walk's timing
  asserted with a margin the ticket states and justifies.

## Non-goals

- Pixel assertions on the drawn scene. What a frame looks like is the maintainer's eye
  (CONVENTIONS.md §10) and Chromatic's; this lane proves that drawing, loss, recovery,
  failure and arrival happen, not what they look like.
- Raising the coverage floor's boundary to include `src/routes/scene/`. The floor is
  measured by the unit run alone and this lane must not feed it; whether the GPU adapter
  should carry a floor of its own is a decision for the handbook, not this ticket.
- Performance figures. Frame time and draw calls on the phone are P10's; SwiftShader's
  numbers mean nothing for the budget.
- Any change to the scene runtime or the page except what a test needs to reach a path
  through its existing options (for instance, a `rendererFactory` the test supplies to
  count draws is already there; add nothing that exists only for the test).

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `vitest.browser.config.ts` | repo, reserved (§10) | new: the lane, modelled on `vitest.storybook.config.ts` |
| `vitest.config.ts` | repo, reserved (§10) | lists the new project beside the other two, if that file still names them |
| `tests/browser/scene-canvas.browser.test.ts` | repo | new: goals 1 to 4 and 6 |
| `tests/browser/page.browser.test.ts` | repo | new: goal 5 |
| `tests/browser/fixtures/` | repo | served fixtures the failure test controls, if a bad path alone is not enough |
| `Justfile` | repo, reserved (§10) | `browser-test`; `check` includes it; `check-browsers` runs before it as it does before the story run |
| `package.json` | repo, reserved (§10) | a `test:browser` script if the recipe needs one; no new dependency unless SwiftShader needs a flag the provider cannot pass (see Open points) |
| `docs/reference/testing.md`, `docs/reference/commands.md` | docs | the lane, and when to use it over `just scene-review` |
| `stories/SceneCanvas.stories.svelte` | repo | the note that names the review route |
| `tickets/P14-webgl-test-lane.md` | tickets | `status: done` |

## Steps

1. **Prove the context.** Before writing a test, run a one-line browser test that
   asserts `document.createElement('canvas').getContext('webgl2')` is non-null under the
   lane's Chromium. If it is null headless, find the launch flag (`--use-gl=angle
   --use-angle=swiftshader` worked on 2026-09-26 from a Playwright script) and pass it
   through the provider's instance options; record what was needed in the config's
   header. If no flag makes it work headless, stop and report — the rest of the ticket
   depends on it.
2. **The lane.** `vitest.browser.config.ts` after `vitest.storybook.config.ts`: the
   `sveltekit()` plugin, the browser block, `include: ['tests/browser/**/*.test.ts']`,
   no coverage block, and a header saying why it is a separate file. Wire the recipe and
   the gate.
3. **`SceneCanvas` in the browser.** Goals 1 to 4 and then 6, in that order; each waits on a
   callback, never on time, except the walk, which waits on `onArrived` with a timeout
   derived from the measured speed and the distance to the target. Serve the real
   assets the way the app does (`?url` imports resolve under Vite in the browser run).
4. **The page in the browser.** Goal 5, mounting `+page.svelte` with the fake ports
   from `tests/route.test.ts` (extract the `fakes()` helper to `tests/helpers/` if both
   files need it; do not duplicate it). The failure case points the page's assets at
   the unreachable URLs — this needs the page to take its assets from a prop or a
   module the test can influence without a global; if it cannot today, that is a
   hand-back to the page, not a stub.
5. **Docs and the story note.** Update the two reference pages and the story; run
   `just check-docs`.
6. **Retire the scratch.** Nothing in `ai_tmp/` is evidence any more for the paths the
   lane covers; say so in the hand-back and leave `just scene-review` for visual work.

## Acceptance criteria

- `just browser-test` runs the six goals green in headless Chromium on the maintainer's
  machine and in CI, with WebGL2 present and no global stubbed.
- `just check` includes the lane, and the `src/lib/**` coverage figures it reports are
  unchanged by it.
- Turning any one of these off in the source breaks a test in the lane: the `onError`
  callback in `SceneCanvas`, the page's card-hiding `onError` handler, the page's
  `onArrived` dispatch, and the retry button's restore.
- `docs/reference/testing.md` no longer describes real WebGL checks as review-route
  work, and names what the lane proves in its table.

## Verification

```text
$ just browser-test
$ just check
$ git diff --stat
```

Record the run's numbers and the SwiftShader flag decision in the hand-back notes.

## Open points

- **Headless WebGL2 without flags.** Whether Playwright's headless Chromium exposes a
  WebGL2 context without `--use-gl=angle --use-angle=swiftshader` is unmeasured for the
  Vitest browser provider; the flag is known to work from a raw Playwright launch.
  Step 1 decides.
- **A coverage floor for the GPU adapter.** With the lane in place the adapter is
  measurable for the first time. Whether to hold `src/routes/scene/**` to a floor of its
  own, in this config, is a handbook decision; raise it in the hand-back with the number
  the first run reports.
- **CI cost.** Real assets in a real browser: measure the lane's wall time in CI and, if
  it dominates `just check`, say so in the hand-back so the maintainer can decide whether
  it runs on every push or only on the main branch.
