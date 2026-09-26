---
id: P12
title: "Repository: create it, grant the package, enable Pages, first push, first deploy"
status: open
depends_on: [P11, C01]
parallel_with: []
branch: ticket/p12-repository
estimated_size: S
---

# P12: Repository: create it, grant the package, enable Pages, first push, first deploy

## Context

Every lane has merged to `main`, P10 has measured the game on the phone, P11 has carried
the hand-backs, and the hub's decision record (C01) has landed, but the repository still
exists only as a local clone: no remote, and `gh repo view steven-cutting/biscuit_cozy`
answers `Could not resolve to a Repository`. This ticket makes the GitHub repository,
applies the settings no file can carry, pushes `main` once, and proves the three checks
and the Pages deployment with the first runs. CONVENTIONS.md §1 decision 14 fixes the
address: a public repository and a project Pages site served at
`https://stevencutting.com/biscuit_cozy/`, built with `BASE_PATH=/biscuit_cozy` (T's
`pages.yml` passes `base_path: /${{ github.event.repository.name }}`, §1 fact 9). The
Pages API and `github.io` name the site `https://steven-cutting.github.io/biscuit_cozy/`;
that address redirects to the user-site domain, which is what S measured on its first
deploy and why decision 14 reads as it does.

The settings are applied with T's `scripts/bootstrap_repo.sh`, which lives at T's
repository root and is not rendered into a game (`git -C
/Users/scutting/projects/biscuit_games_template ls-tree -r --name-only v2.1.0 | grep
bootstrap` prints `scripts/bootstrap_repo.sh` alone). Its `--checks` default is exactly a
game's three contexts, `ci / frontend,ci / documents,ci / stories` (the script's line 38),
so no `--checks` is passed. What the script does, what each step reads and mutates, and
what its dry run prints are in T `tickets/C03-repository-bootstrap.md` at `v2.1.0` (783
lines; Steps at lines 140-356, what happened when it ran at 444-747). Three facts from that
record shape the order below:

- **The Pages source must be GitHub Actions before `deploy-pages` runs**, or the build job
  succeeds and the deploy job fails with `Failed to create deployment (status: 404)`. The
  `POST /repos/{owner}/{repo}/pages` with `build_type=workflow` is accepted on a repository
  with no commits, so the source is set between creating the repository and the first
  push.
- **Branch protection needs the branch to exist**, so the script's protection step can
  only succeed after the first push. Protection before or after the owner's own push
  blocks nothing: administrators are not bound.
- **The package grant.** T `README.md` at `v2.1.0` lines 147-150 says the platform package
  is public and every workflow installs it with the run's own `github.token`, so no grant
  is needed today, and the script prints its step 5 because nothing can read the setting
  back. If the first `CI` run's `npm ci` answers `404 Not Found` for
  `@steven-cutting/biscuit-games`, the grant is missing: it is a setting on the package in
  the GitHub UI (Packages, the package, "Manage Actions access", add the repository with
  read), made by the maintainer, and this ticket records that it was needed.

Git LFS: `git lfs install --local` ran in P00 (CONVENTIONS.md §3) and installs a pre-push
hook that uploads the objects a push references, so the one LFS file
(`blender/model/biscuit-poseable.blend`, 12,004,899 bytes) travels with the first
`git push`. `git lfs push --all origin main` afterwards is a no-op that confirms it.

