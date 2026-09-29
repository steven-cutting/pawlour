---
title: "The room"
kind: "reference"
audience: [contributor, maintainer, agent]
canonical_for: [room_contract]
requires: []
---

# The room

`cabin.glb` is the one interface between the Blender scripts that build the room, under
`blender/cabin/`, and the runtime that draws it, under `src/routes/scene/`. This page is
that contract: the names the file must carry, what each means, and which check holds
which part of it. A change to either side starts here.

## Units and axes

The scene unit is the metre. The room is modelled at true scale: the floor is 5 by 4
units with its origin at the floor's centre, +Y up after export, and the hearth wall at
−Z. An empty's forward is its local −Z.

Biscuit is scaled by the runtime so that her bind-pose height, the `height` in
`biscuit.clips.json`, becomes 0.55 units — a miniature poodle to the top of the topknot.
The factor is computed from the file, never written down. Her walking speed is the walk
clip's stride over its length at that scale, so her feet do not slide.

## Required nodes

Empties — glTF nodes with no mesh — by exact name. The runtime refuses a room missing any
of them and names every one that is missing.

| Name | Meaning |
| --- | --- |
| `item.bed`, `item.chair`, `item.water`, `item.food`, `item.toy`, `item.jar`, `item.lamp`, `item.lights`, `item.fire`, `item.window`, `item.table`, `item.shelf` | the thing's origin; every mesh belonging to it is a descendant of this node |
| `item.<name>.approach` for `bed`, `chair`, `water`, `food`, `toy`, `jar`, `lamp`, `lights` | where she stands to use it, facing −Z toward it; carries `extras.nav` naming its nearest waypoint |
| `spot.bed`, `spot.chair` | where she lies, with facing; `spot.chair` is on the seat |
| `nav.0` to `nav.<n>` | waypoints on the floor; each carries `extras.edges`, a list of neighbouring waypoint names; the graph is connected and undirected |
| `camera.hearth`, `camera.window`, `camera.chair`, `camera.bowls` | the presets, one per name in `CAMERAS` (`src/lib/domain/zones.ts`); position and −Z view direction, level (local +Y up, no roll), inside the three walls; `extras.fov` vertical degrees |
| `light.window`, `light.fire`, `light.lamp`, `light.strings.0` to `light.strings.<n>` | positions the lighting rigs place lights at |
| `glass.window`, `glass.window.left`, `glass.window.hearth` | three pane meshes under `item.window`; weather particles live in the box behind each (`extras.depth` units) |
| `fire.anchor` | where the flame planes and embers sit |
| `steam.anchor` | the mug's steam |

The three panes are the one exception to "no mesh": each is a mesh, 1.0 wide by 0.9
high, with `extras.depth` of 1.5, transparent `cabin.glass`, and its own origin kept
through the build. All three share the `item.window` interaction.

| Node | Position | Facing into the room |
| --- | --- | --- |
| `item.shelf` | (−2.30, 0, −0.40) | local −Z faces +X |
| `glass.window` | (2.49, 1.30, −0.40) | surface normal −X |
| `glass.window.left` | (−2.49, 1.50, −0.40) | surface normal +X |
| `glass.window.hearth` | (1.35, 1.45, −1.99) | surface normal +Z |

Numbered nodes run without gaps: `nav.0` upward and `light.strings.0` upward, each until
the next number is absent.

## Meshes and materials

Every mesh carries `COLOR_0` vertex colours on the warm axis
([Art direction](art-direction.md)) and a material named `cabin.<surface>`: `cabin.log`,
`cabin.plank`, `cabin.rug`, `cabin.leather`, `cabin.ceramic`, `cabin.cloth`,
`cabin.metal`, `cabin.paper`, `cabin.stone`, `cabin.glass`, and `cabin.paper.sleeves`
for the record sleeves. Two textures only: a 512² colour map for the rug and one for
the sleeves, both drawn by `blender/cabin/textures.py`. The window glass is transparent.
The whole room is at most 40,000 triangles.

## The room as built

`blender/cabin/layout.py` places every node; these are its positions in glTF metres.

