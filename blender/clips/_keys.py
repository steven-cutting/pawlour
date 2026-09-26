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


def paw_target(rig, limb, side, frame, offset):
    """Translate a target from rest in model XYZ (+Z up, -Y forward)."""
    frame = at(frame)
    target = rig.pose.bones[f"CTRL.{limb}.paw.{side}"]
    target.location = target.bone.matrix_local.to_3x3().inverted() @ Vector(offset)
    target.keyframe_insert("location", frame=frame, group=target.name)


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


def finish(rig, name, start):
    action = rig.animation_data.action
    ease(curves(action))
    return strip(rig, action, name, start)


def endpoints(rig, start, frames, front_ik=False, all_ik=False):
    for frame in (start, start + frames):
        key_all(rig, frame)
        ik_off(rig, frame)
        for limb, side in PAWS:
            if all_ik or (front_ik and limb == "front"):
                ik_on(rig, limb, side, frame)
                paw_target(rig, limb, side, frame, (0, 0, 0))
