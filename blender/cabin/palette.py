"""P05's phase-neutral, sRGB palette; original geometry and painted textures.

Style reference only: biscuit_pics@1d9d358, inspiration/catherine/katherine/
INDEX.md, 'The core'. No reference image is copied into this room.
"""

import colorsys
from pathlib import Path

import bpy

HEX = {
    "log": "7a4a2c",
    "plank": "8c5a34",
    "rug": "a0582d",
    "leather": "5c331d",
    "cloth": "b07a52",
    "ceramic": "d9b58c",
    "metal": "4a3a30",
    "paper": "e6ceae",
    "stone": "6e5646",
    "glass": "cfd9e6",
    "dark": "120600",
}


def srgb(surface, value=1.0):
    """Value changes preserve the measured hue before colour-space conversion."""
    colour = HEX.get(surface, surface)
    return tuple(int(colour[index : index + 2], 16) / 255 * value for index in (0, 2, 4))


def linear(surface, value=1.0, alpha=1.0):
    return (
        *(
            c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
            for c in srgb(surface, value)
        ),
        alpha,
    )


def create():
    materials = {}
    for surface in HEX:
        if surface == "dark":
            continue
        material = bpy.data.materials.new(f"cabin.{surface}")
        material.use_nodes = True
        shader = material.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Roughness"].default_value = 1.0
        shader.inputs["Specular IOR Level"].default_value = 0.0
        colour = material.node_tree.nodes.new("ShaderNodeVertexColor")
        colour.layer_name = "Color"
        material.node_tree.links.new(colour.outputs["Color"], shader.inputs["Base Color"])
        if surface == "glass":
            shader.inputs["Alpha"].default_value = 0.35
            material.surface_render_method = "BLENDED"
            material.use_transparent_shadow = False
        materials[surface] = material
    materials["sleeves"] = materials["paper"].copy()
    materials["sleeves"].name = "cabin.paper.sleeves"
    for surface, filename in (("rug", "rug.png"), ("sleeves", "sleeves.png")):
        material = materials[surface]
        nodes = material.node_tree.nodes
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = bpy.data.images.load(str(Path(__file__).parent / "textures" / filename))
        shader = nodes.get("Principled BSDF")
        # The glTF exporter recognises this material multiplication as a base
        # colour texture plus COLOR_0, and the runtime preserves both.
        multiply = nodes.new("ShaderNodeMixRGB")
        multiply.blend_type = "MULTIPLY"
        multiply.inputs[0].default_value = 1.0
        material.node_tree.links.new(texture.outputs["Color"], multiply.inputs[1])
        material.node_tree.links.new(
            nodes.get("Color Attribute").outputs["Color"], multiply.inputs[2]
        )
        material.node_tree.links.new(multiply.outputs[0], shader.inputs["Base Color"])
    for surface, colour in HEX.items():
        hue = colorsys.rgb_to_hsv(*srgb(surface))[0] * 360
        print(f"palette {surface}: #{colour}, hue {hue:.2f} degrees")
    return materials


def paint(obj, surface, value=1.0):
    colours = obj.data.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="CORNER")
    for face in obj.data.polygons:
        # Discrete painted value planes, never a wood-grain or brick texture.
        normal = obj.matrix_world.to_3x3() @ face.normal
        shade = 0.62 if normal.z < -0.25 else (0.87 if normal.x < -0.5 else 1.0)
        if surface in ("log", "stone"):
            shade *= 0.97 + (face.index * 7 % 5) * 0.015
        rgba = linear(surface, value * shade)
        for loop in face.loop_indices:
            colours.data[loop].color = rgba
    obj.data.color_attributes.active_color = colours
