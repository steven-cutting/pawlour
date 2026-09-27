---
id: P20
title: "The title card runs on the wipe: one diagonal sweep, in one place, for load-in and photo mode"
status: open
depends_on: [P11]
parallel_with: [P12, P13, P14, P15, P16, P17, P18, P19]
branch: ticket/p20-the-title-card-runs-on-the-wipe
estimated_size: S
---

# P20: The title card runs on the wipe: one diagonal sweep, in one place, for load-in and photo mode

## Context

`CONVENTIONS.md` §5.4 puts the wipe in `src/routes/scene/wipe.ts` and the `TitleCard`
component together: a DOM panel that sweeps a diagonal over `--dur-3` on load-in and when
photo mode opens, so the mechanism exists for a second room (`PRD.md`, "The room").
P07b wrote `wipe.ts` (a token-gated sweep that resolves on the clip transition, tested in
`tests/scene-effects.test.ts`, "the token-gated diagonal wipe"), and P08 wrote
`TitleCard` with its own CSS `@keyframes sweep` on `--dur-3`. They were built in
parallel lanes and never joined: `P08-interface.md`, hand-back notes, "Follow-up outside
this review: P07b's `wipe.ts` (its step 7) is meant for the title card on load-in and
photo mode; `TitleCard` still runs its own CSS `sweep`. Left as it is here." P11 marked
§5.4 accordingly and carried the join here.

One complication the join has to respect: `wipe.ts` sits under `src/routes/scene/`,
outside the coverage floor, and `TitleCard` under `src/lib/components/`, inside it
(`docs/explanation/layering.md`; `AGENTS.md` invariant 7). A component under `src/lib/`
importing from the GPU adapter's directory inverts the layering.

Read first: `src/routes/scene/wipe.ts`; `src/lib/components/TitleCard.svelte` and
`tests/title-card.test.ts`; `src/routes/+page.svelte` (where the card is shown for
loading and for "Saved", and `SAVED_MS`); `stories/TitleCard.stories.svelte`;
`docs/explanation/layering.md`; `docs/design/art-direction.md` "Overlays".

## Goal

- One sweep implementation. Either `wipe.ts` moves to `src/lib/wipe.ts` (it touches no
  browser global beyond the element it is handed, so it belongs under the floor and gets
  its test moved with it), and `TitleCard` calls it on mount and on close; or the page
  drives the wipe around the card and the card's own keyframes go. The executing agent
  chooses with the layering page in hand and says why.
- The card still sweeps in over `--dur-3` on load-in and photo mode, and not at all when
  animations are off (`MotionOffIsAStillDiorama`, "no wipe"), which the existing test
  "resolves immediately at zero duration" already holds for the function.
- The stories still show loading and saved states, and the screenshot of the built
  Storybook is looked at, not only passed.

## Non-goals

- A second room, or the wipe between rooms.
- Any change to the card's copy, colours or geometry (`src/lib/components/overlay.css`,
  `tests/overlay-contrast.test.ts`).

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `src/routes/scene/wipe.ts` → `src/lib/wipe.ts` (if moved) | repo | the move, with its test to `tests/wipe.test.ts` |
| `src/lib/components/TitleCard.svelte`, `tests/title-card.test.ts`, `stories/TitleCard.stories.svelte` | repo | the sweep through the function |
| `src/routes/+page.svelte` | repo | if the page drives it |
| `tests/scene-effects.test.ts` | repo | the wipe block moved out, if the function moves |
| `docs/explanation/rendering.md`, `docs/design/art-direction.md`, `docs/reference/testing.md` | docs | where the wipe lives and what proves it |
| `tickets/CONVENTIONS.md` | tickets | §5.4's wipe bullet, marked "(corrected by P20)" |
| `tickets/P20-the-title-card-runs-on-the-wipe.md` | tickets | `status: done` |

## Steps

1. Decide the direction from the layering page; write the failing test first (the card
   sweeps through the function, and does not at zero duration).
2. Make the change; delete the CSS keyframes; keep the coverage floor.
3. `just storybook-build`, serve `storybook-static`, screenshot the card's stories and
   look at them.
4. Docs, `just check`.

## Acceptance criteria

- [ ] `grep -rn 'keyframes sweep' src/` prints nothing, and one wipe function exists.
- [ ] Coverage over `src/lib/**` at or above the floor with the function under it, if
      moved.
- [ ] `just check` green.

## Verification

```sh
grep -rn 'keyframes sweep\|wipe(' src/ | grep -v node_modules
just frontend-coverage
just check
```

## Hand-back notes

Filled in by the agent that executes this ticket: which direction was taken and why.

## Open points

- **The layering page's word.** If `docs/explanation/layering.md` says a token-gated DOM
  helper belongs beside the scene regardless, the page-driven direction is the one that
  respects it; record the sentence relied on.
