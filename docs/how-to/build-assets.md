---
title: "Build assets"
kind: "how-to"
audience: [contributor, maintainer, agent]
canonical_for: [asset_build_procedure]
requires: []
---

# Build assets

How to turn a raw GLB from Blender into the compressed file the site serves, and how to
add any other file to `src/lib/assets/`. Everything the site serves lives there as an
ordinary Git blob, is imported by Vite so its URL is hashed and carries the base path,
and is recorded in [the asset manifest](../reference/asset-manifest.md). Nothing goes
under `static/`, which the component workshop would copy into every story build.

## Build a model

1. Produce the raw file: `just model-export` for Biscuit
   ([Export the model](export-the-model.md)) or `just cabin-export` for the room. Each
   writes `blender/out/<name>-raw.glb`.
2. Run the pipeline:

   ```console
   just assets-build biscuit
   just assets-build cabin
   ```

   `scripts/build_assets.sh` runs the pinned `gltf-transform` from `node_modules`, offline,
   and keeps every stage under `ai_tmp/` with its measurements in
   `ai_tmp/<name>-pipeline.jsonl`.

3. Read the diff of `src/lib/assets/manifest.json`. The pipeline ends with
   `just assets-manifest`, which updates each rebuilt file's size and hash and checks it
   against its budget.
4. Run `just check`, and commit the served files and the manifest together.

## What the pipeline does

| Stage | Biscuit | The room |
| --- | --- | --- |
| Prune | unused data removed, leaf nodes kept | the same |
| Deduplicate | shared data merged | the same, keeping each material's unique name |
| Flatten | the node tree flattened | skipped, so the `item.*` hierarchy survives |
| Join | `scripts/join_assets.mjs` merges skinned primitives that share a skin, material and layout; the stock `join` leaves skinned meshes alone | named nodes kept apart, so every item stays tappable |
| Normal maps | removed by `scripts/strip_normals.mjs` | the same |
| Resize | colour textures to 1024², occlusion to 512² | the same |
| Encode | WebP at quality 82 | the same |
| Compress | meshopt, medium level, quantised over the scene | meshopt with positions kept as floats, so named origins do not move |

After the Biscuit pass, `scripts/clip_table.mjs` writes `src/lib/assets/biscuit.clips.json`
— each clip's name, length in seconds, whether it loops, the walk's stride, and her
bind-pose height — and `just check-model-asset` loads the result in three.js, plays every
clip and checks the rig, the morphs, the texture sizes and the draw calls. After the room
pass, `just check-cabin` holds the file to [the room's contract](../design/the-room.md).

`just assets-inspect <path>` measures any GLB — meshes, primitives, triangles, image
bytes and file size — without changing it.

## Add another served file

1. Put the file under `src/lib/assets/` and import it where it is used.
2. Run `just assets-manifest`. The new entry gets `made:<today>`, `unsettled` and a
   budget of `0`.
3. Set the new entry's `source`, `licence` and `budget` by hand, in the forms
   [the asset manifest](../reference/asset-manifest.md) lists. Audio must be `cc0` or
   the check fails.
4. Run `just check-assets`, then `just check`.

When two branches both add files, the second to merge re-runs `just assets-manifest` on
the merged tree, re-sets its own entries' three hand fields, and reads the diff.

## Related pages

- [Asset manifest](../reference/asset-manifest.md)
- [Performance budget](../reference/budget.md)
- [Export the model](export-the-model.md)
- [Commands](../reference/commands.md)
- [Decision 0012: Served assets are blobs, and blends are LFS](../decisions/0012-served-assets-are-blobs-and-blends-are-lfs.md)
