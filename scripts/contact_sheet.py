"""Render Blender animation evidence and encode the eighteen fallback stills.

The command runs under the project's Pillow environment. Its Blender subprocess
renders PNG images and writes metadata; Pillow then assembles sheets or encodes WebP.
The camera and sheet styling follow the approved model's render.py/proof_sheet.py.
"""

import argparse
import importlib.util
import json
import math
import os
import subprocess
import sys
from pathlib import Path

if importlib.util.find_spec("bpy") is not None:
    import bpy
    from mathutils import Vector
else:
    from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "ai_tmp/clips"
CLIPS = ("idle.stand", "idle.sit", "walk", "sit", "lie", "sleep", "drink", "eat", "play", "pet")
LOOPS = frozenset(CLIPS) - {"sit", "lie", "pet"}
STILLS = {
    "idle": ("idle.stand", 0),
    "sleep.bed": ("sleep", 0),
    "sleep.chair": ("sleep", 0),
    "drink": ("drink", 30),
    "eat": ("eat", 30),
    "play": ("play", 40),
}
PHASES = {"morning": ("#f2dcc0", 1.45), "evening": ("#b8623a", 0.9), "night": ("#1a1220", 0.5)}
BACKGROUND = "#f4ede2"
INK = "#49382c"
MUTED = "#8a705b"


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("clip", nargs="?", choices=CLIPS)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--still", nargs=2, metavar=("ACTIVITY", "PHASE"))
    modes.add_argument("--all-clips", action="store_true")
    modes.add_argument("--all-stills", action="store_true")
    modes.add_argument("--verify-only", action="store_true")
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    if args.clip and (args.still or args.all_clips or args.all_stills or args.verify_only):
        parser.error("Choose one clip or one mode")
    if not (args.clip or args.still or args.all_clips or args.all_stills or args.verify_only):
        parser.error("Choose a clip or a rendering mode")
    if args.still and (args.still[0] not in STILLS or args.still[1] not in PHASES):
        parser.error("Unknown activity or phase")
    return args, argv


def activate(rig, name):
    for track in rig.animation_data.nla_tracks:
        track.is_solo = False
        track.mute = track.name != name
    matches = [track for track in rig.animation_data.nla_tracks if track.name == name]
    if len(matches) != 1:
        raise ValueError(f"Expected one NLA track named {name}")
    return matches[0].strips[0]


def frame_set(scene, frame):
    whole = math.floor(frame)
    scene.frame_set(whole, subframe=frame - whole)


def evaluated_points(scene):
    graph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in scene.objects:
        if obj.type != "MESH" or not obj.get("base_part"):
            continue
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        points.extend(evaluated.matrix_world @ vertex.co for vertex in mesh.vertices)
        evaluated.to_mesh_clear()
    if not points:
        raise ValueError("No approved character meshes found")
    return points


def loop_difference(scene, rig, clip):
    states = []
    for frame in (clip.frame_start, clip.frame_end):
        frame_set(scene, frame)
        evaluated = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
        states.append(
            [
                component
                for bone in evaluated.pose.bones
                if bone.bone.use_deform
                for row in bone.matrix
                for component in row
            ]
        )
    return max(abs(first - last) for first, last in zip(*states, strict=True))


