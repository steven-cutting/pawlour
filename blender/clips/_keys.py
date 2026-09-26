"""Small, shared helpers for animation on the approved Biscuit rig."""

import json
import math
from pathlib import Path

import bpy
import pose_io
from mathutils import Euler, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / "model/rig.json").read_text())
PAWS = (("front", "L"), ("front", "R"), ("hind", "L"), ("hind", "R"))
_base = {}
_contacts = {}
_joints = {}
_timing = [0, 1]


def at(frame):
    """Map ticket event times 0..N to the N sampled frames of an action."""
    start, frames = _timing
    return start + (frame - start) * (frames - 1) / frames


def preset(rig, name):
    """Apply a validated source pose; control locations never leak between clips."""
    document = pose_io.load(SPEC, ROOT / "poses" / f"{name}.json")
    pose_io.apply(SPEC, document)
    for bone in rig.pose.bones:
        if bone.name.startswith("CTRL."):
            bone.location = (0, 0, 0)
            bone.rotation_quaternion = (1, 0, 0, 0)
            bone.scale = (1, 1, 1)
    _base.clear()
    _base.update(document["bones"])
    _contacts.clear()
    _joints.clear()
    for limb, side in PAWS:
        paw = rig.pose.bones[f"{limb}.paw.{side}"]
        _contacts[limb, side] = Vector((paw.head.x, paw.head.y, paw.bone.head_local.z))
        first = "upper" if limb == "front" else "thigh"
        _joints[limb, side] = rig.pose.bones[f"{limb}.{first}.{side}"].head.copy()


def begin(rig, name, pose, start, frames):
    _timing[:] = (start, frames)
    rig.animation_data_create()
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    rig.animation_data.action = bpy.data.actions.new(name)
    preset(rig, pose)


def key_all(rig, frame, exclude=()):
    """Key every deform transform, with root translation restricted to vertical."""
    frame = at(frame)
    for item in SPEC["bones"]:
        name = item["name"]
        if name in exclude:
            continue
        bone = rig.pose.bones[name]
        if name == "root":
            bone.keyframe_insert("location", index=1, frame=frame, group=name)
        else:
            bone.keyframe_insert("location", frame=frame, group=name)
        bone.keyframe_insert("rotation_quaternion", frame=frame, group=name)
        bone.keyframe_insert("scale", frame=frame, group=name)


def key_bone(rig, bone, frame, rotation=None, location=None):
    """Key Euler-degree offsets from the preset, in the bone's local axes."""
    frame = at(frame)
    target = rig.pose.bones[bone]
    if rotation is not None:
        target.rotation_mode = "QUATERNION"
        delta = Euler(tuple(math.radians(value) for value in rotation), "XYZ").to_quaternion()
        target.rotation_quaternion = Quaternion(_base[bone]["rotation"]) @ delta
        target.keyframe_insert("rotation_quaternion", frame=frame, group=bone)
    if location is not None:
        target.location = Vector(_base[bone]["location"]) + Vector(location)
        if bone == "root":
            if location[0] or location[2]:
                raise ValueError("Root may only move vertically on local Y")
            target.keyframe_insert("location", index=1, frame=frame, group=bone)
        else:
            target.keyframe_insert("location", frame=frame, group=bone)


def ik_on(rig, limb, side, frame):
    frame = at(frame)
    target = rig.pose.bones[f"CTRL.{limb}.paw.{side}"]
    target["IK influence"] = 1.0
    target.keyframe_insert('["IK influence"]', frame=frame, group=target.name)
    # The approved bones use +Y roll. Their native forward poles produce a
    # quarter-turn axial twist; a lateral pole preserves the bend plane.
    joint = _joints[limb, side]
    pole = rig.pose.bones[f"CTRL.{limb}.bend.{side}"]
    goal = joint.lerp(_contacts[limb, side], 0.5) + Vector((1, 0, 0))
    goal.z -= _base["root"]["location"][1]
    pole.location = pole.bone.matrix_local.to_3x3().inverted() @ (goal - pole.bone.head_local)
    pole.keyframe_insert("location", frame=frame, group=pole.name)


def ik_off(rig, frame, limb=None, side=None):
    frame = at(frame)
    for paw_limb, paw_side in PAWS:
        if limb is not None and limb != paw_limb:
            continue
        if side is not None and side != paw_side:
            continue
        target = rig.pose.bones[f"CTRL.{paw_limb}.paw.{paw_side}"]
        target["IK influence"] = 0.0
        target.keyframe_insert('["IK influence"]', frame=frame, group=target.name)
        pole = rig.pose.bones[f"CTRL.{paw_limb}.bend.{paw_side}"]
        pole.location = (0, 0, 0)
        pole.keyframe_insert("location", frame=frame, group=pole.name)


def paw_target(rig, limb, side, frame, offset):
    """Translate a target from rest in model XYZ (+Z up, -Y forward)."""
    frame = at(frame)
    target = rig.pose.bones[f"CTRL.{limb}.paw.{side}"]
    target.location = target.bone.matrix_local.to_3x3().inverted() @ Vector(offset)
    target.keyframe_insert("location", frame=frame, group=target.name)


def footprints():
    """Grounded footprints shared by a reference pose and its transitions."""
    return {paw: point.copy() for paw, point in _contacts.items()}


