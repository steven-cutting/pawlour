---
id: P13
title: "Maintainer docs: `README.md`, `CHANGELOG.md` 0.1.0, `AGENTS.md` provenance and deviations"
status: open
depends_on: [P12]
parallel_with: []
branch: ticket/p13-maintainer-docs
estimated_size: S
---

# P13: Maintainer docs: `README.md`, `CHANGELOG.md` 0.1.0, `AGENTS.md` provenance and deviations

## Context

Every lane has merged and P12 has created the GitHub repository, applied its settings and
deployed the site once. What remains is the three root files a reader meets first. P00
rendered them from T at `v2.1.0`: `README.md` from `template/README.md.jinja` (the
game's description, the Pages address, quick start, check your work, layout,
documentation, boundaries), `CHANGELOG.md` from `template/CHANGELOG.md.jinja` (one
`[Unreleased]` entry saying the repository was rendered), and `AGENTS.md` from
`template/AGENTS.md.jinja` whose Provenance section (lines 146-171 of the jinja) ends
"Deliberate deviations for this repository ... none yet". P09 added the game's decision
records and started the deviations list. This ticket writes the three files in final
form, using facts that only exist now: the address the site is served at, the checks
`main` requires, the measurements P10 recorded, and which decisions the game carries.

Read first: CONVENTIONS.md §0, §1 (decisions 1, 2, 5, 14 to 21), §2, §3, §4, §9, §10; T
`template/README.md.jinja`, `template/CHANGELOG.md.jinja` and `template/AGENTS.md.jinja`
at `v2.1.0` (`git -C /Users/scutting/projects/biscuit_games_template show v2.1.0:<path>`),
so the shape the render gave these files is kept and only the game's sections are added;
S `README.md` (`/Users/scutting/projects/biscuit_studio/README.md`, the register for a
model's provenance and Blender recipes in a README); this repository's `AGENTS.md`,
`docs/decisions/README.md` (P09's), `blender/README.md` (P02's), and the P10, P11 and P12
hand-back notes, which record the budget measurements, what was carried, the deployed
address, the check names and what the bootstrap changed.

The agent contract (`bg-validate-agents`, G
`/Users/scutting/projects/biscuit_games_tooling/src/biscuit_games_tooling/validate_agents.py`
lines 47-54) requires the six phrases `untrusted`, `just check`, `explicit authorization`,
`ai_tmp/`, `docs/specs/` and `runes` in `AGENTS.md` and at least 300 words; an edit to the
Provenance section must leave all six standing. `README.md` and `CHANGELOG.md` are seed
paths T never updates (CONVENTIONS.md §1 fact 7), linted as root files (markdownlint,
typos, lychee offline) and registered nowhere, so neither carries frontmatter.

Tagging `v0.1.0` is a separately authorised action (CONVENTIONS.md §10) and this ticket
does not tag: it writes the changelog entry the tag will name and stops.

## Goal

- `README.md` keeps T's rendered sections and adds the game's own: what Pawlour is and is
  not, the phone it is built for and the budget it meets, where the model came from and
  how its clips are made, the Blender recipes, and the boundary with the hub and the
  studio.
- `CHANGELOG.md` carries a `0.1.0` entry describing the first release and the two link
  definitions Keep a Changelog expects.
- `AGENTS.md`'s Provenance section names the template version, the four decision records
  the game carries, the deviations (each with its decision), and the dependencies P00
  added, and `just check-agents` is green.

## Non-goals

- Tagging, pushing, opening the pull request: each is authorised separately.
- Any handbook page under `docs/`: P09 owns them; a fact this ticket wants to state and
  cannot find on a page or in a hand-back is handed to P11's successor, not written here.
- Any other section of `AGENTS.md`. Only Provenance changes.
- Editing `.copier-answers.yml`, `package.json` or any file CONVENTIONS.md §10 lists as
  touched by no lane.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `README.md` | repo (seed) | P00's render of T `template/README.md.jinja` | the game's sections added, step 2 |
| `CHANGELOG.md` | repo (seed) | P00's render of T `template/CHANGELOG.md.jinja` | the `0.1.0` entry and the link definitions, step 3 |
| `AGENTS.md` | repo (managed, game-edited) | P00's render, P09's deviations | the Provenance section only, step 4 |
| `tickets/P13-maintainer-docs.md` | tickets | this file | `status: done` |

## Steps

1. **Collect the facts.** From the P12 hand-back: the served address (expected
   `https://stevencutting.com/biscuit_cozy/`), the three required contexts as GitHub
   reports them, whether `--hygiene` was applied, whether vulnerability reporting is on.
   From the P10 hand-back: the measured frame rate, draw calls, the two GLB sizes and the
   first-load total on the phone, against `PRD.md`'s budget table. From
   `docs/decisions/README.md`: the four game records (0011 to 0014, CONVENTIONS.md §9)
   with the titles it gives. From `blender/README.md`: the D commit and the two digests.
   From `src/lib/assets/biscuit.clips.json`: the clip names shipped. These are the facts
   the README states; do not state one the notes do not carry.

2. **Write `README.md`.** Keep every section T rendered (`# Pawlour`, the description, the
   **Play it at** line, the platform paragraph, Quick start, Check your work, Layout,
   Documentation, Boundaries) in its place and its words, then:

   - After the platform paragraph, `## What it is`: two paragraphs in `PRD.md`'s opening
     register: a room Biscuit lives in, the player taps, she decides; one room in v1, the
     things in it, the three phases, sound off by default, no meters and no progression.
     One sentence naming the style: cel Biscuit, painted room, red, black and white
     overlays.
   - `## The phone`: built for an iPhone 17 Pro or better in Safari; the budget figures as
     P10 measured them, in a small table with the budget beside the measurement (frame
     rate, draw calls, `biscuit.glb`, `cabin.glb`, first load); and that motion off gives
     a still room.
   - `## The model`: the approved poseable model of the real dog, copied from
     `biscuit_pics` at `1d9d358` with the two digests, animated here with clips authored
     as scripts under `blender/clips/`; the ten clip names; that the `.blend` is in Git LFS
     and needs `git lfs install --local` in a fresh clone before it is anything but
     pointer text; that the model's licence is the platform's open question
     (CONVENTIONS.md §3); that the studio is where the platform's assets are meant to
     live and that reconciling with it is recorded as a later ticket (C02).
   - `## Rebuilding the assets`: the four Blender recipes and the pipeline as a `console`
     block (`just model-clips`, `just model-export`, `just cabin-export`, `just
     assets-build biscuit`, `just assets-build cabin`, then `just check-assets`), that
     they need Blender 5.2.1 at `/Applications/Blender.app` or `BLENDER` set, that none
     runs in CI, and that the built files are committed and checked against
     `src/lib/assets/manifest.json`.
   - In `## Layout`, the `text` block gains `blender/` (the model, its scripts, the clips,
     the room) and `src/lib/assets/` (what the site serves, and the manifest) and
     `src/routes/scene/` (the three.js runtime, outside the coverage glob).
   - In `## Documentation`, four more links: `docs/design/art-direction.md`,
     `docs/explanation/rendering.md`, `docs/how-to/author-a-clip.md`,
     `docs/decisions/README.md`.
   - In `## Boundaries`, one paragraph after T's: the hub owns the rules about Biscuit and
     permits this game's scene by its decision record (name the number C01 used, as a
     code span, no link out); the studio owns her assets in principle and this repository
     holds its own copy until C02; nothing here is promoted anywhere.
   - `## Bootstrap of this repository`, in the shape of T `README.md` at `v2.1.0` lines
     247-259: CI runs three jobs on every pull request, push to `main` and dispatch, all
     three required on `main`, applied by T's `scripts/bootstrap_repo.sh` run from a copy
     (P12); the Pages source is GitHub Actions; the vulnerability-reporting, package-grant
     and `--hygiene` outcomes as P12 recorded them.

   Every link is relative and resolves; every path is a code span; the site address
   appears in angle brackets in T's **Play it at** line and nowhere else.

