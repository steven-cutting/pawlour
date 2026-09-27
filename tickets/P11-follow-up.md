---
id: P11
title: "Follow-up: what P00 to P10 handed back"
status: done
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
points of every ticket P00 to P10; `AGENTS.md`; the `review-change` and `fix-quality`
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

Every Source cell begins with the ticket id, then `hand-back` or `open point`, then the
bullet's lead in quotes (its bold heading, item letter or first clause), so the row can be
found in the source ticket and `grep -c '^| P' tickets/P11-follow-up.md` counts the rows.
Bullets with the same class and destination in one ticket share a row, each lead quoted.
Class is `apply`, `carry` or `decline`, with the reason; `Where` is the section, page or
ticket the change went to.

| Source | Item | Class | Where |
| --- | --- | --- | --- |
| P00 hand-back, "`tickets` is in `.markdownlint-cli2.jsonc` `ignores` and in `[tool.ruff] extend-exclude`" | the deviation recorded in the design; `tickets/README.md`'s sentence still holds for lychee and typos | apply | `CONVENTIONS.md` §2 rows, §11 claim 2 |
| P00 hand-back, "T `v2.1.0`'s `.pre-commit-fix.yaml` has no `check-added-large-files` hook" | only `.pre-commit-config.yaml` carries the `exclude` | apply | §2 row, §3 |
| P00 hand-back, "The branch is `P00-foundation`, not `ticket/p00-foundation`" | the lanes' real branch and worktree names | apply | §0, §11 claim 14 |
| P00 hand-back, "The shared hooks directory now holds a shim naming this worktree's `.venv`" | rerun `just install-hooks` from the primary checkout | decline: already done; the shim at `.git/hooks/pre-commit` names `/Users/scutting/projects/pawlour/.venv/bin/prek` on 2026-09-26 | none |
| P00 hand-back, "`scripts/check_assets.py` imports `re`, `shutil` and `datetime`" | the manifest's canonical form (the `schema_version` wrapper, one entry per line) | apply | §3 "The manifest" |
| P00 hand-back, "Prettier wrapped the `ignores` array in `eslint.config.js`" | `copier update` may conflict there too | apply here; carry to the template | §12; `C03-template-hand-backs.md` |
| P00 hand-back, "The rendered Pages address is `https://steven-cutting.github.io/pawlour/`" | which address the handbook states (P09 and T chose `github.io`) | apply | §1 decision 14 |
| P00 hand-back, "Not verifiable before P12" | CI's `npm ci` installing `sharp`'s Linux binary; `storybook-build` offline | carry, no edit: P12's first push runs CI as its steps stand | P12 |
| P00 open point, "Node's `sharp` binary" | whether `npm ci` needs a flag | decline: none needed locally; CI is the item above | none |
| P00 open point, "`pillow` on Python 3.14" | re-read the release on the day | decline: 12.3.0 resolved and is current | none |
| P01 hand-back, "`EveryControlIsAComfortableTarget` is an `@invariant` inside a local `contract DirectManipulation`" | the kind and the contract | decline: §8 and `tests/restated.ts` already say so | none |
| P01 hand-back, "What else differs from Step 3" (the module's `config` figures, `clock_phase`, the four `given` fields, snake_case literals) | the module as written | decline: the spec is the source of truth and §8 cites it rather than restating it | none |
| P01 hand-back, "The unused `use ./cabin.allium as cabin` in the root draws no diagnostic" (the managed how-to says the opposite) | a row for `cabin.allium` and a reconciled sentence on `work-with-the-specs.md` | carry: a managed page | `C03-template-hand-backs.md` |
| P01 hand-back, "CONVENTIONS.md §8 prose changed in meaning" (`ATapIsAnInvitation`, `EveryItemIsAControl`, `SoundNeverStartsUnasked`, `ACaptionIsShownAndAnnounced`) | the four clause summaries, and `pawlour.sound` no longer persisted | apply | §8, §7 |
| P01 hand-back, "Figures the implementing tickets need that the config block does not carry" (ten figures) | whether any becomes a clause | decline for clauses: the module's Excludes calls them tuning stated beside the code, and P06 shipped them so; apply for the one figure no document stated, the weather weights | §6.1 |
| P01 hand-back, "Also for P11, not a figure: the managed how-to's "Diagnostics and waivers" section" (rule 38) | the checker resolves nothing in `fulfils` | carry: the template's or the checker's | `C03-template-hand-backs.md` |
| P01 open point, "Sound and the platform" | restate a platform sound clause if C01 states one | decline: C01 narrows `direction.md`'s prose and adds no Allium clause, so nothing is owed | none |
| P01 open point, "A second room" | whether a room is a type | decline: v1 does not decide it; the module's own open question stands | none |
| P02 hand-back, "The copied `rig.py` imports `common.py`" | kept byte-identical, not imported | decline: recorded in `blender/README.md` | none |
| P02 hand-back, "Blender emits joints in hierarchy traversal order" | the exporter canonicalises the palette | decline: §4.2 asserts the order already | none |
| P02 hand-back, "120 inclusive samples span 119 intervals" | a clip lasts `(FRAMES − 1) / 30` s | apply | §4.1 table |
| P02 hand-back, "P00 omitted the copied pose/rig JSON from Prettier" | narrow exclusions | decline: P02 added them | none |
| P02 hand-back, "Shared helpers live in `blender/clips/_keys.py`" | the helpers' home | decline: §2 lists `_keys.py` already | none |
| P02 open point, "Where the shared clip helpers live" | the same | decline: settled by the row above | none |
| P02 open point, "Textures in the raw export" | a raw file about 16 MB | decline: 16.15 MB, as expected | none |
| P02 open point, "The undressed display" | a flag for the sweater | decline: `PRD.md`'s open question stands | none |
| P02 hand-back, "P04 follow-up: preserve fractional foot-contact events" | 600 Hz sampling in the exporter | decline: §4.2 already carries the paragraph | none |
| P03 hand-back, "The pinned CLI's `join` explicitly skips skinned nodes and morph targets" | `scripts/join_assets.mjs` instead | apply | §4.3, §11 claim 5 |
| P03 hand-back, "Meshopt's default per-mesh quantization clones a skin for every mesh" | `--quantization-volume scene`; height from the root's inverse-bind matrix | apply | §4.3 |
| P03 hand-back, "`resize` has no `--slots`" | `--pattern '*occlusion*'`, a glob | apply | §4.3 |
| P03 hand-back, "The cabin branch retains empty leaves, skips flattening" and "P05's served-asset check exposed two more cabin-specific requirements" | the room's passes | apply | §4.3 (block rewritten to what `build_assets.sh` runs) |
| P03 open point, "Simplification" | a `simplify` stage if the phone misses 60 fps | decline: P10 held 60 fps at 86,828; the PRD row is corrected instead | `PRD.md` budget row (apply) |
| P03 open point, "Texture memory" | KTX2 | decline: not needed at 60 fps | none |
| P03 open point, "Where the raw export lives" | the raw export in LFS | decline: not, per the recommendation; the maintainer may reopen | none |
| P04 hand-back, "That revision's stance excursion was `STRIDE × STANCE = 0.52`" | the stance wording | apply | §4.1 walk row |
| P04 hand-back, "Durations use P02's N-sample convention" | one frame shorter than the rounded seconds | apply | §4.1 table |
| P04 hand-back, "The still renderer uses the six specified activity frames" (a neutral ground, a review camera) | where the stills come from | apply | §3 "Stills" |
| P04 open point, "Split" | P04a and P04b | decline: done unsplit | none |
| P04 open point, "Stills from the runtime" | re-render at the hearth camera under the same names | carry | `P18-stills-from-the-runtime.md` |
| P04 open point, "Reserved names" | the v1.1 clips | decline: v1.1 | none |
| P04 open point, "Sweater off at night" | a second export or a toggle | decline: `PRD.md`'s open question stands | none |
| P05 hand-back, "The served room is 586,584 bytes" and the material table (eleven `cabin.*` materials, 25,634 triangles, 25 primitives) | the contract's figures | apply | §5.2 |
| P05 hand-back, "The exact chair position, target and 36° vertical field of view produce a tight seat-and-arm crop" | P07a's portrait retreat | decline: P07a fitted the floor corners and the look was approved | none |
| P05 open point, "A door" | set dressing on the −X wall | decline: the maintainer's choice, recorded | `PRD.md` open questions (apply) |
| P05 open point, "The ceiling plane" | keep it or frame it out | decline: recorded | `PRD.md` open questions (apply) |
| P05 open point, "Baked value steps versus lights" | which to lift if over-dark | decline: the look was approved with both | none |
| P06 hand-back, "§11 claim 8, first half: false as written" | jsdom has `requestAnimationFrame` | apply | §11 claim 8 |
| P06 hand-back, "a. Motion off" | `step` resolves movement forward; still mode never sends `arrived` | apply | §6.1, §5.4 |
| P06 hand-back, "b. "A tap on the thing she is at"" | already at or heading to; idle beside it restarts without a walk | apply | §6.1 |
| P06 hand-back, "c. Caption lifetime" | when the caption clears | apply | §6.1 |
| P06 hand-back, "d. Sleep has the minimum; a tap on her inside it is ignored" | the minimum applies to sleep | apply | §6.1, `PRD.md` "What she does" |
| P06 hand-back, "e. The pet's caption lands on the `tapBiscuit` that starts the pet" | the one caption that comes with the tap | apply | §6.1, §8, `PRD.md` "Captions" |
| P06 hand-back, "f. `sit` has two exits" | the reading taken | decline: no recording contradicted it | none |
| P06 hand-back, "g. `untilIdleChoice` counts idle time only" | idle time only; the phase-boundary edge | apply the rule; carry the edge to a recording | §6.1; `P15-second-device-pass.md` |
| P06 hand-back, "h." (rounding to the millisecond) | whole seconds, rounded | apply | §6.1 |
| P06 hand-back, "i. `setPhase('auto')` only clears the override" | the page sends `clockPhase` after it | apply | §6.1, §7 |
| P06 hand-back, "j." (a phase change resets the lights only when the phase actually changes) | the toggle's lifetime | apply | §6.1 |
| P06 hand-back, "k.", "l.", "n.", "p.", "q." (the floor target, the draw order, two extra exports, five timer cases, where the test cases sit) | implementation notes | decline: nothing in the design says otherwise | none |
| P06 hand-back, "m." (the `as unknown as` casts) | drop them from §6.2 | decline: §6.2 already writes `= globalThis` with no cast | none |
| P06 hand-back, "o. The audio adapter" | its behaviour before `enable()` | decline: P08 built against it and tested the stale enable | none |
| P06 hand-back, "7. Hand-backs for P11 to carry" (CONVENTIONS; P08; P07a and P07b; P09) | the four destinations | apply the CONVENTIONS list (rows above) and P09's rows on `testing.md`; decline the P08, P07a and P07b items, which those tickets did | §6.1, §7, §11 claim 8; `docs/reference/testing.md` |
| P06 open point, "`pet` while walking" | stop her and pet her | decline: kept refusing, as `ATapIsAnInvitation` says | none |
| P06 open point, "The chair's climb" | a real climb clip | decline: v1.1 | none |
| P06 open point, "`idle.long`'s frequency" | raise `IDLE_LONG` if the recording says so | carry | `P15-second-device-pass.md` |
| P07a hand-back, "The maintainer selected P07a's four/six ramps" | four and six steps, the fixed ink, sRGB output | apply | §5.3, §11 claim 11 |
| P07a hand-back, "**P05 asset follow-up:** correct the exported camera roll" | the export's up vectors | carry | `P19-level-the-exported-cameras.md` |
| P07a hand-back, "`scale = 0.55 / 3.11312993250124`", "`requireCabin` accepts the generated four-waypoint stub", "At 390×844, initial load draws once", "Live pointer checks", "A night PNG capture" | measurements | decline: figures recorded; nothing in the design disagrees | none |
| P07a hand-back, "`BASE_PATH=/pawlour just frontend-build` and the local production preview resolve both GLBs" | the URL carries the base path | apply | §11 claim 9 |
| P07a hand-back, "`preserveDrawingBuffer` stays false; synchronous capture succeeds" | the capture premise | apply | §11 claim 12 |
| P07a hand-back, "Implementation and local review" (the component's props, `createScene`'s arguments, the levelled camera, the retry button) | the runtime as built | apply | §5.4 |
| P07a open point, "No P07a decisions remain open" | none | decline | none |
| P07b hand-back, "§11 claim 15" | the additive pet on the real mixer | apply | §11 claim 15 |
| P07b hand-back, "Measured walking speed is `0.18276318243234008` scene units/s" | the speed and the stride's unit | apply | §5.1 |
| P07b hand-back, "The maintainer chose desktop recording; phone Safari timeline measurement is deferred to P10" | the phone pass | decline: P10 done | none |
| P07b hand-back, "The manifest adds only `fire.webp`" and "`runtime.json` records zero frame subscriptions" | evidence | decline | none |
| P07b resolved planning points, "Visual randomness", "Path corners", "Motion off mid-walk", "Crossfade timing" | settled in P07b | decline | none |
| P08 hand-back, "`ItemControls` marks where she is with the platform `Button`'s `current` prop" | `aria-current` and the words | apply | §7 |
| P08 hand-back, "`Caption` is one platform `Notice` and no `Announcer`" | the caption's announcement | apply | §7, `PRD.md` "Captions" |
| P08 hand-back, "The platform's icon map (22 names) has no bed, chair, bowl, lamp, string lights, paw or camera" | game-local Lucide icons; icons upstream | apply the design; carry the hub half | §7, §2; `H01-hub-hand-backs.md` |
| P08 hand-back, "`pawlour.sound` is not persisted" | the switch's persistence | apply | §7 |
| P08 hand-back, "`setPhase('auto')` only clears the override (P06 hand-back 4i)" | the page's `clockPhase` | apply | §7 |
| P08 hand-back, "The installed Vite 8.2.1 does not list `glb` in its known asset types" | `?url` | apply | §1 fact 8, §11 claim 9 |
| P08 hand-back, "The page takes one optional prop, `ports?: Ports`" | the single-rule disable | decline: recorded with its reason | none |
| P08 hand-back, "Four pure modules beyond the ticket's list" | `sentence.ts`, `cues.ts`, `data/controls.ts`, `drawn.ts` | apply | §2 tree |
| P08 hand-back, "The runtime draws once per state it is handed" (`drawsTheSame`), "The loading card is for the first load only", "`TitleCard` paints its whole box black", "P07b adds one manifest entry beside this ticket's five", "`stories/SceneCanvas.stories.svelte` already existed", "The clock is read through a second `timer.every`", "\"Saved\" is held for `SAVED_MS`", "Photo mode has no readiness gate", "`PhotoButton` is the ninth cell", "`just assets-manifest` exits 1 on its first run over new audio", "The accessibility review ran the skill's seven steps" | implementation notes | decline: nothing in the design disagrees; P10 fixed the tick redraw the first of these led to | none |
| P08 hand-back, "The platform `SegmentedControl` with four choices runs to 293 px" | a four-choice fit upstream | carry | `H01-hub-hand-backs.md` |
| P08 hand-back, "The Verification grep `grep -rn 'enable()' src/`" | an error in a done ticket's text | decline: recorded there, as this ticket's Context says | none |
| P08 hand-back, "§11 claim 10" | `'three'` alone suffices | apply | §11 claim 10 |
| P08 hand-back, "§11 claim 8 (second half)" | WebGL2 in the story job's Chromium | apply | §11 claim 8 |
| P08 hand-back, "§11 claim 12" | not blank; the premise holds | apply | §11 claim 12 |
| P08 hand-back, "The scarlet and the measured ratios" | the four combinations | decline: held by `tests/overlay-contrast.test.ts` | none |
| P08 hand-back, "Audio" (`ffmpeg`, `.mp3`, the bytes) | §3's extension | decline: §3 unchanged | none |
| P08 hand-back, "Codex adversarial review", finding 1, "Motion on stalled every walk" | fixed by the merge; the walk end to end | decline: P10 saw the walk arrive on the phone | none |
| P08 hand-back, "Codex adversarial review", finding 2, "A failed first load left the loading card over the retry button" | the path in a gate, and once on the device | carry: the lane exists as P14; the device check | `P14-webgl-test-lane.md` (exists); `P15-second-device-pass.md` |
| P08 hand-back, "Codex adversarial review", finding 3, "A stale `enable()` overwrote Off" | fixed and tested | decline | none |
| P08 hand-back, "Codex adversarial review", finding 4, "Lamp and Lights exposed no state" ("hand-back to the platform: a `pressed?: boolean` on `Button`") | `aria-pressed` upstream | apply the name-and-word design; carry the platform half | §7; `H01-hub-hand-backs.md` |
| P08 hand-back, "Follow-up outside this review: P07b's `wipe.ts` (its step 7) is meant for the title card" | one sweep | carry | `P20-the-title-card-runs-on-the-wipe.md` |
| P08 open point, "Jar in v1" | left out | decline: settled | none |
| P08 open point, "The camera control's place" | the dialog | decline: settled | none |
| P08 open point, "The `.m4a` fallback" | not needed | decline: settled | none |
| P08 open point, "`Notice` for a failed `enable()`" | whether Safari rejects inside a gesture | carry | `P15-second-device-pass.md` |
| P09 hand-back, "Decision numbers shifted by one" | 0012 to 0015 everywhere the design says 0011 to 0014 | apply | §1 decisions 16 to 21 and fact 10, §2 `docs/**` row, §3 `.gitattributes` block, §9 table |
| P09 hand-back, "Two files outside Files touched" | comment lines in `.gitattributes` and `.pre-commit-config.yaml` | decline: done | none |
| P09 hand-back, "Manifest: the key is `pages`", "Page titles", "Shortest page", "Lanes merged when written" | records | decline | none |
| P09 hand-back, "`AGENTS.md`: the deviations paragraph was already a list" | the dependency bullet | decline: P13's provenance pass reads it | none |
| P09 hand-back, "Pages not verifiable against code because their lane has not merged" (seven bullets) | verify after P07b, P08 and P10 merged | apply: checked against `main`; `testing.md`'s suite table and `the-director.md`'s port list corrected, the other five held | `docs/reference/testing.md`, `docs/explanation/the-director.md` |
| P09 hand-back, "For P11 to carry into a new ticket: run the room checker inside the pipeline" | `check_cabin.py` at the end of the cabin branch | apply, at the maintainer's choice on 2026-09-26 rather than carried | `scripts/build_assets.sh`, `docs/how-to/build-assets.md`, `docs/design/the-room.md`, `blender/README.md` |
| P09 hand-back, "Where a page follows `main` rather than `CONVENTIONS.md`", items 1 to 10 | the ten corrections | apply | §4.1 (1, 2), §4.3 (3), §3 (4), §5.2 (5), §5.3 (6), §5.4 (7), §6.1 (8), §11 claim 8 (9), §7 (10) |
| P09 hand-back, "Open points settled" and P09 open points, "A design page's kind", "The hub's pages by blob URL", "`purpose-and-scope.md` is a seed page" | settled in P09 | decline | none |
| P10 hand-back, "*Biscuit's triangles*, 86,828 in the file and 173,656 drawn against a 45,000 target" | the PRD row | apply | `PRD.md` budget row |
| P10 hand-back, "*First frame on 4G*, not measured" | once Xcode is on the Mac | carry | `P15-second-device-pass.md` |
| P10 hand-back, "*Reduced motion on the device* (Step 5, both halves) and *the four theme and contrast combinations* (Step 7): **deferred by the maintainer**" | an optional follow-up | carry | `P16-accessibility-on-the-device.md` |
| P10 hand-back, "*Sound* (Step 6): … The character of the synthesised sounds is a hand-back to **P11**" | an ear, or recordings | carry | `P17-the-audio-loops-need-an-ear.md` |
| P10 hand-back, "*The redraw-per-tick defect* was fixed here", "*The maintainer's copy of the run*", "**`debug.ts` was kept**", "Changes beyond the file table" | done and documented | decline | none |
| P10 hand-back, "Codex adversarial review", "*The hook called every tick a second*" (the frame-rate row retaken at the next device pass) | the row with the corrected hook | carry | `P15-second-device-pass.md` |
| P10 hand-back, "Codex adversarial review", "*`hideRoom()` did not hold*" | fixed; its lane test | decline: fixed; P14 carries the browser test | none |
| P10 hand-back, "**§11 claim 6:** holds on the device" and "**§11 claim 7:** holds on the device" | the outcomes | apply | §11 claims 6 and 7 |
| P10 open point, "Keep the debug hook" | kept, gated, documented | decline: settled | none |
| P10 open point, "The 4G profile" | record the preset, not the word | carry | `P15-second-device-pass.md` |
| P10 open point, "A budget that is wrong" | DPR versus frame rate | decline: not reached; 60 fps holds at DPR 2 | none |

## Acceptance criteria

- [x] Every hand-back bullet and open point of P00 to P10 appears in the items table
      with a class and a destination.
- [x] Every §11 claim in `CONVENTIONS.md` carries an outcome.
- [x] Every *carry* item has a ticket file and an index row.
- [x] `just check` green.

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

### Executed 2026-09-26

Executed in the worktree `/Users/scutting/.supacode/repos/pawlour/P11-follow-up` on the
branch `P11-follow-up` (the maintainer created both; the ticket's `branch:` field says
`ticket/p11-follow-up`), from `main` at `6979aaf`. Four choices were put to the maintainer
before anything was written, and each took the recommendation: one ticket rather than a
P11a/P11b split (the open point below); carried items go into new ticket files only, so
C01 and P12 are untouched; the room checker is applied here rather than carried, as P09
asked; the template's items go into a C03 ticket rather than being declined.

**Counts.** 120 rows in the items table, each a bullet or a group of bullets with one
class and destination: 46 applied, 15 carried, 54 declined, 4 applied here
and carried in part, 1 declined for the ask and applied as a record. Every carried item
has a ticket: P15 to P20, H01 and C03.

**Applied to the repository.**

- `scripts/build_assets.sh`: the cabin branch ends with `scripts/check_cabin.py` before
  `just assets-manifest`, as the Biscuit branch ends with `check_model_asset.mjs`.
  Verified by `just cabin-export` then `just assets-build cabin` in this worktree: the
  check ran ("cabin contract valid; 25,634 triangles, 25 primitives, all 47 positions
  within 0.01 m") and the rebuilt `cabin.glb` and manifest were byte-identical to
  `main`, so nothing under `src/lib/assets/` changed. `just check-cabin-self-test`:
  "valid input accepted, 14 broken contracts refused". `docs/how-to/build-assets.md`,
  `docs/design/the-room.md` and `blender/README.md` stop calling it a manual step.
- `docs/reference/testing.md`: "What the current suite proves" gains rows for
  `director.test.ts`, `phases.test.ts`, `captions.test.ts`, the appended blocks of
  `ports.test.ts`, the page's pure modules, the nine component tests and
  `assetPipeline.test.ts`, and the `route.test.ts` row describes P08's page rather than
  the seed (P06 hand-back 7; P09's "P08 not merged" bullet).
- `docs/explanation/the-director.md`: the storage port holds the camera choice too.
- The other five pages P09 could not verify (`rendering.md` "Motion" and "When it
  draws", `art-direction.md` "Overlays", `the-director.md` "Time", `asset-manifest.md`'s
  fire and audio rows, `test-on-a-phone.md` and `budget.md` after P10) were read against
  `main` and held.

**Design corrections, by section** (each changed sentence ends "(corrected by P11)";
60 marks in `CONVENTIONS.md`, 4 in `PRD.md`):

- §0: the lanes' real worktree and branch names.
- §1: decision 14, the Pages address is `steven-cutting.github.io/pawlour/`; decisions
  16, 17, 18 and 21 cite records 0015, 0013, 0012 and 0014; fact 8, Vite 8.2.1 needs
  `?url` for a `.glb`; fact 10, a game's records start at 0012.
- §2: `pyproject.toml` and `.markdownlint-cli2.jsonc` rows carry `tickets`; only
  `.pre-commit-config.yaml` holds the large-file hook; `docs/**` row 0012–0015; new rows
  for P03's four scripts, P08's four pure modules and the icon set.
- §3: the `.gitattributes` comment names 0012; the `exclude` lives in one prek config;
  the manifest's wrapper and canonical layout; `platform` and `cc0` as shipped and no
  `biscuit_pics@` entry; stills from a neutral ground and a fixed review camera, with the
  two sleep pairs byte-identical; `git lfs install --local` on `export-the-model.md`.
- §4.1: `idle_sit.py` naming; `FRAMES` are samples and a clip lasts `(FRAMES − 1) / 30` s;
  contact sheets from the review camera; `STRIDE` 1.0 model units and `STRIDE × STANCE`.
- §4.3: the pipeline block rewritten to what `build_assets.sh` runs (the local binary,
  `--keep-leaves true`, the skin-aware join, no `flatten` for the room, the occlusion
  glob, `--quantization-volume scene`, the cabin passes); the clip table's real `stride`
  and `height`; normals always stripped; the two checkers after the build.
- §5.1: speed is `stride × scale / seconds`, 0.18276 units/s measured.
- §5.2: eleven materials, the primitive cap, contiguous numbering, the measured counts,
  where `check_cabin.py` runs and what the runtime checks.
- §5.3: four- and six-step ramps, the patched shader, the one ink `#33221f`, the
  vignette as a scene quad.
- §5.4: `SceneCanvas`'s props and `createScene`'s arguments as built; the levelled
  camera fitting four floor corners; still mode never sends `arrived`; `onError` and the
  "Retry 3D scene" button; `TitleCard` not yet on `wipe.ts` (P20).
- §6.1: `deps` is the random port; commands keyed by `kind`; `target` a named node; a
  tap on the thing she is at or heading to; sleep's minimum; the pet's caption with the
  tap; the caption's lifetime; a toggle until the phase actually changes; motion off
  resolving forward; `setPhase('auto')` and `clockPhase`; idle intervals whole, rounded,
  idle time only; the tick; the weather weights.
- §6.2: no change; it already writes `= globalThis` without a cast (P06 4m).
- §7: one `Notice` and no `Announcer`; the game's own icons; `aria-current` and the
  words; each light's state in its name; `pawlour.sound` never persisted; `clockPhase`
  after Auto.
- §8: the four clause summaries P01 re-elicited.
- §9: the four decision rows 0012–0015.
- §11: every claim carries its outcome; 15 lines match `Held\|Failed and corrected`.
  Claims 5, 8 (first half) and 9 failed and were corrected; claim 2 held for the render
  and failed for the first check; claim 13 is not yet checked and waits for P12; the
  rest held.
- §12: `copier update` also conflicts on `eslint.config.js`.
- `PRD.md`: the sleep minimum under "What she does"; `Notice` alone and the pet's caption
  under "Captions"; the budget measured on a 17 Pro Max; the triangles row replaced by
  the measured 86,828 and 173,656 with the 45,000 target withdrawn; open questions for
  the door and the ceiling plane, and the caption count.

**Tickets written**, each with its index row in `README.md`: P15 (the second device
pass: 4G, the frame-rate row, `idle.long`, a rejected `enable()`, the failed load), P16
(accessibility on the device, optional), P17 (the audio loops), P18 (stills from the
runtime), P19 (level the exported cameras), P20 (the title card on the wipe), H01 (the
hub: icons, the four-choice control, `pressed`), C03 (the template: the specs how-to and
the eslint conflict note). `README.md` also marks this ticket done in its snapshot, adds a
sentence under the graph, and says P11 wrote the first `H` ticket.

**Verification, as run.**

```text
$ grep -c '^| P' tickets/P11-follow-up.md
121   (120 item rows; the Files-touched header "| Path" is the 121st)
$ grep -n 'Held\|Failed and corrected' tickets/CONVENTIONS.md | wc -l
15
$ ls tickets/P1[4-9]-*.md
tickets/P14-webgl-test-lane.md  tickets/P15-second-device-pass.md
tickets/P16-accessibility-on-the-device.md  tickets/P17-the-audio-loops-need-an-ear.md
tickets/P18-stills-from-the-runtime.md  tickets/P19-level-the-exported-cameras.md
$ just check
exit 0 through every stage (lock-check, lint, frontend-static, frontend-coverage:
27 files, 355 tests, 100 / 97.63 / 100 / 100; frontend-build, storybook-build,
storybook-test: 11 files, 35 tests; check-docs, check-agents, check-specs,
analyse-specs, check-assets, check-clean), ending "All checks passed and the
worktree is unchanged."; run before this file's last edit, which the hook gate
then linted at commit
```

## Open points

- **Whether to split.** If the items exceed twenty, recommend splitting into P11a
  (design corrections and no-lane files) and P11b (carried tickets), with P12 depending
  on P11a alone.
  *Answered: the items ran to 120 rows, and the split was recommended to the maintainer
  on 2026-09-26 with the reasons against it (P12 depends on all of P11 as the graph
  stands, and the carried half is ticket-writing, not code). The maintainer chose one
  ticket, as written.*
