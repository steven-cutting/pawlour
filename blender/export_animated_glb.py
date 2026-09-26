"""Export the derived scene with portable materials and verify baked deformation."""

import json
import struct
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent


def portable_material(source):
    # Port of biscuit_pics@1d9d358, miami-cinematic-studies/src/build.py:542-566.
    # Only image(texture, kind) changes: use the approved scene's packed images.
    material = bpy.data.materials.new("PBR." + source.name)
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Specular IOR Level"].default_value = 0.19 if source.get("gloss") else 0.12
    texture = source.get("texture_family")
    if not texture:
        shader.inputs["Base Color"].default_value = (*source["solid_color"], 1)
        shader.inputs["Roughness"].default_value = 0.8
        return material
    maps = {}
    for kind in ("color", "normal", "roughness", "occlusion"):
        image_name = f"{texture}-{kind}.png" + (".001" if texture == "ear-wave" else "")
        image = bpy.data.images[image_name]
        if not image.packed_file:
            raise ValueError(f"{image_name}: expected packed texture")
        node = nodes.new("ShaderNodeTexImage")
        node.image = image
        node.extension = "EXTEND" if texture == "eye" else "REPEAT"
        maps[kind] = node
    tint = nodes.new("ShaderNodeMixRGB")
    tint.blend_type = "MULTIPLY"
    tint.inputs[0].default_value = 1
    tint.inputs[2].default_value = (*[min(1, value) for value in source["tint"]], 1)
    links.new(maps["color"].outputs[0], tint.inputs[1])
    links.new(tint.outputs[0], shader.inputs["Base Color"])
    links.new(maps["roughness"].outputs[0], shader.inputs["Roughness"])
    normal = nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = 0.18 if texture.startswith("face") else 0.32
    links.new(maps["normal"].outputs[0], normal.inputs["Color"])
    links.new(normal.outputs[0], shader.inputs["Normal"])
    group = bpy.data.node_groups.get("glTF Material Output")
    if not group:
        group = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        group.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    output = nodes.new("ShaderNodeGroup")
    output.node_tree = group
    links.new(maps["occlusion"].outputs[0], output.inputs["Occlusion"])
    return material


def read_glb(path):
    raw = path.read_bytes()
    if struct.unpack_from("<III", raw) != (0x46546C67, 2, len(raw)):
        raise ValueError("Invalid GLB header")
    length, kind = struct.unpack_from("<II", raw, 12)
    if kind != 0x4E4F534A:
        raise ValueError("First GLB chunk must be JSON")
    return json.loads(raw[20 : 20 + length]), raw[28 + length :]


def floats(document, binary, index):
    accessor = document["accessors"][index]
    if accessor["componentType"] != 5126 or "sparse" in accessor:
        raise ValueError("Expected ordinary float animation accessor")
    width = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[accessor["type"]]
    view = document["bufferViews"][accessor["bufferView"]]
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    stride = view.get("byteStride", width * 4)
    return [
        struct.unpack_from("<" + "f" * width, binary, offset + row * stride)
        for row in range(accessor["count"])
    ]


