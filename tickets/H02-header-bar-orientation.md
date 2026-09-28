---
id: H02
title: "Hub hand-back from Pawlour: a vertical HeaderBar for a phone held sideways, and a collapse the caller can ask for"
status: open
depends_on: [C01]
parallel_with: [H01]
branch: ticket/h02-header-bar-orientation
estimated_size: S
---

# H02: Hub hand-back from Pawlour: a vertical HeaderBar for a phone held sideways, and a collapse the caller can ask for

## Context

`README.md` in this directory reserves the `H` prefix for follow-ups to the hub (H,
`steven-cutting/biscuit_games`, `/Users/scutting/projects/biscuit_games`, `575e3dd` at the
time of `CONVENTIONS.md` §0). P21 (`P21-fill-the-screen.md`) gave the room what the
viewport leaves, and on a phone held sideways (landscape, at most 30rem tall) laid the
page out in columns: the header on the left, the room at the full height in the middle,
and the caption, the controls and the notice on the right. Decision 0016
(`docs/decisions/0016-the-room-breaks-out-of-the-shell.md`) records it.

The platform's `HeaderBar` (1.1.0, `dist/components/HeaderBar.svelte`) is a wrapping flex
row with a rule under it, and it collapses the lockup's words to the mark only under a
viewport query, `max-width: 26rem`. A left-hand column 844 px wide is far from that query,
so the words would stay and the column would be as wide as the lockup. P21 therefore
stands the header up from outside, in `src/lib/components/Stage.svelte`, with scoped
reach-ins under its landscape query:

1. `.header :global(header)`: `flex-direction: column`, `flex-wrap: nowrap`,
   `justify-content: flex-start`, the block padding, and the rule moved from
   `border-block-end` to `border-inline-end`.
2. `.header :global(.words)`: the declarations of `app.css`'s `.visually-hidden`, the same
   ones `HeaderBar`'s own collapse uses, so the words leave the layout and stay in the
   heading's name.

Both depend on details the platform does not promise: that the element is a `header`, and
that the words carry the class `words`. A platform release that changes either breaks the
sideways layout; the `Stage` story at 844 by 390 is what would catch it.

The hub is another repository: reading it is free, editing it is a separately authorised
action (`CONVENTIONS.md` §10), and its own `AGENTS.md` governs how a change lands there.

Read first: H `AGENTS.md`; H `src/lib/components/HeaderBar.svelte`, its test and its
story (the width story that holds the collapse arithmetic); H `docs/specs/operation.allium`
(`EveryControlIsAComfortableTarget`); this repository's `src/lib/components/Stage.svelte`
and `stories/Stage.stories.svelte`.

## Goal

- In the hub, on a branch, with the maintainer's authorisation for each push and pull
  request: `HeaderBar` takes an `orientation?: 'row' | 'column'` (default `'row'`), where
  `'column'` lays the lockup and the actions top to bottom with the rule on the inline
  end, and a `collapsed?: boolean` that collapses the lockup's words to the mark whatever
  the viewport, as the narrow query does now. Each with a test and a story; the column
  story measures every action at 44 px both ways.
- A follow-up ticket here, written by this one (the next free `P` id), that takes the game
  to the package version that ships them: `Stage.svelte` passes the props from the page's
  own orientation rather than reaching in. The orientation is a media query, so the
  follow-up decides whether `Stage` renders the header twice under two queries or the
  platform takes a query-driven prop; this ticket records which the hub preferred.

## Non-goals

- Editing this repository beyond writing the follow-up ticket: the game changes only
  when the package is released and pinned, and that is the follow-up's.
- Any other platform change. H01 carries the other hand-backs from Pawlour.
- A layout component for play surfaces in the platform. Decision 0016 names one as what
  would reopen it; proposing it is the hub maintainer's call, not this ticket's.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| H `src/lib/components/HeaderBar.svelte` and its test and story | hub | `orientation`, `collapsed` |
| H `CHANGELOG.md` | hub | the entry |
| `tickets/P*-*.md` (next free id) | tickets | new: the game's adoption |
| `tickets/README.md` | tickets | the row |
| `tickets/H02-header-bar-orientation.md` | tickets | `status: done` |

## Steps

1. Read H's `AGENTS.md` and do the work the way it says, on a branch, in H's own
   worktree; stop before pushing and ask.
2. Write the follow-up ticket here with the package version the hub release will carry.
3. Record in the hand-back notes the hub commit, the pull request if one was opened, and
   the released version if any.

## Acceptance criteria

- [ ] `HeaderBar` in H takes `orientation` and `collapsed`, each with a test and a story,
      on a branch or merged as the maintainer authorised.
- [ ] The follow-up ticket exists here with its index row.
- [ ] Nothing in this repository changed except the two ticket files and the index.

## Verification

```sh
git -C /Users/scutting/projects/biscuit_games status --short
ls tickets/P*-*.md
git status --short
```

## Hand-back notes

Filled in by the agent that executes this ticket.

## Open points

- **A prop or a query.** A prop is chosen by the caller, and the caller's reason here is a
  media query. The hub may prefer `HeaderBar` to own a container query instead, so that a
  narrow column collapses it the way a narrow viewport does now, with no prop at all. If
  so, record that and write the follow-up against it.
