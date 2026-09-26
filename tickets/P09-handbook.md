---
id: P09
title: "Handbook: the game's pages, decisions 0011 to 0014, the manifest and the map"
status: done
depends_on: [P00]
parallel_with: [P01, P02, P03, P04, P05, P06, P07a, P07b, P08]
branch: ticket/p09-handbook
estimated_size: M
---

# P09: Handbook: the game's pages, decisions 0011 to 0014, the manifest and the map

## Context

The rendered handbook under `docs/` is T's: thirty-eight managed pages, the seed pages
the game owns, and a `## This game` section in `docs/README.md` waiting for the pages the
game adds. This ticket writes those pages, `CONVENTIONS.md` §9's table, and the four
decision records `CONVENTIONS.md` §1 decisions 16 to 21 name, registers every page in
`docs/manifest.yml`, links them from the map, and adds the deviations to `AGENTS.md`.

Why it depends on P00 alone and yet describes P01 to P08's work: the prose is written
from the design, not from the code. `PRD.md` and `CONVENTIONS.md` are complete enough to
document the export procedure, the room contract, the rendering model and the director
before a line of them exists, and the pages say what the game does, not whether it has
shipped. In practice this ticket is picked up after the lanes have merged, so the
executor reads what landed and prefers it where it differs from the design; a page that
cannot be verified against `main` because the lane has not merged says so in the
hand-back and P11 corrects any drift. Nothing is marked as done that has not landed: a
page describes a procedure, not a status.

The documentation contract is T's, enforced by `bg-validate-docs` (`CONVENTIONS.md` §1
fact 10): five frontmatter keys equal to the manifest entry including list order, the H1
equal to the title, forty words, no template delimiters, no `TODO`, `TBD` or `FIXME`,
every relative link resolvable with exact case, every page reachable from
`docs/README.md`, nothing unregistered. `docs/manifest.yml` is strict JSON and the game's
entries go after T's last entry (decision 0010) in one contiguous block, so a template
update and this game's additions land in different places.

Sources, at the commits `CONVENTIONS.md` §0 pins (read-only):