def contact_drift(scene, rig, clip, name):
    """Check complete planted soles, including runtime travel during a walk."""
    sys.path[:0] = [str(ROOT / "blender/clips"), str(ROOT / "blender/src")]
    walk = importlib.import_module("walk")
    intervals = clip.frame_end - clip.frame_start
    seconds = intervals / scene.render.fps
    speed = walk.STRIDE / seconds
    drifts = {}
    for limb, side, phase in walk.PHASES:
        spans = [(0, 1)]
        if name == "walk":
            spans = [(phase, phase + walk.STANCE)]
        elif name in {"sit", "lie"}:
            takeoff, landing = importlib.import_module(name).STEPS[limb, side]
            spans = [(0, takeoff), (landing, 1)]
        elif name == "play" and (limb, side) == ("front", "L"):
            spans = [(0, 55 / 90), (84 / 90, 1)]
        bone = rig.data.bones[f"{limb}.paw.{side}"]
        inverse = bone.matrix_local.inverted()
        # Paw/claw meshes are rigidly weighted to this bone. Four coplanar sole
        # markers catch the toe/heel sliding that a pinned ankle alone misses.
        probes = [
            inverse @ Vector((bone.head_local.x + x, bone.head_local.y + y, 0))
            for x, y in ((0, 0.05), (0, -0.25), (0.13, -0.1), (-0.13, -0.1))
        ]
        maximum = 0
        for first, last in spans:
            points = []
            for sample in range(101):
                cycle = first + (last - first) * sample / 100
                position = cycle % 1 if name == "walk" else cycle
                frame_set(scene, clip.frame_start + position * intervals)
                evaluated = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
                matrix = evaluated.pose.bones[bone.name].matrix
                travel = Vector((0, -speed * cycle * seconds, 0)) if name == "walk" else Vector()
                points.append([matrix @ probe + travel for probe in probes])
            drift = max(
                max(row[index][axis] for row in points) - min(row[index][axis] for row in points)
                for index in range(4)
                for axis in range(3)
            )
            ground_error = max(abs(point.z) for row in points for point in row)
            if drift > 1e-3 or ground_error > 1e-3:
                raise ValueError(
                    f"{name}: {limb}.{side} sole drift {drift:g}, ground error {ground_error:g}"
                )
            maximum = max(maximum, drift)
        # Moving paws may leave the floor, but must never pass through it.
        for sample in range(101):
            frame_set(scene, clip.frame_start + intervals * sample / 100)
            evaluated = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
            matrix = evaluated.pose.bones[bone.name].matrix
            if min((matrix @ probe).z for probe in probes) < -1e-3:
                raise ValueError(f"{name}: {limb}.{side} sole penetrates the floor")
        drifts[f"{limb}.{side}"] = maximum
    print(f"{name}: maximum planted-sole drift {max(drifts.values()):g}", flush=True)
    return drifts


def verify(scene, rig):
    report = {}
    for name in CLIPS:
        clip = activate(rig, name)
        channels = {}
        for layer in clip.action.layers:
            for action_strip in layer.strips:
                for bag in action_strip.channelbags:
                    for curve in bag.fcurves:
                        channels[curve.data_path] = curve
                        if any(
                            key.co.x < clip.frame_start or key.co.x > clip.frame_end
                            for key in curve.keyframe_points
                        ):
                            raise ValueError(f"{name}: key outside its strip")
                        if (
                            curve.data_path == 'pose.bones["root"].location'
                            and curve.array_index != 1
                        ):
                            raise ValueError(f"{name}: forbidden root translation channel")
                        if name == "pet":
                            moving = ("neck", "head", "tail.1", "ear.1.L", "ear.1.R")
                            allowed = {
                                f'pose.bones["{bone}"].rotation_quaternion' for bone in moving
                            }
                            values = [key.co.y for key in curve.keyframe_points]
                            if curve.data_path not in allowed and max(values) != min(values):
                                raise ValueError(f"pet: non-additive channel {curve.data_path}")
        for limb in ("front", "hind"):
            for side in ("L", "R"):
                path = f'pose.bones["CTRL.{limb}.paw.{side}"]["IK influence"]'
                if path not in channels:
                    raise ValueError(f"{name}: missing explicit IK state for {limb}.{side}")
                times = [key.co.x for key in channels[path].keyframe_points]
                if min(times) != clip.frame_start or max(times) != clip.frame_end:
                    raise ValueError(f"{name}: IK state is not keyed at both endpoints")
        difference = loop_difference(scene, rig, clip) if name in LOOPS else None
        if difference is not None and difference > 1e-6:
            raise ValueError(f"{name}: loop endpoint difference {difference}")
        report[name] = {
            "first": clip.frame_start,
            "last": clip.frame_end,
            "samples": int(clip.frame_end - clip.frame_start + 1),
            "seconds": (clip.frame_end - clip.frame_start) / scene.render.fps,
            "maximum_loop_difference": difference,
        }
        report[name]["sole_drift"] = contact_drift(scene, rig, clip, name)
        print(
            f"{name}: frames {clip.frame_start:g}..{clip.frame_end:g}, loop maximum difference {difference}",
            flush=True,
        )
    (OUTPUT / "verification.json").write_text(json.dumps(report, indent=2) + "\n")