def canonical_joint_order(path, spec):
    """Keep Blender's skin intact while putting its palette in rig.json order.

    Blender exports hierarchy traversal order. Reorder the inverse-bind matrices
    and each JOINTS_0 value together, so every vertex still names the same bone.
    """
    document, original = read_glb(path)
    binary = bytearray(original)
    skin = document["skins"][0]
    names = [document["nodes"][index]["name"] for index in skin["joints"]]
    expected = [bone["name"] for bone in spec["bones"]]
    if len(names) != len(expected) or set(names) != set(expected):
        raise ValueError("Cannot canonicalize a different skeleton")
    permutation = [names.index(name) for name in expected]
    inverse = {old: new for new, old in enumerate(permutation)}

    def location(index, width):
        accessor = document["accessors"][index]
        if "sparse" in accessor:
            raise ValueError("Unexpected sparse skin accessor")
        view = document["bufferViews"][accessor["bufferView"]]
        return (
            accessor,
            view.get("byteOffset", 0) + accessor.get("byteOffset", 0),
            view.get("byteStride", width),
        )

    matrix, offset, stride = location(skin["inverseBindMatrices"], 64)
    if (
        matrix["count"] != len(names)
        or matrix["type"] != "MAT4"
        or matrix["componentType"] != 5126
    ):
        raise ValueError("Unexpected inverse-bind matrix format")
    for new, old in enumerate(permutation):
        binary[offset + new * stride : offset + new * stride + 64] = original[
            offset + old * stride : offset + old * stride + 64
        ]
    joint_accessors = {
        primitive["attributes"]["JOINTS_0"]
        for mesh in document["meshes"]
        for primitive in mesh["primitives"]
    }
    for index in joint_accessors:
        component = document["accessors"][index]["componentType"]
        code = {5121: "B", 5123: "H"}[component]
        fmt = "<" + code * 4
        accessor, offset, stride = location(index, struct.calcsize(fmt))
        for row in range(accessor["count"]):
            at = offset + row * stride
            old_values = struct.unpack_from(fmt, original, at)
            new_values = tuple(inverse[value] for value in old_values)
            if any(
                names[old] != expected[new]
                for old, new in zip(old_values, new_values, strict=True)
            ):
                raise ValueError("Joint remapping changed a vertex's bone")
            struct.pack_into(fmt, binary, at, *new_values)
    skin["joints"] = [skin["joints"][old] for old in permutation]
    encoded = json.dumps(document, separators=(",", ":")).encode()
    encoded += b" " * (-len(encoded) % 4)
    path.write_bytes(
        struct.pack("<III", 0x46546C67, 2, 28 + len(encoded) + len(binary))
        + struct.pack("<II", len(encoded), 0x4E4F534A)
        + encoded
        + struct.pack("<II", len(binary), 0x004E4942)
        + binary
    )


def required_correctives(rig, spec):
    result = {}
    tracks = list(rig.animation_data.nla_tracks)
    for track in tracks:
        for other in tracks:
            other.mute = other != track
        strip = track.strips[0]
        active = False
        for frame in range(round(strip.frame_start), round(strip.frame_end) + 1):
            bpy.context.scene.frame_set(frame)
            evaluated = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
            for rule in spec["correctives"]:
                bone = evaluated.pose.bones[rule["bone"]]
                rest = bone.bone.matrix_local
                rest_local = bone.parent.bone.matrix_local.inverted() @ rest
                # matrix_basis excludes IK; compare the evaluated matrices in
                # the same rest-local space as the approved pose exporter.
                basis = rest_local.inverted() @ bone.parent.matrix.inverted() @ bone.matrix
                angle = basis.to_quaternion().to_euler("XYZ").x
                active |= abs(angle) > rule["threshold"]
        result[track.name] = active
    for track in tracks:
        track.mute = False
    return result


