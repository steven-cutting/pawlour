"""Check P05's public cabin contract without Blender or a buffer decoder.

The independent position table below is transcribed from P05, not imported from
the authoring scripts. Counts, hierarchy and extras survive meshopt unchanged.
"""

import argparse
import copy
import math
import struct
import sys
from collections import Counter, deque
from pathlib import Path

from glb import read_glb

POSITIONS = {
    "item.fire": (-0.6, 0.30, -1.85),
    "fire.anchor": (-0.6, 0.15, -1.75),
    "light.fire": (-0.6, 0.45, -1.60),
    "item.bed": (-0.6, 0, -1.10),
    "item.bed.approach": (-0.6, 0, -0.55),
    "spot.bed": (-0.6, 0.06, -1.10),
    "item.chair": (1.7, 0, 0.20),
    "item.chair.approach": (1.15, 0, 0.20),
    "spot.chair": (1.7, 0.42, 0.20),
    "item.window": (2.5, 1.30, -0.40),
    "glass.window": (2.49, 1.30, -0.40),
    "glass.window.left": (-2.49, 1.50, -0.40),
    "glass.window.hearth": (1.35, 1.45, -1.99),
    "light.window": (2.4, 1.30, -0.40),
    "item.table": (1.7, 0, -0.50),
    "steam.anchor": (1.7, 0.66, -0.50),
    "item.lamp": (2.0, 0, 0.95),
    "item.lamp.approach": (1.5, 0, 0.95),
    "light.lamp": (2.0, 1.45, 0.95),
    "item.lights": (-0.85, 2.2, -1.95),
    "item.lights.approach": (-1.4, 0, -1.30),
    "item.water": (-2.15, 0, 0.60),
    "item.water.approach": (-1.7, 0, 0.60),
    "item.food": (-2.15, 0, 1.00),
    "item.food.approach": (-1.7, 0, 1.00),
    "item.toy": (0.6, 0, 0.50),
    "item.toy.approach": (0.6, 0, 0.90),
    "item.shelf": (-2.30, 0, -0.40),
    "item.jar": (0.3, 0.45, 1.70),
    "item.jar.approach": (0.3, 0, 1.25),
    "camera.hearth": (0.6, 1.40, 2.30),
    "camera.window": (-0.8, 1.30, 1.60),
    "camera.chair": (0.9, 1.00, 0.90),
    "camera.bowls": (0.5, 1.10, 1.30),
    **{f"light.strings.{i}": (-2.3 + i * 0.58, 2.2, -1.95) for i in range(6)},
    **{
        f"nav.{i}": position
        for i, position in enumerate(
            (
                (0, 0, 0),
                (-0.6, 0, -0.5),
                (1.1, 0, 0.2),
                (-1.6, 0, 0.8),
                (0.6, 0, 0.9),
                (0.3, 0, 1.2),
                (1.5, 0, 0.95),
                (-1.4, 0, -1.2),
            )
        )
    },
}
APPROACH_NAV = {
    "bed": 1,
    "chair": 2,
    "lamp": 6,
    "lights": 7,
    "water": 3,
    "food": 3,
    "toy": 4,
    "jar": 5,
}
CAMERAS = {
    "hearth": ((-0.5, 0.5, -1.5), 42),
    "window": ((1.8, 0.8, -0.2), 40),
    "chair": ((1.7, 0.5, 0.0), 36),
    "bowls": ((-1.9, 0.4, 0.8), 40),
}
# Inside the three walls: the logs at x = +-2.5 and z = -2, the plane at y = 2.405,
# with the +Z side open. A camera outside them would see a wall's back, not the room.
INSIDE = {"x": 2.5, "z": -2.0, "y": 2.4}
FACINGS = {
    **dict.fromkeys(
        ("item.fire", "fire.anchor", "item.bed", "item.lights", "item.jar.approach"), (0, 0, 1)
    ),
    **dict.fromkeys(
        (
            "spot.bed",
            "item.chair.approach",
            "item.lamp.approach",
            "item.water",
            "item.food",
            "item.shelf",
        ),
        (1, 0, 0),
    ),
    **dict.fromkeys(
        ("item.chair", "spot.chair", "item.window", "item.water.approach", "item.food.approach"),
        (-1, 0, 0),
    ),
    **dict.fromkeys(
        (
            "item.bed.approach",
            "item.lights.approach",
            "item.toy.approach",
            "item.jar",
        ),
        (0, 0, -1),
    ),
}
EDGES = {
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
}
IDENTITY = [[float(row == column) for column in range(4)] for row in range(4)]


