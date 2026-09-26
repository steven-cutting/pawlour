"""Build, render and export the cabin in a fresh local Blender scene."""

import importlib
import math
import subprocess
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
layout = importlib.import_module("blender.cabin.layout")
palette = importlib.import_module("blender.cabin.palette")
props = importlib.import_module("blender.cabin.props")


def review_lighting():
    scene = bpy.context.scene
    # Eevee uses a graphics context even in background mode. The production
    # review defaults to Eevee as specified; CPU Cycles is an explicit escape
    # hatch for machines whose headless graphics context cannot initialise.
    scene.render.engine = "CYCLES" if "--cycles" in sys.argv else "BLENDER_EEVEE"
    scene.cycles.samples = 24
    scene.render.resolution_x = 1170
    scene.render.resolution_y = 2532
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    world = bpy.data.worlds.new("Review hemisphere")
    world.use_nodes = True
    world.node_tree.nodes.get("Background").inputs[0].default_value = (0.56, 0.42, 0.30, 1)
    world.node_tree.nodes.get("Background").inputs[1].default_value = 0.65
    scene.world = world
    sun_data = bpy.data.lights.new("Review window sun", "SUN")
    sun_data.energy = 2.0
    sun_data.angle = math.radians(8)
    sun_data.use_shadow = False
    sun = bpy.data.objects.new("Review window sun", sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = layout.to_blender((-1, -0.7, -0.2)).to_track_quat("-Z", "Y").to_euler()
    # A broad, warm bounce gives Eevee the world-light fill it does not sample
    # from the world shader; this light exists only for review and is not exported.
    fill_data = bpy.data.lights.new("Review hemisphere bounce", "AREA")
    fill_data.energy = 110
    fill_data.shape = "DISK"
    fill_data.size = 4
    fill_data.use_shadow = False
    fill = bpy.data.objects.new("Review hemisphere bounce", fill_data)
    scene.collection.objects.link(fill)
    fill.location = layout.to_blender((0.3, 2.25, 0.3))
    return scene


def render_reviews():
    scene = review_lighting()
    folder = ROOT / "ai_tmp/cabin"
    folder.mkdir(parents=True, exist_ok=True)
    for name, (position, target, fov) in layout.CAMERAS.items():
        data = bpy.data.cameras.new(f"Review {name}")
        data.sensor_fit = "VERTICAL"
        data.lens = data.sensor_height / (2 * math.tan(math.radians(fov) / 2))
        data.clip_start = 0.025
        data.clip_end = 100
        camera = bpy.data.objects.new(f"Review {name}", data)
        scene.collection.objects.link(camera)
        camera.location = layout.to_blender(position)
        direction = layout.to_blender(target) - camera.location
        camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.camera = camera
        scene.render.filepath = str(folder / f"{name}.png")
        bpy.ops.render.render(write_still=True)
    # An additional landscape overview makes set dressing outside the three
    # tightly cropped portrait presets reviewable. It is not a runtime preset.
    data = bpy.data.cameras.new("Review overview")
    data.sensor_fit = "HORIZONTAL"
    data.angle = math.radians(78)
    camera = bpy.data.objects.new("Review overview", data)
    scene.collection.objects.link(camera)
    camera.location = layout.to_blender((0.7, 2.25, 3.8))
    direction = layout.to_blender((0, 0.65, -0.2)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.filepath = str(folder / "overview.png")
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    subprocess.run(
        ["uv", "run", "--frozen", "python", str(Path(__file__).parent / "textures.py")],
        cwd=ROOT,
        check=True,
    )
    items = layout.build()
    props.build(palette.create(), items)
    render_reviews()
    out = ROOT / "blender/out/cabin-raw.glb"
    out.parent.mkdir(parents=True, exist_ok=True)
    properties = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    if "export_vertex_color" not in properties:
        raise RuntimeError("This Blender exporter has no export_vertex_color switch")
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        export_extras=True,
        export_yup=True,
        export_apply=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_skins=False,
        export_morph=False,
        export_vertex_color="ACTIVE",
        export_image_format="AUTO",
    )
    print(f"Cabin exported to {out}; export_vertex_color=ACTIVE")


if __name__ == "__main__":
    main()
