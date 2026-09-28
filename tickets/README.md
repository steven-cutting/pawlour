# Tickets for building Pawlour

This directory is the work breakdown for building Pawlour, the Biscuit Games game in which
Biscuit lives in a log cabin and the player taps things for her to do. `PRD.md` says what
the game is; `CONVENTIONS.md` is the shared design every ticket obeys and cites by section.
Each ticket is written for an AI agent with no other context, working in its own git
worktree. Read `PRD.md`, then `CONVENTIONS.md`, then the ticket.

Filing these as GitHub issues, creating the GitHub repository, pushing, tagging and
opening pull requests are separately authorised actions. Nothing here has been filed, and
the repository exists only as a local clone with one commit holding a stub `README.md`.

## Index

Build tickets, in dependency order. The `status:` field in each ticket's frontmatter is
authoritative; this table is a snapshot.

| Id | Title | File | Depends on | Parallel with | Status |
| --- | --- | --- | --- | --- | --- |
| P00 | Foundation: render from the template at v2.1.0, dependencies, large-file policy, the asset checker, recipes, stubs for every path | `P00-foundation.md` | none | none | open |
| P01 | Specification: `pawlour.allium`, `cabin.allium`, the restated platform clauses | `P01-specification.md` | P00 | P02, P03, P04, P05, P09 | open |
| P02 | Model import and the animated exporter: D's `.blend` and scripts, `export_animated_glb.py`, the proof clip | `P02-model-import.md` | P00 | P01, P06, P09 | open |
| P03 | Asset pipeline: `build_assets.sh`, the clip table, budgets measured on the proof export | `P03-asset-pipeline.md` | P02 | P01, P06, P09 | open |
| P04 | Clips, the core set: nine more scripted clips, contact sheets, the maintainer's approval, the stills | `P04-clips.md` | P03 | P01, P05, P06, P07a, P08, P09 | open |
| P05 | The room: scripted props, the `cabin.glb` contract, warm-axis colours, through the pipeline | `P05-the-room.md` | P00, P03 | P01, P04, P06, P07a, P08, P09 | open |
| P06 | Director and ports: the reducer, phases, weather, captions, the timer, frame and audio ports | `P06-director-and-ports.md` | P01 | P02, P03, P04, P05, P09 | open |
| P07a | Scene runtime, static: the three.js adapter, materials, lighting rigs, cameras, hit-test, still mode, context loss | `P07a-scene-static.md` | P03, P06 | P04, P05, P09 | open |
| P07b | Scene runtime, motion: the mixer, walking, procedural idle, fire, weather, the wipe | `P07b-scene-motion.md` | P07a, P05, P04 | P08, P09 | open |
| P08 | Interface: the components, the page, the ports in `onMount`, captions, settings, photo mode, audio | `P08-interface.md` | P06, P07a | P04, P05, P07b, P09 | open |
| P09 | Handbook: the game's pages, decisions 0011 to 0014, the manifest and the map | `P09-handbook.md` | P00 | P01, P02, P03, P04, P05, P06, P07a, P07b, P08 | open |
| P10 | Device verification: iPhone 17 Pro against the budget | `P10-device-verification.md` | P04, P07b, P08, P09 | none | open |
| P11 | Follow-up: what P00 to P10 handed back | `P11-follow-up.md` | P01, P02, P03, P04, P05, P06, P07a, P07b, P08, P09, P10 | none | done |
| P12 | Repository: create it, grant the package, enable Pages, first push, first deploy | `P12-repository.md` | P11, C01 | none | open |
| P13 | Maintainer docs: `README.md`, `CHANGELOG.md` 0.1.0, `AGENTS.md` provenance and deviations | `P13-maintainer-docs.md` | P12 | none | open |
| P14 | A WebGL2 test lane: the scene runtime and its page wiring proved in real Chromium, inside the gate | `P14-webgl-test-lane.md` | P07b, P08 | P09, P10 | open |
| P15 | Second device pass: the 4G first frame, the frame-rate row retaken, and what P06 and P08 left to the phone | `P15-second-device-pass.md` | P10, P11 | P12, P13, P14, P16 | open |
| P16 | Accessibility on the device: reduced motion, the four theme and contrast combinations, and the hard-coded theme | `P16-accessibility-on-the-device.md` | P10, P11 | P12, P13, P14, P15 | open |
| P17 | The five audio loops need an ear: fire that reads as fire, a squeak, and lapping | `P17-the-audio-loops-need-an-ear.md` | P11 | P12, P13, P14, P15, P16 | open |
| P18 | Stills captured from the runtime at the hearth camera, under the same eighteen names | `P18-stills-from-the-runtime.md` | P11 | P12, P13, P14, P15, P16, P17 | open |
| P19 | Level the exported cameras: correct the roll in the room's build script and rebuild `cabin.glb` | `P19-level-the-exported-cameras.md` | P11 | P12, P13, P14, P15, P16, P17, P18 | open |
| P20 | The title card runs on the wipe: one diagonal sweep, in one place, for load-in and photo mode | `P20-the-title-card-runs-on-the-wipe.md` | P11 | P12, P13, P14, P15, P16, P17, P18, P19 | superseded |
| P21 | Fill the screen: the room takes what the viewport leaves, the camera fits its subject, and landscape gets a layout | `P21-fill-the-screen.md` | P11 | P12, P13, P16, P17, P18, P19 | open |
| P22 | The camera follows her: zones, a covering set of presets, and Auto in Settings | `P22-the-camera-follows-her.md` | P19, P21 | P12, P13, P16, P17, P18 | open |

