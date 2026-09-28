---
title: "Decision 0016: The room breaks out of the shell"
kind: "decision"
audience: [contributor, maintainer, agent]
canonical_for: [decision_room_layout]
requires: []
---

# Decision 0016: The room breaks out of the shell

## Context

A Biscuit Games page is a centred column. The platform's stylesheet gives it a maximum
width, `--shell-max` (34rem), and gutters, `--shell-pad` (16px), and every game until
this one put its whole page inside that column. Pawlour did too: the platform's dark
shell, header, lockup, type and controls surround the scene, and the warm room exists
inside the play surface and nowhere else (`tickets/CONVENTIONS.md` §1, decision 2). The
hub decision that let a game be a rendered scene (`tickets/C01-hub-decision.md`) drew
the same line: the fire and the weather move because they are the room's, and the shell
around the room keeps the platform's rules.

Inside that column the room was small. On a phone held upright the room was a box of at
most 40rem whatever was left, above 60rem a 9:16 box 22.5rem wide, and on a phone held
sideways 16rem tall with the page scrolling. The camera then retreated until the whole
floor fitted, so the room ended up a fifth of the screen's height. The maintainer took
the decision on 2026-09-27: the room takes what the viewport leaves.

## Decision

The room leaves the shell; the chrome stays in it. `Stage.svelte` is the page's layout
and its root: a grid the height of the viewport with the header, then `main`, which
holds the room and, under it, the caption, the controls and the notice. The header and
that aside each sit in a shell of their own, `--shell-max` wide with `--shell-pad`
gutters. The room sits in no shell, so it is the viewport's width at every size and
takes the height the header and the aside leave, but never less than 12rem: a viewport
too short for that and the chrome, a small window or a zoomed one, scrolls down rather
than run the scene under the caption. The aside reserves room for two lines
of caption, so the room's box, and with it the camera's framing, does not move when a
caption appears.

On a phone held sideways (landscape and at most 30rem tall) the grid turns into columns:
the header stands on the left, the room takes the middle and the full height, and the
aside stacks on the right. `HeaderBar` lays out as a wrapping row and collapses the
lockup's words only under a viewport-width query, so the vertical header is two scoped
reach-ins from `Stage`: the header's direction, and the words taken out of the layout
with the declarations `HeaderBar`'s own collapse uses, which leaves them in the
heading's name. `tickets/H02-header-bar-orientation.md` asks the platform for a prop
that makes the reach-ins unnecessary.

The breakout is done by the structure of the page, not by stretching a child past its
parent: `margin-inline: calc(50% - 50vw)` overflows by the width of a scrollbar, and the
page must never scroll sideways.

## Consequences

**The warmth has a new edge.** The room's edge is where the warm register stops, and it
is now the viewport's edge on three sides. The shell is still dark and still the
platform's, and nothing of the room's palette reaches the header, the controls or the
notice. The rule C01 wrote is kept; only the shape of the surface it draws around has
changed.

**The camera frames a box of any shape.** The room can be taller than it is wide, or
twice as wide as it is tall on a desktop. `camera.ts` fits each preset's own subject in
either orientation rather than the whole floor in portrait alone; see
[Rendering](../explanation/rendering.md). On a very wide window the hearth view shows past
the ends of the side walls, which the camera's visibility guarantee (P22) is left to
answer.

**Two reach-ins into a platform component.** The sideways header depends on
`HeaderBar` keeping its element a `header` and the lockup's words in an element of class
`words`. A platform release that changes either breaks the sideways layout without
breaking a test that runs in jsdom; the `Stage` story measures the header's position at
844 by 390 and is what would catch it.

**Every figure is measured at pinned viewports.** A frame of fixed size cannot say what
the room takes of a viewport, so the `Stage` stories pin the viewport at 390 by 844, 844
by 390, 320 by 568 and 1200 by 844 and measure against `innerWidth` and `innerHeight`.

## What would reopen this

A platform layout that gives a play surface the viewport. If the package ships one, the
page moves onto it and `Stage.svelte` goes.

## Related pages

- [Rendering](../explanation/rendering.md)
- [The platform upstream](../project/platform.md)
- [Testing](../reference/testing.md)
- [Decision 0013: The canvas lives outside the coverage glob](0013-the-canvas-lives-outside-the-coverage-glob.md)
