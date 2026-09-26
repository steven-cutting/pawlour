"""Record the installed Blender API and packed-image mapping for provenance."""

import json
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent


def main():
    bpy.ops.wm.open_mainfile(filepath=str(ROOT / "model/biscuit-poseable.blend"))
    properties = bpy.ops.export_scene.gltf.get_rna_type().properties
    arguments = (
        "export_animations",
        "export_animation_mode",
        "export_force_sampling",
        "export_frame_step",
        "export_morph",
        "export_morph_animation",
        "export_optimize_animation_size",
        "export_anim_slide_to_zero",
        "export_def_bones",
        "export_image_format",
        "export_vertex_color",
    )
    materials = {
        material.name: {
            key: material.get(key) for key in ("texture_family", "tint", "solid_color", "gloss")
        }
        for material in bpy.data.materials
        if material.get("texture_family") or material.get("solid_color")
    }
    report = {
        "blender": bpy.app.version_string,
        "defaults": {name: properties[name].default for name in arguments},
        "images": [
            {"name": image.name, "packed": bool(image.packed_file)} for image in bpy.data.images
        ],
        "materials": materials,
        "parts": len(
            [
                obj
                for obj in bpy.context.scene.objects
                if obj.type == "MESH" and obj.get("base_part")
            ]
        ),
    }
    out = ROOT.parent / "ai_tmp/model-inspection.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, default=list) + "\n")
    print(out.read_text())


if __name__ == "__main__":
    main()
