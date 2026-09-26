---
id: P00
title: "Foundation: render from the template at v2.1.0, dependencies, large-file policy, the asset checker, recipes, stubs for every path"
status: done
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

- [x] `.copier-answers.yml` records `_commit: v2.1.0` and the four answers; no
      `--trust` was passed.
- [x] `package.json` pins `three`, `@types/three`, `@gltf-transform/cli` and `sharp`
      exactly, and `just lock-check` is green.
- [x] `pyproject.toml`'s `recipes` ends in `"check-assets"`, and `just check` runs it
      after `analyse-specs` and before `check-clean`.
- [x] `git check-attr filter blender/model/biscuit-poseable.blend` prints `filter: lfs`.
- [x] A 1 MB file under `src/lib/assets/` passes `just lint` and the same file at the
      root is refused by `check-added-large-files` (§11 claim 1 recorded).
- [x] `just check-assets` passes on the empty manifest and its output shows the
      self-test ran.
- [x] `git rev-parse --git-path hooks` names a `pre-commit` shim and `just lint` runs
      through it (§11 claim 14 recorded).
- [x] No file under `docs/`, `src/`, `tests/` or `stories/` differs from T's render
      except the three seeds left as rendered and the appended files listed above.
- [x] `just check` is green, twice in a row.

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

### Executed 2026-09-25

Executed in the worktree `/Users/scutting/.supacode/repos/pawlour/P00-foundation` on the
branch `P00-foundation` (the maintainer created both; see item 3 below). Commits:
`788eed4` removes the stub README, `f59717e` is the render plus `just initialize`'s
lockfiles with nothing edited by hand, `2e26b36` is everything this ticket appends, and
the commit that carries this file is the last one.

**Versions (read with `npm view` and PyPI on 2026-09-25).** `three` 0.186.1,
`@types/three` 0.186.0, `@gltf-transform/cli` 4.5.0, `sharp` 0.35.4, `pillow` 12.3.0.
`@types/three` matches `three`'s minor (0.186); its latest is 0.186.0, one patch behind
`three`, which is the case §2.1 allows. `npm ls` shows the CLI already pulls `sharp`
0.35.4 (deduped), so the explicit pin is the visible copy §2.1 asks for. Lockfile diffs
read: `uv.lock` gains `pillow` 12.3.0 only; `package-lock.json` adds 188 entries (three,
`@types/three`, the CLI and its tree, `sharp` and its `@img/*` platform packages), changes
no existing version, and drops the top-level `yaml` 2.9.1, which only `vite` named, as an
optional peer. `node -e "import('sharp')"` loads libvips 8.18.6 and
`npx gltf-transform --version` prints 4.5.0.

