---
title: "Deploy to GitHub Pages"
kind: "how-to"
audience: [maintainer, operator, agent]
canonical_for: [deployment_procedure]
requires: []
---

# Deploy to GitHub Pages

This game publishes to GitHub Pages from `.github/workflows/pages.yml` once CI has passed
on a push to `main`. Its one job calls `game-pages.yml` in `steven-cutting/biscuit_games_tooling`, at a
pinned release, which builds the static site and hands `build/` to the Pages deployment
action; nothing is committed to a branch.

The site is a project site, served at <https://steven-cutting.github.io/pawlour/>: the repository
`steven-cutting/pawlour`, beneath `/pawlour/` on its owner's Pages host.

## One-time setup

A rendered repository starts from nothing, so both steps are done once, before the first
push that should deploy.

1. In the repository settings, under Pages, set the source to **GitHub Actions**. The
   workflow cannot do this for itself.
2. Grant this repository read access on the `@steven-cutting/biscuit-games` package, so
   that the build job's own token can install it. It is a setting on the package, not on
   either repository: on the package's page, open **Package settings**, choose
   **Add repository** under **Manage Actions access**, search for this repository,
   `steven-cutting/pawlour`, and give it the **Read** role.

The template repository's `scripts/bootstrap_repo.sh` applies step 1 with `gh`, together
with the branch protection and the vulnerability-reporting setting the rest of this
handbook assumes. Run it from a checkout of the template before the first push; it also
prints step 2, which it cannot make, because no REST endpoint for that setting exists.

The deploy job names a `github-pages` environment, which needs no setup: GitHub creates it
on the first run that reaches that job.

Until step 2 is done, CI fails at its first install with `404 Not Found` for the package,
so nothing deploys. Until step 1 is done, a green CI run is followed by a build job that
succeeds and uploads its artefact and a deploy job that fails with
`Failed to create deployment (status: 404)`, even though the workflow itself is correct.
Once the step is done, re-run that Pages run: it builds the same commit again.

## When it deploys

`pages.yml` does not run on the push. It runs when a run of the workflow named `CI`
completes on `main`, and its one job deploys only if that run succeeded, was started by a
push, and tested the commit that was `main`'s head when that run finished. So:

- Nothing is published while CI is red. The Pages run appears with its job skipped.
- A push that a newer one overtakes before its CI passes is never published; the newer
  push deploys itself once its own CI passes.
- A Pages run that is already waiting, behind a deployment in progress, when a newer push
  lands still deploys its own commit, which CI passed. The newer push follows once its CI
  passes, and a newer waiting Pages run cancels an older one, so waiting runs never deploy
  out of order.
- There is no **Run workflow** button for Pages, and running CI by hand deploys nothing:
  either would publish a commit no push had proved. A redeploy is a re-run of a Pages run
  that deployed (`gh run rerun`), which GitHub allows for 30 days; after that, a push.
- `CI` is the `name:` in `.github/workflows/ci.yml`. Renaming that workflow without
  changing `workflows:` in `pages.yml` stops every deploy, silently.
- GitHub runs a `workflow_run` trigger from the copy of `pages.yml` on `main` only, so a
  change to it takes effect after it merges, never on a pull request.

The gate exists because branch protection does not bind administrators and a repository's
first push predates it: see [Quality gates](../reference/quality-gates.md).

## Where the site is served from

A project site lives beneath the repository's name on the owner's Pages host, so the app is
built to live under `/pawlour`. The workflow reads that name from the event that
triggered it rather than carrying it in the file, which keeps `pages.yml` the same in every
game and keeps `paths.base` in `svelte.config.js` from drifting away from the address Pages
serves. A custom domain is a later change to the repository settings and to nothing here;
[decision 0010](../decisions/0010-a-project-pages-site.md) records why the project site is
the starting point.

## What the workflow does

- Passes a slash and the repository name, read from the event, to the shared workflow as
  its `base_path` input, and the shared workflow sets `BASE_PATH` from it, so the build
  cannot drift from where Pages serves it.
- Builds with `npm run build`, which is `just frontend-build`.
- Uploads `build/` as the Pages artefact. `static/.nojekyll` rides along so Pages serves
  the underscore-prefixed `_app/` directory rather than treating it as a Jekyll internal.
- Deploys it in a second job that holds the `pages: write` and `id-token: write` scopes.
  The job that builds holds `contents: read` and `packages: read` and neither publishing
  scope, so the credential that installs and the credential that deploys never meet.

Deployments are serialised by a concurrency group and are never cancelled mid-flight: a
half-published site is worse than a slightly stale one.

## Reproduce a deployment locally

```console
BASE_PATH=/pawlour just frontend-build
BASE_PATH=/pawlour just preview
```

The base path goes on both commands, so the preview sits where Pages serves. See
[Configuration](../reference/configuration.md).

## Rolling back

Re-run the last good deployment from the Actions tab: a re-run builds the commit its run
was for, and GitHub allows it for 30 days. Or revert the commit and push; the revert
deploys once CI passes on it. There is no state to migrate and no cache to clear beyond the
browser's.

## Related pages

- [Decision 0010: A project Pages site](../decisions/0010-a-project-pages-site.md)
- [Architecture](../explanation/architecture.md)
- [Configuration](../reference/configuration.md)
- [Maintenance](../operations/maintenance.md)