- T at `v2.1.0` (`git -C /Users/scutting/projects/biscuit_games_template show
  v2.1.0:<path>`): `template/docs/decisions/0001-static-site-no-backend.md` (the shape:
  Context, Decision, Consequences including the ones that hurt, What would reopen this,
  Related pages), `template/docs/decisions/README.md.jinja` ("Writing a new one": add the
  file, add a manifest entry, add a row; the game's numbers start at 0011),
  `template/docs/manifest.yml` (the entry shape, one per line), `template/docs/README.md.jinja`
  (the `## This game` section and its sentence), `template/AGENTS.md.jinja` lines 170–173
  (the deviations sentence to replace), `template/docs/reference/documentation-contract.md`
  (the contract), and one page of each kind as a model for register.
- G at `v0.3.0`: `src/biscuit_games_tooling/validate_docs.py` (`REQUIRED_FIELDS`, `KINDS`,
  `AUDIENCES`, `MINIMUM_WORDS = 40`, `BAD_CONTENT`).
- H at `575e3dd`: `docs/decisions/README.md` lines 53–72 (the four verbs; a game's
  record uses the same shape) and `docs/design/direction.md` and `docs/design/character.md`
  (cited by `design/art-direction.md`, never restated at length).
- This repository: `tickets/PRD.md`, `tickets/CONVENTIONS.md` (the source of every
  page), and whatever of P01 to P08 is on `main` when this ticket is picked up.

**Authorisation.** Nothing here pushes or touches another repository. Pushing and the
pull request are separately authorised.

## Goal

- Sixteen pages under `docs/` as `CONVENTIONS.md` §9's table lists them, with the exact
  frontmatter the table gives, each forty words or more, each written from the named
  sections of `PRD.md` and `CONVENTIONS.md`.
- Four decision records, 0011 to 0014, in T's shape, each with an index row in
  `docs/decisions/README.md`.
- `docs/manifest.yml` gaining fourteen entries after decision 0010's, in strict JSON, and
  `docs/README.md` gaining the links under `## This game`.
- `AGENTS.md`'s deviations sentence replaced by the list of deviations, and nothing else
  in that file changed.
- `just check-docs`, `just check-agents` and `just check` green.

## Non-goals

- Editing any managed page of T's (`develop-locally.md`, `testing.md` and the rest):
  the game's own procedures live on the game's pages (`CONVENTIONS.md` §9's last
  paragraph). A managed page that should link to a game page is left alone; the map is
  where the link lives.
- `README.md`, `CHANGELOG.md` and the Provenance section of `AGENTS.md`: P13. This
  ticket edits `AGENTS.md`'s deviations list only.
- The device figures on `docs/reference/budget.md`: this ticket writes the budget table
  from `PRD.md` with an empty "Measured" column that P10 fills.
- Correcting `CONVENTIONS.md` or `PRD.md` where the code diverged: recorded in the
  hand-back for P11, not edited here.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `docs/project/purpose-and-scope.md` | repo | T's seed | rewritten from `PRD.md` ("Who it is for", "Experience pillars", "Non-goals for v1") |
| `docs/project/terminology.md` | repo | T's seed | the game's words: phase, item, approach, waypoint, spot, clip, still, caption, register |
| `docs/design/art-direction.md` | repo | new | `CONVENTIONS.md` §0 (the references), §1 decision 12, §5.3; cites H's two design pages by path |
| `docs/design/the-room.md` | repo | new | `CONVENTIONS.md` §5.1, §5.2 (the contract, every required node) |
| `docs/how-to/export-the-model.md` | repo | new | `CONVENTIONS.md` §2.3 (`model-clips`, `model-export`), §4.2, §3 (provenance, LFS, `git lfs install --local`) |
| `docs/how-to/author-a-clip.md` | repo | new | `CONVENTIONS.md` §4.1 (the rules, the table, the contact sheet gate) |
| `docs/how-to/build-assets.md` | repo | new | `CONVENTIONS.md` §4.3, §3 (the manifest, `assets-manifest`, `check-assets`) |
| `docs/how-to/test-on-a-phone.md` | repo | new | `CONVENTIONS.md` §2.3 (`preview-lan`) and P10's procedure in brief |
| `docs/explanation/rendering.md` | repo | new | `CONVENTIONS.md` §5.3, §5.4, §1 decisions 16 and 17 |
| `docs/explanation/the-director.md` | repo | new | `CONVENTIONS.md` §6.1, §6.2, §6.3 |
| `docs/reference/asset-manifest.md` | repo | new | `CONVENTIONS.md` §3 (fields, forms of `source`, `licence`, budgets, the checker's subcommands) |
| `docs/reference/budget.md` | repo | new | `PRD.md`'s budget table with a "Measured" column left for P10 |
| `docs/decisions/0011-served-assets-are-blobs-and-blends-are-lfs.md` | repo | new | `CONVENTIONS.md` §1 decision 18, §3 |
| `docs/decisions/0012-the-canvas-lives-outside-the-coverage-glob.md` | repo | new | `CONVENTIONS.md` §1 decision 17 |
| `docs/decisions/0013-this-repository-owns-its-animated-model.md` | repo | new | `CONVENTIONS.md` §1 decisions 5 and 21, §3 provenance; names C02 as the reopener |
| `docs/decisions/0014-three-js-is-the-renderer.md` | repo | new | `CONVENTIONS.md` §1 decision 16; cites S ticket C03 by path |
| `docs/decisions/README.md` | repo | T's rendered | four rows appended to the table |
| `docs/manifest.yml` | repo (no lane; this ticket is the one writer) | T's rendered | fourteen entries appended after decision 0010's |
| `docs/README.md` | repo (no lane; this ticket is the one writer) | T's rendered | links under `## This game` |
| `AGENTS.md` | repo | T's rendered | the deviations sentence replaced (Step 6); nothing else |
| `tickets/P09-handbook.md` | tickets | this file | `status: done` |

## Steps

1. **Read the contract and the models.** T's `documentation-contract.md`, G's
   `validate_docs.py` (what is counted as a word, what is refused), one T page of each
   kind for register, T's decision 0001, `CONVENTIONS.md` §9 in full, and `PRD.md`.
   Then `git log --oneline main` and the ticket statuses under `tickets/`, to know which
   lanes have landed; for each that has, read its Files touched against `main` so the
   page describes what exists.

2. **The pages.** Write each page in the Files-touched table from the sections named
   there, in T's register (a page says what is true and why, in plain prose; procedures
   as numbered steps with the exact `just` recipe; no marketing). Frontmatter exactly as
   `CONVENTIONS.md` §9 gives `kind`, `audience` and `canonical_for`, with `requires: []`
   and `title` equal to the H1. Every page at least forty words after stripping
   punctuation. Cross-references between game pages as relative links with exact case;
   references to H's pages as `https://github.com/steven-cutting/biscuit_games/blob/main/docs/<path>`
   blob URLs (T's `project/platform.md` is the precedent) or as code spans naming the
   path, never a relative link into another repository. `the-room.md` reproduces §5.2's
   table of required nodes exactly, because it is the contract P05 and P07a share and
   a reader arriving from either needs it whole. `budget.md` reproduces `PRD.md`'s table
   with a fourth column "Measured" holding "not yet" in every row.

3. **The decisions.** Four records in T's shape. Each Context names the constraint from
   `CONVENTIONS.md` §1's facts (fact 9 for 0011; fact 7's coverage glob and jsdom for
   0012; decision 5 and the studio's ledger for 0013; S C03 for 0014). Each
   Consequences names what hurts: 0011, a public site publishing renders of a model
   whose licence is the platform's open question, and LFS bandwidth on every `.blend`
   change; 0012, canvas code that no unit test measures and a story that renders only the
   still; 0013, a model that forks from the studio's approved one and a ledger entry that
   does not exist; 0014, a dependency at 0.186 that moves monthly and a look reproduced
   rather than exported. Each "What would reopen this" names the trigger: 0011, G's
   workflows gaining `lfs: true`; 0012, a coverage exclude the template sanctions; 0013,
   C02; 0014, a renderer the platform adopts. Add the four rows to
   `docs/decisions/README.md`'s table in the same form as T's.

4. **The manifest.** Append fourteen entries (§9's sixteen pages less the two seed
   pages, which T already registers) to `docs/manifest.yml` after the
   `decisions/0010-a-project-pages-site.md` entry, one per line, in the order of the
   Files-touched table, each `{"path": ..., "title": ..., "kind": ..., "audience": [...],
   "canonical_for": [...], "requires": []}` with the lists in the same order as the page's
   frontmatter. The two seed pages (`purpose-and-scope.md`, `terminology.md`) are already
   registered: their entries stay where they are and their `canonical_for` is not changed.
   Strict JSON: a trailing comma fails `check-json`.

5. **The map.** Under `## This game` in `docs/README.md`, after T's sentence, one link
   per new page with a one-line hook in T's form (`- [Art direction](design/art-direction.md) — …`),
   grouped as the table groups them (design, how to, understand, look up), and one line
   saying the four decisions are in the record. Every page must be reachable from here.

6. **`AGENTS.md`'s deviations.** Replace the sentence "Deliberate deviations for this
   repository, each recorded in `[the decision records](docs/decisions/README.md)`: none
   yet. Record one here …" (T lines 170–173 of the rendered file; find it by its first
   words) with a list of the deviations, each naming its record: served assets are blobs
   and blends are LFS (0011); the canvas lives under `src/routes/scene/`, outside the
   coverage glob (0012); this repository owns a copy of the approved model (0013);
   three.js, `@types/three`, `@gltf-transform/cli` and `sharp` are dependencies the
   template does not ship (0014); `vitest.storybook.config.ts` gains `'three'` in
   `optimizeDeps.include`, a managed file this game appends to (0014); the hook
   `check-added-large-files` excludes `src/lib/assets/` (0011). Keep T's closing sentence
   about changing the template instead. Nothing else in `AGENTS.md` changes; the six
   required phrases and the 300 words are untouched.

7. **Gates.** `just check-docs` (sixteen game pages registered and reachable, forty words
   each), `just check-agents`, `just lint` (markdownlint over the new pages; lychee
   offline resolves every relative link), `just check`. Set `status: done`. Commit.
   Pushing and the pull request are authorised separately.

## Acceptance criteria

- [ ] Sixteen pages exist with frontmatter equal to `CONVENTIONS.md` §9's table, and
      `bg-validate-docs` passes (`just check-docs` green).
- [ ] Four decision files in T's shape, four rows in `docs/decisions/README.md`.
- [ ] `docs/manifest.yml` parses as JSON (`python3 -c 'import json;json.load(open("docs/manifest.yml"))'`)
      and its last fourteen entries are the game's new pages, in the table's order.
- [ ] `docs/README.md` links every new page under `## This game`.
- [ ] `AGENTS.md` differs from `main` only inside the deviations paragraph
      (`git diff main -- AGENTS.md` shows one hunk).
- [ ] `docs/design/the-room.md` carries every node name of `CONVENTIONS.md` §5.2.
- [ ] `docs/reference/budget.md` carries every row of `PRD.md`'s budget table.
- [ ] `just check` green.

## Verification

```sh
just check-docs
just check-agents
python3 -c 'import json;m=json.load(open("docs/manifest.yml"));print(len(m["pages"]))'
git diff --stat main -- AGENTS.md docs/manifest.yml docs/README.md
grep -c 'item\.\|nav\.\|camera\.\|light\.\|spot\.' docs/design/the-room.md
just check
```

Expected: both validators green; the page count is T's thirty-eight plus fourteen (the
two seed pages were already counted); three files changed, `AGENTS.md` in one hunk; the
grep count at or above twenty; `just check` green.

