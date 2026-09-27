---
id: P16
title: "Accessibility on the device: reduced motion, the four theme and contrast combinations, and the hard-coded theme"
status: open
depends_on: [P10, P11]
parallel_with: [P12, P13, P14, P15]
branch: ticket/p16-accessibility-on-the-device
estimated_size: S
---

# P16: Accessibility on the device: reduced motion, the four theme and contrast combinations, and the hard-coded theme

## Context

P10's Step 5 (reduced motion on the device, both halves) and Step 7 (the four theme and
contrast combinations, four screenshots) were deferred by the maintainer on 2026-09-26
("Let's deal with accessibility later"; `P10-device-verification.md`, hand-back notes,
"Reduced motion on the device … deferred by the maintainer"). The hook's
`setAnimations(false)` path was verified in Chromium, and no phone screenshot was taken,
so P10's "four screenshots" acceptance criterion is unmet by decision. P10 also noted for
this ticket: `src/app.html` hard-codes `data-theme="dark"`, so the phone's Light
appearance may not change the page, and nothing in the page reads `prefers-contrast`.

The platform's clauses that apply are H `docs/specs/appearance.allium`:
`ReducedMotionOverridesTheAnimationSetting` (restated in `docs/specs/cabin.allium`),
`AppearanceNeverCarriesMeaningAlone` and `EveryCombinationMeetsTheLegibilityFloor`; and
the game's `MotionOffIsAStillDiorama`. `tests/overlay-contrast.test.ts` already holds the
overlay tokens to the floor in all four combinations on paper; this ticket is the eye on
the device.

Read first: `docs/how-to/test-on-a-phone.md` (the reduced-motion and contrast steps
already written there); `docs/specs/cabin.allium`; `src/app.html` and its comment on
`data-theme`; `src/lib/components/overlay.css`; the `accessibility-review` skill under
`.agents/skills/`.

## Goal

- Reduced motion on the phone (Settings → Accessibility → Motion → Reduce Motion) gives
  the still diorama: no fire flicker, no particles, no clip, `data-animations="off"`, a
  tap on a thing cutting to her still at it, the time control and captions still working;
  and turning it back on restores motion without a reload.
- The four combinations (dark and light appearance, Increase Contrast off and on) each
  have a phone screenshot under `ai_tmp/` and a finding list: nothing illegible, every
  state readable without colour, the scarlet card's words black.
- A decision on `data-theme="dark"`: whether the page should follow the phone's
  appearance (the platform's `AppearanceSettings` says what the default is; read its
  comment in `src/app.html` before changing anything) or stay dark by design, recorded
  on `docs/design/art-direction.md`.
- Whether the page owes `prefers-contrast` anything, recorded the same way.

## Non-goals

- The budget rows and the 4G measurement: P15.
- Changing the platform. A combination that fails inside a platform component is a
  hand-back to the hub, written into `H01-hub-hand-backs.md` or its successor.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `docs/design/art-direction.md` | docs | the theme decision and the contrast note |
| `src/app.html` | repo | only if the maintainer decides the page follows the device |
| `docs/how-to/test-on-a-phone.md` | docs | only if a step proved wrong on the device |
| `tickets/P16-accessibility-on-the-device.md` | tickets | `status: done` |

## Steps

1. Serve as P15 does; the maintainer drives the phone.
2. Reduce Motion on: reload, confirm the still, tap Bed, confirm the cut to the still of
   her at the bed and the caption; turn Reduce Motion off and confirm motion resumes.
   Record what the hook's console line shows at each step.
3. The four combinations: for each, a screenshot of the room with the settings dialog
   open and one of the photo card; look at them, run the skill's seven steps against
   `cabin.allium`, and write the findings.
4. Put the theme question to the maintainer with what `src/app.html`'s comment says;
   apply the decision; record it.
5. `just check`.

## Acceptance criteria

- [ ] Four screenshots under `ai_tmp/` named for their combination, and a findings
      list per combination in the hand-back notes.
- [ ] The reduced-motion steps recorded with the hook's readings.
- [ ] The theme and contrast decisions on `docs/design/art-direction.md`.
- [ ] `just check` green.

## Verification

```sh
ls ai_tmp/p16-*.png
grep -n 'data-theme' src/app.html
grep -n -i 'appearance\|contrast' docs/design/art-direction.md
just check
```

## Hand-back notes

Filled in by the agent that executes this ticket: the readings, the findings per
combination, the decisions, and anything handed to the hub.

## Open points

- **Optional.** The maintainer deferred this work by choice; it does not gate P12. If it
  is never picked up, `P10-device-verification.md`'s unmet criterion stays recorded there
  and here.