Nothing deploys before C01 has landed (CONVENTIONS.md §12, "The hub decision gates
shipping"): step 1 checks the hub's `docs/decisions/` for the record and stops if it is
absent.

Every action that touches GitHub below is marked **Authorisation required**: creating the
repository, setting the Pages source, pushing, each `--apply`, the package grant if it is
needed, and the optional hygiene settings. Read-only `gh api` GETs, `gh run list`, `gh run
watch`, `curl` and the script's dry run are not (CONVENTIONS.md §10). The `gh` login is
`steven-cutting` (§0).

Read first: CONVENTIONS.md §0, §1 (decision 14, facts 7 and 9), §3, §10, §11 (claims 9 and
13), §12. T `README.md` at `v2.1.0` lines 130-168 ("Bootstrap a repository") and T C03
whole, both read with `git -C /Users/scutting/projects/biscuit_games_template show
v2.1.0:<path>` after `git fetch --tags`. This repository's `.github/workflows/`,
`src/lib/assets/manifest.json` (the `sha256` of `biscuit.glb` and `cabin.glb`, which step 8
compares against what Pages serves), `docs/how-to/deploy-to-github-pages.md`, the P10 and
P11 hand-back notes, and C01's hand-back notes (the decision number and the merge).

## Goal

- `steven-cutting/biscuit_cozy` exists, public, with `main` pushed from this clone and the
  LFS object uploaded.
- Pages source GitHub Actions; `main` protected requiring `ci / frontend`, `ci / documents`
  and `ci / stories` (strict false, no review, no force push, no deletion, administrators
  unbound); private vulnerability reporting on; a second `--apply` prints `changed: 0`.
- The first `CI` run is green on all three jobs and the first `Deploy to GitHub Pages`
  run is green; `https://stevencutting.com/biscuit_cozy/` answers `200` with the game's
  title; the two GLBs are served byte-identical to the manifest, with the content type
  and cache header §11 claim 13 names.
- A fresh clone on a machine with git-lfs receives the real `.blend`.
- Every GitHub action was authorised before it happened and is recorded in the hand-back
  table.

## Non-goals

- `README.md`, `CHANGELOG.md`, `AGENTS.md`'s provenance: P13.
- A custom domain of the game's own, a tag, a release, filing any ticket as an issue.
- A Chromatic project or token (`--chromatic-token-stdin` is never passed; the
  `chromatic.yml` workflow stays green without one, CONVENTIONS.md §1 fact 9).
- Changing any file in this repository other than this ticket. If a run fails on
  something a file caused, the fix is a follow-up on `main` through a pull request, not a
  push to `main` from here, and this ticket records it.
- Touching H, T, G, P, S, D or a game.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `steven-cutting/biscuit_cozy` (repository, no file) | GitHub | `gh repo create` | created, public |
| `steven-cutting/biscuit_cozy` (settings, no file) | GitHub | T `scripts/bootstrap_repo.sh` run from `ai_tmp/`, one API call | Pages source, protection on `main`, vulnerability reporting; optionally hygiene |
| `@steven-cutting/biscuit-games` (package settings, no file) | GitHub | the maintainer, in the UI | a read grant, only if step 8 shows it is needed |
| `.git/config` (local, not committed) | local | `git remote add` | `origin` added |
| `ai_tmp/bootstrap_repo.sh` (ignored) | local | T `v2.1.0` `scripts/bootstrap_repo.sh` | copied to run; never committed |
| `tickets/P12-repository.md` | tickets | this file | `status:` line, hand-back notes |

The table is the whole scope. No tracked file other than this ticket changes.

## Steps

Work from the repository root. This ticket's own commit (the status line and the notes)
lands on `ticket/p12-repository` and reaches `main` through a pull request like every
other ticket; the steps below act on `main` as it stands after P11 merged.

1. **Confirm the starting state, and that C01 has landed.**

   ```sh
   git branch --show-current
   git status --short | wc -l
   git log --oneline | head -3
   git remote -v | wc -l
   gh repo view steven-cutting/biscuit_cozy 2>&1 | head -1
   git lfs ls-files --long
   ls /Users/scutting/projects/biscuit_games/docs/decisions/ | tail -3
   git -C /Users/scutting/projects/biscuit_games log --oneline main -- 'docs/decisions/00*-a-game-may-be-a-rendered-scene.md' | head -1
   just check
   ```

   Expected: `main`; `0`; the merge commits of the last lanes and P11; `0` (no remote);
   `GraphQL: Could not resolve to a Repository with the name 'steven-cutting/biscuit_cozy'`;
   one LFS file, the `.blend`; a listing that includes the record C01's hand-back names; a
   commit on H's `main` for it; `just check` green. If the record is absent from H's
   `main`, stop: nothing deploys before it (CONVENTIONS.md §12). If a remote or the
   repository already exists, stop: the maintainer created it by hand, and the steps below
   assume they did not. Also confirm every `tickets/P0*-*.md`, `P10` and `P11` has
   `status: done`.

2. **Fetch the bootstrap script from T** (read-only; T is never edited):

   ```sh
   git -C /Users/scutting/projects/biscuit_games_template fetch --tags
   git -C /Users/scutting/projects/biscuit_games_template show v2.1.0:scripts/bootstrap_repo.sh > ai_tmp/bootstrap_repo.sh
   sed -n 12,18p ai_tmp/bootstrap_repo.sh
   sh ai_tmp/bootstrap_repo.sh steven-cutting/biscuit_cozy; echo "rc=$?"
   ```

   Expected: the usage block; then a dry run against a repository that does not exist,
   where every read answers `404` and the script treats absence as a state, ending
   `changed: 0 (dry run; 3 would change)` with `rc=0`. If it aborts instead, note it; the
   real dry run is step 5.

3. **Create the repository.** **Authorisation required:** creating a public repository on
   GitHub. Stop and ask, then:

   ```sh
   gh repo create steven-cutting/biscuit_cozy --public --description "Biscuit at home in a log cabin: tap a thing, and she decides what to do about it."
   git remote add origin git@github.com:steven-cutting/biscuit_cozy.git
   gh repo view steven-cutting/biscuit_cozy --json name,visibility,defaultBranchRef --jq '[.name, .visibility, .defaultBranchRef.name] | join(" ")'
   ```

   Expected: the repository URL; then `biscuit_cozy PUBLIC` with an empty default branch.
   Created empty rather than with `--source . --push`, so the Pages source can be set
   before any workflow runs. The description is `.copier-answers.yml`'s (CONVENTIONS.md §1
   decision 1). SSH if `gh auth status` reports `Git operations protocol: ssh`; if the push
   in step 6 is refused for a key reason, `https://` is the fallback, recorded.

