---
id: P00
title: "Foundation: render from the template at v2.1.0, dependencies, large-file policy, the asset checker, recipes, stubs for every path"
status: open
depends_on: []
parallel_with: []
branch: ticket/p00-foundation
estimated_size: L
---

# P00: Foundation: render from the template at v2.1.0, dependencies, large-file policy, the asset checker, recipes, stubs for every path

## Context

This repository (`steven-cutting/pawlour`, branch `main`, one commit `0b55a6e`
holding a 10-byte `README.md`, no remote, no GitHub repository) becomes Pawlour, a
Biscuit Games game. `PRD.md` says what the game is; `CONVENTIONS.md` is the design; read
both in full before anything else, then `README.md` in this directory for the worktree
rules. This is the first ticket: nothing else can start until it has merged to `main`,
because every lane (P01 to P08) replaces stubs this ticket creates, and every lane's
definition of done is `just check` green, which only this ticket can make true.

A Biscuit Games game is rendered from the Copier template T (CONVENTIONS.md §0) rather
than assembled by hand: T at `v2.1.0` (commit `378acc8`) supplies the toolchain, the hook
gate, the agent contract, the handbook, the seed specification and the three ports, and
`just check` runs twelve gates in order (CONVENTIONS.md §1 fact 7). Everything this
ticket adds is appended to what T renders, because `copier update` merges and a game
edits a managed file only at its end (T `tickets/CONVENTIONS.md` §5). The additions are
exact in CONVENTIONS.md §2.1, §2.2, §2.3 and §3, and they land here, in one ticket,
because `package.json`, `pyproject.toml`, the lockfiles, the `Justfile`, the prek configs
and `.gitattributes` are files no lane touches (CONVENTIONS.md §10).

Sources, at the commits CONVENTIONS.md §0 pins (read-only, never modified):

