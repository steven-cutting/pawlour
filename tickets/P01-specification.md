---
id: P01
title: "Specification: `pawlour.allium`, `cabin.allium`, the restated platform clauses"
status: open
depends_on: [P00]
parallel_with: [P02, P03, P04, P05, P09]
branch: ticket/p01-specification
estimated_size: M
---

# P01: Specification: `pawlour.allium`, `cabin.allium`, the restated platform clauses

## Context

The specifications are the source of truth for behaviour (T `template/AGENTS.md.jinja`,
invariant 1: "No rule, threshold or wording that `docs/specs/` states is re-decided in
code. When the code needs to differ, change the spec first and say why."). P06 (the
director), P07a and P07b (the runtime) and P08 (the interface) each build against a
clause, so the clauses land first, in this lane, while P02 to P05 build the assets.

T renders one seed module, `docs/specs/pawlour.allium` (rendered from T
`template/docs/specs/{{ game_slug }}.allium.jinja`): the six platform figures under
`config`, one `given` (`viewport_width`), and `surface Play` with the guarantee
`EveryFigureHoldsAtTheNarrowestWidth`. `tests/platformSpecs.test.ts` (T, managed) holds
the figures equal to `src/lib/config.ts`, to the hub's shipped modules and to every game
module that states one, and holds every clause listed in `tests/restated.ts` equal to
the platform's text word for word (T `tests/platform.ts` lines 40–58: a `Restatement` is
`{ module, theirs, file, ours, alias, clauses }`).

CONVENTIONS.md §8 designs two modules: the root, kept as the seed states it, and
`cabin.allium`, imported by the root, declaring the game's own types and `surface Cabin`
with eight guarantees whose draft prose is in §8. The guarantees are the promises
`PRD.md` makes, in the platform's register: a name, then the prose that is the rule, and
nothing about markup, colour or mechanism.

Sources, at the commits CONVENTIONS.md §0 pins (read-only, never modified):

- H = `/Users/scutting/projects/biscuit_games` at `575e3dd`. Read first:
  `docs/specs/operation.allium` whole (414 lines; the register: a Scope, Includes,
  Excludes, Dependencies header in comments; `given`; `config` with a comment per figure;
  contracts with `@invariant`; surfaces with `let`, `exposes`, `contracts: fulfils`,
  `@guarantee` with the prose as `--` comment lines; an open question at the end),
  `docs/specs/appearance.allium` lines 118–160 (`surface Appearance`, the four
  guarantees, `ReducedMotionOverridesTheAnimationSetting` at 140–144),
  `docs/specs/play-surfaces.allium` lines 60–90 (how a game-facing type is declared),
  `docs/how-to/work-with-the-specs.md` and `docs/explanation/specifications.md` (what
  `check-specs` and `analyse-specs` refuse).
- T at `v2.1.0`, read through `git show`: `template/docs/specs/{{ game_slug }}.allium.jinja`
  (the seed, 80 lines), `template/tests/platform.ts` (the `Restatement` interface and
  `PlatformModule`), `template/tests/platformSpecs.test.ts` (how clauses are found: a
  body runs to the first non-comment line, paragraphs separated by a bare `--`, compared
  by the surface or contract that states them and the clause name),
  `template/tests/restated.ts` (the empty table and its comment naming Poodl's two
  restatements as the worked example), `template/docs/how-to/work-with-the-specs.md`.
