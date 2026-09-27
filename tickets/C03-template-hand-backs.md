---
id: C03
title: "Template hand-backs from Pawlour: the specs how-to's module table, the rule-38 gap, and the eslint conflict note"
status: open
depends_on: []
parallel_with: []
branch: ticket/c03-template-hand-backs
estimated_size: S
---

# C03: Template hand-backs from Pawlour: the specs how-to's module table, the rule-38 gap, and the eslint conflict note

## Context

Three things the lanes found belong to the template (T, `steven-cutting/biscuit_games_template`,
rendered here at `v2.1.0`; `CONVENTIONS.md` §0), not to this repository, because the
pages they touch are managed files that `copier update` rewrites
(`docs/how-to/update-from-template.md`). P11 collected them; this ticket carries them to
T, where the fix reaches every game.

1. P01 hand-back, "What else differs from Step 3", last bullet: the managed
   `docs/how-to/work-with-the-specs.md` says "Every module the game adds imports this
   one" (line 19) and its module table lists only the root, but the game's `cabin.allium`
   is imported *by* the root (`docs/specs/pawlour.allium` carries `use "./cabin.allium" as
   cabin`), and the checker draws no diagnostic either way. "P09, or the template, owes
   it a row for `cabin.allium` and a reconciled sentence." P09 did not edit it, because
   T's managed pages are not edited (`CONVENTIONS.md` §9).
2. P01 hand-back, "Also for P11, not a figure": the same page's "Diagnostics and
   waivers" section lists the checker's known gaps and owes one more: at Allium 3.6.1
   the checker resolves nothing in `contracts: fulfils …`, so rule 38 of the language
   reference (a referenced contract "must resolve to a `contract` declaration in scope")
   is held by review alone; a scratch module with the contract deleted, and another
   reading `fulfils NoSuchContract`, both check clean. "The fix is the template's or the
   checker's to make, not this repository's."
3. P00 hand-back, item 6: Prettier wrapped the `ignores` array in `eslint.config.js`
   over several lines once `'blender/'` made it too long, so `copier update` may
   conflict there as well as on `vitest.storybook.config.ts`. `update-from-template.md`
   already lists `eslint.config.js` among the files a game appends to, but says nothing
   about Prettier reflowing the block the template owns; a sentence there saves the
   next game a surprise. `CONVENTIONS.md` §12 was corrected by P11 for this repository.

T is another repository: reading it is free (`git -C /Users/scutting/projects/biscuit_games_template
show v2.1.0:<path>` after `git fetch --tags`), editing it is a separately authorised
action, and its own `AGENTS.md` governs a change there.

Read first: T `AGENTS.md`; T `template/docs/how-to/work-with-the-specs.md.jinja` (or
its rendered name; find it with `git ls-files | grep work-with-the-specs`); T
`template/docs/how-to/update-from-template.md`; this repository's
`docs/how-to/work-with-the-specs.md` and `docs/specs/pawlour.allium` header; the Allium
language reference the vendored `allium` skill carries, rule 38.

## Goal

- In T, on a branch, with authorisation for each push and pull request: the specs how-to
  says a game's root may import the modules it adds (the direction the checker
  accepts), its module table has a generic row for an added module, and "Diagnostics
  and waivers" names the rule-38 gap with the checker version it was seen at; the update
  how-to warns that Prettier may reflow a template-owned block once a game's append
  lengthens it, naming `eslint.config.js`'s `ignores`.
- If the rule-38 gap is the checker's rather than the template's, an issue filed against
  the checker's repository instead, with the two scratch modules as the reproduction;
  filing an issue is a separately authorised action.
- A note in the hand-back saying which template version carries the change, so this
  game's next `copier update` (`docs/how-to/update-from-template.md`) brings it in.

## Non-goals

- Editing the managed pages in this repository; they arrive through `copier update`.
- Changing the import direction in this repository's specs; the checker accepts it and
  `tests/platformSpecs.test.ts` holds the restatements either way.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| T `template/docs/how-to/work-with-the-specs.md` (or its jinja source) | template | the sentence, the row, the gap |
| T `template/docs/how-to/update-from-template.md` (or its jinja source) | template | the Prettier sentence |
| T `CHANGELOG.md` | template | the entry |
| `tickets/C03-template-hand-backs.md` | tickets | `status: done` |

## Steps

1. Read T's `AGENTS.md` and its docs contract; make the two page changes on a branch in
   T's worktree; run T's own check; stop before pushing and ask.
2. Reproduce the rule-38 gap against the current checker release before writing it as a
   gap: if a newer Allium resolves `fulfils`, the how-to says at which version it was
   fixed instead.
3. Record the outcome here.

## Acceptance criteria

- [ ] The three changes exist in T with its check green, on a branch or merged as the
      maintainer authorised.
- [ ] The rule-38 reproduction (or its fix version) is in the hand-back notes.
- [ ] Nothing in this repository changed except this ticket and the index.

## Verification

```sh
git -C /Users/scutting/projects/biscuit_games_template status --short
git status --short
```

## Hand-back notes

Filled in by the agent that executes this ticket.

## Open points

- **The template's own conventions for a game-added module.** T may prefer to say that
  a game's added modules are imported by the root (this game's direction) or import it
  (the page's current sentence); either is a template decision, and this ticket asks
  rather than choosing.
