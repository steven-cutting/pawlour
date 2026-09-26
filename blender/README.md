# Blender

This directory is a stub that ticket P02 fills: the approved model's `.blend` (in Git
LFS), its copied build scripts under `blender/src/` with their provenance, the animated
exporter, `build_clips.py` and the clip scripts under `blender/clips/`. The Blender
recipes in the `Justfile` write their output to `blender/out/`, which Git ignores; nothing
there is committed, because the recipes rebuild it.
