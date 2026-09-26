---
title: "Export the model"
kind: "how-to"
audience: [contributor, maintainer, agent]
canonical_for: [model_export_procedure]
requires: []
---

# Export the model

How to turn the approved Blender model and the clip scripts into the `biscuit.glb` the
site serves. You need this after changing a clip, the exporter or the model; nothing in
`just check` or CI runs Blender, so the built files are committed and these recipes are
how they are rebuilt.

## Before the first export in a clone

1. Install Blender 5.2.1 LTS. The recipes run
   `/Applications/Blender.app/Contents/MacOS/Blender`; set `BLENDER` to the executable
   to use another path.
2. Turn on Git LFS for this clone, once. The `.blend` is the one file in LFS
   ([Decision 0012](../decisions/0012-served-assets-are-blobs-and-blends-are-lfs.md)),
   and `just initialize` does not do this for you:

   ```console
   git lfs install --local
   git lfs pull
   ```

3. Prove the copied model is the approved one:

   ```console
   just model-provenance
   ```

   It checks the `.blend`, `rig.json`, the four poses and the sixteen copied source files
   against the hashes in `blender/provenance.json`. If the `.blend` is still an LFS pointer
   — a few lines of text rather than 12 MB — this fails, and Blender could not open it
   anyway; run step 2.

## Export

1. Build the clips into a working copy of the model:

   ```console
   just model-clips
   ```

   This opens `blender/model/biscuit-poseable.blend`, runs every script under
   `blender/clips/` (see [Author a clip](author-a-clip.md)) and saves
   `blender/out/biscuit-clips.blend`. The committed `.blend` is never written to.
   `PAWLOUR_CLIPS=walk,sit just model-clips` builds only the clips named, by file stem.

2. Export it:

   ```console
   just model-export
   ```

   `blender/export_animated_glb.py` swaps every part's material for the portable one
   the approved GLB was exported with, exports each NLA track as one glTF animation named
   after it, samples every clip at 600 Hz so no authored foot contact is lost, and
   rewrites the skin's joints into `rig.json`'s order. It then reads the file back and
   refuses it unless every clip is present with its authored length, the skin has
   `rig.json`'s 33 joints and no control bone, and the sweater's corrective morphs are
   animated wherever the pose needs them. The result is `blender/out/biscuit-raw.glb`,
   with a summary in `ai_tmp/export-report.json`.

3. Build the served file from it, as [Build assets](build-assets.md) describes:

   ```console
   just assets-build biscuit
   ```

4. If a clip that a still is taken from changed, render the stills again:

   ```console
   just model-stills
   just assets-manifest
   ```

5. Read the diff of `src/lib/assets/manifest.json`, then run `just check` before
   committing.

Everything under `blender/out/` is rebuilt, never committed.

## Where the model comes from

`blender/README.md` records the copy: the `biscuit_pics` commit, the date, the hash of
every copied file, and the chain of study folders the copied `build.py` would read, which
stay in `biscuit_pics`. So `build.py` is kept as a record of how the model was made and
cannot run here. Of the copied source, the clips import only `pose_io.py`, and they read
`rig.json` directly.
[Decision 0014](../decisions/0014-this-repository-owns-its-animated-model.md) says why
the copy exists.

## Related pages

- [Author a clip](author-a-clip.md)
- [Build assets](build-assets.md)
- [Commands](../reference/commands.md)
- [Decision 0014: This repository owns its animated model](../decisions/0014-this-repository-owns-its-animated-model.md)
