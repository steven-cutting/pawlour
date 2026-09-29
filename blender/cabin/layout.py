"""Exact P05 world positions in glTF metres; conversion happens in one helper."""

import math

import bpy
from mathutils import Vector

ITEMS = {
    "fire": ((-0.6, 0.30, -1.85), "+Z"),
    "bed": ((-0.6, 0, -1.10), "+Z"),
    "chair": ((1.7, 0, 0.20), "-X"),
    "window": ((2.5, 1.30, -0.40), "-X"),
    "table": ((1.7, 0, -0.50), "-Z"),
    "lamp": ((2.0, 0, 0.95), "-Z"),
    "lights": ((-0.85, 2.2, -1.95), "+Z"),
    "water": ((-2.15, 0, 0.60), "+X"),
    "food": ((-2.15, 0, 1.00), "+X"),
    "toy": ((0.6, 0, 0.50), "-Z"),
    "shelf": ((-2.30, 0, -0.40), "+X"),
    "jar": ((0.3, 0.45, 1.70), "-Z"),
}
APPROACHES = {
    "bed": ((-0.6, 0, -0.55), "-Z", 1),
    "chair": ((1.15, 0, 0.20), "+X", 2),
    "lamp": ((1.5, 0, 0.95), "+X", 6),
    "lights": ((-1.4, 0, -1.30), "-Z", 7),
    "water": ((-1.7, 0, 0.60), "-X", 3),
    "food": ((-1.7, 0, 1.00), "-X", 3),
    "toy": ((0.6, 0, 0.90), "-Z", 4),
    "jar": ((0.3, 0, 1.25), "+Z", 5),
}
ANCHORS = {
    "fire.anchor": ((-0.6, 0.15, -1.75), "+Z"),
    "light.fire": ((-0.6, 0.45, -1.60), "-Z"),
    "spot.bed": ((-0.6, 0.06, -1.10), "+X"),
    "spot.chair": ((1.7, 0.42, 0.20), "-X"),
    "light.window": ((2.4, 1.30, -0.40), "-Z"),
    "steam.anchor": ((1.7, 0.66, -0.50), "-Z"),
    "light.lamp": ((2.0, 1.45, 0.95), "-Z"),
}
CAMERAS = {
    "hearth": ((0.6, 1.40, 2.30), (-0.5, 0.5, -1.5), 42),
    "window": ((-0.8, 1.30, 1.60), (1.8, 0.8, -0.2), 40),
    "chair": ((0.9, 1.00, 0.90), (1.7, 0.5, 0.0), 36),
    "bowls": ((0.5, 1.10, 1.30), (-1.9, 0.4, 0.8), 40),
}
WAYPOINTS = [
    (0, 0, 0),
    (-0.6, 0, -0.5),
    (1.1, 0, 0.2),
    (-1.6, 0, 0.8),
    (0.6, 0, 0.9),
    (0.3, 0, 1.2),
    (1.5, 0, 0.95),
    (-1.4, 0, -1.2),
]
EDGES = [
    (0, 1),
    (0, 2),
    (0, 3),
    (0, 4),
    (0, 5),
    (0, 6),
    (0, 7),
    (1, 7),
    (2, 6),
    (3, 7),
    (4, 5),
    (2, 4),
]


def to_blender(position):
    x, y, z = position
    return Vector((x, -z, y))


def empty(name, position, facing="-Z", **extras):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.1
    obj.location = to_blender(position)
    obj.rotation_euler.z = {"-Z": 0, "+Z": math.pi, "+X": -math.pi / 2, "-X": math.pi / 2}[facing]
    for key, value in extras.items():
        obj[key] = value
    return obj


def build():
    items = {
        name: empty(f"item.{name}", position, facing) for name, (position, facing) in ITEMS.items()
    }
    for name, (position, facing, nav) in APPROACHES.items():
        empty(f"item.{name}.approach", position, facing, nav=f"nav.{nav}")
    for name, (position, facing) in ANCHORS.items():
        empty(name, position, facing)
    for index in range(6):
        empty(f"light.strings.{index}", (-2.3 + index * 2.9 / 5, 2.2, -1.95))
    for index, position in enumerate(WAYPOINTS):
        neighbours = sorted(b if a == index else a for a, b in EDGES if index in (a, b))
        empty(f"nav.{index}", position, edges=[f"nav.{other}" for other in neighbours])
    for name, (position, target, fov) in CAMERAS.items():
        obj = empty(f"camera.{name}", position, fov=float(fov))
        # Track in Blender space, where Z is up: an empty's local +Y exports as its
        # glTF -Z and its local +Z as glTF +Y, so the preset looks along -Z, level.
        direction = to_blender(target) - to_blender(position)
        obj.rotation_euler = direction.to_track_quat("Y", "Z").to_euler()
    bpy.context.view_layer.update()
    return items