def camera_for(scene):
    camera = bpy.data.objects.new(
        "Pawlour.Review.Camera", bpy.data.cameras.new("Pawlour.Review.Camera")
    )
    scene.collection.objects.link(camera)
    scene.camera = camera
    scene.view_layers[0].material_override = None
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    return camera


def frame_camera(camera, points, *, portrait=False):
    low = Vector([min(point[i] for point in points) for i in range(3)])
    high = Vector([max(point[i] for point in points) for i in range(3)])
    target = (low + high) / 2
    yaw, pitch = 0.85, 0.32
    direction = Vector(
        (math.sin(yaw) * math.cos(pitch), -math.cos(yaw) * math.cos(pitch), math.sin(pitch))
    )
    camera.location = target + 9 * direction
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    rotation = camera.rotation_euler.to_matrix().transposed()
    projected = [rotation @ (point - target) for point in points]
    if portrait:
        camera.data.type = "PERSP"
        camera.data.lens = 45
        camera.data.sensor_fit = "HORIZONTAL"
        width = 2 * max(abs(point.x) for point in projected) * 1.45
        distance = width / (2 * math.tan(camera.data.angle_x / 2))
        camera.location = target + direction * max(distance, 9)
        # Positive lens shift raises the view while leaving Biscuit in its lower third.
        camera.data.shift_y = 0.38
    else:
        camera.data.type = "ORTHO"
        camera.data.ortho_scale = (
            2 * max(abs(point[i]) for point in projected for i in (0, 1)) * 1.22
        )


def render_clip(scene, rig, camera, name):
    clip = activate(rig, name)
    frames = [
        clip.frame_start + (clip.frame_end - clip.frame_start) * index / 11 for index in range(12)
    ]
    points = []
    for frame in frames:
        frame_set(scene, frame)
        points.extend(evaluated_points(scene))
    frame_camera(camera, points)
    scene.render.resolution_x = scene.render.resolution_y = 500
    scene.render.film_transparent = True
    folder = OUTPUT / name
    folder.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(frames):
        frame_set(scene, frame)
        scene.render.filepath = str(folder / f"{index:02d}.png")
        bpy.ops.render.render(write_still=True)
    (folder / "frames.json").write_text(json.dumps(frames) + "\n")


def rgb(hex_color):
    values = [int(hex_color[index : index + 2], 16) / 255 for index in (1, 3, 5)]
    return tuple(
        value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in values
    )


def still_ground():
    existing = bpy.data.objects.get("Pawlour.Still.Ground")
    if existing:
        return
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.03))
    plane = bpy.context.object
    plane.name = "Pawlour.Still.Ground"
    material = bpy.data.materials.new("Pawlour.Still.Ground")
    material.diffuse_color = (*rgb("#3a2418"), 1)
    material.use_nodes = True
    material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (
        *rgb("#3a2418"),
        1,
    )
    material.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = 1
    plane.data.materials.append(material)


def render_still(scene, rig, camera, request):
    activity, phase = request
    name, offset = STILLS[activity]
    clip = activate(rig, name)
    frame_set(scene, clip.frame_start + offset)
    still_ground()
    color, strength = PHASES[phase]
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get("Background").inputs["Color"].default_value = (*rgb(color), 1)
    scene.world.color = rgb(color)
    bpy.data.lights["Key"].energy = strength
    scene.render.film_transparent = False
    scene.render.resolution_x = 1170
    scene.render.resolution_y = 2532
    frame_camera(camera, evaluated_points(scene), portrait=True)
    folder = OUTPUT / "stills"
    folder.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(folder / f"{activity}.{phase}.png")
    bpy.ops.render.render(write_still=True)