def multiply(a, b):
    return [
        [sum(a[row][k] * b[k][column] for k in range(4)) for column in range(4)]
        for row in range(4)
    ]


def local_matrix(node):
    if "matrix" in node:
        return [[node["matrix"][column * 4 + row] for column in range(4)] for row in range(4)]
    x, y, z, w = node.get("rotation", (0, 0, 0, 1))
    matrix = [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0],
        [0, 0, 0, 1],
    ]
    scale = node.get("scale", (1, 1, 1))
    for row in range(3):
        for column in range(3):
            matrix[row][column] *= scale[column]
        matrix[row][3] = node.get("translation", (0, 0, 0))[row]
    return matrix


def world_matrices(nodes, findings):
    parents = {}
    for index, node in enumerate(nodes):
        for child in node.get("children", []):
            if not isinstance(child, int) or not 0 <= child < len(nodes):
                findings.append(f"{node.get('name', index)}: invalid child {child}")
            elif child in parents:
                findings.append(f"{nodes[child].get('name', child)}: multiple parents")
            else:
                parents[child] = index
    matrices = {}

    def resolve(index, seen):
        if index in seen:
            raise ValueError("cyclic node hierarchy")
        if index not in matrices:
            parent = resolve(parents[index], seen | {index}) if index in parents else IDENTITY
            matrices[index] = multiply(parent, local_matrix(nodes[index]))
        return matrices[index]

    for index in range(len(nodes)):
        resolve(index, set())
    return matrices


def has_mesh(index, nodes):
    pending, visited = [index], set()
    while pending:
        current = pending.pop()
        if current in visited or not 0 <= current < len(nodes):
            continue
        visited.add(current)
        if "mesh" in nodes[current]:
            return True
        pending.extend(nodes[current].get("children", []))
    return False


def normalise(vector):
    length = math.sqrt(sum(value * value for value in vector))
    if length == 0:
        raise ValueError("zero-length facing vector")
    return tuple(value / length for value in vector)


def check_nodes(document, findings):
    nodes = document.get("nodes", [])
    counts = Counter(node.get("name") for node in nodes)
    named = {node.get("name"): node for node in nodes}
    matrices = world_matrices(nodes, findings)
    indices = {node.get("name"): index for index, node in enumerate(nodes)}
    for name, expected in POSITIONS.items():
        if counts[name] != 1:
            findings.append(f"{name}: expected one required node, found {counts[name]}")
            continue
        node = named[name]
        matrix = matrices[indices[name]]
        position = tuple(matrix[row][3] for row in range(3))
        if any(
            not math.isfinite(a) or abs(a - b) > 0.01
            for a, b in zip(position, expected, strict=True)
        ):
            findings.append(f"{name}: world position {position} differs from {expected}")
        if not name.startswith("glass.window") and "mesh" in node:
            findings.append(f"{name}: contract node must be an empty")
        if (
            name.startswith("item.")
            and not name.endswith(".approach")
            and not has_mesh(indices[name], nodes)
        ):
            findings.append(f"{name}: item has no mesh descendant")
        facing = FACINGS.get(name)
        if name.startswith("camera."):
            x, y, z = position
            if not (abs(x) < INSIDE["x"] and z > INSIDE["z"] and 0 < y < INSIDE["y"]):
                findings.append(f"{name}: world position {position} is outside the walls")
            target, fov = CAMERAS[name.removeprefix("camera.")]
            if node.get("extras", {}).get("fov") != fov:
                findings.append(f"{name}: extras.fov must be {fov}")
            facing = normalise(tuple(b - a for a, b in zip(expected, target, strict=True)))
            # Level means no roll: local +Y within a degree of world +Y with the
            # camera's own -Z taken out, so the pitch is the preset's and a small
            # error in aim cannot hide roll.
            aim = normalise(tuple(-matrix[row][2] for row in range(3)))
            up = normalise(tuple(matrix[row][1] for row in range(3)))
            level = normalise(tuple(float(axis == 1) - aim[1] * aim[axis] for axis in range(3)))
            if sum(a * b for a, b in zip(up, level, strict=True)) < math.cos(math.radians(1)):
                findings.append(f"{name}: rolled; local +Y is {up}, level is {level}")
        if facing:
            actual = normalise(tuple(-matrix[row][2] for row in range(3)))
            if sum(a * b for a, b in zip(actual, facing, strict=True)) < 0.9999:
                findings.append(f"{name}: local -Z faces {actual}, expected {facing}")
    check_glass(document, named, findings)
    for item, nav in APPROACH_NAV.items():
        name = f"item.{item}.approach"
        actual = named.get(name, {}).get("extras", {}).get("nav")
        if actual != f"nav.{nav}" or actual not in named:
            findings.append(f"{name}: extras.nav must name nav.{nav}")
    return named