- T is read with `git -C /Users/scutting/projects/biscuit_games_template fetch --tags`
  then `git -C /Users/scutting/projects/biscuit_games_template show v2.1.0:<path>`; the
  local clone's working tree is stale and is read for nothing. Read first: `copier.yml`
  (the four questions at lines 107, 145, 156 and 188 and their validators; the seed
  list under `_skip_if_exists`, which is why the stub `README.md` is deleted before the
  render), `README.md` ("Use it"), `template/Justfile` (the recipe order: `check-agents`
  at line 122 is what the assets section is appended after), `template/pyproject.toml.jinja`
  (the `recipes` list and `[tool.ruff.lint.per-file-ignores]`), `template/package.json.jinja`
  (the `dependencies` and `devDependencies` blocks), `template/.pre-commit-config.yaml`
  (the `check-added-large-files` hook at lines 76–77), `template/vitest.storybook.config.ts`
  (`optimizeDeps` at line 45 and the comment above it saying why),
  `template/.gitattributes` (three lines), `template/.gitignore`, `template/.prettierignore`,
  `template/eslint.config.js` (line 11), `template/lychee.toml`,
  `template/.markdownlint-cli2.jsonc`, `template/scripts/initialize.sh` (lines 45–58:
  hooks are skipped in a secondary worktree), `tickets/CONVENTIONS.md` §5 (managed
  versus seed, "the template inserts, the game appends") and §13 ("Delete the stub README
  before copying").
- S = `/Users/scutting/projects/biscuit_studio` at `a4d20af`. Read `scripts/check_assets.py`
  for the shape of a manifest checker with a `self-test` subcommand, and
  `tickets/CONVENTIONS.md` §4 for its interface; the checker here is the reduced version
  CONVENTIONS.md §3 specifies, written fresh, not copied.
- H = `/Users/scutting/projects/biscuit_games` at `575e3dd`. Read
  `docs/how-to/consume-the-hub.md` §1 for the registry token.

Tooling on the machine, verified 2026-09-25: uv 0.11.18, just 1.51.0, node 26.5.1 with
npm 11.17.0, Python 3.14, git-lfs 3.8.0, and a `~/.npmrc` line for `npm.pkg.github.com`
(its token is never read or printed). `typos`, `lychee`, `prek`, `markdownlint-cli2` and
`editorconfig-checker` are not on the PATH; the render installs them through `uv sync`
and the hook cache.

This worktree (`/Users/scutting/.supacode/repos/pawlour/full-cozy`) is a secondary
worktree of `/Users/scutting/projects/pawlour`, so `scripts/initialize.sh` will not
install the hooks (CONVENTIONS.md §11 claim 14); Step 4 installs them by hand.

**Authorisation.** No step here pushes, tags, opens a pull request, creates a GitHub
repository, changes a setting or touches another repository. The network is used by
`uvx copier` (GitHub, for the template), `uv lock` and `uv sync` (PyPI and GitHub, for
the tooling package), `npm install` and `npm ci` (the npm registry and GitHub Packages,
reading the token from `~/.npmrc`), `just storybook-browsers` (a Chromium download) and
the first `just lint`, which clones every hook repository into the prek cache. None of
those needs asking. Pushing this branch and opening its pull request are separately
authorised: stop and ask.

## Goal

At the end of this ticket, on branch `ticket/p00-foundation`:

- The repository is a rendered Biscuit Games game: `.copier-answers.yml` records
  `_commit: v2.1.0` and the four answers of CONVENTIONS.md §1 decision 1, and every
  template path exists in the form T gives it.
- `just check` is green: `lock-check`, `lint`, `frontend-static`, `frontend-coverage`,
  `frontend-build`, `storybook-build`, `storybook-test`, `check-docs`, `check-agents`,
  `check-specs`, `analyse-specs`, `check-assets`, then `check-clean`.
- `three`, `@types/three`, `@gltf-transform/cli` and `sharp` are pinned exactly (§2.1);
  the `Justfile` carries the assets, model and develop additions (§2.3); `pyproject.toml`
  carries the `check-assets` recipe and the excludes (§2.2); the large-file policy is in
  place (§3); `git lfs install --local` has run.
- `scripts/check_assets.py` exists in final form and `just check-assets` passes on the
  stub manifest with the checker's `self-test` proving itself live.
- The hooks are installed in this worktree and `just lint` runs them.
- A stub exists for every path a lane replaces, so each lane starts green.

## Non-goals

- The lanes' content. P01 (the specification), P02 (the model import and the exporter),
  P03 (the pipeline), P04 (the clips), P05 (the room), P06 (the director and the ports),
  P07a and P07b (the runtime), P08 (the interface) each replace a stub this ticket ships;
  this ticket writes only the stub, never the real thing, for a path those tickets own.
- Handbook prose. T's pages stand as rendered; the game's pages and decisions are P09.
- Creating the GitHub repository, granting the package, enabling Pages, pushing: P12.
  The real `README.md`, `CHANGELOG.md` 0.1.0 and the `AGENTS.md` provenance: P13.
- Copying anything from D: P02. This ticket reads D for nothing.
- Editing `vite.config.ts` or its coverage block (CONVENTIONS.md §1 decision 17).

## Files touched

Legend for the Class column: **rendered** is a file T writes and this ticket leaves as
rendered; **appended** is a rendered file this ticket adds to at its end; **repo** is a
file this ticket writes in final form; **stub** is a file the named lane replaces;
**gen** is generated and committed.

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `README.md` | stub (P13) | the 10-byte stub deleted, then T's rendered `README.md` | replaced by the render |
| every path T renders | rendered | `uvx copier copy … --vcs-ref v2.1.0` | new |
| `.copier-answers.yml` | gen | Copier | new; committed |
| `package.json` | appended | CONVENTIONS.md §2.1 | four dependencies |
| `package-lock.json` | gen | `just lock` | regenerated; committed |
| `pyproject.toml` | appended | CONVENTIONS.md §2.2 | `check-assets`, `pillow`, ruff and typos excludes |
| `uv.lock` | gen | `just lock` | regenerated; committed |
| `Justfile` | appended | CONVENTIONS.md §2.3, byte for byte | three sections |
| `.gitattributes` | appended | CONVENTIONS.md §3, byte for byte | LFS and binary lines |
| `.gitignore` | appended | Step 6 | `blender/out/` |
| `.pre-commit-config.yaml`, `.pre-commit-fix.yaml` | appended | Step 6 | one `exclude` on one hook |
| `.prettierignore` | appended | Step 6 | `blender/src`, `src/lib/assets` |
| `eslint.config.js` | appended | Step 6 | `'blender/'` in `ignores` |
| `lychee.toml` | appended | Step 6 | `"blender/src"` in `exclude_path` |
| `.markdownlint-cli2.jsonc` | appended | Step 6 | `"blender/src"` in `ignores` |
| `vitest.storybook.config.ts` | appended | Step 6 | `'three'` in `optimizeDeps.include` |
| `scripts/check_assets.py` | repo | Step 7 | new |
| `src/lib/assets/manifest.json` | stub (P03) | `{"schema_version": 1, "assets": []}` and a newline | new |
| `blender/README.md` | stub (P02) | Step 8 | new |
| `docs/specs/pawlour.allium` | rendered; stub (P01) | T's seed | left as rendered |
| `tests/restated.ts` | rendered; stub (P01) | T's seed | left as rendered |
| `src/routes/+page.svelte` | rendered; stub (P08) | T's seed | left as rendered |
| `tickets/P00-foundation.md` | tickets | this file | `status: done` |

Every other path CONVENTIONS.md §2 names is created by the ticket that owns it; a lane
adds files, it never renames or reclassifies one.

## Steps

1. **The slug is settled.** The Copier `game_slug` is `pawlour` (CONVENTIONS.md §1
   decision 1, settled by the maintainer on 2026-09-25). A render cannot be re-answered
   without `copier recopy`, so the answers below are typed exactly as §1 gives them.

2. **Render.** From the worktree root, with the network:

   ```sh
   git rm README.md && git commit -m "Remove the stub README before the render"
   uvx copier copy gh:steven-cutting/biscuit_games_template --vcs-ref v2.1.0 .
   ```

   Answer `game_name` `Pawlour`, `game_slug` `pawlour`, `description`
   `Biscuit at home in a log cabin: tap a thing, and she decides what to do about it.`,
   `repository` `steven-cutting/pawlour`. Never pass `--trust`. Read
   `.copier-answers.yml` afterwards: `_commit: v2.1.0`, `_src_path:
   gh:steven-cutting/biscuit_games_template`, the four answers. This is CONVENTIONS.md
   §11 claim 2's first half; record whether the render was clean.

3. **Initialise.** `just initialize`, then `just check`. Both need the network on the
   first run. Read what `initialize.sh` prints: it will say "Secondary worktree: skipping
   install-hooks." Record the twelve recipes' pass in the hand-back before touching
   anything (the render is green on its own; if it is not, the fault is T's or the
   machine's, and the ticket stops and reports rather than patching T's files).

4. **Install the hooks by hand.** `just install-hooks` from this worktree, then `git
   rev-parse --git-common-dir` and `git rev-parse --git-dir` to record that they differ,
   and `cat .git/hooks/pre-commit` (the path `git rev-parse --git-path hooks` prints)
   to record where the shim points. This is CONVENTIONS.md §11 claim 14. Note in the
   hand-back that the shim names this worktree's virtual environment, which is why
   `initialize.sh` refused: when this worktree is deleted the shim breaks for the
   primary checkout, and P13 (or the maintainer) reruns `just install-hooks` there.

5. **Dependencies.** Re-read the four versions (`npm view three version`, and the same
   for `@types/three`, `@gltf-transform/cli`, `sharp`); append them to `package.json`
   exactly as CONVENTIONS.md §2.1 places them (`three` under `dependencies`, the other
   three under `devDependencies`, alphabetical within each block, exact versions, no
   `^`); append `"pillow==<current>"` to the dev group in `pyproject.toml`; `just lock`;
   read both lockfile diffs; `just lock-check`. If `@types/three`'s latest is not the
   same minor as `three`'s, follow §2.1's rule and say so in the hand-back.

6. **The appended configuration.** Each is an append at the end of the relevant block,
   nothing reordered:

   - `pyproject.toml`: the `recipes` list gains `"check-assets"` as its last entry;
     `[tool.ruff] extend-exclude = ["blender/src"]`; `[tool.ruff.lint.per-file-ignores]`
     gains `"blender/**"` with the same list `"scripts/**"` carries; `[tool.typos.files]
     extend-exclude` gains `"blender/src/"` and `"src/lib/assets/"`.
   - `Justfile`: CONVENTIONS.md §2.3's three sections, byte for byte, after
     `check-agents`.
   - `.gitattributes`: CONVENTIONS.md §3's block, byte for byte, after T's three lines.
   - `.gitignore`: after the `ai_tmp/` line, a comment and `blender/out/` ("What the
     Blender recipes write: the clips .blend and the raw GLBs. Rebuilt, never committed.").
   - `.pre-commit-config.yaml` and `.pre-commit-fix.yaml`: the `check-added-large-files`
     hook becomes

     ```yaml
       - id: check-added-large-files
         args: [--maxkb=768]
         # The served assets are the one place a large file is allowed:
         # docs/decisions/0011-served-assets-are-blobs-and-blends-are-lfs.md.
         exclude: ^src/lib/assets/
     ```

   - `.prettierignore`: `blender/src` and `src/lib/assets`, each on its own line at the
     end, with a comment that the first is the model's own build tooling and the second
     is binaries and a manifest `check-json` owns.
   - `eslint.config.js`: `'blender/'` appended to the `ignores` array at line 11.
   - `lychee.toml`: `"blender/src"` appended to `exclude_path`.
   - `.markdownlint-cli2.jsonc`: `"blender/src"` appended to `ignores`.
   - `vitest.storybook.config.ts`: `optimizeDeps: { include: ['@steven-cutting/biscuit-games', 'three'] }`,
     with one sentence added to the comment above it saying the game appends here and
     that `copier update` will conflict on this line (CONVENTIONS.md §12).

   After these, `git lfs install --local`, then `git check-attr filter
   blender/model/biscuit-poseable.blend` must print `blender/model/biscuit-poseable.blend:
   filter: lfs` before any such file exists.

7. **`scripts/check_assets.py`.** Write it to CONVENTIONS.md §3's interface exactly:
   three subcommands `check`, `write`, `self-test`; the manifest at
   `src/lib/assets/manifest.json`, strict JSON, one entry per line inside `assets`,
   sorted by `path`, one trailing newline; the six fields in order (`path`, `bytes`,
   `sha256`, `source`, `licence`, `budget`); every refusal §3 lists, printed one per line
   as `<path>: <reason>` with exit 1; `check` and `write` both run `self-test` first;
   no whole-tree total (CONVENTIONS.md §3: the per-file budgets are the rule and the
   12 MB first-load figure is P10's measurement); standard library only
   (`hashlib`, `json`, `pathlib`, `sys`, `tempfile`, `argparse`). Ruff-clean under
   §2.2's per-file ignores. The self-test builds its tree under `tempfile.mkdtemp()`
   and passes that root to the same functions `check` uses, so the checker under test is
   the checker that runs.

8. **Stubs.** `src/lib/assets/manifest.json` as the empty manifest; `blender/README.md`
   with one paragraph saying P02 fills it and that `blender/out/` is ignored. No
   `blender/out/` directory is committed. The three seed files P01 and P08 replace stay
   exactly as T rendered them.

9. **Prove the large-file claim.** CONVENTIONS.md §11 claim 1: create a 1 MB file with
   `head -c 1048576 /dev/urandom > src/lib/assets/probe.bin`, `git add` it, run `just
   lint` and expect the hook to pass; move the same file to `probe.bin` at the root,
   `git add` it, run `just lint` and expect `check-added-large-files` to refuse it;
   remove both and `git reset`. Record both outputs. If prek ignores the per-hook
   `exclude`, stop: the design changes (a raised `--maxkb` is the fallback) and it goes
   back through `CONVENTIONS.md`.

10. **`just check`, twice.** Once to prove the thirteen recipes; once more to prove
    `check-clean` sees nothing a recipe wrote (a recipe that writes a tracked or untracked
    file fails the run, T `docs/reference/quality-gates.md`). If `just storybook-build`
    fails offline, that is the one gate that reaches the network (T's hub Storybook ref)
    and the run is repeated with it.

11. **Hand-back and status.** Fill in the notes, set `status: done`, commit on the ticket
    branch. Pushing and the pull request are authorised separately.

## Acceptance criteria

- [ ] `.copier-answers.yml` records `_commit: v2.1.0` and the four answers; no
      `--trust` was passed.
- [ ] `package.json` pins `three`, `@types/three`, `@gltf-transform/cli` and `sharp`
      exactly, and `just lock-check` is green.
- [ ] `pyproject.toml`'s `recipes` ends in `"check-assets"`, and `just check` runs it
      after `analyse-specs` and before `check-clean`.
- [ ] `git check-attr filter blender/model/biscuit-poseable.blend` prints `filter: lfs`.
- [ ] A 1 MB file under `src/lib/assets/` passes `just lint` and the same file at the
      root is refused by `check-added-large-files` (§11 claim 1 recorded).
- [ ] `just check-assets` passes on the empty manifest and its output shows the
      self-test ran.
- [ ] `git rev-parse --git-path hooks` names a `pre-commit` shim and `just lint` runs
      through it (§11 claim 14 recorded).
- [ ] No file under `docs/`, `src/`, `tests/` or `stories/` differs from T's render
      except the three seeds left as rendered and the appended files listed above.
- [ ] `just check` is green, twice in a row.

## Verification

```sh
cat .copier-answers.yml
just lock-check
git check-attr filter blender/model/biscuit-poseable.blend
uv run --frozen python scripts/check_assets.py check
grep -n 'check-assets' pyproject.toml Justfile
grep -n "'three'" vitest.storybook.config.ts
grep -n -A3 'check-added-large-files' .pre-commit-config.yaml
just check
```

Expected: the answers file with `_commit: v2.1.0`; green; `filter: lfs`; one summary line
after a self-test line and exit 0; the recipe in both files; the one line; the hook with
its `exclude`; thirteen recipes green then `check-clean` green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- The four versions pinned and the date they were read; whether `@types/three` matched
  `three`'s minor.
- Whether the render was clean and whether the first `just check` was green before any
  edit (§11 claim 2).
- The outputs of Step 9 (§11 claim 1) and Step 4 (§11 claim 14), quoted.
- Which template files were appended to, each with the line count before and after.
- Anything a lane will need that this ticket could not give it, as a numbered list for
  P11.

## Open points

- **Node's `sharp` binary.** `sharp` downloads a platform binary on install; if `npm ci`
  in CI needs a flag or an environment variable for it, that is a workflow change
  (managed by G) and is handed back rather than made.
- **`pillow` on Python 3.14.** S pinned `pillow==12.3.0` and it resolved; the current
  release is re-read on the day.
