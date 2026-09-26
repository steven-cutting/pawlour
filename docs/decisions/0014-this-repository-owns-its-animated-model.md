---
title: "Decision 0014: This repository owns its animated model"
kind: "decision"
audience: [contributor, maintainer, agent]
canonical_for: [decision_model_ownership]
requires: []
---

# Decision 0014: This repository owns its animated model

## Context

The approved poseable model of Biscuit lives in the `biscuit_pics` repository: a
`.blend`, the GLB exported from it, a rig description, four pose presets and sixteen
source files that built and verified it. It has a skeleton and no animations. Pawlour
needs it walking, sitting, sleeping, drinking, eating and playing, which means clips
keyframed on that rig in Blender and exported with the model.

The platform means its shared assets to be developed in `biscuit_studio` and to leave
there by a ledger entry that records what was taken, from where, and at which approval.
Nothing in the studio animates this model, and waiting for it to would stop this game.

## Decision

This repository copies the approved `.blend`, `rig.json`, the four poses and the sixteen
source files under `blender/`, byte for byte, with their provenance in
`blender/README.md` and `blender/provenance.json`. The committed `.blend` is never
modified. Clips are Python scripts under `blender/clips/` that keyframe the rig in a
separate build output, and the exporter here writes the animated GLB the game serves.
Nothing here is promoted anywhere else, and the studio's ledger is untouched.

The dependencies that pipeline needs — `@gltf-transform/cli` and its libraries,
`meshoptimizer` and `sharp` — landed with the foundation, because `package.json` and the
lockfiles are files no parallel lane edits. `AGENTS.md` lists them among the deviations.

## Consequences

**The model forks from the studio's approved one.** From the moment of the copy there are
two sources of truth for her geometry, and an improvement made in either place does not
reach the other. The fork is narrow on purpose — the `.blend` is unchanged and every clip
is a script — so reconciling means replaying scripts, not merging meshes.

**A ledger entry that should exist does not.** The studio has no record that this game
took the model, so its view of where Biscuit is used is incomplete until the
reconciliation writes one.

**The rebuild chain stays behind.** The copied `build.py` reads seven study folders that
remain in `biscuit_pics`, so it is not runnable here. The copies are kept as the record of
how the model was made and for the modules the exporter and the clips import.

## What would reopen this

Ticket C02, the studio reconciliation after v1: it decides whether the animated model and
its clips move into `biscuit_studio` and leave by ledger, at which point this
repository's copy becomes a consumer of that entry rather than a fork.

## Related pages

- [Export the model](../how-to/export-the-model.md)
- [Author a clip](../how-to/author-a-clip.md)
- [Decision 0012: Served assets are blobs, and blends are LFS](0012-served-assets-are-blobs-and-blends-are-lfs.md)
- [The platform upstream](../project/platform.md)