def check_glass(document, named, findings):
    nodes = document.get("nodes", [])
    pending = list(named.get("item.window", {}).get("children", []))
    descendants = set()
    while pending:
        index = pending.pop()
        if index in descendants or not 0 <= index < len(nodes):
            continue
        descendants.add(index)
        pending.extend(nodes[index].get("children", []))
    descendant_names = {nodes[index].get("name") for index in descendants}
    for name in ("glass.window", "glass.window.left", "glass.window.hearth"):
        glass = named.get(name, {})
        if "mesh" not in glass or glass.get("extras", {}).get("depth") != 1.5:
            findings.append(f"{name}: requires a mesh and extras.depth of 1.5")
            continue
        if name not in descendant_names:
            findings.append(f"{name}: pane must belong to item.window")
        mesh = document["meshes"][glass["mesh"]]
        for primitive in mesh.get("primitives", []):
            material = document["materials"][primitive["material"]]
            if material.get("name") != "cabin.glass" or material.get("alphaMode") != "BLEND":
                findings.append(f"{name}: pane must bind transparent cabin.glass")


def check_graph(named, findings):
    graph = {}
    for name, node in named.items():
        if not isinstance(name, str) or not name.startswith("nav."):
            continue
        edges = node.get("extras", {}).get("edges")
        if not isinstance(edges, list) or any(not isinstance(edge, str) for edge in edges):
            findings.append(f"{name}: extras.edges must be a list of waypoint names")
            graph[name] = []
        else:
            graph[name] = edges
    for name, neighbours in graph.items():
        for neighbour in neighbours:
            if neighbour not in graph:
                findings.append(f"{name}: edge {neighbour} is not an existing waypoint")
            elif name not in graph[neighbour]:
                findings.append(f"{name}: edge to {neighbour} is not reciprocal")
    pending, visited = deque(["nav.0"]), set()
    while pending:
        waypoint = pending.popleft()
        if waypoint in visited:
            continue
        visited.add(waypoint)
        pending.extend(graph.get(waypoint, []))
    if set(graph) - visited:
        findings.append(f"nav.0: disconnected graph; cannot reach {sorted(set(graph) - visited)}")
    expected = {frozenset((f"nav.{a}", f"nav.{b}")) for a, b in EDGES}
    actual = {
        frozenset((name, other)) for name, neighbours in graph.items() for other in neighbours
    }
    if actual != expected:
        findings.append("nav.0: graph edges differ from the P05 route contract")


def check_meshes(document, findings):
    materials = document.get("materials", [])
    for index, material in enumerate(materials):
        if not material.get("name", "").startswith("cabin."):
            findings.append(f"material.{index}: material name must start cabin.")
        if material.get("name") == "cabin.glass" and material.get("alphaMode") != "BLEND":
            findings.append("cabin.glass: glass must use BLEND transparency")
    accessors = document.get("accessors", [])
    triangles, primitives = 0, 0
    for mesh in document.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            name = mesh.get("name", "mesh")
            primitives += 1
            if "COLOR_0" not in primitive.get("attributes", {}):
                findings.append(f"{name}: primitive has no COLOR_0")
            if primitive.get("mode", 4) != 4:
                findings.append(f"{name}: primitive is not TRIANGLES")
            index = primitive.get("indices")
            if not isinstance(index, int) or not 0 <= index < len(accessors):
                findings.append(f"{name}: missing or invalid index accessor")
            else:
                count = accessors[index].get("count", 0)
                if count % 3:
                    findings.append(f"{name}: triangle index count is not divisible by three")
                triangles += count // 3
            material = primitive.get("material")
            if not isinstance(material, int) or not 0 <= material < len(materials):
                findings.append(f"{name}: missing or invalid material")
    if triangles > 40_000:
        findings.append(f"cabin: {triangles} triangles exceeds 40000")
    if primitives > 30:
        findings.append(f"cabin: {primitives} primitives exceeds the 30-draw allowance")
    return triangles, primitives