def plant_all(rig, frame):
    for limb, side in PAWS:
        ik_on(rig, limb, side, frame)
        pose_paw(rig, limb, side, frame)


def pose_paw(rig, limb, side, frame):
    rest = rig.data.bones[f"{limb}.paw.{side}"].head_local
    root = Vector((0, 0, _base["root"]["location"][1]))
    paw_target(rig, limb, side, frame, _contacts[limb, side] - rest - root)


def curves(action):
    """Blender 5 stores curves in the action's slot/channel bag."""
    for layer in action.layers:
        for action_strip in layer.strips:
            for bag in action_strip.channelbags:
                yield from bag.fcurves


def ease(fcurves):
    for curve in fcurves:
        for key in curve.keyframe_points:
            key.interpolation = "BEZIER"
            key.handle_left_type = "AUTO_CLAMPED"
            key.handle_right_type = "AUTO_CLAMPED"


def strip(rig, action, name, start):
    slot = rig.animation_data.action_slot
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    clip = track.strips.new(name, start, action)
    clip.action_slot = slot
    clip.extrapolation = "NOTHING"
    clip.blend_type = "REPLACE"
    rig.animation_data.action = None
    for previous in rig.animation_data.nla_tracks:
        previous.mute = False
    return int(clip.frame_end) + 1


def finish(rig, name, start, *, linear_paths=(), footsteps=None):
    action = rig.animation_data.action
    ease(curves(action))
    for curve in curves(action):
        if curve.data_path in linear_paths:
            for key in curve.keyframe_points:
                key.interpolation = "LINEAR"
    if footsteps is not None:
        step_paws(rig, action, *footsteps)
    flat_paws(rig, action)
    return strip(rig, action, name, start)


def step_paws(rig, action, first_points, last_points, intervals):
    """Lift each repositioning paw instead of dragging it through the floor."""
    first, last = action.frame_range
    times = {first + sample / 4 for sample in range(round((last - first) * 4) + 1)}
    times.update(first + phase * (last - first) for span in intervals.values() for phase in span)
    for frame in sorted(times):
        bpy.context.scene.frame_set(math.floor(frame), subframe=frame % 1)
        root = rig.pose.bones["root"].matrix.translation.copy()
        cycle = (frame - first) / (last - first)
        for limb, side in PAWS:
            takeoff, landing = intervals[limb, side]
            progress = min(1, max(0, (cycle - takeoff) / (landing - takeoff)))
            eased = progress * progress * (3 - 2 * progress)
            point = first_points[limb, side].lerp(last_points[limb, side], eased)
            point.z += 0.13 * math.sin(math.pi * progress)
            target = rig.pose.bones[f"CTRL.{limb}.paw.{side}"]
            target.location = target.bone.matrix_local.to_3x3().inverted() @ (
                point - target.bone.head_local - root
            )
            target.keyframe_insert("location", frame=frame, group=target.name)
    for curve in curves(action):
        if curve.data_path.startswith('pose.bones["CTRL.') and curve.data_path.endswith(
            ".location"
        ):
            for key in curve.keyframe_points:
                key.interpolation = "LINEAR"


def flat_paws(rig, action):
    """Bake world-level paws: native IK solves the ankle, not the sole angle."""
    paws = [
        rig.pose.bones[f"{limb}.paw.{side}"]
        for limb, side in PAWS
        if rig.pose.bones[f"CTRL.{limb}.paw.{side}"]["IK influence"] == 1
    ]
    if not paws:
        return
    scene = bpy.context.scene
    first, last = action.frame_range
    previous = {}
    # Quarter-frame samples also keep subframe contact-sheet views level.
    times = {first + sample / 4 for sample in range(round((last - first) * 4) + 1)}
    times.update(key.co.x for curve in curves(action) for key in curve.keyframe_points)
    for frame in sorted(times):
        scene.frame_set(math.floor(frame), subframe=frame % 1)
        evaluated = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
        rotations = {}
        for paw in paws:
            parent = evaluated.pose.bones[paw.parent.name]
            rest = paw.parent.bone.matrix_local.inverted() @ paw.bone.matrix_local
            rotation = (
                rest.to_quaternion().inverted()
                @ parent.matrix.to_quaternion().inverted()
                @ paw.bone.matrix_local.to_quaternion()
            )
            if paw.name in previous:
                rotation.make_compatible(previous[paw.name])
            rotations[paw.name] = rotation
        for paw in paws:
            paw.rotation_quaternion = rotations[paw.name]
            paw.keyframe_insert("rotation_quaternion", frame=frame, group=paw.name)
        previous = rotations
    paths = {f'pose.bones["{paw.name}"].rotation_quaternion' for paw in paws}
    for curve in curves(action):
        if curve.data_path in paths:
            for key in curve.keyframe_points:
                key.interpolation = "LINEAR"


def endpoints(rig, start, frames, front_ik=False, all_ik=False):
    for frame in (start, start + frames):
        key_all(rig, frame)
        ik_off(rig, frame)
        for limb, side in PAWS:
            if all_ik or (front_ik and limb == "front"):
                ik_on(rig, limb, side, frame)
                pose_paw(rig, limb, side, frame)