4. **Set the Pages source before anything deploys.** **Authorisation required:** enabling
   GitHub Pages. Stop and ask, then the one call the script's step 1 makes on a repository
   with no site:

   ```sh
   gh api -X POST repos/steven-cutting/biscuit_cozy/pages -f build_type=workflow
   gh api repos/steven-cutting/biscuit_cozy/pages --jq '[.build_type, .html_url] | join(" ")'
   ```

   Expected: a JSON body; then `workflow https://steven-cutting.github.io/biscuit_cozy/`
   (the API names the `github.io` address; the served address is the user-site domain,
   step 8). If the `POST` answers `409`, a site exists: `PUT` the same body instead. If it
   answers `422` asking for a source, send `{"build_type": "workflow", "source":
   {"branch": "main", "path": "/"}}` with `--input -` and record that it was needed.

5. **The real dry run.** Read-only, no authorisation:

   ```sh
   sh ai_tmp/bootstrap_repo.sh steven-cutting/biscuit_cozy
   ```

   Expected: step 1 `already`; step 2 `not protected (HTTP 404)` with the three wanted
   contexts and the `PUT` it would make; step 3 `skipped: no token supplied`; step 4
   `state: false` and the `PUT` it would make; step 5 the package note; step 6 `skipped:
   --hygiene not given`; `changed: 0 (dry run; 2 would change)`; `rc=0`.

