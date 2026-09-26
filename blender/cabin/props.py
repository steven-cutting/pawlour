"""Original low-poly room geometry, built from primitives and lathed profiles.

Like biscuit_pics@1d9d358 models/biscuit/src/rig.py, geometry is named and
tagged as it is made; there is no dependency on that repository's build chain.
"""

import math

import bpy
from blender.cabin import layout, palette
from mathutils import Matrix


class Workshop:
    def __init__(self, materials, items):
        self.materials = materials
        self.items = items
        self.parts = []

    def finish(self, obj, name, surface, options):
        item = options.get("item")
        obj.name = f"{item}.{name}" if item else f"room.{name}"
        obj["base_part"] = obj.name
        obj["cabin_item"] = item or "room"
        obj.data.materials.append(self.materials[surface])
        bpy.context.view_layer.update()
        palette.paint(obj, options.get("colour", surface), options.get("value", 1.0))
        self.parts.append(obj)
        return obj

    def box(self, name, position, size, surface, **options):
        bpy.ops.mesh.primitive_cube_add(size=1, location=layout.to_blender(position))
        obj = bpy.context.object
        obj.scale = (size[0], size[2], size[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel := options.get("bevel", 0):
            modifier = obj.modifiers.new("Cut edges", "BEVEL")
            modifier.width = bevel
            modifier.segments = options.get("rounding", 2)
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.rotation_euler.z = options.get("angle", 0)
        return self.finish(obj, name, surface, options)

    def cylinder(self, name, a, b, radius, surface, **options):
        start, end = layout.to_blender(a), layout.to_blender(b)
        bpy.ops.mesh.primitive_cone_add(
            vertices=options.get("vertices", 12),
            radius1=radius,
            radius2=options.get("radius_top", radius),
            depth=(end - start).length,
            location=(start + end) / 2,
        )
        obj = bpy.context.object
        obj.rotation_euler = (end - start).to_track_quat("Z", "Y").to_euler()
        return self.finish(obj, name, surface, options)

    def lathe(self, name, position, profile, surface, **options):
        segments = options.get("segments", 24)
        vertices = []
        faces = []
        for radius, height in profile:
            vertices.extend(
                (
                    radius * math.cos(i * math.tau / segments),
                    radius * math.sin(i * math.tau / segments),
                    height,
                )
                for i in range(segments)
            )
        for ring in range(len(profile) - 1):
            for index in range(segments):
                following = (index + 1) % segments
                faces.append(
                    (
                        ring * segments + index,
                        ring * segments + following,
                        (ring + 1) * segments + following,
                        (ring + 1) * segments + index,
                    )
                )
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        obj.location = layout.to_blender(position)
        return self.finish(obj, name, surface, options)

    def ring(self, name, position, radii, scale, surface, **options):
        bpy.ops.mesh.primitive_torus_add(
            major_segments=32,
            minor_segments=10,
            location=layout.to_blender(position),
            major_radius=radii[0],
            minor_radius=radii[1],
        )
        obj = bpy.context.object
        obj.scale = (scale[0], scale[2], scale[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if options.get("soft", False):
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
        return self.finish(obj, name, surface, options)

    def drape(self, name, centre, width, profile, **options):
        """A folded cloth surface; the profile follows height along room depth."""
        columns = 24
        vertices = []
        for row, (depth, height) in enumerate(profile):
            for column in range(columns + 1):
                across = column / columns
                ripple = math.sin(across * math.tau * 3 + row * 0.26) * 0.008
                vertices.append(
                    layout.to_blender((centre + (across - 0.5) * width, height + ripple, depth))
                )
        faces = [
            (
                row * (columns + 1) + column,
                (row + 1) * (columns + 1) + column,
                (row + 1) * (columns + 1) + column + 1,
                row * (columns + 1) + column + 1,
            )
            for row in range(len(profile) - 1)
            for column in range(columns)
        ]
        if profile[-1][0] < profile[0][0]:
            faces = [tuple(reversed(face)) for face in faces]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        self.finish(obj, name, options.pop("surface"), options)
        colours = mesh.color_attributes.active_color
        for polygon in mesh.polygons:
            column = polygon.index % columns
            if column in (2, 3, 20, 21):
                for loop in polygon.loop_indices:
                    colours.data[loop].color = palette.linear("paper", 0.84)
            polygon.use_smooth = True
        return obj

    def combine(self):
        """One primitive per item/material, while retaining every hit-test root."""
        groups = {}
        for obj in self.parts:
            # Each pane's origin and facing are part of the public contract.
            if obj.name.startswith("glass.window"):
                groups[("window", obj.name)] = [obj]
                continue
            groups.setdefault((obj["cabin_item"], obj.data.materials[0].name), []).append(obj)
        for (item, material), objects in groups.items():
            bpy.ops.object.select_all(action="DESELECT")
            for obj in objects:
                obj.select_set(True)
            active = objects[0]
            bpy.context.view_layer.objects.active = active
            if len(objects) > 1:
                bpy.ops.object.join()
            if not active.name.startswith("glass.window"):
                prefix = "room" if item == "room" else f"item.{item}"
                active.name = f"{prefix}.{material.removeprefix('cabin.')}"
            if item != "room":
                world = active.matrix_world.copy()
                active.parent = self.items[item]
                active.matrix_world = world
            active.data.name = active.name
        bpy.context.view_layer.update()


def wall_spans(height, opening, bounds):
    centre, elevation = opening
    if height + 0.11 <= elevation - 0.45 or height - 0.11 >= elevation + 0.45:
        return [bounds]
    return [(bounds[0], centre - 0.56), (centre + 0.56, bounds[1])]


def architecture(w):
    for course in range(12):
        height = 0.09 + course * 0.2
        value = 1.04 if course % 2 else 0.96
        for index, (start, end) in enumerate(wall_spans(height, (1.35, 1.45), (-2.62, 2.62))):
            w.cylinder(
                f"log.hearth.{course}.{index}",
                (start, height, -2),
                (end, height, -2),
                0.11,
                "log",
                value=value,
            )
        for index, (start, end) in enumerate(wall_spans(height, (-0.40, 1.50), (-2.12, 2.10))):
            w.cylinder(
                f"log.left.{course}.{index}",
                (-2.5, height, start),
                (-2.5, height, end),
                0.11,
                "log",
                value=value * 0.86,
            )
        for index, (start, end) in enumerate(wall_spans(height, (-0.40, 1.30), (-2.12, 2.10))):
            w.cylinder(
                f"log.window.{course}.{index}",
                (2.5, height, start),
                (2.5, height, end),
                0.11,
                "log",
                value=value * 1.03,
            )
    for plank in range(18):
        x = -2.5 + (plank + 0.5) * 5 / 18
        w.box(
            f"plank.{plank}",
            (x, -0.035, 0),
            (5 / 18 - 0.012, 0.07, 4),
            "plank",
            value=0.97 if plank % 2 else 1.03,
            bevel=0.003,
        )
    w.box("top.edge", (0, 2.405, 0), (5, 0.01, 4), "log", colour="dark")


def rug(w):
    obj = w.box("rug", (0, 0.005, -0.3), (2.2, 0.01, 1.6), "rug", colour="ffffff")
    uv = obj.data.uv_layers.active
    for polygon in obj.data.polygons:
        for index in polygon.loop_indices:
            vertex = obj.data.vertices[obj.data.loops[index].vertex_index].co
            uv.data[index].uv = (vertex.x / 2.2 + 0.5, vertex.y / 1.6 + 0.5)
    for end in (-1, 1):
        for index in range(26):
            x = -1.02 + index * 2.04 / 25
            depth = -0.3 + end * 0.79
            w.cylinder(
                f"rug.fringe.{end}.{index}",
                (x, 0.012, depth),
                (x + 0.006 * math.sin(index), 0.009, depth + end * 0.065),
                0.0035,
                "plank",
                colour="cloth",
                vertices=6,
            )


def fireplace(w):
    item = "fire"
    w.box("interior", (-0.6, 0.52, -1.865), (0.83, 0.90, 0.025), "stone", item=item, colour="dark")
    w.box("hearth", (-0.6, 0.06, -1.73), (1.38, 0.12, 0.50), "stone", item=item, bevel=0.026)
    for side in (-1, 1):
        for level in range(4):
            w.box(
                f"stone.{side}.{level}",
                (
                    -0.6 + side * 0.53 + math.sin(level * 2 + side) * 0.008,
                    0.24 + level * 0.20,
                    -1.79,
                ),
                (0.25 + 0.012 * (level % 2), 0.193, 0.34),
                "stone",
                item=item,
                value=0.88 + ((level + side) % 3) * 0.085,
                bevel=0.024,
            )
    w.box("lintel", (-0.6, 1.02, -1.79), (1.26, 0.24, 0.37), "stone", item=item, bevel=0.022)
    w.box(
        "mantel",
        (-0.6, 1.18, -1.79),
        (1.50, 0.11, 0.51),
        "stone",
        item=item,
        colour="log",
        bevel=0.016,
    )
    for index in range(5):
        x = -0.90 + index * 0.15
        w.cylinder(
            f"grate.{index}",
            (x, 0.15, -1.51),
            (x, 0.42, -1.55),
            0.015,
            "metal",
            item=item,
            vertices=8,
        )
    w.cylinder(
        "grate.rail", (-1, 0.28, -1.53), (-0.2, 0.28, -1.53), 0.018, "metal", item=item, vertices=8
    )
    for index in range(3):
        x = -0.6 + (index - 1) * 0.065
        height = 0.15 + (index % 2) * 0.085
        w.cylinder(
            f"firewood.{index}",
            (x - 0.28, height, -1.72 + index * 0.025),
            (x + 0.28, height, -1.66 - index * 0.025),
            0.055,
            "stone",
            item=item,
            colour="log",
            value=0.74 + index * 0.12,
            vertices=10,
        )
    mantel_dressing(w)


def mantel_dressing(w):
    # Books, a little framed landscape and unlit candles make this a used home.
    for index in range(3):
        w.box(
            f"mantel.book.{index}",
            (-1.09 + index * 0.014, 1.25 + index * 0.038, -1.77),
            (0.27 - index * 0.025, 0.033, 0.19),
            "stone",
            item="fire",
            colour=("cloth", "paper", "leather")[index],
            bevel=0.004,
            angle=(index - 1) * 0.07,
        )
    w.box(
        "frame",
        (-0.63, 1.42, -1.81),
        (0.29, 0.36, 0.035),
        "stone",
        item="fire",
        colour="leather",
        bevel=0.007,
    )
    w.box(
        "frame.paper",
        (-0.63, 1.42, -1.786),
        (0.245, 0.31, 0.008),
        "stone",
        item="fire",
        colour="paper",
    )
    w.box(
        "frame.land",
        (-0.63, 1.365, -1.780),
        (0.215, 0.115, 0.004),
        "stone",
        item="fire",
        colour="cloth",
    )
    w.cylinder(
        "frame.sun",
        (-0.68, 1.475, -1.777),
        (-0.68, 1.475, -1.775),
        0.036,
        "stone",
        item="fire",
        colour="rug",
        vertices=16,
    )
    for index, height in enumerate((0.16, 0.105)):
        x = -0.16 + index * 0.105
        w.cylinder(
            f"candle.{index}",
            (x, 1.24, -1.78),
            (x, 1.24 + height, -1.78),
            0.039,
            "stone",
            item="fire",
            colour="ceramic",
            vertices=16,
        )
        w.cylinder(
            f"wick.{index}",
            (x, 1.24 + height, -1.78),
            (x, 1.25 + height, -1.78),
            0.004,
            "stone",
            item="fire",
            colour="dark",
            vertices=6,
        )


def bed(w):
    w.ring(
        "bolster",
        (-0.6, 0.095, -1.10),
        (0.30, 0.105),
        (1.30, 0.78, 0.95),
        "cloth",
        item="bed",
        soft=True,
    )
    w.lathe(
        "cushion",
        (-0.6, 0.045, -1.10),
        [(0, 0), (0.29, 0), (0.32, 0.025), (0.27, 0.045), (0, 0.045)],
        "cloth",
        item="bed",
        colour="ceramic",
    )
    w.ring(
        "piping",
        (-0.6, 0.105, -1.10),
        (0.401, 0.009),
        (1.27, 0.80, 0.95),
        "cloth",
        item="bed",
        colour="paper",
        soft=True,
    )
    w.drape(
        "blanket",
        -0.60,
        0.29,
        [
            (-1.10, 0.126),
            (-1.00, 0.135),
            (-0.92, 0.16),
            (-0.87, 0.192),
            (-0.81, 0.214),
            (-0.76, 0.19),
            (-0.72, 0.145),
            (-0.69, 0.09),
            (-0.67, 0.038),
        ],
        surface="cloth",
        item="bed",
        colour="leather",
        value=1.18,
    )


def chair(w):
    # Facing -X; the seat's top is exactly spot.chair's 0.42 metres.
    for x in (1.44, 1.98):
        for z in (-0.09, 0.49):
            w.box(
                f"foot.{x}.{z}",
                (x, 0.12, z),
                (0.09, 0.24, 0.09),
                "leather",
                item="chair",
                colour="log",
                bevel=0.008,
            )
    w.box("base", (1.73, 0.28, 0.20), (0.75, 0.22, 0.83), "leather", item="chair", bevel=0.055)
    w.box(
        "seat",
        (1.66, 0.38, 0.20),
        (0.63, 0.08, 0.61),
        "leather",
        item="chair",
        value=1.15,
        bevel=0.035,
        rounding=4,
    )
    w.box(
        "back",
        (2.045, 0.67, 0.20),
        (0.20, 0.84, 0.85),
        "leather",
        item="chair",
        bevel=0.075,
        rounding=4,
    )
    w.box(
        "back.cushion",
        (1.923, 0.75, 0.20),
        (0.07, 0.47, 0.62),
        "leather",
        item="chair",
        value=1.10,
        bevel=0.035,
        rounding=4,
    )
    for z in (-0.205, 0.605):
        w.box(
            f"arm.{z}",
            (1.74, 0.54, z),
            (0.81, 0.27, 0.19),
            "leather",
            item="chair",
            bevel=0.085,
            rounding=4,
        )
    cushion = w.box(
        "loose.cushion",
        (1.835, 0.60, 0.08),
        (0.17, 0.35, 0.36),
        "leather",
        item="chair",
        colour="cloth",
        bevel=0.075,
        rounding=5,
    )
    lean = math.radians(8)
    cushion.rotation_euler.y = lean
    bpy.context.view_layer.update()
    # Settle the rounded, tilted surface slightly into the seat's 0.42 top.
    bottom = min((cushion.matrix_world @ vertex.co).z for vertex in cushion.data.vertices)
    cushion.location.z += 0.417 - bottom
    button_x = 1.835 - 0.089 * math.cos(lean) + 0.015 * math.sin(lean)
    button_y = cushion.location.z + 0.089 * math.sin(lean) + 0.015 * math.cos(lean)
    for z in (0.015, 0.145):
        w.cylinder(
            f"cushion.button.{z}",
            (button_x, button_y, z),
            (button_x + 0.005 * math.cos(lean), button_y - 0.005 * math.sin(lean), z),
            0.014,
            "leather",
            item="chair",
            colour="leather",
            vertices=12,
        )
    w.drape(
        "throw",
        1.65,
        0.37,
        [
            (-0.02, 0.465),
            (-0.07, 0.54),
            (-0.11, 0.625),
            (-0.15, 0.681),
            (-0.20, 0.69),
            (-0.25, 0.677),
            (-0.30, 0.64),
            (-0.325, 0.55),
            (-0.337, 0.43),
            (-0.35, 0.32),
            (-0.36, 0.255),
        ],
        surface="leather",
        item="chair",
        colour="cloth",
        value=1.12,
    )
    for index in range(12):
        x = 1.49 + index * 0.029
        w.cylinder(
            f"throw.fringe.{index}",
            (x, 0.258, -0.36),
            (x + 0.005, 0.205 + 0.006 * (index % 3), -0.37),
            0.004,
            "leather",
            item="chair",
            colour="paper",
            vertices=6,
        )


def window(w):
    origin = layout.to_blender((2.5, 1.30, -0.40))
    for name, centre, angle in (
        ("glass.window", (2.5, 1.30, -0.40), 0),
        ("glass.window.left", (-2.5, 1.50, -0.40), math.pi),
        ("glass.window.hearth", (1.35, 1.45, -2.0), math.pi / 2),
    ):
        first = len(w.parts)
        window_unit(w)
        transform = (
            Matrix.Translation(layout.to_blender(centre))
            @ Matrix.Rotation(angle, 4, "Z")
            @ Matrix.Translation(-origin)
        )
        for obj in w.parts[first:]:
            obj.matrix_world = transform @ obj.matrix_world
            if obj.get("depth") is not None:
                obj.name = name
            else:
                obj.name = f"{name.removeprefix('glass.')}.{obj.name.removeprefix('window.')}"


def window_unit(w):
    # Deep jambs cover the cut log ends even when a window is seen obliquely.
    for y in (0.80, 1.80):
        w.box(
            f"frame.{y}",
            (2.53, y, -0.40),
            (0.34, 0.10, 1.20),
            "log",
            item="window",
            value=1.20,
            bevel=0.008,
        )
    for z in (-0.95, 0.15):
        w.box(
            f"frame.{z}",
            (2.53, 1.30, z),
            (0.34, 1.10, 0.10),
            "log",
            item="window",
            value=1.20,
            bevel=0.008,
        )
    w.box(
        "sill",
        (2.32, 0.765, -0.40),
        (0.44, 0.08, 1.30),
        "log",
        item="window",
        value=1.24,
        bevel=0.009,
    )
    for name, position, size in (
        ("cross.vertical", (2.40, 1.30, -0.40), (0.065, 0.90, 0.035)),
        ("cross.horizontal", (2.40, 1.30, -0.40), (0.065, 0.035, 1.0)),
    ):
        w.box(name, position, size, "log", item="window", value=1.10)
    mesh = bpy.data.meshes.new("Window pane")
    mesh.from_pydata(
        [(0, -0.5, -0.45), (0, 0.5, -0.45), (0, 0.5, 0.45), (0, -0.5, 0.45)], [], [(3, 2, 1, 0)]
    )
    mesh.update()
    pane = bpy.data.objects.new("Window pane", mesh)
    bpy.context.collection.objects.link(pane)
    pane.location = layout.to_blender((2.49, 1.30, -0.40))
    w.finish(pane, "pane", "glass", {"item": "window"})
    pane.name = "glass.window"
    pane["depth"] = 1.5
    curtains(w)


def curtains(w):
    w.cylinder(
        "curtain.rod",
        (2.31, 1.94, -1.22),
        (2.31, 1.94, 0.42),
        0.012,
        "log",
        item="window",
        colour="metal",
        vertices=10,
    )
    for side, centre in ((-1, -1.025), (1, 0.225)):
        vertices = []
        columns, rows = 12, 10
        for row in range(rows + 1):
            along = row / rows
            width = 0.255 - 0.055 * math.sin(along * math.pi)
            for column in range(columns + 1):
                across = column / columns
                depth = centre + (across - 0.5) * width + side * 0.045 * math.sin(along * math.pi)
                x = 2.31 + math.cos(across * math.tau * 3) * 0.023
                height = 1.90 - along * 1.17 + along**8 * 0.013 * math.cos(across * math.tau * 3)
                vertices.append(layout.to_blender((x, height, depth)))
        faces = [
            (
                row * (columns + 1) + column,
                (row + 1) * (columns + 1) + column,
                (row + 1) * (columns + 1) + column + 1,
                row * (columns + 1) + column + 1,
            )
            for row in range(rows)
            for column in range(columns)
        ]
        mesh = bpy.data.meshes.new(f"Curtain {side}")
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(f"Curtain {side}", mesh)
        bpy.context.collection.objects.link(obj)
        w.finish(
            obj, f"curtain.{side}", "log", {"item": "window", "colour": "cloth", "value": 1.18}
        )
        for polygon in mesh.polygons:
            polygon.use_smooth = True


def table(w):
    for x in (1.50, 1.90):
        for z in (-0.68, -0.32):
            w.box(
                f"leg.{x}.{z}",
                (x, 0.26, z),
                (0.06, 0.52, 0.06),
                "plank",
                item="table",
                value=0.83,
                bevel=0.007,
            )
    w.box("top", (1.7, 0.515, -0.50), (0.57, 0.055, 0.51), "plank", item="table", bevel=0.014)
    w.cylinder(
        "coaster",
        (1.7, 0.543, -0.50),
        (1.7, 0.548, -0.50),
        0.071,
        "ceramic",
        item="table",
        colour="cloth",
        vertices=24,
    )
    for height in (0.5475, 0.5785):
        w.box(
            f"book.cover.{height}",
            (1.505, height, -0.48),
            (0.14, 0.005, 0.23),
            "plank",
            item="table",
            colour="leather",
            angle=-0.08,
            bevel=0.001,
        )
    w.box(
        "book.pages",
        (1.505, 0.563, -0.481),
        (0.137, 0.025, 0.226),
        "plank",
        item="table",
        colour="paper",
        angle=-0.08,
    )
    w.lathe(
        "mug",
        (1.7, 0.545, -0.50),
        [
            (0, 0),
            (0.047, 0),
            (0.053, 0.10),
            (0.052, 0.115),
            (0.042, 0.115),
            (0.038, 0.025),
            (0, 0.025),
        ],
        "ceramic",
        item="table",
    )
    handle = w.ring(
        "handle", (1.77, 0.606, -0.50), (0.033, 0.011), (1, 1, 1), "ceramic", item="table"
    )
    handle.rotation_euler.x = math.pi / 2
    w.cylinder(
        "tea",
        (1.7, 0.64, -0.50),
        (1.7, 0.643, -0.50),
        0.041,
        "ceramic",
        item="table",
        colour="leather",
        vertices=24,
    )


def shelf(w):
    # Author the low bookcase in its original frame, then turn it to the left wall.
    first = len(w.parts)
    w.box(
        "shadow.under",
        (-0.8, 0.023, 1.82),
        (1.48, 0.046, 0.23),
        "plank",
        item="shelf",
        colour="dark",
    )
    for x in (-1.56, -0.04):
        w.box(
            f"upright.{x}", (x, 0.40, 1.82), (0.06, 0.80, 0.30), "plank", item="shelf", bevel=0.007
        )
    for height in (0.055, 0.27, 0.565, 0.775):
        w.box(
            f"shelf.{height}",
            (-0.8, height, 1.82),
            (1.55, 0.055, 0.34),
            "plank",
            item="shelf",
            bevel=0.005,
        )
    for index in range(13):
        height = 0.125 + (index % 4) * 0.012
        x = -1.43 + index * 0.085
        book = w.box(
            f"book.{index}",
            (x, 0.081 + height / 2, 1.79),
            (0.065, height, 0.21),
            "paper",
            item="shelf",
            colour=("paper", "cloth", "leather", "ceramic")[index % 4],
            bevel=0.003,
        )
        book.rotation_euler.y = 0.065 * ((index % 5) - 2)
        for band in (0.10, 0.10 + height * 0.70):
            offset = band - (0.081 + height / 2)
            angle = book.rotation_euler.y
            stripe = w.box(
                f"book.band.{index}.{band}",
                (
                    x + offset * math.sin(angle),
                    0.081 + height / 2 + offset * math.cos(angle),
                    1.681,
                ),
                (0.045, 0.009, 0.004),
                "paper",
                item="shelf",
                colour="ceramic",
            )
            stripe.rotation_euler.y = angle
    for index in range(4):
        w.box(
            f"stack.{index}",
            (-0.38 + 0.008 * index, 0.609 + index * 0.036, 1.79),
            (0.33 - index * 0.017, 0.035, 0.23),
            "paper",
            item="shelf",
            colour=("cloth", "paper", "rug", "leather")[index],
            angle=0.045 * (index - 2),
            bevel=0.005,
        )
    for index in range(6):
        obj = w.box(
            f"record.{index}",
            (-1.36 + index * 0.195, 0.412, 1.77),
            (0.175, 0.23, 0.023),
            "sleeves",
            item="shelf",
            colour="ffffff",
            angle=0.04 * (index % 3 - 1),
        )
        uv = obj.data.uv_layers.active
        for polygon in obj.data.polygons:
            for loop in polygon.loop_indices:
                vertex = obj.data.vertices[obj.data.loops[loop].vertex_index].co
                uv.data[loop].uv = (
                    (index + (vertex.x / 0.175 + 0.5) * 0.96 + 0.02) / 6,
                    vertex.z / 0.23 + 0.5,
                )
    transform = (
        Matrix.Translation(layout.to_blender(layout.ITEMS["shelf"][0]))
        @ Matrix.Rotation(-math.pi / 2, 4, "Z")
        @ Matrix.Translation(-layout.to_blender((-0.8, 0, 1.85)))
    )
    for obj in w.parts[first:]:
        obj.matrix_world = transform @ obj.matrix_world


def lamp(w):
    w.lathe(
        "foot",
        (2, 0, 0.95),
        [(0, 0), (0.20, 0), (0.20, 0.03), (0.14, 0.055), (0, 0.055)],
        "metal",
        item="lamp",
    )
    w.cylinder("stem", (2, 0.04, 0.95), (2, 1.50, 0.95), 0.019, "metal", item="lamp", vertices=12)
    w.lathe(
        "shade",
        (2, 1.28, 0.95),
        [(0.28, 0), (0.19, 0.36), (0.18, 0.36), (0.27, 0), (0.28, 0)],
        "paper",
        item="lamp",
        segments=24,
    )


def lights(w):
    for index in range(5):
        start = -2.3 + index * 2.9 / 5
        end = -2.3 + (index + 1) * 2.9 / 5
        midpoint = (start + end) / 2
        w.cylinder(
            f"wire.{index}.a",
            (start, 2.27, -1.95),
            (midpoint, 2.20, -1.95),
            0.006,
            "metal",
            item="lights",
            vertices=6,
        )
        w.cylinder(
            f"wire.{index}.b",
            (midpoint, 2.20, -1.95),
            (end, 2.27, -1.95),
            0.006,
            "metal",
            item="lights",
            vertices=6,
        )
    for index in range(6):
        x = -2.3 + index * 2.9 / 5
        w.cylinder(
            f"socket.{index}",
            (x, 2.27, -1.95),
            (x, 2.225, -1.95),
            0.023,
            "metal",
            item="lights",
            vertices=8,
        )
        w.lathe(
            f"bulb.{index}",
            (x, 2.16, -1.95),
            [(0, 0), (0.027, 0.012), (0.031, 0.03), (0.022, 0.06), (0, 0.07)],
            "ceramic",
            item="lights",
            segments=12,
        )


def bowls(w):
    for item, z in (("water", 0.60), ("food", 1.0)):
        w.lathe(
            "bowl",
            (-2.15, 0.01, z),
            [
                (0, 0),
                (0.12, 0),
                (0.17, 0.085),
                (0.17, 0.10),
                (0.15, 0.10),
                (0.105, 0.026),
                (0, 0.026),
            ],
            "ceramic",
            item=item,
        )
        if item == "water":
            w.cylinder(
                "surface",
                (-2.15, 0.069, z),
                (-2.15, 0.071, z),
                0.132,
                "ceramic",
                item=item,
                colour="stone",
                vertices=24,
            )
        else:
            for index in range(9):
                theta = index * math.tau / 9
                x = -2.15 + 0.065 * math.cos(theta)
                depth = z + 0.065 * math.sin(theta)
                w.box(
                    f"food.{index}",
                    (x, 0.066, depth),
                    (0.042, 0.035, 0.035),
                    "ceramic",
                    item=item,
                    colour="log",
                    bevel=0.011,
                    angle=theta,
                )


def toy(w):
    for side in (-1, 1):
        w.cylinder(
            f"rope.{side}",
            (0.44, 0.032, 0.50 + side * 0.023),
            (0.76, 0.032, 0.50 - side * 0.023),
            0.022,
            "cloth",
            item="toy",
            colour="cloth" if side == 1 else "paper",
            vertices=8,
        )
    for x in (0.46, 0.74):
        w.ring(
            f"knot.{x}",
            (x, 0.035, 0.50),
            (0.032, 0.023),
            (1, 0.8, 1),
            "cloth",
            item="toy",
            colour="paper",
        )


def jar(w):
    for dx, dz in ((-0.115, -0.11), (-0.115, 0.11), (0.115, -0.11), (0.115, 0.11)):
        w.cylinder(
            f"stool.leg.{dx}.{dz}",
            (0.3 + dx * 1.2, 0, 1.70 + dz * 1.2),
            (0.3 + dx, 0.42, 1.70 + dz),
            0.025,
            "plank",
            item="jar",
            vertices=10,
        )
    w.cylinder(
        "stool.seat", (0.3, 0.40, 1.70), (0.3, 0.45, 1.70), 0.20, "plank", item="jar", vertices=20
    )
    w.lathe(
        "jar",
        (0.3, 0.45, 1.70),
        [
            (0, 0),
            (0.087, 0),
            (0.105, 0.035),
            (0.105, 0.20),
            (0.082, 0.23),
            (0.08, 0.25),
            (0, 0.25),
        ],
        "ceramic",
        item="jar",
    )
    w.lathe(
        "lid",
        (0.3, 0.70, 1.70),
        [(0, 0), (0.096, 0), (0.10, 0.025), (0.085, 0.04), (0, 0.04)],
        "ceramic",
        item="jar",
        colour="cloth",
    )
    w.cylinder(
        "lid.knob",
        (0.3, 0.74, 1.70),
        (0.3, 0.77, 1.70),
        0.027,
        "ceramic",
        item="jar",
        colour="cloth",
    )


def build(materials, items):
    workshop = Workshop(materials, items)
    for prop in (
        architecture,
        rug,
        fireplace,
        bed,
        chair,
        window,
        table,
        shelf,
        lamp,
        lights,
        bowls,
        toy,
        jar,
    ):
        prop(workshop)
    workshop.combine()
    triangles = 0
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
    if triangles > 40_000:
        raise ValueError(f"Room has {triangles} triangles, above 40000")
    print(f"Cabin: {triangles:,} triangles")
