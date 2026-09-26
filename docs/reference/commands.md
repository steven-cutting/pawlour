---
title: "Commands"
kind: "reference"
audience: [contributor, maintainer, operator, agent]
canonical_for: [command_reference]
requires: []
---

# Commands

`just --list` prints the live set. This page says what each recipe is for. The `Justfile`
is the only supported interface: if something is worth running twice, it belongs here
rather than in a shell history.

## Setup

| Recipe | Purpose |
| --- | --- |
| `just initialize` | One explicit first run. Creates both lockfiles, installs both dependency trees, the browser the story tests need and the pinned `allium` binary, normalises formatting, and installs the hook from the primary checkout; a secondary worktree skips the hook and says so. On Linux it names `just storybook-browsers-deps` rather than running it, because that recipe asks for sudo. Never stages, commits, tags or pushes. |
| `just sync` | Install exactly what the lockfiles say. Run after pulling. Reads the design system from GitHub Packages, so it needs the token [Develop locally](../how-to/develop-locally.md) describes. |
| `just install-hooks` | Install the read-only pre-commit gate. Run it from the primary checkout: every worktree shares one hooks directory, and the hook runs the environment of whichever worktree installed it. |
| `just install-allium` | Download, verify and install the pinned `allium` binary into `.tools/bin/`. Over the network; no lockfile can name a binary. |
| `just storybook-browsers` | Download the Chromium the story tests render in. Over the network, into a cache outside the repository. |
| `just storybook-browsers-deps` | The system libraries Chromium links against. Linux only; CI runs it first. |

## Dependencies

| Recipe | Purpose |
| --- | --- |
| `just lock` | Relock at the versions the manifests state. |
| `just lock-upgrade` | Move within the manifests' constraints. |
| `just lock-check` | Fail if a manifest and its lockfile disagree. |

## Develop

| Recipe | Purpose |
| --- | --- |
| `just dev` | Vite development server with hot module replacement. |
| `just preview` | Serve the built output in `build/`. Build first, and set the same `BASE_PATH` — see [Configuration](configuration.md). |
| `just storybook` | The component workshop on port 6006, with hot module replacement. |

## Format and repair

| Recipe | Purpose |
| --- | --- |
| `just format` | Ruff and Prettier, writing. |
| `just fix` | The mutating hook set, then ESLint autofix and Prettier, then `just lint`. The recipe that repairs what a check reports. Not the only one that writes: `just format`, `just initialize` and the lock recipes do too, and none of them is a check. |

## Check

| Recipe | Purpose |
| --- | --- |
| `just lint` | The whole read-only hook gate over every file. |
| `just frontend-static` | ESLint, `prettier --check`, and `svelte-check --fail-on-warnings`. |
| `just frontend-unit` | Vitest, once. |
| `just frontend-coverage` | Vitest with the 90% floor enforced. |
| `just frontend-build` | Production build. Honours `BASE_PATH`. |
| `just storybook-build` | Build the workshop into `storybook-static/`. Ignored by Git; this build is discarded, and `just chromatic` is what publishes one. Reaches the network for the platform's workshop, and cannot fail on it. |
| `just storybook-test` | Every story in real Chromium: axe over each render, play functions as interaction tests. |

## Documents and agents

| Recipe | Purpose |
| --- | --- |
| `just check-docs` | markdownlint, `typos`, offline link check, then the documentation contract. |
| `just check-agents` | The agent contract: inventory, adapters, and skill bridges. |
| `just check-specs` | `allium check` over `docs/specs/`. Asserts that every module reports an empty `diagnostics` array; anything reported is a regression. Waiver terms: [Work with the specifications](../how-to/work-with-the-specs.md). |
| `just analyse-specs` | `allium analyse` over `docs/specs/`: the same structural diagnostics plus data flow, reachability, deadlocks and conflicts. Asserts that both arrays are empty; a finding cannot be waived, so any finding is a regression. |
| `just check-links-online` | Follow external links. Manual; needs the network. |

