---
title: "Decision 0012: Served assets are blobs, and blends are LFS"
kind: "decision"
audience: [contributor, maintainer, operator, agent]
canonical_for: [decision_large_file_storage]
requires: []
---

# Decision 0012: Served assets are blobs, and blends are LFS

## Context

The game serves files no other Biscuit Games game has: a skinned, animated model of
Biscuit of several megabytes, the cabin, eighteen stills, a fire texture and, in time,
audio loops. It also keeps the Blender source of the model, a `.blend` of about 12 MB.
The template's hook gate refuses any file over 768 KB with `check-added-large-files`, and
Git LFS is the usual answer to large binaries.

The shared workflows in `biscuit_games_tooling` at `v0.3.0` — `game-ci.yml`,
`game-pages.yml` and `game-chromatic.yml` — check out the repository with
`persist-credentials: false` and without `lfs: true`. A file in LFS arrives in those jobs
as a pointer: a few lines of text naming the object. If the site served an LFS file,
Pages would publish that pointer, and the model would fail to load in every browser.

## Decision

Everything the site serves is an ordinary Git blob under `src/lib/assets/`, imported by
Vite so its URL is hashed and carries the base path. The hook `check-added-large-files`
keeps `--maxkb=768` and gains `exclude: ^src/lib/assets/`, so a large file is accepted
there and nowhere else.

The `.blend` under `blender/` is never served, and nothing in CI reads it, so it lives in
LFS: `.gitattributes` routes `blender/**/*.blend` through the LFS filter. The binary
formats the site serves are marked `-text -diff` so Git never normalises or diffs them.
Each clone runs `git lfs install --local` once;
[Export the model](../how-to/export-the-model.md) says when.

## Consequences

**The served files sit in Git history for good.** Every rebuilt `biscuit.glb` adds
megabytes to the repository that no garbage collection removes. The per-file budgets in
[the asset manifest](../reference/asset-manifest.md) bound each copy, not the history.

**A public site publishes renders of a model whose licence is open.** The model's licence
is the platform's unresolved question, recorded on its character page. The asset
manifest marks every file derived from it `platform` and the game does not resolve it;
serving the files as blobs on a public site is the maintainer choosing to publish under
that open question.

**LFS costs bandwidth on every `.blend` change.** Each change is another 12 MB against
the account's LFS quota. Clips are Python scripts and the committed `.blend` stays
byte-identical to the approved one, so it changes only with a new approved model.

**A clone without LFS still works for everything but Blender.** CI and a contributor who
never runs Blender see pointer text in the `.blend` and never notice. A contributor who
exports the model without `git lfs install --local` has a pointer where the `.blend`
should be, which Blender cannot open; [Export the model](../how-to/export-the-model.md)
says how to tell and what to run.

## What would reopen this

The shared workflows gaining `lfs: true` on their checkout. Served files could then move
to LFS and the history would stop growing with every rebuilt model, at the price of LFS
bandwidth on every CI run and every Pages deployment.

## Related pages

- [Asset manifest](../reference/asset-manifest.md)
- [Build assets](../how-to/build-assets.md)
- [Decision 0014: This repository owns its animated model](0014-this-repository-owns-its-animated-model.md)
- [Quality gates](../reference/quality-gates.md)
