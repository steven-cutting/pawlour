---
id: P21
title: "Fill the screen: the room takes what the viewport leaves, the camera fits its subject, and landscape gets a layout"
status: done
depends_on: [P11]
parallel_with: [P12, P13, P16, P17, P18, P19]
branch: ticket/p21-fill-the-screen
estimated_size: M
---

# P21: Fill the screen: the room takes what the viewport leaves, the camera fits its subject, and landscape gets a layout

## Context

The room is small on the phone for two reasons the maintainer named on 2026-09-27. The
box: `src/routes/+page.svelte` gives `.room` `clamp(16rem, calc(100svh - 16rem), 40rem)`
inside the platform's centred `.shell` (`max-inline-size: var(--shell-max)`, 34rem;
`padding-inline: var(--shell-pad)`, 16px), and above 60rem a 9:16 box 22.5rem wide; at
844×390 the box is 16rem tall and the page scrolls. The camera:
`src/routes/scene/camera.ts` retreats along the preset's axis in portrait until all four
`FLOOR_CORNERS` fit, which from the authored presets is 15.6 m for hearth, 23.5 m for
window and 30.7 m for chair at 390×844, so the room ends up a fifth of the height;
landscape gets no fit at all. P11 declined P05's tight chair crop because of this
retreat (`tickets/P11-follow-up.md`, the chair-camera item). `CONVENTIONS.md` §1
decision 2 ("the platform's dark shell, header, lockup, type and controls surround the
scene"), §5.4 (the camera bullet) and §7 (the layout sentence), and
`docs/explanation/rendering.md` "Light and camera", state the shipped behaviour.

Where she settles is six points and nothing else: `activityFor(item).spot` for the five
walk items (`src/lib/domain/items.ts`, `PLANS`) and `nav.0`, where she opens
(`src/routes/scene/biscuit.ts`, `apply`); a floor tap only turns her head
(`src/lib/domain/director.ts`), and she never walks to the lamp or the lights.

Decisions the maintainer took on 2026-09-27, fixed: the box grows to what the viewport
leaves and the camera frames tighter, fitting each preset's own subject in both
orientations (hearth: all six settle points; window: `spot.chair`, `item.toy.approach`,
`nav.0`; chair: `spot.chair`), accepting that she can leave the frame from window and
chair while they are chosen, as she already does today in landscape, until P22 follows
her; landscape on a phone puts the room at the remaining height with the caption,
controls and notice in a column on the right and the header either vertical on the left
or overlaid minimally on the room's top; on desktop the room breaks out of the shell to
the viewport width while the header and controls stay in the column, recorded as a
decision; DPR stays capped at 2 unless a gated local check in Chrome says otherwise,
and the device re-measure is a follow-up. P22 (the camera follows her through zones,
more presets, the visibility guarantee) depends on this ticket and on P19, so the
`camera.ts` change here is minimal and named: `frameCamera` gains the points it must
fit, and P22 supplies them from its zones. P14 lists `docs/reference/testing.md` and
P15 lists `docs/reference/budget.md`, both of which this ticket may edit, so neither
runs beside it (`CONVENTIONS.md` §10); whichever of the three merges second re-applies
its hunk and says so in its hand-back.

Read first: `CONVENTIONS.md` §1 decision 2, §5.4, §7, §10, §12; `PRD.md` "The room"
and the budget table; `src/routes/+page.svelte` (the layout and its styles);
`src/routes/scene/SceneCanvas.svelte` (`measure`, the `ResizeObserver`, `.scene`);
`src/routes/scene/camera.ts`; `src/routes/scene/scene.ts` (`makeRenderer`, `resize`,
the `frameCamera` call); `tests/scene-assets.test.ts` (the framing test);
`tests/route.test.ts`; `stories/narrowest.ts`, `stories/Lockup.stories.svelte`,
`stories/SceneCanvas.stories.svelte`; `docs/decisions/0013-*.md` (the shape) and
`docs/decisions/README.md` "Writing a new one"; `docs/manifest.yml`;
`docs/reference/documentation-contract.md`; `docs/reference/testing.md`;
`tickets/P14-webgl-test-lane.md` Files touched (the "reserved (§10)" precedent);
`tickets/C01-hub-decision.md` (the shell sentence). The platform package is not
installed in a fresh worktree until `just initialize`; then read `HeaderBar.svelte`,
`IconButton.svelte`, `Wordmark.svelte`, `Notice.svelte` and `app.css` under
`node_modules/@steven-cutting/biscuit-games/` (H at `575e3dd` is identical,
`CONVENTIONS.md` §0). Two facts from them: `HeaderBar` is a wrapping flex row that
collapses the lockup's words only under a viewport `max-width: 26rem` query, so a narrow
left column at 844 px wide keeps the words; `Notice` collapses to zero when silent, so a
room sized by the remaining height would re-frame every time a caption appears.

## Goal

- `frameCamera(camera, preset, size, framed)` fits `framed`, the world points it is
  given, each at the floor and at 0.55 up (`CONVENTIONS.md` §5.1), with the 0.96 margin
  by the least retreat along the authored axis, in both orientations; the `aspect < 1`
  gate goes; direction, field of view and level unchanged. `framedFor(cabin, name)`
  resolves a per-preset table of node names, the maintainer's sets above, and P22
  replaces the table with its zones.
- The room's box is full-bleed at every width and takes the viewport's remaining
  height: at 390×844 at least 60% of the height; at 844×390 at least 85% of the height
  and 60% of the width, with the caption, controls and notice in a right column and the
  header on the left or overlaid; at 1200×844 the room is the viewport's width while the
  header and controls stay within the shell; the box does not change when a caption
  appears; nothing scrolls sideways at 320; every control stays 44 px.
- The layout is one component, `Stage.svelte`, with its test and its story, measured in
  Chromium at the pinned viewports.
- Decision 0016 recorded and registered; §1 decision 2, §5.4 and §7 of
  `CONVENTIONS.md`, `rendering.md` and `testing.md` say the new behaviour.
- The DPR cap unchanged unless the gated step says otherwise, and then recorded in the
  three places that state it, with the device re-measure filed.

## Non-goals

- Presets, auto cuts, following her, or any guarantee about walls and the ceiling: P22.
- Moving a camera or changing a field of view (P19's non-goal); editing `blender/`,
  `cabin.glb` or `scripts/check_cabin.py`.
- A spec edit: `cabin.allium` excludes camera positions as assets, and the layout's
  guarantees are `pawlour.allium` surface Play's (`EveryFigureHoldsAtTheNarrowestWidth`),
  which the story asserts rather than restates.
- Copying any platform primitive. If the header cannot be laid vertically with
  `HeaderBar` as shipped, the page composes `Lockup` and the platform `IconButton`, and
  an `H02` ticket carries the platform half.
- A new test runner or a `*.spec.ts` lane (P14 owns that); new dependencies.
- `100vw` breakout tricks: `margin-inline: calc(50% - 50vw)` overflows by the scrollbar
  and breaks "nothing scrolls sideways"; the breakout is done by DOM structure.
- The device frame-rate re-measure after any DPR change.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `src/routes/scene/camera.ts` | repo | `frameCamera(camera, preset, size, framed)`; `framedFor(cabin, name)` and the per-preset name table; `SETTLE_HEIGHT = 0.55`; `FLOOR_CORNERS` removed (`FLOOR_HALF` stays for `hit.ts`) |
| `src/routes/scene/scene.ts` | repo | the `frameCamera` call passes `framedFor(cabin, state.camera)`; the three `Math.min(ratio, 2)` read one `MAX_PIXEL_RATIO` |
| `tests/scene-assets.test.ts` | tests | the framing test replaced by the frame-set test |
| `src/lib/components/Stage.svelte`, `tests/stage.test.ts`, `stories/Stage.stories.svelte` | repo, new | the layout: three snippets (`header`, `room`, `aside`), the orientation query, the breakout |
| `src/routes/+page.svelte` | repo | `Stage` becomes the page's root: the outer `.shell` wrapper and its style go with the `.room` sizing and the 60rem block; the page keeps `<main>` and the hidden sentence inside `Stage`'s slots |
| `src/routes/scene/SceneCanvas.svelte` | repo | `.scene`'s `min-block-size: 12rem` only if it fights the grid; say so in the hand-back |
| `src/lib/components/ControlBar.svelte` and its test and story | repo | only if the bar needs a column variant for the right-hand stack |
| `docs/decisions/0016-the-room-breaks-out-of-the-shell.md`, `docs/decisions/README.md` | docs | new, in 0013's shape; one row |
| `docs/manifest.yml` | repo, reserved (§10) | one entry after 0015's, strict JSON on one line (P11 and P14 precedent) |
| `docs/explanation/rendering.md`, `docs/reference/testing.md` | docs | the framing and DPR sentences; the `scene-assets.test.ts` row, a `stage.test.ts` row, the stories row |
| `docs/reference/budget.md`, `tickets/PRD.md` (budget row) | docs, tickets | only if the DPR step changes the cap |
| `tickets/CONVENTIONS.md` | tickets | §1 decision 2, §5.4 camera bullet, §7 layout sentence, each "(corrected by P21)" |
| `tickets/H02-*.md` | tickets | only if the header is composed or reached into |
| `tickets/P23-*.md` | tickets | only if the cap changes: the device re-measure |
| `tickets/P21-fill-the-screen.md` | tickets | `status: done` |

Not touched: `AGENTS.md` (its deviations list is template departures; this departs from
`CONVENTIONS.md` and a hub convention), `docs/README.md` (links the decision record, not
each decision), `docs/specs/`, `vite.config.ts`, `Justfile`.

## Steps

1. **Red, the camera.** Replace the framing test in `tests/scene-assets.test.ts`. For
   each preset and each size in 844×390, 1200×844, 390×844, 320×568: build the frame set
   from the director's tables, not a list in the test (`activityFor` over the five walk
   items gives the node names; add `nav.0`; keep only the names in the preset's set;
   resolve through `cabin` by `assetName`); call `frameCamera`; assert field of view,
   direction and level unchanged (the three existing assertions); position on the
   authored axis; every frame-set point at the floor and at 0.55 up projects inside
   NDC; and tightness: whenever the camera has retreated, the largest `max(|x|, |y|)`
   over the framed points is within 1e-3 of 0.96. `just frontend-unit` fails against
   the shipped rule: hearth at 844×390 (`item.toy.approach` projects to y = −1.71) and
   every portrait case by tightness.
2. **Green.** `SETTLE_HEIGHT`, `framedFor`, the table, `frameCamera` with the retreat
   loop over `framed` and no aspect gate; `scene.ts` passes `framedFor`. Quote the
   retreats in the hand-back (hearth measured at design time: 1.27 m at 844×390,
   1.50 m at 1200×844, 8.82 m at 390×844, 6.87 m at 320×568; window 1.25 / 1.25 /
   3.66 / 2.70; chair 0.22 everywhere, which also fixes P05's cut head: `spot.chair`
   at 0.55 up projects to y = 1.18 today).
3. **Red, the layout.** `tests/stage.test.ts`: the three snippets render in document
   order, header heading before the room's image before the aside's button, by role.
   `stories/Stage.stories.svelte`: `HeaderBar` with `Lockup` and the Settings action as
   the header, a named `img` as the room, `Caption`, `ControlBar`, `PhotoButton` and
   `Notice` as the aside; stories pinned with `parameters.viewport` as
   `stories/narrowest.ts` does at 390×844, 844×390, 320×568 and 1200×844; each play
   asserts `window.innerWidth` equals the pin, measures the room slot's bounding box
   against `innerWidth` and `innerHeight` (never a fixed frame), and reuses
   `expectNothingScrollsSideways` and `expectComfortableTargets`; a fifth story renders
   390×844 with a caption and asserts the same room box as without.
   `just storybook-test` fails: no component.
4. **Green, the layout.** `Stage.svelte`: a grid of `min-block-size: 100svh`, header
   `auto`, room `1fr` with `min-block-size: 0`, aside `auto`; the header and aside each
   inside their own shell (`max-inline-size: var(--shell-max)`, `padding-inline:
   var(--shell-pad)`), the room outside any shell; `@media (orientation: landscape) and
   (max-height: 30rem)` turns the grid into columns, room `1fr`, aside
   `minmax(12.5rem, max-content)` on the right (four 44 px controls in a row are
   200 px), header on the left or overlaid; the aside reserves the caption row (two
   lines plus `Notice`'s margin). Today the page wraps `HeaderBar` and `<main>` in one
   `.shell` div, and a `Stage` mounted inside it could never escape that ancestor's
   `max-inline-size`, so `Stage` becomes the page's root element and that wrapper and
   its `.shell` rule go: `Stage` owns the two shells, `<main>` wraps the room and the
   aside slots so the landmark survives, and the hidden sentence stays beside the
   room. Every selector must be used (`svelte-check --fail-on-warnings`).
   Header choice: `HeaderBar` as shipped in a left column keeps its words, so vertical
   needs two scoped reach-ins (the header's direction, the words hidden); an overlay
   over the room's top needs none, but it sits on a solid ground of the platform's own
   dark tokens, never on the picture, because the lockup and the Settings button owe
   `EveryCombinationMeetsTheLegibilityFloor` and text over a moving warm scene has no
   measurable contrast (`AGENTS.md` invariant 6); if that band reads badly, vertical is
   the default. Either way one `h1` with the same name, Settings at 44 px, no sideways
   scroll. If a reach-in or a composition is used, write
   `tickets/H02-*.md` asking for an orientation or forced-collapse prop on
   `HeaderBar`, in `H01-hub-hand-backs.md`'s shape.
5. **DPR, gated.** Consolidate the three caps into `MAX_PIXEL_RATIO = 2`. Write a
   disposable Playwright Chromium probe under `ai_tmp/fill/` and run it with
   `just scene-review <script>` against `just preview` (P07a, P07b and P08 did the
   same; `P14-webgl-test-lane.md`, Context): 390×844, 844×390 and 1200×844 at each
   preset, and 390×844 at `deviceScaleFactor` 2 and 3, hearth, evening, captured under
   `ai_tmp/fill/`. Only if the bigger framing reads soft at DPR 3, set the
   constant to 3, recapture, record both, and change `PRD.md`'s budget row,
   `budget.md`, `rendering.md` and file `P23` for the device re-measure. Otherwise
   record "held at 2" and touch none of them.
6. **Docs.** Decision 0016 (context: `CONVENTIONS.md` §1 decision 2 and C01's shell
   sentence, kept: the shell stays dark and the platform's, and the room's edge is
   where the warmth stops; what would reopen it: a platform layout that gives a play
   surface the viewport). The manifest entry, the README row, `rendering.md`,
   `testing.md`, the three `CONVENTIONS.md` marks. `just check-docs`.
7. `just frontend-unit`, `just storybook-test`, `just check-docs`, `just check`. Read the
   whole diff. Pushing and the pull request are separately authorised.

## Acceptance criteria

- [x] The frame-set test fails against the shipped `camera.ts` and passes after: for
      each preset at the four sizes, every framed point inside NDC at the floor and at
      0.55 up, field of view, direction and horizon unchanged, position on the authored
      axis, and the extreme point at 0.96 ± 1e-3 whenever retreated.
- [x] Hearth's retreat at 390×844 under 9 m (was 15.6); the numbers in the hand-back.
- [x] `stories/Stage.stories.svelte` in Chromium: at 390×844 the room is the viewport's
      width and at least 60% of its height; at 844×390 at least 85% of the height and
      60% of the width with the aside to its right; at 320×568 nothing scrolls sideways
      and every control is 44 px both ways; at 1200×844 the room is the viewport's width
      while the `h1` and the control bar sit within the shell; the room's box at 390×844
      is identical with and without a caption.
- [x] `tests/route.test.ts` unchanged and green: one `h1` named `biscuit games /
      pawlour`, a `main` landmark, Settings opens the dialog.
- [x] `grep -n 'ratio, 2)' src/routes/scene/scene.ts` prints nothing and
      `grep -c 'MAX_PIXEL_RATIO' src/routes/scene/scene.ts` is at least 4: the
      declaration and its three uses.
- [x] Decision 0016 exists, is in `docs/manifest.yml` and `docs/decisions/README.md`.
- [x] `grep -c 'corrected by P21' tickets/CONVENTIONS.md` is at least 3.
- [x] Coverage over `src/lib/**` at the floor with `Stage.svelte` measured.
- [x] `just check` green.

## Verification

```sh
just frontend-unit
just storybook-test
grep -n 'ratio, 2)' src/routes/scene/scene.ts | wc -l
grep -c 'MAX_PIXEL_RATIO' src/routes/scene/scene.ts
grep -c 'corrected by P21' tickets/CONVENTIONS.md
grep -c '0016' docs/manifest.yml docs/decisions/README.md
git diff main --stat -- AGENTS.md docs/README.md docs/specs/
just check-docs
just check
```

Expected: the unit and story runs green with the new cases named; `0`; `4` or more;
`3` or more; `1` and `1`; no diff on the three paths; green. Plus the capture set under
`ai_tmp/fill/` (390×844, 844×390, 1200×844 at each preset; DPR 2 and 3 at 390×844)
listed in the hand-back.

## Hand-back notes

Executed on 2026-09-28 on the branch `fill-screen-and-auto-camera-shift` (not the
`branch:` field's name: the worktree was created on that branch with P21 and P22 filed on
it).

**Red, the camera.** The frame-set test run against the shipped `frameCamera` (with the
table added and the rule unchanged) failed all three presets at 844×390, the first size:
hearth `844x390: expected 1.047061793427362 to be less than 1` (`spot.chair` at x = 1.05;
`item.toy.approach` at y = −1.71 as the ticket says), window `expected 1.651556644324865`,
chair `expected 1.1764993539196225` (`spot.chair` at 0.55 up, the cut head). The portrait
sizes come after it in the loop; a probe of the shipped rule put their extreme points
between 0.04 and 0.59, far inside 0.96, so they failed tightness too. Green: 13 of 13.

**Retreats**, measured by the probe (`ai_tmp/fill/retreats.txt`), all equal to the
design-time figures to two decimals:

| Preset | 844×390 | 1200×844 | 390×844 | 320×568 |
| --- | --- | --- | --- | --- |
| hearth | 1.27 m | 1.50 m | 8.82 m (was 15.57) | 6.87 m (was 12.51) |
| window | 1.25 m | 1.25 m | 3.66 m (was 23.48) | 2.70 m (was 19.11) |
| chair | 0.22 m | 0.22 m | 0.22 m (was 30.70) | 0.22 m (was 25.13) |

The floor point of each framed node is its own world position (`spot.chair` sits at
y = 0.42), and the second point is that plus 0.55; flattening to y = 0 would not have
reproduced the design figures.

**Red, the layout.** `tests/stage.test.ts` failed on the missing import; the story run's
dependency scan failed on it too. Green: 2 of 2, and 6 `Stage` stories (the sixth, at 320×320, from the review below). Screenshots of
the built workshop then showed the landscape aside squeezing Pet and Photo past their
content inside a 200 px column, which the 44 px check did not see because the column's
scroll box hid the overflow. The `Stage` stories now also assert every button whole
(`scrollWidth` within `clientWidth`) and on screen; that failed at 844×390, and
`ControlBar.svelte` gained its column variant: a container query on a new wrapper turns
the bar two by two below 17rem (the row needs about 266 px: two 44 px chips, Pet 75,
Photo 91, three gaps). A story, "In a narrow column", holds it at 12.5rem; no test
change, because jsdom cannot see a container query.

**Measured in Chromium** (the `Stage` stories, and the built app under `just preview`):

| Viewport | Room box | Share |
| --- | --- | --- |
| 390×844 | 390×647 at y = 56 | full width, 77% of the height |
| 844×390 | 591×390 at x = 53 | 70% of the width, full height; aside 200 px on the right |
| 320×568 | 320×371 | full width, 65% of the height; no sideways scroll |
| 1200×844 | 1200×647 | full width; the `h1` at x = 344 to 537 inside the 544 px shell |

The captioned story measures the same box with and without a caption.

**Header choice: vertical on the left.** `HeaderBar` stands up with two reach-ins scoped
to the landscape query in `Stage.svelte` (the header's direction with the rule moved to
the inline end, and `.words` out of the layout with `HeaderBar`'s own collapse
declarations, so the `h1` keeps its name). It costs 53 px of width and leaves the room's
picture untouched; an overlay would have put the lockup on a band over the room's top,
owing a contrast judgement no test can make. `tickets/H02-header-bar-orientation.md`
asks the platform for `orientation` and `collapsed`.

**`.scene`'s minimum height moved into `Stage`.** At the pinned sizes it never
mattered (the smallest room box is 371 px at 320×568), but Codex's adversarial review
of the branch found that it fights the grid on a short viewport: at 320×320, a small
window or a zoomed one, the header (56 px) and the aside's reserve (141 px) left the
room 123 px while `.scene` held 12rem, so the canvas ran 69 px under the caption. A
`Stage` story on the real `SceneCanvas` at 320×320 with a caption up failed on it
(`expected 178 to be greater than or equal to 248`); silent, the aside's bottom-up stack
hid the overlap. The floor is now `Stage`'s, `--room-min: 12rem` on the room's row in
both layouts, so a viewport shorter than the chrome and the room scrolls down, never
sideways; `SceneCanvas.svelte` drops its own `min-block-size` so the figure has one
owner. `Stage`'s room is `contain: size`, so the canvas's drawing buffer never sizes
the grid.

**DPR: held at 2.** `MAX_PIXEL_RATIO = 2` in `scene.ts` replaces the three literals. At
390×844, hearth, evening, the capture at `deviceScaleFactor` 3 (a 780×1294 buffer
upscaled) and at 2 read the same on a 3× crop of the fireplace and Biscuit
(`ai_tmp/fill/crop-dpr2.png`, `crop-dpr3.png`): flat cel bands and ink outlines, nothing
soft. `PRD.md`, `budget.md` and `rendering.md`'s cap are unchanged, and no P23 is filed.

**Captures**, all under `ai_tmp/fill/`: `app-{hearth,window,chair}-{390x844,844x390,1200x844}.png`,
`app-hearth-390x844-dpr2.png`, `app-hearth-390x844-dpr3.png`, the two crops, and the
`Stage` stories at each pin in both themes, `stage-*.png`. The probe scripts are there as
`.txt`.

**Outside the file table.** `tickets/README.md` gained H02's index row, which that
page's own rule asks of every `H` ticket when it is written, and P21's row there now says
`done` to match this file. Nothing else outside the
table changed; `tests/route.test.ts` is unchanged and green.

**For whoever merges second of P14, P15 and this ticket.** This ticket edited three rows
of `docs/reference/testing.md` (`scene-assets.test.ts`, a new `stage.test.ts`, and
`stories/`) and none of `docs/reference/budget.md`.

**Verification**, run on 2026-09-28:

```text
just frontend-unit        Test Files 31 passed (31), Tests 397 passed (397)
just storybook-test       Test Files 14 passed (14), Tests 51 passed (51)
grep -n 'ratio, 2)' src/routes/scene/scene.ts | wc -l          0
grep -c 'MAX_PIXEL_RATIO' src/routes/scene/scene.ts            4
grep -c 'corrected by P21' tickets/CONVENTIONS.md              3
grep -c '0016' docs/manifest.yml docs/decisions/README.md      1 and 1
git diff main --stat -- AGENTS.md docs/README.md docs/specs/   (nothing)
just check-docs           Validated 54 pages and 55 canonical topics.
just check                All checks passed and the worktree is unchanged.
```

Coverage over `src/lib/**`: 100% statements, 97.4% branches, 100% functions, 100% lines;
`Stage.svelte` is measured at 100%.

**Open points, answered or carried.** The ceiling plane: in portrait the hearth camera
now ends at y = 3.36 m, above the 2.4 m plane, and the captures show black above the
wall tops rather than the plane's edge; left to P22 as the PRD's open question says.
The frame sets are a table in `camera.ts`, for P22 to replace. The header is vertical,
with H02 written. Desktop at 2:1 or wider: at 1200×844 the room box is 1200×647 and the
hearth view shows the side walls whole; wider windows are P22's guarantee. P18: its
stills at the hearth camera were framed by the old retreat and are retaken through this
fit whenever it runs. Pushing and the pull request were not done; each is a separately
authorised action.

## Open points

- **The ceiling plane at 2.4 m** (`PRD.md`, open questions). The hearth camera now ends
  near y = 3.4 m in portrait (was 4.8 m); the plane's edge may show differently. Record
  what the captures show; do not resolve it.
- **Where the frame sets live.** A table in `camera.ts` here. P22 replaces it with its
  zones; if P22 would rather author them as `extras` on the camera empties, that is a
  `check_cabin.py` rule of P19's shape and P22's to decide.
- **The header in landscape**: vertical with reach-ins, or overlaid; the executing
  agent's call with `HeaderBar` in hand; an H02 if any reach-in or composition is used.
- **Desktop at 2:1 or wider.** The hearth view shows past the ends of the ±X walls
  (about 6.3 m visible against a 5 m room at the far wall). Left to P22's guarantee; a
  height or aspect cap here is not the decision as taken.
- **P18.** Its stills "at the hearth camera" are framed by the retreat this ticket
  changes; if P18 runs first its captures are retaken after this lands, and if it runs
  after, it captures through the new fit. Handed to P18's executing agent; not a
  dependency.