def check(document):
    findings = []
    try:
        named = check_nodes(document, findings)
        check_graph(named, findings)
        triangles, primitives = check_meshes(document, findings)
    except (KeyError, TypeError, IndexError, ValueError, RecursionError) as error:
        findings.append(f"cabin: malformed contract data ({error})")
        triangles, primitives = 0, 0
    return findings, triangles, primitives


def self_test(path):
    """Mutate real output, including JSON-only changes to compressed buffers."""
    original, _ = read_glb(path)
    baseline, _, _ = check(original)
    if baseline:
        raise ValueError(f"self-test input is invalid: {baseline}")
    cases = (
        ("renamed node", "nav.7", "name", "missing.nav", "nav.7"),
        ("bad position", "item.bed", "translation", [99, 0, 0], "item.bed"),
        (
            "bad approach",
            "item.bed.approach",
            "extras",
            {"nav": "nav.missing"},
            "item.bed.approach",
        ),
        ("one-way edge", "nav.7", "extras", {"edges": ["nav.0"]}, "not reciprocal"),
        ("missing fov", "camera.hearth", "extras", {}, "camera.hearth"),
        # Behind the hearth wall; the position check trips too, so the phrase is what counts.
        (
            "camera behind a wall",
            "camera.hearth",
            "translation",
            [0.6, 1.4, -2.3],
            "outside the walls",
        ),
        ("missing depth", "glass.window", "extras", {}, "glass.window"),
        ("missing added pane", "glass.window.left", "name", "wrong.pane", "glass.window.left"),
        ("added pane depth", "glass.window.hearth", "extras", {}, "glass.window.hearth"),
        ("item without meshes", "item.bed", "children", [], "mesh descendant"),
        (
            # The rotation P05 shipped: the right facing, rolled.
            "rolled camera",
            "camera.hearth",
            "rotation",
            [0.0762253850698471, 0.16085411608219147, 0.8892382979393005, 0.42139166593551636],
            "rolled",
        ),
        (
            # 1.2 degrees of roll behind 0.74 of aim, which the facing check allows:
            # level taken from the target's direction instead of -Z read 0.89.
            "rolled camera, aim slightly off",
            "camera.chair",
            "rotation",
            [-0.17964, -0.344014, -0.077825, 0.918328],
            "rolled",
        ),
    )
    total = 0
    for label, name, key, value, expected in cases:
        changed = copy.deepcopy(original)
        next(node for node in changed["nodes"] if node.get("name") == name)[key] = value
        findings, _, _ = check(changed)
        if not any(expected in finding for finding in findings):
            raise ValueError(f"checker accepted {label}")
        total += 1
    for label in ("colour", "triangles", "disconnected", "material", "glass material"):
        changed = copy.deepcopy(original)
        if label == "colour":
            del changed["meshes"][0]["primitives"][0]["attributes"]["COLOR_0"]
        elif label == "triangles":
            index = changed["meshes"][0]["primitives"][0]["indices"]
            changed["accessors"][index]["count"] = 120_003
        elif label == "material":
            changed["materials"][0]["name"] = "wrong.material"
        elif label == "glass material":
            pane = next(node for node in changed["nodes"] if node.get("name") == "glass.window")
            material = changed["meshes"][pane["mesh"]]["primitives"][0]["material"]
            changed["materials"][material]["alphaMode"] = "OPAQUE"
        else:
            for node in changed["nodes"]:
                if node.get("name", "").startswith("nav."):
                    node["extras"]["edges"] = []
        if not check(changed)[0]:
            raise ValueError(f"checker accepted invalid {label}")
        total += 1
    print(f"cabin self-test: valid input accepted, {total} broken contracts refused")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path, nargs="?", default=Path("blender/out/cabin-raw.glb"))
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    try:
        if args.self_test:
            self_test(args.path)
            return 0
        findings, triangles, primitives = check(read_glb(args.path)[0])
    except (OSError, TypeError, ValueError, struct.error) as error:
        print(f"{args.path}: {error}", file=sys.stderr)
        return 1
    if findings:
        print("\n".join(findings), file=sys.stderr)
        return 1
    print(
        f"{args.path}: cabin contract valid; {triangles:,} triangles, {primitives} primitives, all {len(POSITIONS)} positions within 0.01 m"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