## Hand-back notes

Filled in by the agent that executes this ticket.

Executed 2026-09-26 on branch `P09-handboo` (the maintainer's worktree; the ticket's
`branch:` field says `ticket/p09-handbook`), from `main` at `3f72648`.

- **Decision numbers shifted by one.** `docs/decisions/0011` was already taken by
  `0011-vendored-skills-outside-the-agent-contract.md`, so, with the maintainer's
  agreement, the game's four records are 0012 to 0015 in `CONVENTIONS.md`'s order:
  0012 served assets are blobs and blends are LFS (§1 decision 18), 0013 the canvas lives
  outside the coverage glob (decision 17), 0014 this repository owns its animated model
  (decisions 5 and 21), 0015 three.js is the renderer (decision 16). For P11:
  `CONVENTIONS.md` §1 decisions 16 to 21, §1 fact 10 ("a game's start at 0011"), §2's
  `docs/**` row, §3's `.gitattributes` block and §9's table all carry the old numbers.
- **Two files outside Files touched**, by the maintainer's agreement: the comments in
  `.gitattributes` and `.pre-commit-config.yaml` pointed at
  `0011-served-assets-are-blobs-and-blends-are-lfs.md` and now point at `0012-…`. Comment
  lines only.
- **Manifest**: the key is `pages`. It now has 53 entries, not 52: it held 39 before this ticket (T's 38 and
  decision 0011), and the fourteen game entries appended
  after decision 0011's in the Files-touched order. `just check-docs`: "Validated 53
  pages and 54 canonical topics."
