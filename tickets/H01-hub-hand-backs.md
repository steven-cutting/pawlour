---
id: H01
title: "Hub hand-backs from Pawlour: item icons upstream, a four-choice SegmentedControl, and a pressed state on Button"
status: open
depends_on: [C01]
parallel_with: []
branch: ticket/h01-hub-hand-backs
estimated_size: S
---

# H01: Hub hand-backs from Pawlour: item icons upstream, a four-choice SegmentedControl, and a pressed state on Button

## Context

`README.md` in this directory reserves the `H` prefix for follow-ups to the hub (H,
`steven-cutting/biscuit_games`, `/Users/scutting/projects/biscuit_games`, `575e3dd` at the
time of `CONVENTIONS.md` §0). P08 built the interface against `@steven-cutting/biscuit-games`
1.1.0 and handed three things to the platform, each recorded in `P08-interface.md`'s
hand-back notes and collected by P11:

1. P08 hand-back, "The platform's icon map (22 names) has no bed, chair, bowl, lamp,
   string lights, paw or camera": the game carries nine Lucide SVGs under
   `src/lib/icons/` (bed, armchair, glass-water, bone, toy-brick, lamp-floor, sparkles,
   hand, camera; restroked to 1.5 as the platform's are, with `LICENSE-lucide.txt`
   beside them) and renders them with `src/lib/components/GameIcon.svelte`. "Hand-back
   to the hub: add item icons upstream so a game need not carry them."
2. P08 hand-back, "The platform `SegmentedControl` with four choices runs to 293 px at
   its own padding, wider than the `Modal`'s body at 320 px, and Night was cut off":
   `TimeControl` narrows the segment padding under a scoped `:global` so Auto, Morning,
   Evening and Night fit on one row with every segment past 44 px. "Hand-back to the
   hub: the control is written for two or three choices; a four-choice fit belongs
   upstream."
3. P08 hand-back, "Codex adversarial review", finding 4, "Lamp and Lights exposed no
   state": the platform `Button` has no `pressed`, so a light's state rides in the
   accessible name ("Lamp, on") and as a visible word rather than `aria-pressed`, which a
   reader announces more reliably on change. "Hand-back to the platform: a `pressed?:
   boolean` on `Button`, after which the two buttons should carry `aria-pressed` and keep
   the word."

The hub is another repository: reading it is free, editing it is a separately authorised
action (`CONVENTIONS.md` §10), and its own `AGENTS.md` governs how a change lands there.
C01 is the hub decision that permits this game at all and lands first; this ticket is
small enough to ride behind it.

Read first: H `AGENTS.md`; H `src/lib/components/Button.svelte`, `SegmentedControl.svelte`
and the icon map (find it with `grep -rn 'icons' src/lib` in H); H `docs/specs/operation.allium`
(`EveryControlIsAComfortableTarget`, and whatever clause the segmented control owes at 320
px); this repository's `src/lib/components/TimeControl.svelte`, `ItemControls.svelte` and
`src/lib/icons/`.

## Goal

- In the hub, on a branch, with the maintainer's authorisation for each push and pull
  request: the nine icons added to the platform's map under the platform's names and
  licence record; `SegmentedControl` fitting four choices at the narrowest width with
  every segment a comfortable target, with a story that shows four; `Button` taking
  `pressed?: boolean` and rendering `aria-pressed` when it is given, with a test.
- A follow-up ticket here, written by this one (`P21` or the next free id), that takes
  the game to the package version that ships them: `TimeControl` drops its `:global`,
  `ItemControls` passes `pressed` and keeps the word, `src/lib/icons/` and `GameIcon.svelte`
  go, and `AGENTS.md`'s dependency deviation list is unchanged because the package pin
  simply moves.

## Non-goals

- Editing this repository beyond writing the follow-up ticket: the game changes only
  when the package is released and pinned, and that is the follow-up's.
- Any other platform change. What a second game would render unchanged belongs upstream
  (`AGENTS.md`), but this ticket carries only the three P08 named.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| H `src/lib/components/Button.svelte` and its test and story | hub | `pressed` |
| H `src/lib/components/SegmentedControl.svelte` and its test and story | hub | the four-choice fit |
| H the icon map and its licence record | hub | nine icons |
| H `CHANGELOG.md` | hub | the entry |
| `tickets/P21-*.md` (next free id) | tickets | new: the game's adoption |
| `tickets/README.md` | tickets | the row |
| `tickets/H01-hub-hand-backs.md` | tickets | `status: done` |

## Steps

1. Read H's `AGENTS.md` and do the work the way it says, on a branch, in H's own
   worktree; stop before pushing and ask.
2. Write the follow-up ticket here with the package version the hub release will carry.
3. Record in the hand-back notes the hub commit, the pull request if one was opened, and
   the released version if any.

## Acceptance criteria

- [ ] The three changes exist in H with tests and stories, on a branch or merged as the
      maintainer authorised.
- [ ] The follow-up ticket exists here with its index row.
- [ ] Nothing in this repository changed except the two ticket files and the index.

## Verification

```sh
git -C /Users/scutting/projects/biscuit_games status --short
ls tickets/P21-*.md
git status --short
```

## Hand-back notes

Filled in by the agent that executes this ticket.

## Open points

- **Whether icons belong in the platform at all.** The platform's map is deliberately
  small; the hub's maintainer may prefer a game-local icon directory as a supported
  pattern instead. If so, record that decision and drop the icon half of the follow-up.
