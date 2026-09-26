"""Build NLA clips on a derived copy of the approved, immutable Biscuit scene."""

import importlib.util
import json
import os
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def main():
    bpy.ops.wm.open_mainfile(filepath=str(ROOT / "model/biscuit-poseable.blend"))
    scene = bpy.context.scene
    scene.render.fps = 30
    scene.render.fps_base = 1
    load_module("pose_io", ROOT / "src/pose_io.py")
    # The copied rig.py imports common.py and its seven historical studies.
    # This pipeline needs only the committed rig.json, never the rebuild chain.
    spec = json.loads((ROOT / "model/rig.json").read_text())
    rig = bpy.data.objects["Biscuit.Rig"]
    if {bone.name for bone in rig.data.bones if bone.use_deform} != {
        bone["name"] for bone in spec["bones"]
    }:
        raise ValueError("Approved rig and rig.json disagree")
    sys.path.insert(0, str(ROOT / "clips"))
    only = os.environ.get("PAWLOUR_CLIPS", "").split(",")
    start = 1
    paths = [
        path for path in sorted((ROOT / "clips").glob("*.py")) if not path.stem.startswith("_")
    ]
    unknown = set(only) - {""} - {path.stem for path in paths}
    if unknown:
        raise ValueError(f"Unknown clips: {sorted(unknown)}")
    selected = [path for path in paths if only == [""] or path.stem in only]
    if not selected:
        raise ValueError("No clips selected")
    for path in selected:
        module = load_module(f"pawlour_clip_{path.stem}", path)
        kwargs = (
            {"ik_probe": True}
            if path.stem == "idle_stand" and os.environ.get("PAWLOUR_IK_PROBE") == "1"
            else {}
        )
        end = module.build(rig, start, **kwargs)
        track = rig.animation_data.nla_tracks[-1]
        strip = track.strips[0]
        if strip.frame_start != start or strip.frame_end != end - 1:
            raise ValueError(f"{track.name}: strip must end on the last authored frame")
        print(f"{track.name}: frames {start}-{end - 1} ({end - start} samples at 30 fps)")
        start = end + 10
    scene.frame_start = 1
    scene.frame_end = start - 11
    scene.frame_set(1)
    out = ROOT / "out/biscuit-clips.blend"
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out))
    print(f"Saved {out.relative_to(ROOT.parent)}; approved source unchanged")


if __name__ == "__main__":
    main()
