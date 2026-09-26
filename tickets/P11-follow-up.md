---
id: P11
title: "Follow-up: what P00 to P10 handed back"
status: open
depends_on: [P01, P02, P03, P04, P05, P06, P07a, P07b, P08, P09, P10]
parallel_with: []
branch: ticket/p11-follow-up
estimated_size: S
---

# P11: Follow-up: what P00 to P10 handed back

## Context

A ticket that is done or in progress is not reopened (`CONVENTIONS.md` §10). Instead,
each build ticket's hand-back notes name changes it could not make because the file
belonged to another ticket, to a file no lane touches, or to `CONVENTIONS.md` and
`PRD.md`, and those changes are collected here. P12 depends on this ticket, so the fixes
are in the first deploy.

This ticket is written before any of P00 to P10 has run, so its items table is empty.
The mechanism is the ticket: the executor reads every done ticket's Hand-back notes and
Open points, lists each item with its source as `<ticket> hand-back, "<bullet>"`, applies
the ones addressed to no-lane files or to done tickets, corrects `CONVENTIONS.md` and
`PRD.md` where a measurement disagreed with the design, and writes the rest into new
tickets with the next free ids. Read the source bullet before acting on an item: the
notes carry the evidence, and this ticket only carries the change.

Errors in a done ticket's own text (a count in a Verification section, a grep in an
acceptance criterion) are recorded in that ticket's hand-back notes and are not
corrected here, because a done ticket's file is a record of what was asked.

This ticket runs after every lane has merged, so it may edit the files `CONVENTIONS.md`
§10 reserves from the lanes (`package.json`, `pyproject.toml`, `Justfile`, the prek
configs, `.gitattributes`, `vitest.storybook.config.ts`, `scripts/check_assets.py`,
`docs/manifest.yml`, `docs/README.md`), the way P12 and P13 may.

Read first: `CONVENTIONS.md` §10, §11 and §12; `PRD.md`; the Hand-back notes and Open
points of every ticket P00 to P10; `AGENTS.md`; the `code-review` and `fix-quality`
skills under `.agents/skills/`.

## Goal

- Every hand-back item from P00 to P10 is either applied here, carried into a new ticket
  by id, or recorded as declined with a reason.
- `CONVENTIONS.md` §11's claims each carry their outcome (held, failed and corrected),
  and §3, §4, §5 and §6 agree with what the tickets measured.
- `docs/reference/budget.md` carries P10's figures if P10 could not write them.
- `just check` green.

## Non-goals

- New behaviour. An item that asks for a feature (`PRD.md`'s v1.1 list, or anything a
  hand-back proposes) becomes a ticket, not a change here.
- Reopening a done ticket, or editing any ticket file other than this one and the new
  ones it writes.
- Pushing, opening the pull request, anything in P12.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| whatever the items table names | repo | the source ticket's hand-back | as the item says |
| `tickets/CONVENTIONS.md` | tickets | the design | §11 outcomes; corrections named by item |
| `tickets/PRD.md` | tickets | the product | corrections named by item, if any |
| `tickets/README.md` | tickets | the index | rows for any new ticket |
| `tickets/P14-*.md` onward | tickets | new | one per item carried forward |
| `tickets/P11-follow-up.md` | tickets | this file | the items table filled; `status: done` |

## Steps

1. **Collect.** For each of P00 to P10, read Hand-back notes and Open points on `main`.
   Write every item into the table below with its source bullet quoted, and classify it:
   *apply* (a no-lane file, a done ticket's file that this ticket may edit, a design
   correction), *carry* (behaviour, or work larger than a fix), *decline* (with the
   reason).
2. **Apply.** Make each *apply* change, smallest first, running the narrowest recipe
   after each and `just check` at the end.
3. **Correct the design.** For each §11 claim, write its outcome after the claim in the
   form the studio uses ("Held: …" or "Failed and corrected: …", naming the ticket and
   bullet). Where a ticket measured something §3 to §6 state differently, change the
   sentence and mark it "(corrected by P11)".
4. **Carry.** Write a ticket for each *carry* item, in the format `README.md` gives,
   with the next free id, citing the source bullet, and add its row to `README.md`'s
   index.
5. **Gates.** `just lint`, `just check-docs`, `just check`. Set `status: done`. Commit.
   Pushing and the pull request are authorised separately.

### Items

| Source | Item | Class | Where |
| --- | --- | --- | --- |
| | | | |

## Acceptance criteria

- [ ] Every hand-back bullet and open point of P00 to P10 appears in the items table
      with a class and a destination.
- [ ] Every §11 claim in `CONVENTIONS.md` carries an outcome.
- [ ] Every *carry* item has a ticket file and an index row.
- [ ] `just check` green.

## Verification

```sh
grep -c '^| P' tickets/P11-follow-up.md
grep -n 'Held\|Failed and corrected' tickets/CONVENTIONS.md | wc -l
ls tickets/P1[4-9]-*.md 2>/dev/null
just check
```

Expected: an item count equal to the bullets collected; at least fourteen outcome lines;
the carried tickets, if any; `just check` green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- The count of items collected, applied, carried and declined.
- Every design correction made, by section.
- The ids of the tickets written.

## Open points

- **Whether to split.** If the items exceed twenty, recommend splitting into P11a
  (design corrections and no-lane files) and P11b (carried tickets), with P12 depending
  on P11a alone.