6. **Push `main`.** **Authorisation required:** the first push. Stop and ask, then:

   ```sh
   git push -u origin main
   git lfs push --all origin main
   git lfs ls-files --long
   ```

   Expected: the push prints the LFS upload for one object before the git objects (the
   pre-push hook), then `main -> main`; `git lfs push --all` finds nothing left to upload;
   the `.blend` is still listed. If the push is refused with an LFS error (`batch
   response`, `Repository or object not found`), stop and record it rather than pushing
   the object another way. The push starts `CI`; its success starts `Deploy to GitHub
   Pages` (`workflow_run`, T's `pages.yml`).

7. **Apply the rest of the bootstrap, twice.** **Authorisation required:** changing the
   repository's settings. Stop and ask for both runs together, as one action with a stated
   second run, then:

   ```sh
   sh ai_tmp/bootstrap_repo.sh steven-cutting/biscuit_cozy --apply
   sh ai_tmp/bootstrap_repo.sh steven-cutting/biscuit_cozy --apply
   gh api repos/steven-cutting/biscuit_cozy/branches/main/protection --jq '[.required_status_checks.strict, ([.required_status_checks.checks[].context] | sort | join(",")), .enforce_admins.enabled, .allow_force_pushes.enabled, .allow_deletions.enabled, (.required_pull_request_reviews != null), (.restrictions != null)] | map(tostring) | join(" ")'
   gh api repos/steven-cutting/biscuit_cozy/private-vulnerability-reporting --jq .enabled
   gh secret list -R steven-cutting/biscuit_cozy
   ```

   Expected, first run: step 1 `already`; step 2 a `PUT` to `branches/main/protection`;
   step 4 a `PUT` to `private-vulnerability-reporting`; `changed: 2`. Second run: `already`
   on every step that reads, `skipped` on 3 and 6, no line beginning `+`, `changed: 0`.
   Then `false ci / documents,ci / frontend,ci / stories false false false false false`;
   `true`; nothing. `--hygiene` (delete branch on merge, wiki off, projects off) is a
   separate **Authorisation required** choice: offer it, and if wanted add it to a third
   `--apply` (`changed: 1`) and a fourth (`changed: 0`).

8. **The first runs, what they served, and the two claims.**

   ```sh
   gh run list -R steven-cutting/biscuit_cozy --limit 5
   gh run watch -R steven-cutting/biscuit_cozy --exit-status "$(gh run list -R steven-cutting/biscuit_cozy --workflow CI --limit 1 --json databaseId --jq '.[0].databaseId')"
   gh run watch -R steven-cutting/biscuit_cozy --exit-status "$(gh run list -R steven-cutting/biscuit_cozy --workflow 'Deploy to GitHub Pages' --limit 1 --json databaseId --jq '.[0].databaseId')"
   gh api repos/steven-cutting/biscuit_cozy/environments --jq '.environments[].name'
   ```

   Expected: `CI` `success` with jobs `frontend`, `documents`, `stories`; `Deploy to
   GitHub Pages` `success`; `github-pages`. If `CI`'s install step answers `404 Not Found`
   for the platform package, the package grant is needed: **Authorisation required**, the
   maintainer makes it in the UI (Context), then `gh run rerun` (**Authorisation
   required**, it is a deployment on success) and record that it was needed. If the deploy
   failed with `status: 404`, step 4 did not take: fix it, rerun, record it. If `CI` failed
   on a recipe, the fix is a follow-up on `main` through a pull request (Non-goals), and
   this ticket waits for it.

   Then what Pages serves, compared with the manifest. The hashed asset names are read from
   the served page rather than guessed:

   ```sh
   curl -sI https://steven-cutting.github.io/biscuit_cozy/ | grep -i -E '^(HTTP|location)'
   curl -sI https://stevencutting.com/biscuit_cozy/ | head -1
   curl -s https://stevencutting.com/biscuit_cozy/ | grep -o '<title>[^<]*</title>'
   curl -sL https://stevencutting.com/biscuit_cozy/ | grep -o '/biscuit_cozy/_app/immutable/assets/[A-Za-z0-9._-]*\.glb' | sort -u
   for f in $(curl -sL https://stevencutting.com/biscuit_cozy/ | grep -o '/biscuit_cozy/_app/immutable/assets/[A-Za-z0-9._-]*\.glb' | sort -u); do curl -sI "https://stevencutting.com$f" | grep -i -E '^(HTTP|content-type|cache-control)'; curl -sL "https://stevencutting.com$f" | shasum -a 256; done
   uv run --frozen python -c "import json; m={e['path']: e['sha256'] for e in json.load(open('src/lib/assets/manifest.json'))['assets']}; print(m['src/lib/assets/biscuit.glb']); print(m['src/lib/assets/cabin.glb'])"
   ```

   Expected: a `301` from `github.io` with a `location` on `stevencutting.com`; `HTTP/2
   200`; `<title>Pawlour</title>` (or the title `src/lib/brand.ts` states); two `.glb`
   paths under `/biscuit_cozy/_app/immutable/assets/` (which settles §11 claim 9 on Pages:
   the asset URLs carry `paths.base`); for each, `200`, a `content-type` and a
   `cache-control`, and a digest equal to the manifest's for that file. Record the content
   type and the cache header verbatim: §11 claim 13 expected `model/gltf-binary` and a
   long `max-age` for an immutable path, and the claim holds or fails on what is printed.
   Pages can take a minute after the run to serve the new content; retry `curl` rather
   than reading a `404` as failure inside that minute. If the GLB URLs are not in the HTML
   (they are loaded by script, not by a tag), read them from the served JS chunk instead:
   `curl -sL <the page> | grep -o '/biscuit_cozy/_app/immutable/[^"]*\.js'` and grep the
   chunks for `.glb`.

9. **A fresh clone receives the `.blend`.** In a scratch directory outside this repository:

   ```sh
   git clone git@github.com:steven-cutting/biscuit_cozy.git /tmp/biscuit_cozy-clone-check
   shasum -a 256 /tmp/biscuit_cozy-clone-check/blender/model/biscuit-poseable.blend
   rm -rf /tmp/biscuit_cozy-clone-check
   ```

   Expected: `95d164730e9354ab3d9bd561a73180690bbb055fffa9bf230c735f735234b4c3`
   (CONVENTIONS.md §1 fact 1). A digest of a few hundred bytes is pointer text: LFS did not
   travel, and the hand-back says so.

10. **Record and close.** Fill in the hand-back notes, set `status: done`, commit on
    `ticket/p12-repository`. Pushing that branch and opening its pull request are
    **Authorisation required**: stop and ask.

## Acceptance criteria

- [ ] `gh repo view steven-cutting/biscuit_cozy --json visibility` prints `PUBLIC`, and
      `origin` points at it.
- [ ] Pages source is `workflow`; protection on `main` requires exactly the three `ci /`
      contexts with the flags step 7 expects; private vulnerability reporting is on; the
      second `--apply` printed `changed: 0`.
- [ ] The first `CI` run and the first `Deploy to GitHub Pages` run are green, and the
      package grant was recorded as needed or not needed.
- [ ] `https://stevencutting.com/biscuit_cozy/` answers `200` with the game's title, and
      both GLBs are served with the manifest's digests; §11 claims 9 and 13 are each
      recorded as held or failed with the printed evidence.
- [ ] A fresh clone's `.blend` has the sha256 §1 fact 1 gives.
- [ ] No tracked file other than this ticket changed; nothing under `ai_tmp/` was committed.
- [ ] Every authorisation was asked for and given before the action, and the hand-back
      table lists each with its date.

## Verification

```sh
git remote -v
gh api repos/steven-cutting/biscuit_cozy/pages --jq .build_type
gh api repos/steven-cutting/biscuit_cozy/branches/main/protection --jq '[.required_status_checks.checks[].context] | sort | join(",")'
gh run list -R steven-cutting/biscuit_cozy --limit 2 --json name,conclusion --jq '.[] | [.name, .conclusion] | join(" ")'
curl -sI https://stevencutting.com/biscuit_cozy/ | head -1
git status --short
```

Expected: two `origin` lines; `workflow`; `ci / documents,ci / frontend,ci / stories`;
`CI success` and `Deploy to GitHub Pages success`; `HTTP/2 200`; only this ticket's file
modified.

## Hand-back notes

Filled in by the agent that executes this ticket.

- A table of every authorisation asked for and given, with dates: repository creation,
  Pages source, first push, each `--apply`, hygiene if applied, the package grant if
  needed, any rerun.
- The first `CI` and deploy run ids, their durations, and the environment created.
- §11 claim 9: the two served GLB URLs, verbatim, showing `paths.base`.
- §11 claim 13: the `content-type` and `cache-control` headers verbatim, and whether the
  claim held.
- The fresh clone's `.blend` digest.
- Whether the package grant was needed, and what the maintainer did if it was.
- Anything handed to P13 (the deployed address as served, the check names as GitHub
  reports them, whether `--hygiene` was applied, whether vulnerability reporting is on).

## Open points

- Whether to apply `--hygiene`. S applied it on its repository; recommend the same, as a
  third and fourth `--apply`, because nothing here expects a merged branch to survive.
- Whether the `github.io` address should be documented anywhere. Recommend not: P13's
  README names the served address only, and the redirect is GitHub's to keep.
- Whether the maintainer wants the first deploy to wait for P13's README, so the
  repository's front page is not the stub. Recommend deploying now: Pages serves the
  built site, not the README, and P13 follows in the same week.