**Render and first check (§11 claim 2).** The render was clean: every path of
`template/` at `v2.1.0` exists, nothing was skipped, `.copier-answers.yml` reads
`_commit: v2.1.0`, `_src_path: gh:steven-cutting/biscuit_games_template` and the four
answers, rendered non-interactively with `--defaults --data ...` and no `--trust`.
`just initialize` exited 0 and printed "Secondary worktree: skipping install-hooks." The
first `just check` was **not** green, and the fault was neither T's nor the machine's:
`lock-check` passed, then `lint` failed on markdownlint alone, with seven findings in
`tickets/` (MD029 on `CONVENTIONS.md` lines 122 to 141, the §1 decisions numbered 16 to
21; MD004 on `P06-director-and-ports.md` line 217, a wrapped line starting with
`+ TRANSITION.sit`). The rest were run one at a time on the unedited render and every
one exited 0: `frontend-static`, `frontend-coverage`, `frontend-build`, `storybook-build`,
`storybook-test`, `check-agents`, `check-specs`, `analyse-specs`. `check-docs` was not run
separately on the render; it runs the same markdownlint hook. `just initialize` also ran
`ruff format .`, which reformatted fenced Python in `tickets/CONVENTIONS.md` (§4.2's
exporter arguments became tuples, changing their meaning) and `tickets/P05-the-room.md`;
both were reverted before anything was committed. At the maintainer's direction,
`tickets` was then added to `.markdownlint-cli2.jsonc`'s `ignores` and to `[tool.ruff]
extend-exclude` (item 1 below).

**Hooks (§11 claim 14), Step 4 output:**

```text
$ just install-hooks
prek installed at `/Users/scutting/projects/pawlour/.git/hooks/pre-commit`
$ git rev-parse --git-common-dir
/Users/scutting/projects/pawlour/.git
$ git rev-parse --git-dir
/Users/scutting/projects/pawlour/.git/worktrees/P00-foundation
$ git rev-parse --git-path hooks
/Users/scutting/projects/pawlour/.git/hooks
$ cat "$(git rev-parse --git-path hooks)/pre-commit"   (the lines that matter)
PREK="/Users/scutting/.supacode/repos/pawlour/P00-foundation/.venv/bin/prek"
exec "$PREK" hook-impl --hook-dir "$HERE" --script-version 4 --hook-type=pre-commit -- "$@"
```

The claim holds: the two directories differ, `initialize.sh` refused, and the hooks
directory is the shared one. The shim names this worktree's virtual environment, which
is why `initialize.sh` refused: when this worktree is deleted the shim falls back to a
`prek` on the PATH, which there is not, and every commit in the primary checkout fails;
P13 (or the maintainer) reruns `just install-hooks` there once `main` holds the render.
`git lfs install --local` added `pre-push`, `post-checkout`, `post-commit` and
`post-merge` to the same shared directory, beside the `pre-commit` shim. The commit
`2e26b36` went through the shim: its first attempt was refused by Prettier
(`eslint.config.js`) and by markdownlint (the tickets), which is how both surfaced.

**Large files (§11 claim 1), Step 9 output.** The per-hook `exclude` is honoured by prek
0.4.12:

```text
# 1 MB of /dev/urandom at src/lib/assets/probe.bin, git add, just lint: exit 0
check for added large files..............................................Passed
# the same file at probe.bin, git add, just lint: exit 1
check for added large files..............................................Failed
- hook id: check-added-large-files
- exit code: 1

  probe.bin (1024 KB) exceeds 768 KB