3. **Write `CHANGELOG.md`.** Keep T's header (the two sentences, Keep a Changelog and
   Semantic Versioning), then:

   ```markdown
   ## [Unreleased]

   ## [0.1.0] - <date>

   ### Added

   - ...
   ```

   The `Added` list names, one bullet each: the repository rendered from the template at
   `v2.1.0` (T's own bullet, moved here from `[Unreleased]`); the specification
   (`pawlour.allium`, `cabin.allium`, the restated clauses); the model imported from
   `biscuit_pics` at `1d9d358` and the animated exporter; the asset pipeline, the manifest
   and `just check-assets`; the ten clips; the room; the director and the three ports;
   the scene runtime; the interface (the controls, the settings dialog, captions, photo
   mode, ambient sound off by default); the handbook pages and decisions 0011 to 0014;
   the device measurements; the deployment at the address. Use the date P12's first
   deploy succeeded. Then the two link definitions, replacing T's one:

   ```markdown
   [Unreleased]: https://github.com/steven-cutting/biscuit_cozy/compare/v0.1.0...HEAD
   [0.1.0]: https://github.com/steven-cutting/biscuit_cozy/releases/tag/v0.1.0
   ```

   Both resolve only after the tag exists; lychee runs `--offline` and skips them.

4. **Finalise the Provenance section of `AGENTS.md`**, and nothing above it. Keep T's
   opening paragraph and its bullet list of what the template decides; then the
   "Deliberate deviations" paragraph becomes a list, each item with its decision as a
   relative link into `docs/decisions/`, in this order: served assets are ordinary blobs
   and the `.blend` is LFS, with `check-added-large-files` excluded for
   `src/lib/assets/` (0011); the three.js runtime lives under `src/routes/scene/`,
   outside the coverage glob, with the browser touchpoints behind ports (0012); this
   repository owns its animated model rather than taking it from the studio (0013);
   three.js as the renderer, with `three`, `@types/three`, `@gltf-transform/cli` and
   `sharp` pinned in P00 (0014); `vitest.storybook.config.ts` appended with `three` in
   `optimizeDeps.include`, a managed file this game edits (recorded under 0014); a
   `check-assets` gate appended to the recipes; four Blender recipes and `preview-lan`
   appended to the `Justfile`. Add whatever P10 and P11 recorded as a further deviation.
   Do not move or reword the six phrases the validator requires.

5. **Run the checks.** `just check-docs`, `just check-agents`, then `just check`. Set
   `status: done`. Commit on the branch. Pushing and the pull request are authorised
   separately: stop and ask.

## Acceptance criteria

- [ ] `README.md` keeps every section T rendered and adds the six of step 2 in the order
      given; every relative link resolves (`just check-docs` is green, which runs lychee
      offline over root files); the site address appears exactly once, in angle brackets.
- [ ] `README.md` states no measurement P10 did not record and no repository setting
      P12's hand-back does not carry.
- [ ] `CHANGELOG.md` parses as Keep a Changelog: `## [Unreleased]`, `## [0.1.0] - <date>`,
      an `### Added` list, and the two link definitions at the end.
- [ ] `AGENTS.md` differs from `main` only inside the Provenance section (`git diff main
      -- AGENTS.md` shows hunks under that heading alone), and every deviation names a
      decision file that exists.
- [ ] `uv run --frozen bg-validate-agents` exits 0 and the six phrases are each present.
- [ ] `just check` is green.
- [ ] No tag was created, nothing was pushed.

## Verification

```sh
just check-docs
just check-agents
for p in untrusted 'just check' 'explicit authorization' 'ai_tmp/' 'docs/specs/' runes; do printf '%s: ' "$p"; grep -c -- "$p" AGENTS.md; done
grep -c 'stevencutting.com/biscuit_cozy' README.md
grep -o 'docs/decisions/00[0-9][0-9][^)]*' AGENTS.md | sort -u | while read -r f; do test -f "$f" && echo "ok $f" || echo "MISSING $f"; done
git diff main --stat -- AGENTS.md README.md CHANGELOG.md
git tag --list
just check
```

Expected: the first two exit 0; six counts, each at least 1; `1`; every decision link
`ok`; three files in the stat; `git tag --list` prints nothing; `just check` ends green
with the worktree unchanged.

## Hand-back notes

Filled in by the agent that executes this ticket.

- The three files' final line counts, and the date written into the `0.1.0` entry.
- The verification output, quoted.
- Any fact the README wanted and no page or hand-back note supplied, handed to a
  follow-up ticket for the page's owner (CONVENTIONS.md §10); P09's pages are not edited
  here.
- A reminder that `v0.1.0` is untagged and that tagging is the maintainer's call.

## Open points

- Whether the README should carry the budget table at all, or only link
  `docs/reference/budget.md`. Recommend the table, short: a reader on the repository page
  should see the phone and the numbers without opening the handbook.
- Whether `CHANGELOG.md` should name C01's hub decision as a dependency of the release.
  Recommend one clause in the deployment bullet: "after the hub's decision record
  permitted a rendered scene".
- Whether the first tag should wait for C02's reconciliation with the studio. Recommend
  not: the changelog says what this repository holds, and C02 is after v1 by decision.