| Approach | Stands at | Nearest waypoint |
| --- | --- | --- |
| `item.bed.approach` | (−0.60, 0, −0.55) | `nav.1` |
| `item.chair.approach` | (1.15, 0, 0.20) | `nav.2` |
| `item.water.approach` | (−1.70, 0, 0.60) | `nav.3` |
| `item.food.approach` | (−1.70, 0, 1.00) | `nav.3` |
| `item.toy.approach` | (0.60, 0, 0.90) | `nav.4` |
| `item.jar.approach` | (0.30, 0, 1.25) | `nav.5` |
| `item.lamp.approach` | (1.50, 0, 0.95) | `nav.6` |
| `item.lights.approach` | (−1.40, 0, −1.30) | `nav.7` |

Eight waypoints, `nav.0` at the floor's centre through `nav.7`, joined by twelve edges:
`nav.0` to each of the other seven, and `nav.1`–`nav.7`, `nav.2`–`nav.6`,
`nav.3`–`nav.7`, `nav.4`–`nav.5` and `nav.2`–`nav.4`.

`spot.bed` is in front of the fire at (−0.60, 0.06, −1.10); `spot.chair` is on the seat
at (1.70, 0.42, 0.20).

`camera.hearth` looks at the fireplace from the front of the room with a vertical field
of 42°, `camera.window` looks across to the armchair and the window at 40°,
`camera.chair` is close on the armchair and the side table at 36°, and `camera.bowls`,
at (0.50, 1.10, 1.30), looks down on the two bowls at 40°. Every camera sits inside the
three walls, |x| < 2.5, z > −2 and 0 < y < 2.4, with the open +Z side free, so no wall
can come between it and the room.

Which one is in use is the director's (`cabin.allium`, TheCameraFollowsHerUntilPinned):
every waypoint, approach and spot belongs to one preset's zone, listed in
`src/lib/domain/zones.ts`, and under Auto the picture cuts to that preset as she reaches
the node. The hearth owns the middle of the room and its left side, `nav.0`, `nav.1`,
`nav.3`, `nav.5`, `nav.7` and the bed, lights and jar approaches with `spot.bed`; the
window owns the right, `nav.2`, `nav.4`, `nav.6` and the chair, lamp and toy approaches;
the chair owns `spot.chair`; the bowls own the water and food approaches. The zones live
in TypeScript rather than as `extras` on the empties, because the director cannot read
the room; `tests/scene-assets.test.ts` holds them to it.

Six string lights, `light.strings.0` to `light.strings.5`, run along the hearth wall at
2.2 units high. `light.window` sits just inside the window, `light.fire` in the hearth
and `light.lamp` at the floor lamp's shade.

## What checks what

| Check | Holds | When |
| --- | --- | --- |
| `requireCabin` in `src/routes/scene/cabin.ts` | every required name; each `item.*.approach` naming a real waypoint; edges that exist, run both ways and connect every waypoint; a numeric `extras.fov` on each camera; each pane a mesh under `item.window` with a numeric depth | every load, in the browser and in `tests/scene-assets.test.ts` |
| `just check-cabin` (`scripts/check_cabin.py`) | all of that, plus every position within a centimetre, every facing, no camera rolled more than a degree or outside the three walls, the exact edge set and fields of view, empties carrying no mesh, every item owning a mesh, the pane depth and glass material, `cabin.*` names, `COLOR_0` on every primitive, at most 40,000 triangles and at most 30 primitives | on the raw file by hand after `just cabin-export`, and on the served file at the end of `just assets-build cabin`; it is not part of `just check` |
| `just check-cabin-self-test` | that the checker refuses seventeen deliberate violations | by hand |
| `tests/scene-assets.test.ts` | that the zones name every waypoint, approach and spot once, and that each preset, fitted at four sizes, holds its zone and every node one step beyond it in frame at the floor and at 0.55 up, with no mesh of the room on the line from the camera to her at 0.3 and 0.55 up (0.55 alone on a spot, and from the hearth to `nav.5` and the jar's approach, which the jar's stand hides at knee height) | in `just check`, through `just frontend-unit` |

`just scene-stub` writes a small room of boxes that satisfies the runtime's half of the
contract to `ai_tmp/stub-cabin/cabin.glb`, for working on the scene without Blender.

## Related pages

- [Art direction](art-direction.md)
- [Rendering](../explanation/rendering.md)
- [Build assets](../how-to/build-assets.md)
- [The director](../explanation/the-director.md)
- [Terminology](../project/terminology.md)