- P = `/Users/scutting/projects/poodl` at `a2860fc`. Read `docs/specs/game.allium`
  lines 1–80 (a game's header and a `use "./words.allium" as words` import, an `external
  entity` for a dependency it does not import) and `docs/specs/settings.allium` (how it
  restates `Appearance` through the alias `game`), and `tests/restated.ts` if present.

The game's behaviour the clauses state is `PRD.md`'s: the interaction table, "Captions",
"Time of day", "Sound", "Motion off", and the acceptance list. Read those sections
before writing a word of prose.

**Authorisation.** Nothing here leaves the repository. Pushing and the pull request are
separately authorised: stop and ask.

## Goal

- `docs/specs/pawlour.allium`: the seed's header rewritten for Pawlour (Scope, Includes,
  Excludes, Dependencies naming `cabin.allium`), its `given`, `config` and
  `surface Play` kept verbatim so `platformSpecs.test.ts` keeps holding the figures, and
  a `use "./cabin.allium" as cabin` import.
- `docs/specs/cabin.allium`: the game's types (`Phase { morning | evening | night }`,
  `Weather { clear | rain | snow }`, `Item`, `Activity` as CONVENTIONS.md §6.1 lists
  them), its `given` (the device's hour, the reader's reduced-motion and animations
  answers as the platform names them), its own `config` figures (the phase boundaries,
  the minimum activity, the caption floor of forty, as CONVENTIONS.md §6.1 states them),
  and `surface Cabin` fulfilling `DirectManipulation` with the eight guarantees of §8,
  each named exactly and each with prose that a test could be written from.
- `tests/restated.ts`: the four platform clauses `cabin.allium` restates word for word
  (`EveryControlIsAComfortableTarget` from `operation.allium`'s `DirectManipulation`,
  `FullyKeyboardOperable` and `AChangeNobodyIsLookingAtIsAnnounced` from its `Operation`
  surface, `ReducedMotionOverridesTheAnimationSetting` from `appearance.allium`'s
  `Appearance`), listed under the surface that states them, with `alias: null`.
- `just check-specs` and `just analyse-specs` green with empty diagnostics and empty
  findings; `just frontend-coverage` green with `platformSpecs.test.ts` holding every
  restated clause equal; `just check` green.

## Non-goals

- Implementing any clause: P06, P07a, P07b and P08 do that, citing the clause.
- Restating a platform clause the game does not need. Four are restated because the
  game's surface fulfils them in its own words; the rest are inherited by citation, as
  the seed's Dependencies comment says.
- Any figure the platform states being re-stated with a different value: the six figures
  stay equal, and a game figure "belongs below these" (T `template/src/lib/config.ts`).
- `src/lib/config.ts`: this ticket adds no constant there; the game's own figures are
  read from the spec by the ticket that implements them (P06 writes `timing.ts` from
  §6.1 and cites the config block).
- Editing `tests/platformSpecs.test.ts` or `tests/platform.ts`: managed files.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `docs/specs/pawlour.allium` | repo | T's seed, rewritten | header for Pawlour, the import; `given`, `config`, `surface Play` verbatim |
| `docs/specs/cabin.allium` | repo | new; CONVENTIONS.md §8 | the game's module |
| `tests/restated.ts` | repo | T's seed, filled | four restatements |
| `tickets/P01-specification.md` | tickets | this file | `status: done` |

## Steps

1. **Read the register twice.** H `operation.allium` for shape and voice, then the
   seed. Note what a clause body may and may not contain: it names the rule in prose
   and names `config.<figure>` where a figure applies; it names no colour, no markup, no
   port, no component. Note how the platform separates paragraphs inside a body with a
   bare `--` line, and that `platformSpecs.test.ts` treats that line as part of the body.

2. **Rewrite the root's header.** Scope: "The root module of Pawlour, a room Biscuit
   lives in …"; Includes: the six figures and `surface Play`; Excludes: what the room is
   made of, how she is drawn, colour, markup, mechanism, and sound files; Dependencies:
   `cabin.allium`. Add `use "./cabin.allium" as cabin` after the header, as P's
   `game.allium` does. Change nothing else in the file: `given`, `config` and
   `surface Play` stay byte for byte.

3. **Write `cabin.allium`.** Header in the same four parts. Then:

   - `given { hour_of_day: Integer, prefers_reduced_motion: Boolean, animations_setting: Boolean }`,
     each with a comment saying which port supplies it (the clock port, the platform's
     preferences port, the platform's appearance settings), and that the module states
     what is owed and never how it is read.
   - The types, as `enum` or `entity` in the platform's syntax (copy the form
     `play-surfaces.allium` uses for `PlayMark` at lines 70–87): `Phase`, `Weather`,
     `Item { bed | chair | water | food | toy | lamp | lights }` (`jar` arrives with
     v1.1, CONVENTIONS.md §6.1), `Activity` as
     CONVENTIONS.md §6.1 lists the values.
   - `config { morning_starts: Integer = 5, evening_starts: Integer = 14, night_starts: Integer = 21, minimum_activity_seconds: Integer = 4, caption_floor: Integer = 40 }`,
     each with a comment; these are the game's own figures and are not held equal to the
     platform.
   - `surface Cabin` with `let phase = …` derived from `hour_of_day` and the three
     boundaries, `let motion_active = animations_setting and not prefers_reduced_motion`
     (the platform's own derivation, restated), `exposes:` both, `contracts: fulfils
     DirectManipulation`, and the eight guarantees. Start from CONVENTIONS.md §8's draft
     prose and make each read as a rule: `EveryItemIsAControl`, `ATapIsAnInvitation`,
     `ACaptionIsShownAndAnnounced`, `SheIsTheOnlyThingAlive`,
     `TimeFollowsTheClockUntilOverridden`, `SoundNeverStartsUnasked`,
     `MotionOffIsAStillDiorama`, `AContextLossLeavesAStill`. Then the four restated
     platform clauses, copied word for word from the package's shipped text
     (`node_modules/@steven-cutting/biscuit-games/docs/specs/operation.allium` and
     `appearance.allium`, resolved as `tests/platform.ts` resolves them), under the same
     names, as `@guarantee` (the platform's `@invariant EveryControlIsAComfortableTarget`
     is restated as the surface's guarantee that it holds for every item control; if
     `platformSpecs.test.ts` compares by kind as well as by name, keep it an
     `@invariant` inside a `contract` the surface fulfils, and say which in the
     hand-back).
   - An open question at the end, in the platform's form: whether a second room's
     surface restates these or inherits them.

4. **Fill `tests/restated.ts`.** One `Restatement` per platform module and surface:
   `{ module: 'operation.allium', theirs: 'DirectManipulation', file: 'docs/specs/cabin.allium', ours: '<the contract or surface stating it>', alias: null, clauses: ['EveryControlIsAComfortableTarget'] }`,
   the same for `Operation` with the two clauses, and for `appearance.allium`'s
   `Appearance` with `ReducedMotionOverridesTheAnimationSetting`. Read
   `platformSpecs.test.ts` to see exactly how `ours` and `theirs` are used before
   writing the values.

5. **Run the gates.** `just check-specs` (empty diagnostics), `just analyse-specs`
   (empty findings; a finding is never waived, so a finding is a change to the module),
   `just frontend-coverage` (the restatement cases pass; a reworded comma fails them,
   which is the point), then `just check`.

6. **Hand-back and status.** Record what Step 3's last bullet decided, set
   `status: done`, commit. Pushing and the pull request are authorised separately.

## Acceptance criteria

- [ ] `docs/specs/pawlour.allium` still states the six figures with the seed's values
      and `surface Play` unchanged; `platformSpecs.test.ts` is green.
- [ ] `docs/specs/cabin.allium` declares `Phase`, `Weather`, `Item`, `Activity`, the five
      game figures and `surface Cabin` with the eight named guarantees and the four
      restated clauses.
- [ ] Every restated clause in `tests/restated.ts` is held equal to the shipped text by
      `platformSpecs.test.ts`.
- [ ] `just check-specs` reports no diagnostic and `just analyse-specs` no finding.
- [ ] No clause body names a colour, a component, a port, a file or a library.
- [ ] `just check` is green.

## Verification

```sh
just check-specs
just analyse-specs
just frontend-coverage
grep -c '@guarantee' docs/specs/cabin.allium
grep -n 'use "./cabin.allium"' docs/specs/pawlour.allium
just check
```

Expected: green with empty diagnostics; green with empty findings; green with the
restatement cases listed as passing; `12` (eight of the game's and four restated) or the
figure the hand-back explains; one line; green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- Whether the restated `EveryControlIsAComfortableTarget` is a `@guarantee` or an
  `@invariant` in a contract, and why `platformSpecs.test.ts` required it.
- Any draft prose from CONVENTIONS.md §8 that was changed in meaning, with the sentence
  before and after, so `CONVENTIONS.md` can be corrected on `main`.
- Any figure the implementing tickets will need that the config block does not carry,
  as a numbered list for P11.

## Open points

- **Sound and the platform.** H `docs/design/direction.md` lines 186–189 say audio is
  deferred platform-wide and the decision "is taken here". `SoundNeverStartsUnasked` is
  written as a game clause now; if C01's hub record states a platform clause for sound,
  this module restates it and `tests/restated.ts` gains a row (a P11 follow-up).
- **A second room.** `Item` is the cabin's list. Whether a room is a type of its own
  with its own item list is the open question the module ends on; v1 does not decide it.