def blender_main(args):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT / "blender/out/biscuit-clips.blend"))
    scene = bpy.context.scene
    rig = bpy.data.objects["Biscuit.Rig"]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if args.verify_only or args.all_clips:
        verify(scene, rig)
    if args.verify_only:
        return
    camera = camera_for(scene)
    if args.clip or args.all_clips:
        for name in CLIPS if args.all_clips else (args.clip,):
            clip = activate(rig, name)
            if name in LOOPS:
                difference = loop_difference(scene, rig, clip)
                print(f"{name}: maximum loop difference {difference}", flush=True)
                if difference > 1e-6:
                    raise ValueError(f"{name}: loop endpoints do not match")
            render_clip(scene, rig, camera, name)
    else:
        requests = (
            [(activity, phase) for activity in STILLS for phase in PHASES]
            if args.all_stills
            else [args.still]
        )
        for activity, phase in requests:
            render_still(scene, rig, camera, (activity, phase))


def font(size, *, serif=False):
    preferred = (
        "/System/Library/Fonts/Supplemental/Georgia.ttf"
        if serif
        else "/System/Library/Fonts/Helvetica.ttc"
    )
    for candidate in (preferred, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size=size)


def assemble(name):
    sheet = Image.new("RGB", (2100, 1700), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    draw.text((45, 24), f"Biscuit / {name}", fill=INK, font=font(48, serif=True))
    draw.text(
        (47, 89), "ANIMATION REVIEW  /  TWELVE SAMPLES  /  30 FPS", fill=MUTED, font=font(22)
    )
    folder = OUTPUT / name
    frames = json.loads((folder / "frames.json").read_text())
    for index, frame in enumerate(frames):
        left = 35 + (index % 4) * 515
        top = 140 + (index // 4) * 515
        draw.rounded_rectangle(
            (left, top, left + 495, top + 500),
            radius=16,
            fill="#faf6ef",
            outline="#e1d5c4",
            width=2,
        )
        with Image.open(folder / f"{index:02d}.png") as source:
            render = source.convert("RGBA")
        render.thumbnail((475, 460), Image.Resampling.LANCZOS)
        sheet.paste(render, (left + (495 - render.width) // 2, top + 5), render)
        draw.text(
            (left + 20, top + 466),
            f"{index + 1:02d}  /  frame {frame:.2f}",
            fill=INK,
            font=font(22),
        )
    path = OUTPUT / f"{name}.jpg"
    sheet.save(path, quality=94, subsampling=0)
    print(path.relative_to(ROOT))


def encode_still(activity, phase):
    destination = ROOT / "src/lib/assets/stills" / f"{activity}.{phase}.webp"
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(OUTPUT / "stills" / f"{activity}.{phase}.png") as source:
        render = source.convert("RGB")
    for quality in range(80, -1, -5):
        render.save(destination, "WEBP", quality=quality, method=6)
        if destination.stat().st_size < 262144:
            print(
                f"{destination.relative_to(ROOT)}: {destination.stat().st_size} bytes, quality {quality}"
            )
            return
    raise ValueError(f"{destination}: cannot meet the still budget")


def main():
    args, argv = arguments()
    if importlib.util.find_spec("bpy") is not None:
        blender_main(args)
        return
    executable = os.environ.get("BLENDER", "/Applications/Blender.app/Contents/MacOS/Blender")
    subprocess.run(
        [
            executable,
            "--background",
            "--python-exit-code",
            "1",
            "--python",
            str(Path(__file__).resolve()),
            "--",
            *argv,
        ],
        cwd=ROOT,
        check=True,
    )
    if args.clip or args.all_clips:
        for name in CLIPS if args.all_clips else (args.clip,):
            assemble(name)
    elif args.still or args.all_stills:
        requests = (
            [(activity, phase) for activity in STILLS for phase in PHASES]
            if args.all_stills
            else [args.still]
        )
        for activity, phase in requests:
            encode_still(activity, phase)


if __name__ == "__main__":
    main()
