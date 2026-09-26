---
id: C02
title: "Reconcile the animated model with the studio after v1"
status: open
depends_on: [P13]
parallel_with: []
branch: ticket/c02-studio-reconciliation
estimated_size: S
---

# C02: Reconcile the animated model with the studio after v1

## Context

CONVENTIONS.md §1 decision 5 has this repository own its animated model for v1: D's
`.blend` and its eight scripts copied byte for byte under `blender/` (P02), ten clips
authored as scripts under `blender/clips/` (P02, P04), an exporter of this repository's own
(`blender/export_animated_glb.py`), and a served GLB built here (P03). That was chosen for
speed, and the maintainer said it would be revisited after v1.

The studio (S, `/Users/scutting/projects/biscuit_studio` at `a4d20af`) is where the
platform's assets are meant to be developed and to leave by copy, recorded on both sides:
S `README.md` lines 3-7, S `docs/how-to/promote-an-asset.md` ("Promotion is a finished
asset leaving the studio for the hub or a game. It happens by copy"; its interim
procedure is four steps: copy from a named commit and check the sha256, record the commit
and the hash beside the file in the consumer, write the item into the studio's
`docs/operations/hub-handover.md`, never edit the other repository), and S ticket
`C02-asset-ledger-design.md` (`/Users/scutting/projects/biscuit_studio/tickets/C02-asset-ledger-design.md`,
status `open`), whose Goal is a design page `docs/explanation/asset-ledger.md`, a studio
decision `0010-assets-leave-through-a-ledger.md`, and follow-up tickets, one per
repository the ledger touches. S holds the same `.blend` (`assets/models/biscuit/model/biscuit-poseable.blend`,
LFS, sha256 `95d16473…`, identical to D's and to this repository's) and no animation
tooling at all; its ticket C03 plans a three.js pose viewer that plays no clips.

So after v1 two repositories hold the same `.blend`, one of them holds the only clips, and
neither ledger knows. This ticket is the design that ends that: a recommendation page,
not code, written so that each follow-up ticket it names can cite a section. It depends on
P13 because the recommendation reads the shipped v1 (which clips exist, what the exporter
does, what the manifest records) rather than the plan.

Read first: CONVENTIONS.md §1 decisions 5 and 18, §3 (provenance, the manifest, the
licence), §4, §10; this repository's `blender/README.md`, `blender/export_animated_glb.py`,
`blender/build_clips.py`, `src/lib/assets/manifest.json`, `docs/decisions/0013-this-repository-owns-its-animated-model.md`;
S `docs/how-to/promote-an-asset.md`, S `docs/operations/hub-handover.md`, S
`docs/explanation/large-files.md`, S `tickets/C02-asset-ledger-design.md` whole and
`tickets/C03-threejs-viewer.md` (its Non-goals name animation), S `assets/manifest.json`
(the entry shape); H `docs/operations/pawlour-handover.md` as C01 wrote it, and H
`docs/project/what-the-hub-owns.md` lines 70-97 (the test: "Would a second game need
this, unchanged?").

## Goal

- `docs/explanation/model-reconciliation.md` in this repository (kind `explanation`,
  topic `model_reconciliation`), registered and linked, answering four questions with a
  recommendation each and the costs of the options it rejects:
  1. **Where the canonical animated `.blend` lives.** Options: S (its purpose; the
     `.blend` is already there in LFS; the clips move there as scripts and S grows a
     `model-clips` recipe), this repository (status quo; two copies forever), or the
     `.blend` in S and the clips here (one source, two toolchains). Recommend S, with the
     reasoning that a second game wanting a walk cycle would need it unchanged.
  2. **How clips travel.** As scripts (rebuilt by the consumer, needs Blender on the
     consumer's machine), as a built GLB (a binary copied under the ledger, sha256
     recorded, rebuilt only in S), or both (the scripts for provenance, the GLB for the
     site). Recommend the built GLB through the ledger, with the scripts staying in S
     only, so a game needs no Blender.
  3. **What the S ledger entry looks like**, in the shape S C02's design settles (or, if
     S C02 has not landed, in the interim procedure's shape: studio commit, sha256, the
     path there, the path here, the date), for `biscuit.glb`, `biscuit.clips.json` and
     the eighteen stills, and how `scripts/check_assets.py`'s `source` field
     (`biscuit_studio@<commit>:<path>`) would carry it.
  4. **What this repository deletes and keeps**, as a table: delete `blender/model/`,
     `blender/src/`, `blender/clips/`, `blender/build_clips.py`,
     `blender/export_animated_glb.py`, the `model-clips` and `model-export` recipes and
     the LFS pattern (decision 0011 narrowed); keep `blender/cabin/` and `cabin-export`
     (the room is this game's, not the platform's), `scripts/build_assets.sh` for the room,
     `check_assets.py`, and the manifest; and what `AGENTS.md`'s deviations and decision
     0013 gain as a **carried out on** mark.