- **`AGENTS.md`**: the deviations paragraph was already a list (decision 0011's bullet),
  so the five deviations were appended to it, one hunk. The dependency bullet names what
  `package.json` pins beyond the template: `three`, `@types/three`, `meshoptimizer`,
  `sharp` and the four `@gltf-transform/*` packages, not only the four the ticket named.
- **Page titles** (§9 gives none): Art direction, The room, Export the model, Author a
  clip, Build assets, Test on a phone, Rendering, The director, Asset manifest,
  Performance budget, and "Decision 00NN: …" for the records.
- **Shortest page**: `docs/reference/budget.md`, 387 words.
- **Lanes merged when written**: P00 to P06 and P07a. Not merged: P07b, P08, P10.
- **Pages not verifiable against code** because their lane has not merged, written from
  `CONVENTIONS.md`:
  - `explanation/rendering.md` "Motion" section (P07b: mixer crossfades, walk, procedural
    idle, fire flipbook, weather, steam, the 600 ms rig blend).
  - `design/art-direction.md` "Overlays" section (P08: `overlay.css`, `TitleCard`, the wipe).
  - `how-to/test-on-a-phone.md`: the `?debug` query and `window.__pawlour` are P10's
    design (its Step 2) and do not exist.
  - `explanation/the-director.md` "The ports it runs on": the page constructing ports is
    P08's; `+page.svelte` is still the template seed.
  - `reference/budget.md`: "Measured" is "not yet" in every row, for P10.
  - `reference/asset-manifest.md`: the `fire.webp` and `audio/` budget rows are the
    design's; neither file exists on `main`.
  - `explanation/the-director.md` "Time" (the page ticking the director every 250 ms)
    and `explanation/rendering.md` "When it draws" (the frame-port loop while
    animations are active): the wiring is P08's and P07b's; on `main` the scene draws
    once per state and nothing subscribes to the frame port.
- **Where a page follows `main` rather than `CONVENTIONS.md`** (corrections for P11):
  1. §4.1: clip files use `_` for the dot (`idle_sit.py`); `FRAMES` counts samples, so a
     clip lasts `(FRAMES − 1) / 30` s; `walk.py`'s `STRIDE` is 1.0 in model units, not
     0.45 scene units.
  2. §4.1: contact sheets and stills are rendered from a fixed review camera, not the
     hearth camera; `sleep.bed.*` and `sleep.chair.*` stills are byte-identical.
  3. §4.3: the local `gltf-transform` binary, not `npx`; `prune --keep-leaves true`;
     Biscuit is joined by the skin-aware `scripts/join_assets.mjs` (the CLI `join` leaves
     skinned meshes alone); the room skips `flatten`; the second resize is
     `--pattern '*occlusion*'`; Biscuit's meshopt adds `--quantization-volume scene`;
     normal maps are always stripped; `check_model_asset.mjs` runs after the build.
  4. §3: the manifest is wrapped as `{"schema_version": 1, "assets": [...]}`; no entry
     uses `biscuit_pics@`; `platform` is the licence of every `built:` file derived from
     the model; `cabin.glb` is `cc0`. `.pre-commit-fix.yaml` has no large-file hook.
     `git lfs install --local` now lives on `how-to/export-the-model.md`, not on T's
     `develop-locally.md`.
  5. §5.2: eleven `cabin.*` materials (`cabin.paper.sleeves` is the eleventh); numbered
     nodes must be contiguous; `check_cabin.py` also caps primitives at 30; `just
     check-cabin` is not part of `just check`, and the runtime checks names and the graph
     only.
  6. §5.3: Biscuit's ramp has four steps and the room's six (the maintainer's choice over
     three and five); the toon shader is patched to read the ramp's colour; the ink is one
     fixed `#33221f`; the vignette is a scene quad, not a post pass.
  7. §5.4: `createScene` takes `frames`, sizes and callbacks and gets `animations` per
     `apply`; the component takes `state`, `animations`, `frames`, `assets` and four
     callbacks; the retry control is a button named "Retry 3D scene"; while the context
     is lost, restore only asks the extension; the camera fits all four floor corners in
     portrait only and levels the horizon; `@types/three` is 0.186.0 against `three`
     0.186.1.
  8. §6.1: `deps` is the random port only; commands are objects keyed by `kind`; a target
     is a named node, not a point and facing; the four-second minimum applies to sleep;
     the pet caption comes with the tap (as `cabin.allium` now says); motion off resolves
     every movement forward after each command rather than freezing; `setPhase('auto')`
     waits for the next clock reading; idle intervals are whole seconds and count idle
     time only; she never chooses the food bowl.
  9. §11 claim 8: P06 found jsdom does provide `requestAnimationFrame`; decision 0013
     says the frame port exists because tests never stub a global, not because jsdom
     lacks it.
  10. §7: `pawlour.sound` is not persisted (`SoundNeverStartsUnasked`); no storage key
     exists yet.
- **Open points settled**: the design pages stay under `docs/design/` (the validator
  does not care about directories); `art-direction.md` cites H's two pages by blob URL,
  with `platform.md`'s sentence about links that rot; the two seed pages were rewritten
  in place with their `canonical_for` unchanged.
- **Verification**, run before `status:` was set: `just check-docs` green (53 pages, 54 topics); `just check-agents`
  green; `just lint` green; manifest JSON parses with 53 pages;
  `git diff --stat main -- AGENTS.md docs/manifest.yml docs/README.md` shows three files,
  `AGENTS.md` in one hunk; the node grep on `the-room.md` counts 29 lines;
  `just check` green ("All checks passed and the worktree is unchanged.").

## Open points

- **A design page's kind.** `art-direction.md` and `the-room.md` sit under
  `docs/design/`, a directory T does not have; `bg-validate-docs` does not care about
  directories, only registration. If it does refuse an unknown directory, move them to
  `explanation/` and `reference/` and record it.
- **The hub's pages by blob URL.** `art-direction.md` cites H's `direction.md` and
  `character.md`. A blob URL rots silently (`CONVENTIONS.md` §12 of the studio's
  design); a code span does not resolve at all. Recommend the blob URL, on this one
  page, with the sentence T's `platform.md` uses about links that rot.
- **`purpose-and-scope.md` is a seed page.** It is excluded from `copier update`, so
  rewriting it is safe; `terminology.md` likewise.