Cross-repository and design tickets. Each is a recommendation written to be picked up on
its own; C01 gates the first deploy.

| Id | Title | File | Depends on | Status |
| --- | --- | --- | --- | --- |
| C01 | The hub permits a rendered scene: a hub decision, `direction.md`, `character.md`, the naming table, a handover page | `C01-hub-decision.md` | none; before P12 | open |
| C02 | Reconcile the animated model with the studio after v1 | `C02-studio-reconciliation.md` | P13 | open |
| C03 | Template hand-backs from Pawlour: the specs how-to's module table, the rule-38 gap, and the eslint conflict note | `C03-template-hand-backs.md` | none | open |
| H01 | Hub hand-backs from Pawlour: item icons upstream, a four-choice `SegmentedControl`, and a pressed state on `Button` | `H01-hub-hand-backs.md` | C01 | open |

## Dependency graph

```text
P00 ─┬─ P01 ── P06 ───────┬─ P07a ─┬─ P07b ─┐
     ├─ P02 ── P03 ─┬─ P04 ┼────────┘        ├─ P10 ─ P11 ─ P12 ─ P13
     │              └─ P05 ┘        └─ P08 ──┤
     └─ P09 ─────────────────────────────────┘
C01 (the hub) ── P12
C02 waits for P13
```

The graph is acyclic. P00 first; then P01, P02 and P09 in parallel; P03 after P02; P04
and P05 after P03; P06 after P01; P07a after P03 and P06 (it uses a stub room until P05
lands); P07b after P07a, P05 and P04; P08 after P06 and P07a, beside P07b; P10 after
P04, P07b, P08 and P09; then P11, P12 and P13 in sequence. C01 touches only the hub and can
start at any time; P12 waits for it. P15 to P20 are the follow-ups P11 carried: each
depends on P11, none gates P12, and they run beside P12 to P14 in any order. C03 carries
P00's and P01's hand-backs to the template and H01 carries P08's to the hub; neither
gates a deploy. P21 runs beside the follow-ups except P14 and P15, with which it shares a
docs page; P22 waits for P19 and P21 because it rebuilds the room and builds on P21's
fit, and shares files with P14 and P15 too.

## How to pick up a ticket

1. Create a worktree on the branch the ticket's `branch:` field names, from `main`, after
   every ticket it depends on has merged. Below, `<branch>` is that field, which is
   lowercase (`ticket/p02-model-import`), and `<id>` is the ticket id (`P02`):

   ```sh
   supacode repo worktree-new --branch <branch> --base main --name <id>
   ```

   Outside a Supacode terminal:

   ```sh
   git worktree add ../<id> -b <branch> main
   ```

2. Read `PRD.md`, `CONVENTIONS.md`, then the ticket. Read the source files the ticket
   names in the clones `CONVENTIONS.md` §0 pins, at the commits it pins. `biscuit_pics`
   and `biscuit_studio` are read-only.
3. Edit only the files the ticket lists, plus the `status:` line of the ticket itself. A
   change needed elsewhere is handed back in the ticket's hand-back notes, not made. A
   ticket that is done, or in progress, is never reopened: what is handed back to it goes
   into a follow-up ticket, and only a ticket nobody has started is amended in place
   (`CONVENTIONS.md` §10).
4. Run the ticket's verification commands and quote their output in the hand-back notes.
5. Where the ticket names the maintainer's approval as a gate (a contact sheet, a
   screenshot), stop there and ask; record the approval in the hand-back notes.
6. Commit on the ticket branch. Pushing and opening the pull request are separately
   authorised: stop and ask.

## Definition of done

For a build ticket: `just check` is green in this repository, the ticket's acceptance
criteria are met, its verification commands ran with the output quoted in the hand-back
notes, every open point is answered or explicitly carried forward, and the ticket's
`status:` is `done` in the same pull request.

For a cross-repository or design ticket: the recommendation is implemented where the
ticket says, its acceptance criteria are met, and every action that touches another
repository or a repository setting was authorised before it was taken.

## Ticket format

Every ticket carries frontmatter (`id`, `title`, `status`, `depends_on`, `parallel_with`,
`branch`, `estimated_size`) and these sections in this order: Context, Goal, Non-goals,
Files touched, Steps, Acceptance criteria, Verification, Hand-back notes, Open points.
Repository paths are written as code spans, never as links, because the hook gate P00
installs runs lychee offline over this directory.

Ids: `P` is a build ticket executed in this repository; `C` is a cross-repository or design
ticket. A follow-up for the hub is filed here with the prefix `H` (C01 writes them; P11
wrote the first, H01, from P08's hand-backs), and one for the studio with the prefix `S`;
each is added to the tables above when it is written.