- The follow-up tickets the page implies, written into `tickets/` here with the prefix
  `S` for ones executed in the studio (recommendations only; S is never edited from
  here) and `P` for ones executed here, and added to `tickets/README.md`'s tables.
- One item written for H's `docs/operations/pawlour-handover.md` (a hand-back to the hub,
  not an edit): that the animated model's home moved, and where the hub should look when
  it wants a pose or a clip for `MascotSlot`.

## Non-goals

- Moving anything. No file leaves this repository and none arrives; no ledger entry is
  made; S, H and D are not edited.
- Deciding the licence; the page names it as still open.
- Changing the served GLB, the exporter or any clip.
- Deciding whether S adopts three.js animation in its viewer (S C03's business).

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `docs/explanation/model-reconciliation.md` | repo | new | the recommendation page |
| `docs/manifest.yml` | repo (no lane; this runs after every lane) | P09's | one entry after the last game page |
| `docs/README.md` | repo (no lane) | P09's | one link under `## This game` |
| `tickets/S01-*.md`, `tickets/P14-*.md` (as many as the page implies) | tickets | new | follow-ups, self-contained |
| `tickets/README.md` | tickets | this directory's | rows and graph for the follow-ups |
| `tickets/C02-studio-reconciliation.md` | tickets | this file | `status: done` |

## Steps

1. **Read the shipped v1.** List every file under `blender/` and `src/lib/assets/` with
   its manifest `source`; read `blender/export_animated_glb.py`'s docstring for what it
   needs that S does not have (the ported `portable_material`, the clip table, the
   exporter flags, CONVENTIONS.md §4.2); note which of these S's `assets/models/biscuit/src/`
   already holds byte-identical (all of D's scripts) and which are this repository's
   alone.

2. **Read the studio's state.** Whether S C02 has landed (`ls
   /Users/scutting/projects/biscuit_studio/docs/decisions/ | grep 0010`) and what the
   ledger entry shape is if it has; whether S C03 has landed; S's `.gitattributes` (LFS for
   `*.blend`, blobs for `*.glb`) and its `check_assets.py` fields, so the recommendation
   names the exact entry.

3. **Write the page**, forty words or more per section, one section per question in the
   Goal, each ending in a bold **Recommendation** sentence; a fifth section, "The order of
   operations", saying which follow-up runs first (S takes the clips; S builds and
   records the GLB; this repository takes the GLB under the ledger and deletes its
   Blender half; H's handover gains the item) and that each step is a separately
   authorised change in the repository it touches.

4. **Write the follow-up tickets** in the format `tickets/README.md` states, each
   self-contained, each citing the page by section, each with its `depends_on` on the
   one before; add them to the index tables and the graph. An `S` ticket is a
   recommendation for the studio's maintainer to file there; it is never executed from
   this repository.

5. **Write the hub item** into this ticket's hand-back notes in the register of
   `pawlour-handover.md`, for the maintainer to carry to H.

6. **Register the page** (`docs/manifest.yml`, `docs/README.md`), run `just check-docs`,
   then `just check`. Set `status: done`. Commit. Pushing and the pull request are
   authorised separately: stop and ask.

## Acceptance criteria

- [ ] The page exists, is registered and linked, answers the four questions with a
      recommendation each, names the licence as open, and passes `just check-docs`.
- [ ] Every follow-up ticket the page implies exists under `tickets/`, is in the index and
      the graph, and depends on its predecessor.
- [ ] No file under `blender/` or `src/lib/assets/` changed; S, H and D are untouched.
- [ ] The hub item is in the hand-back notes.
- [ ] `just check` is green.

## Verification

```sh
grep -c 'Recommendation' docs/explanation/model-reconciliation.md
grep -c 'model-reconciliation' docs/manifest.yml docs/README.md
git diff main --stat -- blender src/lib/assets | wc -l
ls tickets/ | grep -E '^(S[0-9]{2}|P1[4-9])-'
just check-docs
just check
```

Expected: at least `4`; `1` for each of the two files; `0`; the follow-up tickets listed;
green; green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- Whether S C02 and S C03 had landed, and which ledger shape the page assumed.
- The follow-up tickets written, with ids.
- The hub item, in the handover register, ready to carry.
- Any fact about v1 the page needed and no page here recorded (handed to the page's
  owner).

## Open points

- Whether the room (`blender/cabin/`) is a platform asset too, if a second scene game
  ever wants a cabin. Recommend not until one does: "Would a second game need this,
  unchanged?" answers no today.
- Whether the stills should be regenerated by S from its render settings so the studio's
  previews and the game's stills agree. Recommend yes, as part of the S follow-up that
  builds the GLB.
- Whether this repository should keep a read-only copy of the clip scripts after the move,
  for a reader of `docs/how-to/author-a-clip.md`. Recommend not: the page cites S by
  path and commit, as `blender/README.md` cites D today.