def verify(path, spec, clips, corrective_required):
    document, binary = read_glb(path)
    animations = document.get("animations", [])
    if sorted(animation["name"] for animation in animations) != sorted(clips):
        raise ValueError("Export did not preserve one animation per NLA track")
    nodes = document["nodes"]
    joints = [nodes[index]["name"] for index in document["skins"][0]["joints"]]
    expected_joints = [bone["name"] for bone in spec["bones"]]
    if len(document["skins"]) != 1 or len(joints) != 33 or joints != expected_joints:
        raise ValueError("Exported deformation skeleton differs from rig.json")
    if any(node.get("name", "").startswith("CTRL.") for node in nodes):
        raise ValueError("IK controls escaped into the served skeleton")
    corrective_names = [rule["name"] for rule in spec["correctives"]]
    sweater_nodes = {
        index
        for index, node in enumerate(nodes)
        if "mesh" in node
        and document["meshes"][node["mesh"]].get("extras", {}).get("targetNames")
        == corrective_names
    }
    if not sweater_nodes:
        raise ValueError("Sweater's five named corrective targets are missing")
    if any(image.get("mimeType") != "image/png" for image in document["images"]):
        raise ValueError("Raw textures must remain PNG")
    if "Blender I/O v5.2" not in document["asset"]["generator"]:
        raise ValueError("Expected Blender 5.2 glTF exporter")
    summary = []
    for animation in animations:
        name = animation["name"]
        inputs = [floats(document, binary, sampler["input"]) for sampler in animation["samplers"]]
        duration = max(value[0] for values in inputs for value in values)
        samples = max(map(len, inputs))
        start, end = clips[name]
        if abs(duration - (end - start) / 30) > 0.00001:
            raise ValueError(f"{name}: exported duration does not match the strip")
        weights = [
            channel
            for channel in animation["channels"]
            if channel["target"]["path"] == "weights"
            and channel["target"]["node"] in sweater_nodes
        ]
        if corrective_required[name] and not weights:
            raise ValueError(f"{name}: active correctives lost their baked weights")
        if weights and corrective_required[name]:
            outputs = [
                floats(document, binary, animation["samplers"][channel["sampler"]]["output"])
                for channel in weights
            ]
            if not any(value[0] > 0.00001 for values in outputs for value in values):
                raise ValueError(f"{name}: active correctives were baked as zero")
        result = {
            "name": name,
            "samples": samples,
            "duration": duration,
            "weights": bool(weights),
            "correctivesActive": corrective_required[name],
        }
        summary.append(result)
        print(
            f"{name}: {samples} samples, {duration:.6f}s; weights={bool(weights)}, above threshold={corrective_required[name]}"
        )
    triangles = sum(
        document["accessors"][primitive["indices"]]["count"] // 3
        for mesh in document["meshes"]
        for primitive in mesh["primitives"]
    )
    report = {
        "animations": summary,
        "joints": joints,
        "jointOrderMatchesSpec": joints == expected_joints,
        "triangles": triangles,
        "bytes": path.stat().st_size,
    }
    (ROOT.parent / "ai_tmp/export-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"33 deformation joints; no CTRL nodes; rig.json order={joints == expected_joints}")
    print(f"{triangles} triangles; {path.stat().st_size} bytes")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(ROOT / "out/biscuit-clips.blend"))
    rig = bpy.data.objects["Biscuit.Rig"]
    spec = json.loads((ROOT / "model/rig.json").read_text())
    clips = {
        track.name: (track.strips[0].frame_start, track.strips[0].frame_end)
        for track in rig.animation_data.nla_tracks
    }
    corrective_required = required_correctives(rig, spec)
    bpy.context.scene.frame_set(1)
    parts = sorted(
        (obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.get("base_part")),
        key=lambda obj: obj.name,
    )
    if len(parts) != 148:
        raise ValueError("Approved character must have 148 base parts")
    materials = {}
    for obj in parts:
        for index, source in enumerate(list(obj.data.materials)):
            if source.name not in materials:
                materials[source.name] = portable_material(source)
            obj.data.materials[index] = materials[source.name]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [*parts, rig]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    out = ROOT / "out/biscuit-raw.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_yup=True,
        export_animations=True,
        export_cameras=False,
        export_lights=False,
        export_apply=False,
        export_tangents=True,
        export_skins=True,
        export_def_bones=True,
        export_morph=True,
        export_morph_normal=True,
        export_influence_nb=4,
        export_all_influences=False,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=True,
        export_frame_step=1,
        export_morph_animation=True,
        export_optimize_animation_size=True,
        export_anim_slide_to_zero=True,
        export_image_format="AUTO",
    )
    canonical_joint_order(out, spec)
    verify(out, spec, clips, corrective_required)


if __name__ == "__main__":
    main()
