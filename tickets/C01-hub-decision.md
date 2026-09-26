---
id: C01
title: "The hub permits a rendered scene: a hub decision, `direction.md`, `character.md`, the naming table, a handover page"
status: open
depends_on: []
parallel_with: []
branch: ticket/c01-hub-decision
estimated_size: L
---

# C01: The hub permits a rendered scene: a hub decision, `direction.md`, `character.md`, the naming table, a handover page

## Context

The hub (H, `/Users/scutting/projects/biscuit_games` at `575e3dd`) owns the platform's
aesthetic and the character, and every game cites it (H `docs/project/what-the-hub-owns.md`
lines 26-35: the aesthetic, Biscuit, the naming of the games and every platform decision
are the hub's). Two of its pages rule out, as written, most of what Pawlour is
(CONVENTIONS.md §1 fact 12, each line at `575e3dd`):

- H `docs/design/direction.md` line 260 (**Avoid**: "Cream or warm-neutral grounds"), lines
  262-263 ("3D rendering"), line 55 (the operating-rule table: "nothing decorative moves |
  The only thing that moves is her"), lines 178-179 ("a decorative transition added
  somewhere harmless still costs it"), lines 186-189 (**Sound**: "Deferred ... waits until
  there is a second game and a reason. When it is taken, it is taken here."), lines 220-224
  ("she reduces to the mark"), lines 91-98 (differentiation "never by re-theming the
  shell"), and lines 85-89 (the naming table lists Poodl and Pawjong only).
- H `docs/design/character.md` lines 69-73 ("absent while a player is thinking"), 115-120
  ("Where she does not go ... anywhere she competes with play"), 89-98 (**The first pose
  set**: "Commissioned from an illustrator"), and 100-104 (a clock is a side effect; "There
  is no clock port in this repository yet").

Pawlour is a Biscuit Games game whose play surface is a three.js diorama of a log cabin,
warm inside, fire-lit, with Biscuit walking through it as animation clips authored from
the approved model (`PRD.md`; CONVENTIONS.md §1 decisions 2, 3, 12 and 13). The maintainer's
answer (§1 decision 2) is that **the hub's rule changes first**: this ticket writes a hub
decision record and narrows both pages, and nothing deploys before it lands (P12 depends
on it). The game is built regardless.

A sister ticket exists in the studio: S `tickets/C01-hub-brand-rule.md`
(`/Users/scutting/projects/biscuit_studio/tickets/C01-hub-brand-rule.md`, 317 lines, status
`open` on 2026-09-25), which plans H decision `0018-renders-from-the-approved-model-may-ship.md`
and narrows `direction.md` lines 262-263 so that a cel render posed from the approved
model may ship. Its narrowed bullet (S C01 lines 203-207) still forbids "3D that reads as
3D — physically based materials, gloss, realistic lighting", so it does not cover a
fire-lit room, and it keeps "motion off reduces to the mark" and "placement only at
boundaries" (S C01 lines 96-98, 165-168). This ticket therefore narrows further, and it
relates to S C01 in one of two ways, decided in step 1:

- **S C01 has landed** (H `docs/decisions/0018-*` exists on `main`): this record is `0019`,
  builds on 0018, and touches lines 262-263 only to widen 0018's own sentence.
- **S C01 has not landed**: this record is `0018`, absorbs S C01's narrowing (its exact
  bullet and its four `character.md` passages, S C01 lines 191-233, reproduced below where
  they apply) so the hub changes once, and S C01 is handed back to the studio to be marked
  carried out by whoever owns it. Nothing in S is edited here.

Two hub mechanisms this ticket runs inside:

- A decision record has a fixed shape and a fixed procedure: H `docs/decisions/README.md`
  lines 53-57 ("Copy the shape of an existing entry: context, the decision, the
  consequences including the ones that hurt, and what would reopen it. Add the file, add
  a manifest entry, add a row above. A decision nobody can find is not recorded.") and
  lines 65-72, the four verbs: a record is **superseded by** a successor, **narrowed by**
  one "that changes part of its letter and none of its reasoning", **carried out on** a
  date "when what it planned actually happened", and "a trigger is **overruled on** a date
  when a later record acts without it, which is not the same as the trigger firing and
  must never be written as though it were." H `docs/decisions/0016-the-play-surface-is-the-platforms.md`
  is the shape to copy (frontmatter, then Context, Decision, Consequences, What would
  reopen this, Related pages).
- A change to a page a game cites runs the `consumer-impact` skill (H
  `.agents/skills/consumer-impact/SKILL.md`, eight steps) and, where Poodl is affected,
  writes the item into H `docs/operations/poodl-handover.md`. Page paths are outside
  versioning (H `docs/reference/published-artefacts.md` lines 116-123), so no version bump
  follows a prose change; the package is untouched.

Two reopeners of earlier records are touched. H decision 0010 lines 274-275 name "A second
game, which would pull the play-surface primitives out of Poodl into shared components
here" as a reopener, and its line 28 already carries a blockquote saying that trigger was
"overruled rather than met" by 0016 (which moved the primitives with no second game).
Pawlour is a second game and pulls none of them, so the record says what happened to that
trigger rather than letting it sit ambiguous. H decision 0013 lines 127-129 name "A
consumer that is not a Biscuit Games game" as a reopener; Pawlour is a game, so it does
not fire, and the record says so in one sentence.

Read first: `PRD.md` whole; CONVENTIONS.md §1 (decisions 1, 2, 8, 11, 12, 13, 14; fact
12), §3 (the licence paragraph), §5.3, §10; every H passage above at H's current `main` (step 1 re-reads the
line numbers); S C01 whole; H
`docs/decisions/README.md` lines 53-72; H `0016` whole (the shape); H `0010` lines 20-30
and 270-278; H `0013` lines 120-131; H `docs/operations/poodl-handover.md` lines 1-24 (the
register of a handover page) and its section "What a cross-repository link costs"; H
`.agents/skills/consumer-impact/SKILL.md`; H `docs/README.md` lines 71-79 and
`docs/manifest.yml` (the last `operations` entry and the last `decisions` entry); T
`template/src/lib/ports/clock.ts` at `v2.1.0` (the clock port `character.md` said did not
exist).

## Goal

A hub pull request, authorised before it is pushed, that:

- adds `docs/decisions/00NN-a-game-may-be-a-rendered-scene.md` (`NN` the next free
  number), indexed and registered;
- narrows `docs/design/direction.md` at the six passages step 4 names, and adds the naming
  row;
- rewrites three passages of `docs/design/character.md` (step 5), plus S C01's four if
  this ticket absorbs it;
- marks decision 0010's second-game reopener and states why 0013's does not fire;
- adds `docs/operations/pawlour-handover.md`, registered and reachable;
- records the `consumer-impact` finding and passes the hub's `just check`;
- names the licence question (`character.md` lines 128-134) as unresolved, and does not
  resolve it.

## Non-goals

- Deploying Pawlour, or any edit to this repository beyond this ticket's status line.
- Editing S, or marking S C01 carried out: that is handed back to the studio in the
  hand-back notes.
- A version bump of the package. Nothing packaged changes.
- Registering Pawlour in H `README.md`'s games table (lines 18-23) beyond one row, or
  changing `what-the-hub-owns.md`'s boundary: the naming row on `direction.md` is the
  rule; the README row is a courtesy this ticket adds in step 6 and nothing else there
  moves.
- Deciding the licence of the model or of `biscuit_pics`; a licence file; reopening 0013.
- Any edit to `direction.md` or `character.md` beyond the passages named. Everything else
  on both pages stands, and the record says so: one face, broken rarely; no first person;
  the mark stays abstract and geometric; the shell is never re-themed.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `biscuit_games: docs/decisions/00NN-a-game-may-be-a-rendered-scene.md` | other repo | new; shape from H `0016` | the record, step 3 |
| `biscuit_games: docs/decisions/README.md` | other repo | H file | one row after the last (line 43 at `575e3dd`) |
| `biscuit_games: docs/manifest.yml` | other repo | H file | one `decisions` entry after the last, one `operations` entry after `poodl-handover` |
| `biscuit_games: docs/README.md` | other repo | H file | one link under "Run it" after line 75 |
| `biscuit_games: docs/design/direction.md` | other repo | H file | lines 55, 88, 178-179, 186-189, 220-224, 260, 262-263; step 4 |
| `biscuit_games: docs/design/character.md` | other repo | H file | lines 69-73, 89-98, 100-104, 115-120; and 25-32, 106-113, 128-134 if absorbing S C01; step 5 |
| `biscuit_games: docs/decisions/0010-biscuit-games-design-system.md` | other repo | H file | one dated sentence under the line-28 blockquote; step 3 |
| `biscuit_games: docs/operations/pawlour-handover.md` | other repo | new; shape from `poodl-handover.md` | step 7 |
| `biscuit_games: README.md` | other repo | H file | one row in the games table, step 6 |
| `biscuit_games: docs/operations/poodl-handover.md` | other repo | H file | only if step 8 finds an item |
| `tickets/C01-hub-decision.md` | tickets | this file | `status: done` |

## Steps

1. **Confirm the numbering, the sister ticket and the lines.** In H at its current
   `main`: `ls docs/decisions/` shows the highest record; `grep -n 'status:'
   /Users/scutting/projects/biscuit_studio/tickets/C01-hub-brand-rule.md` and `ls
   docs/decisions/ | grep 0018` say whether S C01 has landed. Set `NN` to the next free
   number. Then `sed -n 260,263p docs/design/direction.md`, `sed -n 55p`, `sed -n
   178,179p`, `sed -n 186,189p`, `sed -n 220,224p`, `sed -n 85,89p`; `sed -n 69,73p
   docs/design/character.md`, `sed -n 89,104p`, `sed -n 115,120p`, `sed -n 128,134p`;
   `sed -n 26,30p docs/decisions/0010-biscuit-games-design-system.md` and `sed -n
   274,275p`; `sed -n 127,129p docs/decisions/0013-shared-material-travels-as-a-package.md`.
   Each must print the passage quoted in Context or in the steps below; if a line has
   moved, adjust every number in this ticket's hand-back and say so. The design does not
   change.

2. **Create the branch** `ticket/c01-hub-decision` from H's `main`, in a worktree
   (`git -C /Users/scutting/projects/biscuit_games worktree add ../biscuit_games-c01 -b
   ticket/c01-hub-decision main`). Run `just initialize` there if `node_modules/` is
   absent; the hub's gate runs Storybook and needs the browser. H is another repository:
   every edit below is prepared in that worktree and **nothing is pushed** until step 10.

3. **Write the record.** Frontmatter exactly:

   ```markdown
   ---
   title: "Decision 00NN: A game may be a rendered scene"
   kind: "decision"
   audience: [contributor, maintainer, agent]
   canonical_for: [decision_rendered_scene_game]
   requires: []
   ---

   # Decision 00NN: A game may be a rendered scene
   ```

   Then the sections in `0016`'s shape and H's register:

   - **Context.** What Pawlour is, in three sentences from `PRD.md`'s opening (a room she
     lives in; the player taps; she decides; no board, no score, no end). Every passage
     the two pages state against it, quoted with its line: warm grounds (260), 3D
     rendering (262-263), only she moves (55, 178-179), sound deferred until "a second
     game and a reason" (186-189), motion off reduces her to the mark (220-224), never
     re-theme the shell (91-98), absent while a player is thinking (character 69-73,
     115-120), the first pose set from an illustrator (89-98), no clock port (100-104).
     Then the two facts that make the answer: the approved poseable model exists and is
     rigged (D `models/biscuit/README.md` line 3, cited as `biscuit_pics` and its commit
     `1d9d358`; and, if 0018 has landed, 0018 itself); and a room with nothing to think
     about has no board for her to compete with, so the rule that rations her was written
     for a surface this game does not have. Name the second game as the trigger `direction.md`
     line 187 was waiting for.
   - **Decision**, numbered sentences, each the rule that the page edit in steps 4 and 5
     carries:
     1. A game's play surface may be a rendered scene: real-time, cel-shaded, drawn from
        the approved model, with the room painted in one warm hue axis. The shell around
        it stays the platform's, dark, and is never re-themed; the warmth is inside the
        surface and stops at its edge. "3D that reads as 3D" — physically based
        materials, gloss, depth of field, hyperrealism — stays avoided; a cel character
        with ink outlines and a flat-banded room lit by a fire is not that, and the line
        is drawn at whether a stranger reads craft or a game engine.
     2. Inside a scene surface the fire, the weather and the steam may move, because
        they are the scene's weather and not the interface's decoration; the interface
        rule stands unchanged (120-180 ms, no bounce, nothing decorative on the shell
        moves), and she is still the only thing that is alive.
     3. Sound is taken: a game may carry ambient sound, opt-in, off by default, never
        autoplaying, with a visible switch, and it says so on its own pages. The
        platform still has no audio of its own. The "second game and a reason" clause
        has been met by Pawlour, and this record is where the decision was taken.
     4. When motion is off or the device asks for less, a scene game shows a still of
        her rather than reducing to the mark, because a game that is her, emptied of
        her, is not the honest reduction the rule meant; the still is a decision of the
        same kind, drawn once and never animated. For every other surface she still
        reduces to the mark.
     5. Where the surface is a scene and there is nothing to think about, she may be the
        surface: present throughout, tapped, watched. The boundary rule stands for every
        surface that has a board.
     6. Animation clips authored from the approved model are the fuller illustrated
        register, checked against the model as a reference sheet; an illustrator remains
        a route. (If absorbing S C01: also its sentences 1 to 3 on renders and vetted
        generated art, taken from S C01 lines 151-161 in the record's own words.)
     7. The clock port exists (the template ships one at `v2.1.0`,
        `template/src/lib/ports/clock.ts`), and a game that reads the time reads it there.
     8. The naming table gains the room: Pawlour.
     9. Everything else on both pages stands: one face, broken rarely (and Pawlour does
        not break it: the rig has no face); the dry third-person narrator and no first
        person, everywhere; the mark abstract and geometric; the stark shell; the
        contrast floors in all four combinations; the accessibility obligations, which a
        canvas meets by mirroring every control in the document.
   - **Consequences**, each a bold lead sentence then a paragraph, including the ones that
     hurt: the "reads as 3D" line is now a reviewer's eye, not a rule, and Pawlour's own
     pages and its device verification are where the judgement is visible; a second
     motion rule exists (shell versus scene) and every future game has to say which side
     of it a moving thing is on; sound exists on the platform for the first time and the
     platform's own pages still say nothing about how it sounds, which is a page owed the
     day a second game wants it; the still-diorama reduction is weaker than the mark for
     the reader who asked for less motion (a still room is still a picture of her, and the
     mark was chosen to be nothing), stated and accepted; the model's licence is the open
     question `character.md` lines 128-134 record, the game is public, and this record
     names that a public site now shows renders under an unsettled licence without
     resolving it; 0010's second-game trigger: quote line 28's existing blockquote, then
     state that a second game has now arrived and pulled nothing, which confirms the
     overruling rather than firing the trigger, and that a dated sentence is added under
     that blockquote (not a new verb: the trigger was already overruled on 2026-09-05 by
     0016); 0013's "consumer that is not a game" trigger does not fire, because Pawlour
     is a game on this account with the same version policy.
   - **What would reopen this.** A scene a stranger reads as a game engine rather than
     craft (`direction.md`'s decision test, lines 270-278); a third game wanting sound on
     by default, or sound on the shell; a licensing answer for `biscuit_pics` that forbids
     derived work; a facial rig arriving, which reopens the fixed-face question rather
     than this record; the studio taking the animated model back (Pawlour's own ticket
     C02), which changes where the reference lives and not what this record permits.
   - **Related pages**: `direction.md`, `character.md`, `0010`, `0013`, `0016`, `0018` if
     it exists, `what-the-hub-owns.md`, `pawlour-handover.md`, as relative links.

   Then, in `0010-biscuit-games-design-system.md`, directly under the blockquote at line
   28, one dated sentence in the same blockquote: "On YYYY-MM-DD, `[decision 00NN](00NN-a-game-may-be-a-rendered-scene.md)`
   recorded that a second game had arrived and needed none of the play-surface
   primitives, which confirms the overruling." Nothing else in 0010 changes.

4. **Edit `docs/design/direction.md`**, keeping every heading and every other paragraph.
   Each item is a before and an after; the after keeps the page's register and links
   the record as `[decision 00NN](../decisions/00NN-a-game-may-be-a-rendered-scene.md)`
   once per passage at most.

   - Line 55, the Motion row of the table. Before:

     ```markdown
     | Motion | 120–180ms, no bounce, nothing decorative moves | The only thing that moves is her |
     ```

     After:

     ```markdown
     | Motion | 120–180ms, no bounce, nothing decorative moves | The only thing that moves is her — and, inside a scene she lives in, the scene's own weather |
     ```

   - Lines 85-89, the naming table gains a row after Pawjong:

     ```markdown
     | The room | **Pawlour** — Biscuit at home; a scene, not a board |
     ```

   - Lines 178-179. After the sentence ending "still costs it.", add: "A game whose play
     surface is a scene is the one exception, and only inside the surface: there the fire
     and the weather move because they are the room's, and the shell around the room
     keeps this rule; `[decision 00NN](../decisions/00NN-a-game-may-be-a-rendered-scene.md)`
     draws the line."
   - Lines 186-189, **Sound**. Before:

     ```markdown
     **Deferred.** There is no audio, and the decision to have any waits until there is a second
     game and a reason. When it is taken, it is taken here.
     ```

     After:

     ```markdown
     **Taken, narrowly.** The platform has no audio of its own. A game may carry ambient
     sound — opt-in, off by default, never started by anything but the player's own switch —
     and says so on its own pages; Pawlour is the second game that supplied the reason, and
     [decision 00NN](../decisions/00NN-a-game-may-be-a-rendered-scene.md) is where the
     decision was taken. Sound on the shell, or on by default, is still a decision this
     page has not made.
     ```

   - Lines 220-224. After "preferable to a half-animated compromise.", add one sentence:
     "A game whose surface is a scene of her reduces instead to a still of her, drawn once
     and never animated, because emptying that surface of her would leave nothing; decision
     00NN says why that is the same decision and not a compromise." (Link once, as above.)
   - Line 260. Before:

     ```markdown
     - Cream or warm-neutral grounds, friendly geometric sans, soft pill buttons everywhere.
     ```

     After:

     ```markdown
     - Cream or warm-neutral grounds, friendly geometric sans, soft pill buttons everywhere.
       A warm ground inside a game's play surface, where the surface is a scene, is that
       game's and stops at the surface's edge; the shell stays stark.
     ```

   - Lines 262-263. If 0018 has landed, its bullet (S C01 lines 203-207) is on the page;
     append one sentence to it: "A real-time cel scene lit by its own fire is drawn on the
     same side of the line; decision 00NN says so." If absorbing S C01, replace the
     original bullet with S C01's after-text (S C01 lines 203-207, verbatim, with the link
     retargeted to `00NN`) plus that sentence.

   Nothing else on the page changes. `just check-docs` resolves every link.

5. **Edit `docs/design/character.md`**, keeping every heading and every other paragraph:

   - Lines 69-73 (**Where she is allowed to be**): keep the paragraph; add a second: "A
     game whose play surface is a scene she lives in — Pawlour — has no board and nothing
     to think about, and there she is the surface: present throughout, tapped, watched.
     That is not a boundary and it is not decoration; it is the one surface built for
     her, and decision 00NN is where it was permitted." (Relative link once.)
   - Lines 89-98 (**The first pose set**): if 0018 has landed, its first sentence is on
     the page; otherwise replace "Commissioned from an illustrator." with S C01's text
     (S C01 lines 221-224): "Posed and rendered from the approved model in the studio, or
     commissioned from an illustrator; either way the set is a budget as much as a wish
     list:". In both cases add, after the exclusion line 98: "Animation clips authored
     from the approved model are the same register in motion, and a game that has them
     says so on its own pages."
   - Lines 100-104: the paragraph is updated, not deleted. "There is no clock port in this
     repository yet — the device's preferences are the only port —" becomes "This
     repository ships no clock port — the device's preferences and the keyboard are its
     only ports — but the template every game is rendered from does
     (`src/lib/ports/clock.ts`), so a game reads the time there;". The sentence about
     decision 0005 stands.
   - Lines 115-120 (**Where she does not go**): after "anywhere she competes with play.",
     add: "A scene she lives in is not competition: there is no play for her to compete
     with, which is the one case decision 00NN carves out."
   - If absorbing S C01: also its passages at lines 25-32, 106-113 and 128-134 exactly as
     S C01 step 5 gives them (S C01 lines 215-233), with `0018` read as `00NN`. The
     licensing sentence "is not yet decided" (line 133) stands unchanged in every case.

6. **The README row.** In H `README.md` lines 18-23, after the Pawjong row:

   ```markdown
   | Pawlour | A room Biscuit lives in: tap a thing, and she decides what to do about it. | <https://stevencutting.com/biscuit_cozy/> |
   ```

   The address is CONVENTIONS.md §1 decision 14's; if Pawlour has not deployed when this
   lands, write `—` and note that P12 owes the address as a hub follow-up.

7. **The handover page.** `docs/operations/pawlour-handover.md`, frontmatter `title:
   "Pawlour handover"`, `kind: "operations"`, `audience: [maintainer, agent]`,
   `canonical_for: [pawlour_handover]`, `requires: []`. Body in the Poodl page's register
   (H `docs/operations/poodl-handover.md` lines 9-19: "**None of this has happened.**",
   the ledger not a record of work done, "This repository records what Pawlour has to
   change; it never changes it", an agent writes the item down and stops), then three
   groups: **What Pawlour restates** (the four platform clauses CONVENTIONS.md §8 lists in
   `tests/restated.ts`, held equal to the package's text by its own test, and the six
   figures); **What this repository owes Pawlour** (the decided licence for the model's
   renders, the open question on `character.md`; a page on how sound sounds, the day a
   second game with audio wants one; the studio's animated model, when Pawlour's C02
   moves it back); **What a cross-repository link costs** (two sentences pointing at the
   Poodl page's section of that name). Register it in `docs/manifest.yml` after the
   `poodl-handover` entry and link it in `docs/README.md` under "Run it" after line 75,
   with the dash-summary "what Pawlour still has to change."

8. **Run `consumer-impact`** (H `.agents/skills/consumer-impact/SKILL.md`). Steps 2 and 3:
   nothing in the package moved, so there is no version. Step 5: three pages moved and
   one was added; no anchor was renamed (check every `##` heading on `direction.md` and
   `character.md` is unchanged with `git diff main -- docs/design/ | grep '^[-+]## '`,
   expected empty). Step 6: Poodl restates no sentence of either page (`grep -rn -i
   'illustrator\|3D rendering\|reduces to the mark\|Deferred' /Users/scutting/projects/poodl/docs/`);
   if nothing is found, write "nothing to Poodl" in the hand-back notes and leave
   `poodl-handover.md` untouched; if something is found, write the item there in that
   page's register.

9. **Register, index, check.** The manifest entry for the record after the last
   `decisions` entry; the row after the last in `docs/decisions/README.md` (line 43 at
   `575e3dd`), in that table's shape:
   `| [00NN](00NN-a-game-may-be-a-rendered-scene.md) | A game may be a rendered scene |`.
   Then `just check-docs`, then the hub's full `just check`. Record the `CHANGELOG.md`
   question: the package did not change, so no entry and no version (skill step 8).

10. **Authorisation required:** pushing the branch and opening the hub pull request. Stop
    and ask; the diff is prepared and the executor goes no further without it. After the
    merge, set this ticket's `status: done` here and commit that on `ticket/c01-hub-decision`
    in this repository; pushing that is authorised separately too. Hand back to the studio,
    in the notes, what S C01 should do (mark itself carried out on the merge date if
    absorbed; or nothing, if 0018 had landed).

## Acceptance criteria

- [ ] `00NN` exists with the frontmatter above, the five sections in `0016`'s shape, the
      nine numbered decisions, and is registered (`docs/manifest.yml`) and indexed
      (`docs/decisions/README.md`); `just check-docs` in the hub is green.
- [ ] `docs/design/direction.md` differs from `main` only at the passages step 4 names
      (`git diff main -- docs/design/direction.md | grep -c '^@@'` is at most 7), the
      naming table has a Pawlour row, and the Sound section no longer says "Deferred".
- [ ] `docs/design/character.md` differs from `main` only inside the passages step 5
      names, and "is not yet decided" is still present.
- [ ] `0010` gained one dated sentence under its line-28 blockquote and nothing else;
      `00NN` states 0013's trigger does not fire and why.
- [ ] `00NN` states, in one numbered place, what does not change: one face, no first
      person, the mark, the stark shell, the floors, the accessibility obligations.
- [ ] `00NN` names the licence question and does not resolve it.
- [ ] `docs/operations/pawlour-handover.md` exists, opens with "None of this has
      happened", is registered and linked from `docs/README.md`.
- [ ] The `consumer-impact` outcome is recorded, and `poodl-handover.md` changed only if an
      item was found.
- [ ] `package.json` and `CHANGELOG.md` in the hub are untouched.
- [ ] The hub's `just check` is green on the pull request; every push and the pull request
      were authorised first; nothing in S was edited.

## Verification

In the hub worktree, on the branch:

```sh
git diff main --stat
git diff main -- docs/design/ | grep '^[-+]## ' | wc -l
grep -n 'Pawlour' docs/design/direction.md | head -3
grep -c 'is not yet decided' docs/design/character.md
grep -n 'overruled\|00[0-9][0-9]-a-game-may-be-a-rendered-scene' docs/decisions/0010-biscuit-games-design-system.md
grep -n 'does not fire\|0013' docs/decisions/00*-a-game-may-be-a-rendered-scene.md | head -3
grep -c 'pawlour-handover' docs/manifest.yml docs/README.md
git diff main --stat -- package.json CHANGELOG.md | wc -l
just check-docs
just check
```

Expected: nine or ten files in the stat (ten if the Poodl page gained an item); `0`
heading changes; at least two Pawlour lines (the naming row and one link); `1`; two lines
in 0010 (the existing blockquote and the new sentence); at least one line naming 0013;
`1` for each of the two files; `0`; green; green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- The decision number used, whether S C01 had landed, and which branch of step 1 was
  taken; the line numbers if they had moved.
- The `consumer-impact` finding: "nothing to Poodl", or the item written.
- The hub pull request and its check outcome; the merge date, which is the date written
  into `0010`'s sentence.
- What was handed to the studio (S C01 marked carried out, or nothing) and to P12 (the
  README row's address, if it was `—`).
- Which authorisations were asked for and given, with dates.

## Open points

- Whether the Motion row of the operating-rule table (line 55) should change at all, or
  whether the paragraph at 178-179 carries the exception alone. Recommend both: the table
  is the test every decision answers to, and a reader who checks the table alone must see
  the exception.
- Whether "Taken, narrowly" is the right heading register for Sound, given the page's
  other headings are one bold word. Recommend keeping it; the maintainer may shorten it
  to **Taken.** in review.
- Whether the README row should wait for the site to exist. Recommend writing `—` and
  letting P12 hand the address back; a hub row pointing at a `404` is worse than a dash.
- Whether the still-diorama reduction belongs in `appearance.allium` as a guarantee rather
  than on a design page. Recommend not: the guarantee is Pawlour's own
  (`MotionOffIsAStillDiorama`, CONVENTIONS.md §8), and the platform's clause is unchanged.