Both spec recipes go through `bg-run-allium`, which reads the JSON rather than
trusting the exit code — `allium check` exits 0 on an `info` diagnostic and `allium
analyse` ignores diagnostics altogether. Both need the pinned binary, so a worktree that
has not run `just initialize` must run `just install-allium` first.

## Model and assets

These local authoring recipes need Blender 5.2.1 LTS (`BLENDER` overrides its
default application path). The full gate validates committed assets without
rebuilding them. No authoring recipe reads the historical model studies, and
none writes over the approved source. See [Blender provenance](../../blender/README.md).

| Recipe | Purpose |
| --- | --- |
| `just model-provenance` | Check all copied model files against their recorded source hashes. |
| `just model-inspect` | Record the installed exporter's defaults and packed image names under `ai_tmp/`. |
| `just model-diagnose <script>` | Run a local Blender diagnostic; disposable scripts belong in `ai_tmp/`. |
| `just model-clips` | Build all clip scripts into the derived `blender/out/biscuit-clips.blend`. `PAWLOUR_CLIPS=idle_stand` selects the proof; `PAWLOUR_IK_PROBE=1` enables its temporary IK probe. |
| `just model-export` | Export portable materials, sampled animation and driven sweater morphs; verify the raw GLB's skeleton, clip names, durations and weights. |
| `just model-sheet <clip>` | Render one twelve-frame contact sheet under `ai_tmp/clips/`. |
| `just model-sheets` | Render a contact sheet for every clip. |
| `just model-stills` | Render eighteen activity/phase WebP stills, each below 262,144 bytes. |
| `just model-check-clips` | Check native loop endpoints, in-place motion, additive channels and authored frame ranges. |
| `just model-check-ik <baseline> <probe>` | Compare ordinary and temporary IK GLBs: movement must bake into the lower-leg bone without exporting controls. |
| `just cabin-export` | Build the room, raw GLB and three review camera renders. |
| `just check-cabin [path]` | Verify the room's node names, navigation graph, item hierarchy, colours and triangle budget; defaults to the served cabin. |
| `just check-cabin-self-test` | Exercise the room checker with deliberate contract violations. |
| `just assets-build <name>` | Build `biscuit` or `cabin` through the offline, pinned gltf-transform pipeline; write the manifest and clip metadata. Budgets are 6,291,456 and 3,145,728 bytes respectively. |
| `just assets-inspect <path>` | Measure a GLB's meshes, primitives, triangles, image payload and bytes. |
| `just assets-placeholder <copied-preview> [output]` | Pad the approved standing preview to a 1170 × 2532 WebP placeholder; defaults to `stills/idle.morning.webp`. |
| `just check-model-asset [path]` | Load Biscuit in three.js and verify its rig, baked clips, morph channels and bind height. |
| `just assets-tools-help` | Show the pinned transform CLI's resize and join flags. |
| `just check-assets` | Check manifest completeness, hashes, budgets and provenance, including checker self-tests. Part of `just check`. |
| `just assets-manifest` | Recompute manifest sizes and hashes; retain each entry's source, licence and budget. |
| `just python-check <paths...>` | Ruff lint and formatting checks for authoring tools. |
| `just python-format <paths...>` | Apply Ruff's safe fixes and formatting to authoring tools. |
| `just assets-format <paths...>` | Format selected asset-tool JavaScript and metadata with Prettier. |

## Publish

| Recipe | Purpose |
| --- | --- |
| `just chromatic [branch]` | Build the workshop and publish it to Chromatic for visual review. Manual; needs the network and `CHROMATIC_PROJECT_TOKEN`. Never part of `just check`. The argument overrides the branch name, which only CI needs, because it checks a pull request out at a detached head. |

## Aggregate

| Recipe | Purpose |
| --- | --- |
| `just check` | Every gate in order, proving the worktree is unchanged between each. |
| `just check-clean` | Assert the worktree is clean, or matches a supplied baseline. |

## Related pages

- [Quality gates](quality-gates.md)
- [Develop locally](../how-to/develop-locally.md)
- [Configuration](configuration.md)