```

No other hook failed in either run. Both files were removed and the index reset.

**`git check-attr`** printed `blender/model/biscuit-poseable.blend: filter: lfs` before any
such file exists.

**`scripts/check_assets.py`.** `check`, `write` and `self-test` as §3 gives them; the
self-test builds its tree under `tempfile.mkdtemp()` and runs the same `write_tree` and
`check_tree` the commands run. It proves: the empty tree writes the stub byte for byte;
`write` lists every file with the defaults `made:<today>`, `unsettled`, `0` and refuses only
the unsettled audio; then `check` refuses exactly seven files, one per reason (over
budget, unlisted, listed but absent, one tampered byte, unsettled audio, a licence outside
the three, a `source` in none of the four forms), leaves the in-budget file alone, and
refuses a manifest out of canonical form. Each refusal was mutated out in turn and the
self-test failed for every one. `just assets-manifest` on the stub leaves it byte for byte
unchanged. Ruff-clean with no per-file waiver beyond `scripts/**`.

**Template files appended to**, lines before and after: `package.json` 71 to 75,
`pyproject.toml` 72 to 84, `Justfile` 164 to 207, `.gitattributes` 4 to 18, `.gitignore` 47
to 51, `.pre-commit-config.yaml` 166 to 169, `.pre-commit-fix.yaml` 41 to 41 (unchanged;
item 2), `.prettierignore` 21 to 26, `eslint.config.js` 46 to 53, `lychee.toml` 15 to 16,
`.markdownlint-cli2.jsonc` 25 to 27, `vitest.storybook.config.ts` 62 to 63. The lockfiles
are regenerated, not appended. Nothing under `docs/`, `src/`, `tests/` or `stories/`
differs from the render except the new `src/lib/assets/manifest.json`.

**Verification** (the block above, run after the last code commit):

```text
$ cat .copier-answers.yml             -> _commit: v2.1.0, the four answers
$ just lock-check                     -> exit 0
$ git check-attr filter blender/model/biscuit-poseable.blend
blender/model/biscuit-poseable.blend: filter: lfs
$ uv run --frozen python scripts/check_assets.py check
self-test: every refusal is live (budget, unlisted, absent, sha256, licence, source)
check-assets: checked 0 file(s) against src/lib/assets/manifest.json
$ grep -n 'check-assets' pyproject.toml Justfile
pyproject.toml:81:  "analyse-specs", "check-assets",
Justfile:130:check-assets:
$ grep -n "'three'" vitest.storybook.config.ts
48:  optimizeDeps: { include: ['@steven-cutting/biscuit-games', 'three'] },
$ grep -n -A3 'check-added-large-files' .pre-commit-config.yaml
76:      - id: check-added-large-files
77-        args: [--maxkb=768]
78-        # The served assets are the one place a large file is allowed:
79-        # docs/decisions/0011-served-assets-are-blobs-and-blends-are-lfs.md.
```

`just check`, twice in a row, both exit 0, each running `lock-check`, `lint`,
`frontend-static`, `frontend-coverage`, `frontend-build`, `storybook-build`,
`storybook-test`, `check-docs`, `check-agents`, `check-specs`, `analyse-specs`,
`check-assets` and ending "The worktree matches the check baseline. All checks passed
and the worktree is unchanged." The network was available for both runs.

**Open points answered.** `sharp`: `npm ci` needed no flag or environment variable here;
`sharp` 0.35 ships its binary as optional `@img/sharp-*` packages, and the lockfile
carries `@img/sharp-linux-x64` for CI, but a CI run was not possible before P12 (item 8).
`pillow` 12.3.0 is still current and resolved on Python 3.14.

**For P11:**

1. `tickets` is in `.markdownlint-cli2.jsonc` `ignores` and in `[tool.ruff]
   extend-exclude`, a deviation from Step 6 and §2.2 taken at the maintainer's direction
   (the tickets are to be thrown away). The seven markdownlint findings remain in the
   ticket prose. `tickets/README.md` ("the hook gate P00 installs runs lychee offline over
   this directory") still holds for lychee and typos; CONVENTIONS.md §2's rows for
   `pyproject.toml` and `.markdownlint-cli2.jsonc` do not mention `tickets`.
2. T `v2.1.0`'s `.pre-commit-fix.yaml` has no `check-added-large-files` hook (it holds
   only `end-of-file-fixer`, `trailing-whitespace`, ruff and markdownlint), so it was left
   as rendered. CONVENTIONS.md §2 and §3 and this ticket name both prek configs; only
   `.pre-commit-config.yaml` carries the `exclude`.
3. The branch is `P00-foundation`, not `ticket/p00-foundation`, and the worktree is
   `P00-foundation`, not `full-cozy` (CONVENTIONS.md §0 and §11 claim 14). Both were left
   as the maintainer created them.
4. The shared hooks directory now holds a shim naming this worktree's `.venv`; rerun
   `just install-hooks` from the primary checkout once `main` holds the render, before
   this worktree is removed.
5. `scripts/check_assets.py` imports `re`, `shutil` and `datetime` beside the six modules
   Step 7 names; all are standard library. A non-empty manifest's canonical text is
   `{"schema_version": 1, "assets": [` then one entry per line indented two spaces,
   comma-separated, sorted by path, then `]}` and a newline; `check` refuses any other
   layout, so P03 and later lanes write it only through `just assets-manifest`.
6. Prettier wrapped the `ignores` array in `eslint.config.js` over several lines once
   `'blender/'` made it too long, so `copier update` may conflict there as well as on
   `vitest.storybook.config.ts` (CONVENTIONS.md §12 names only the latter).
7. The rendered Pages address is `https://steven-cutting.github.io/pawlour/` (T computes
   it; `README.md` and decision 0010 carry it), while CONVENTIONS.md §1 decision 14 says
   the site is seen at `https://stevencutting.com/pawlour/` through the redirect. P09 or
   P13 decides which the handbook states.
8. Not verifiable before P12: that CI's `npm ci` installs `sharp`'s Linux binary with
   no flag, and that `storybook-build` passes offline (it was not tried offline here).

## Open points

- **Node's `sharp` binary.** `sharp` downloads a platform binary on install; if `npm ci`
  in CI needs a flag or an environment variable for it, that is a workflow change
  (managed by G) and is handed back rather than made.
- **`pillow` on Python 3.14.** S pinned `pillow==12.3.0` and it resolved; the current
  release is re-read on the day.
