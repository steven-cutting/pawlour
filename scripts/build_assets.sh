#!/bin/sh
# Offline served assets from blender/out/. See tickets/CONVENTIONS.md section 4.3.
set -eu
if [ "$#" -ne 1 ]; then
    echo 'usage: build_assets.sh biscuit|cabin' >&2
    exit 2
fi
name="$1"
case "$name" in biscuit|cabin) ;; *) echo "unknown asset: $name" >&2; exit 2 ;; esac
raw="blender/out/$name-raw.glb"
out="src/lib/assets/$name.glb"
tmp="ai_tmp"
gt="node_modules/.bin/gltf-transform"
[ -f "$raw" ] || { echo "missing $raw: run just model-export or just cabin-export" >&2; exit 2; }
[ -x "$gt" ] || { echo 'missing pinned local gltf-transform: run just sync' >&2; exit 2; }
mkdir -p "$tmp" src/lib/assets
report="$tmp/$name-pipeline.jsonl"
: > "$report"
measure() {
    node scripts/inspect_asset.mjs "$1" "$2" "$report" > "$tmp/$name-inspect-$2.json"
    echo "assets-build: $name $2 measured"
}
measure "$raw" raw
"$gt" prune "$raw" "$tmp/$name.1.glb" --keep-leaves true
measure "$tmp/$name.1.glb" prune
case "$name" in
    biscuit) "$gt" dedup "$tmp/$name.1.glb" "$tmp/$name.2.glb" ;;
    cabin) node scripts/optimize_cabin.mjs dedup "$tmp/$name.1.glb" "$tmp/$name.2.glb" ;;
esac
measure "$tmp/$name.2.glb" dedup
case "$name" in
    biscuit)
        "$gt" flatten "$tmp/$name.2.glb" "$tmp/$name.3.glb"
        measure "$tmp/$name.3.glb" flatten
        "$gt" join "$tmp/$name.3.glb" "$tmp/$name.4-cli.glb"
        measure "$tmp/$name.4-cli.glb" join-cli
        node scripts/join_assets.mjs biscuit "$tmp/$name.4-cli.glb" "$tmp/$name.4.glb"
        ;;
    cabin)
        # CLI join implicitly flattens, losing item parents and empty anchors.
        node scripts/join_assets.mjs cabin "$tmp/$name.2.glb" "$tmp/$name.4.glb"
        ;;
esac
measure "$tmp/$name.4.glb" join
node scripts/strip_normals.mjs "$tmp/$name.4.glb" "$tmp/$name.4n.glb"
measure "$tmp/$name.4n.glb" strip-normals
"$gt" resize "$tmp/$name.4n.glb" "$tmp/$name.5.glb" --width 1024 --height 1024
measure "$tmp/$name.5.glb" resize-colour
# resize accepts a glob, not --slots or a regular expression.
"$gt" resize "$tmp/$name.5.glb" "$tmp/$name.5o.glb" --width 512 --height 512 --pattern '*occlusion*'
measure "$tmp/$name.5o.glb" resize-occlusion
"$gt" webp "$tmp/$name.5o.glb" "$tmp/$name.6.glb" --quality 82
measure "$tmp/$name.6.glb" webp
# One scene quantization grid keeps all skinned meshes on the same inverse-bind
# matrices; the per-mesh default clones the skin once for every mesh.
case "$name" in
    biscuit) "$gt" meshopt "$tmp/$name.6.glb" "$out" --level medium --quantization-volume scene ;;
    cabin) node scripts/optimize_cabin.mjs meshopt "$tmp/$name.6.glb" "$out" ;;
esac
measure "$out" meshopt
if [ "$name" = biscuit ]; then
    node scripts/clip_table.mjs "$out" src/lib/assets/biscuit.clips.json
    node scripts/check_model_asset.mjs "$out"
fi
just assets-manifest
