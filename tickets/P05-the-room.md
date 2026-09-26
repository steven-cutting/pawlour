---
id: P05
title: "The room: scripted props, the `cabin.glb` contract, warm-axis colours, through the pipeline"
status: done
depends_on: [P00, P03]
parallel_with: [P01, P04, P06, P07a, P08, P09]
branch: ticket/p05-the-room
estimated_size: L
---

# P05: The room: scripted props, the `cabin.glb` contract, warm-axis colours, through the pipeline

## Context

The room is the second served asset. It is built the way the model itself was built, by
python scripts run inside Blender (CONVENTIONS.md §1 decision 20), exported to
`blender/out/cabin-raw.glb`, and pushed through P03's pipeline to
`src/lib/assets/cabin.glb`. Its shape is a contract: CONVENTIONS.md §5.2 names every
empty, every `extras` field and every material the runtime (P07a, P07b) reads, and P07a
is being written at the same time against a stub of boxes, so this ticket's whole value
is in matching that contract exactly. The runtime refuses a room missing a required node,
and `scripts/check_cabin.py`, written here, refuses it first.

The look is Catherine's painted background (CONVENTIONS.md §5.3): every surface a flat
vertex colour inside a 15° wedge on the warm axis, planes separated by value rather than
hue, no textures except the rug and the record sleeves, no outlines (the runtime adds
none for `cabin.*`). The reference is D
`inspiration/catherine/katherine/INDEX.md`, "The core" (figure and ground are two
rendering systems; one hue axis per picture; dark masses zero green and blue rather than
greying). It is cited, never copied.

Sources, at the commits CONVENTIONS.md §0 pins (read-only):

- D `models/biscuit/src/build.py` lines 61–75: the exporter call the model uses, the
  base for the cabin's (§1 fact 3).
- D `models/biscuit/src/rig.py` and `common.py`: the manner of building geometry from
  primitives in a script (helpers, naming, `base_part` properties) to match.
- P03's `scripts/build_assets.sh` (the `cabin` branch: `join --keepNamed true`, as
  CONVENTIONS.md §4.3 and gltf-transform 4.5.0 both spell it) and
  `scripts/check_assets.py`.
- CONVENTIONS.md §5.1 (units, axes, the 5 × 4 floor, origin), §5.2 (the contract,
  copied into Step 2 below with positions), §5.3 (the palette rules), §3 (the budget:
  3,145,728 bytes), §10 (the maintainer's eye), `PRD.md` ("The room").

**Authorisation.** Blender runs locally; nothing leaves the machine. The maintainer's
approval of the three room renders is a gate (§10). Pushing and the pull request are
separately authorised.

## Goal

- `blender/cabin/build.py` (with helpers under `blender/cabin/`) builds every thing in
  `PRD.md`'s room table as low-poly meshes with vertex colours, places every empty §5.2
  requires with its `extras`, and exports `blender/out/cabin-raw.glb` in one Blender run
  through `just cabin-export`.
- `scripts/check_cabin.py` proves the contract on the raw and on the served file.
- `src/lib/assets/cabin.glb` is committed under 3,145,728 bytes, at most 40,000
  triangles, with every `item.*` mesh kept apart for hit-testing.
- Three renders from the camera empties are approved by the maintainer.

## Non-goals

- Lighting, the fire, the weather, the steam: the runtime's (P07a, P07b). This ticket
  places `light.*`, `fire.anchor`, `steam.anchor` and `glass.window` and draws nothing
  that moves.
- Biscuit in the room, her scale, her paths: P07a and P07b read `nav.*` and `spot.*`; this
  ticket only places them.
- Textures beyond the rug and the record sleeves (§5.2). No wood grain, no brick: value
  steps in vertex colour do that work.
- A second room. The script is written so a second `blender/<room>/build.py` could exist,
  but none does.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `blender/cabin/build.py` | repo | Steps 1–4 | new; the entry point `just cabin-export` runs |
| `blender/cabin/props.py` | repo | Step 3 | new; one function per thing |
| `blender/cabin/palette.py` | repo | Step 1 | new; the colours and materials |
| `blender/cabin/layout.py` | repo | Step 2 | new; every position and every empty |
| `blender/cabin/textures/rug.png`, `blender/cabin/textures/sleeves.png` | repo | Step 3 | new; 512², made by the script or by hand, `made:` source |
| `scripts/check_cabin.py` | repo | Step 5 | new |
| `src/lib/assets/cabin.glb` | gen | `just assets-build cabin` | new; committed |
| `src/lib/assets/manifest.json` | gen | `just assets-manifest` | one entry added |
| `tickets/P05-the-room.md` | tickets | this file | `status: done` |

Renders go to `ai_tmp/cabin/<camera>.png` and are not committed.

## Steps

1. **Write `blender/cabin/palette.py`.** The hue wedge is 20° to 35°; every colour below
   sits in it except the glass, which is the one off-axis accent (§5.3). Materials are
   named `cabin.<surface>` and each carries a `Color Attribute` node into the Principled
   base colour so the exporter writes `COLOR_0`. Base colours (sRGB), with a `shade`
   variant at 0.62 of the value for faces the script marks as shadowed (undersides, the
   hearth's interior, the shelf's underside):

   | Material | Base | Used for |
   | --- | --- | --- |
   | `cabin.log` | `#7a4a2c` | walls; alternate log courses ±4% value |
   | `cabin.plank` | `#8c5a34` | floor; alternate planks ±3% value |
   | `cabin.rug` | `#a0582d` | rug, with `rug.png` |
   | `cabin.leather` | `#5c331d` | armchair |
   | `cabin.cloth` | `#b07a52` | bed, cushion |
   | `cabin.ceramic` | `#d9b58c` | bowls, mug, jar |
   | `cabin.metal` | `#4a3a30` | fire grate, lamp stem, string-light wire |
   | `cabin.paper` | `#e6ceae` | lampshade, books, record sleeves with `sleeves.png` |
   | `cabin.stone` | `#6e5646` | hearth surround |
   | `cabin.glass` | `#cfd9e6` at alpha 0.35 | the window pane; `blend_method` blend |

   The hearth's interior and the gap under the shelf are painted `#120600` (green and
   blue zeroed, §5.3). Record every hex in the hand-back with its measured hue.

2. **Write `blender/cabin/layout.py`.** Every position in **glTF coordinates** (metres,
   +Y up, the hearth wall at −Z, the window wall at +X); the script converts to Blender's
   Z-up with `(x, y, z) → (x, −z, y)` in one helper, and `export_yup=True` converts back.
   The floor is 5 (X) by 4 (Z), origin at its centre, y = 0; walls 2.4 high; no ceiling
   mesh (the camera never sees it) but a dark plane at y = 2.4 so the wipe of the top
   edge is not white. Empties are Blender `EMPTY` objects (`PLAIN_AXES`), named exactly,
   forward along local −Z after export (so in Blender, facing +Y = glTF −Z means rotation
   0; a facing toward glTF +X is a Blender Z rotation of −90°), with `extras` written as
   custom properties (`ob["edges"] = [...]`, `ob["nav"] = "nav.1"`, `ob["fov"] = 42.0`,
   `ob["depth"] = 1.5`), which `export_extras=True` writes.

   | Empty | Position (x, y, z) | Facing | `extras` |
   | --- | --- | --- | --- |
   | `item.fire` | (−0.6, 0.30, −1.85) | +Z | |
   | `fire.anchor` | (−0.6, 0.15, −1.75) | +Z | |
   | `light.fire` | (−0.6, 0.45, −1.60) | | |
   | `item.bed` | (−0.6, 0, −1.10) | +Z | |
   | `item.bed.approach` | (−0.6, 0, −0.55) | −Z | `nav: "nav.1"` |
   | `spot.bed` | (−0.6, 0.06, −1.10) | +X | |
   | `item.chair` | (1.7, 0, 0.20) | −X | |
   | `item.chair.approach` | (1.15, 0, 0.20) | +X | `nav: "nav.2"` |
   | `spot.chair` | (1.7, 0.42, 0.20) | −X | |
   | `item.window` | (2.5, 1.30, −0.40) | −X | |
   | `glass.window` (a mesh) | (2.49, 1.30, −0.40), 1.0 wide, 0.9 high | | `depth: 1.5` |
   | `glass.window.left` (a mesh) | (−2.49, 1.50, −0.40), 1.0 wide, 0.9 high | surface normal +X | `depth: 1.5` |
   | `glass.window.hearth` (a mesh) | (1.35, 1.45, −1.99), 1.0 wide, 0.9 high | surface normal +Z | `depth: 1.5` |
   | `light.window` | (2.4, 1.30, −0.40) | | |
   | `item.table` | (1.7, 0, −0.50) | | |
   | `steam.anchor` | (1.7, 0.66, −0.50) | | |
   | `item.lamp` | (2.0, 0, 0.95) | | |
   | `item.lamp.approach` | (1.5, 0, 0.95) | +X | `nav: "nav.6"` |
   | `light.lamp` | (2.0, 1.45, 0.95) | | |
   | `item.lights` | (−0.85, 2.2, −1.95) | +Z | |
   | `item.lights.approach` | (−1.4, 0, −1.30) | −Z | `nav: "nav.7"` |
   | `light.strings.0` … `light.strings.5` | y 2.2, z −1.95, x from −2.3 to 0.6 in six steps | | |
   | `item.water` | (−2.15, 0, 0.60) | +X | |
   | `item.water.approach` | (−1.7, 0, 0.60) | −X | `nav: "nav.3"` |
   | `item.food` | (−2.15, 0, 1.00) | +X | |
   | `item.food.approach` | (−1.7, 0, 1.00) | −X | `nav: "nav.3"` |
   | `item.toy` | (0.6, 0, 0.50) | | |
   | `item.toy.approach` | (0.6, 0, 0.90) | −Z | `nav: "nav.4"` |
   | `item.shelf` | (−2.30, 0, −0.40) | +X | |
   | `item.jar` | (0.3, 0.45, 1.70) on a stool | −Z | |
   | `item.jar.approach` | (0.3, 0, 1.25) | +Z | `nav: "nav.5"` |
   | `camera.hearth` | (0.6, 1.40, 2.30) | toward (−0.5, 0.5, −1.5) | `fov: 42` |
   | `camera.window` | (−0.8, 1.30, 1.60) | toward (1.8, 0.8, −0.2) | `fov: 40` |
   | `camera.chair` | (0.9, 1.00, 0.90) | toward (1.7, 0.5, 0.0) | `fov: 36` |
   | `nav.0` … `nav.7` | (0,0,0), (−0.6,0,−0.5), (1.1,0,0.2), (−1.6,0,0.8), (0.6,0,0.9), (0.3,0,1.2), (1.5,0,0.95), (−1.4,0,−1.2) | | `edges` |

   Edges (undirected, written on both ends): 0–1, 0–2, 0–3, 0–4, 0–5, 0–6, 0–7, 1–7,
   2–6, 3–7, 4–5, 2–4. The rug is centred at (0, 0.005, −0.3), 2.2 by 1.6. P07a's stub
   uses these same positions, so the two tickets agree before either lands; a position
   this ticket has to move is handed back to P07a's follow-up with the new figure.

   The shelf and two added panes above incorporate the maintainer's explicit
   2026-09-25 request to put the shelf on the left wall opposite the chair and add
   more windows. The shelf clears the existing bowls; all approaches, waypoints
   and camera presets remain unchanged. All three panes belong to `item.window`.

3. **Write `blender/cabin/props.py`**, one function per thing, from primitives (cubes,
   cylinders, a lathe for the bowls, mug and jar) with at most the triangles the thing
   needs: log walls as stacked cylinders of 0.22 diameter, twelve courses, ends showing
   at the corners; a plank floor of 18 planks; the hearth as a stone surround, a black
   interior box, a grate of five `cabin.metal` bars, a mantel; the bed as a flattened
   torus and a cushion; the armchair with a seat at 0.42, arms and a back; the window
   frame and the pane; the side table, the mug with a handle; the bookshelf with three
   shelves, a row of books and six records leaning on the middle shelf; the lamp, its
   stem and a conical shade; six bulbs on a wire along the hearth wall; two bowls; a rope
   toy of two knotted cylinders; a stool and the jar with a lid. Every mesh belonging to
   an item is parented to its `item.*` empty and named `<item>.<part>`. Triangles in total
   at most 40,000; the script prints the count. `rug.png` and `sleeves.png` are 512²,
   drawn by the script with Pillow (a border and two stripes; six sleeve colours from the
   palette) or by hand, listed in the manifest as `made:`; nothing generated by an image
   model.

4. **Write `blender/cabin/build.py`.** A fresh scene (`bpy.ops.wm.read_factory_settings(use_empty=True)`),
   the palette, the layout, the props; then three Blender cameras created at the three
   camera empties (not exported: `export_cameras=False`) rendering `ai_tmp/cabin/<camera>.png`
   at 1170×2532 with Eevee, a hemisphere-like world light and one sun through the window,
   for the maintainer's eye; then the export:

   ```python
   bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', export_extras=True,
       export_yup=True, export_apply=True, export_animations=False, export_cameras=False,
       export_lights=False, export_skins=False, export_morph=False,
       export_vertex_color='ACTIVE', export_image_format='AUTO')
   ```

   `export_vertex_color` is the 4.2+ name for the vertex-colour switch; confirm it exists
   in 5.2.1 with `bpy.ops.export_scene.gltf.get_rna_type().properties.keys()` and record
   the name actually used. The exporter must write `COLOR_0` on every primitive; if
   `ACTIVE` writes none, the fallback is `MATERIAL` with the Color Attribute node wired,
   which is how the palette is built anyway.

5. **Write `scripts/check_cabin.py`** (standard library only; ruff-clean under §2.2):
   reads a GLB's JSON chunk (`struct`, the 12-byte header, the first chunk), and asserts
   every required node of §5.2 exists by name; every `item.<name>.approach` carries
   `extras.nav` naming an existing `nav.*`; every `nav.*` carries `extras.edges`, every
   edge names an existing waypoint and appears on both ends, and the graph is connected
   (breadth-first from `nav.0`); every `camera.*` carries `extras.fov`; all three
   `glass.window*` nodes carry `extras.depth`, are meshes under `item.window`, and
   bind transparent `cabin.glass`; every material's name starts `cabin.`; every
   mesh primitive has `COLOR_0`; the triangle total from the index accessors' `count`
   is at most 40,000; every `item.*` empty has at least one mesh descendant. Prints one
   summary line on success; on failure prints every finding as `<node>: <reason>` and
   exits 1. Run it on `blender/out/cabin-raw.glb` and, after the pipeline, on
   `src/lib/assets/cabin.glb` (meshopt compresses the buffers, not the JSON; the node
   names, extras and accessor counts survive).

6. **Export, check, build.** `just cabin-export`; `python3 scripts/check_cabin.py
   blender/out/cabin-raw.glb`; `just assets-build cabin` (P00's recipe, CONVENTIONS.md
   §2.3; it runs `sh scripts/build_assets.sh cabin`); `python3 scripts/check_cabin.py
   src/lib/assets/cabin.glb`; confirm with `npx gltf-transform inspect` that the `item.*`
   meshes were not joined into each other (`--keepNamed true` keeps named meshes and
   nodes apart) while the walls and floor were; record the primitive count (the room's
   draw calls; §11 claim 7's allowance is 30).

7. **Stop for the maintainer's eye.** Show `ai_tmp/cabin/hearth.png`, `window.png`,
   `chair.png`. The questions are §5.3's: does the room read as painted rather than as
   cardboard; is the hue one wedge; is the value doing the separating; is the glass the
   only cool thing. Record the date and the verdict; rework and re-render on a refusal.

8. **Manifest.** `just assets-manifest`; set the entry's `budget` to `3145728` and
   `licence` to `cc0` (the room is this repository's own work, §3) and re-run; read the
   diff: one entry plus the two texture sources are not under `src/lib/assets/` and get no
   entry. `just check-assets` green.

9. **`just check`**, `status: done`, commit. Pushing and the pull request are authorised
   separately.

## Acceptance criteria

- [x] `just cabin-export` builds the room from an empty scene and writes
      `blender/out/cabin-raw.glb` in one run, printing the triangle count.
- [x] `scripts/check_cabin.py` passes on the raw and on the served file, and refuses a
      file with one required node renamed (checked once by hand on a copy under
      `ai_tmp/` and recorded).
- [x] Every position in Step 2's table is where the table says, within 0.01, read back
      from the served GLB's node translations.
- [x] `src/lib/assets/cabin.glb` is under 3,145,728 bytes; at most 40,000 triangles;
      every `item.*` mesh a separate primitive; `COLOR_0` on every primitive.
- [x] The three renders are approved by the maintainer, with the date in the hand-back.
- [x] `just check-assets` and `just check` are green.

## Verification

```sh
just cabin-export
python3 scripts/check_cabin.py blender/out/cabin-raw.glb
sh scripts/build_assets.sh cabin
python3 scripts/check_cabin.py src/lib/assets/cabin.glb
npx gltf-transform inspect src/lib/assets/cabin.glb --format md | head -40
ls -la src/lib/assets/cabin.glb ai_tmp/cabin/
just check-assets
just check
```

Expected: Blender printing the triangle count and the export path; two summary lines
from the checker; the pipeline's stage lines; the inspect report with `cabin.*` materials,
`COLOR_0` attributes and the `item.*` meshes listed apart; a file under 3,145,728 bytes
and three renders; green; green.

## Hand-back notes

Implementation, native review and served-room pipeline completed on 2026-09-25.
The maintainer approved the revised room on that date: "Approve the room".
The final `just check` passed on that date with 37 unit tests, three Storybook
tests, all 21 served assets verified, and no worktree changes from the checks.

`just cabin-export` builds the room from factory settings with Blender 5.2.1 LTS,
renders with Eevee, and writes `blender/out/cabin-raw.glb`. The installed exporter
exposes `export_vertex_color`; `ACTIVE` writes `COLOR_0` on all 25 primitives.
The raw room has 25,634 triangles, 25 meshes, 11 materials and 1,924,836 bytes.
The room has no animation, skin, exported camera or exported light. The two
embedded texture maps are each 512 × 512; every other surface uses vertex colour.
Compatible parts are joined by item and material before export, retaining all
twelve item roots and their mesh descendants for hit testing.

The served room is 586,584 bytes, below its 3,145,728-byte budget. It retains
25,634 triangles, 25 primitives, all 11 named materials and the two 512² textures,
now WebP. Both raw and served contract checks pass all 47 positions. P03's cabin
compression preserves mesh origins and material names; its roundtrip regression
covers the offset and material deduplication failures found during this ticket.

Every prescribed base hex is unchanged. Value variations and shaded faces retain
their source hue; the glass is the only cool material:

| Surface | sRGB hex | Hue |
| --- | --- | --- |
| Log | `#7a4a2c` | 23.08° |
| Plank | `#8c5a34` | 25.91° |
| Rug | `#a0582d` | 22.43° |
| Leather | `#5c331d` | 20.95° |
| Cloth | `#b07a52` | 25.53° |
| Ceramic | `#d9b58c` | 31.95° |
| Metal | `#4a3a30` | 23.08° |
| Paper | `#e6ceae` | 34.29° |
| Stone | `#6e5646` | 24.00° |
| Glass, alpha 0.35 | `#cfd9e6` | 213.91° |
| Dark interior and gap under shelf | `#120600` | 20.00° |

`blender/cabin/textures.py` makes the original rug and record-sleeve artwork with
the pinned Pillow. Both PNG sources have provenance `made:2026-09-25`, licence
`cc0`. They stay outside `src/lib/assets/`, so neither receives a manifest entry.
The Catherine reference is cited in `palette.py`; no reference image is copied.

The checker independently encodes Step 2's positions and directions. All 47 named
positions are within 0.01 m, all prescribed facings match, the three camera fields
of view are vertical degrees, and the connected navigation graph has exactly the
twelve reciprocal edges. The shelf and added panes use the maintainer-requested
revised contract below; all other positions, including the cameras, are unchanged.

Local evidence so far:

- `just python-check blender/cabin scripts/check_cabin.py`: passed.
- `just cabin-export`: passed, including the three 1170 × 2532 Eevee renders.
- `just check-cabin blender/out/cabin-raw.glb`: passed.
- `just check-cabin-self-test`: accepts the real room and refuses fourteen broken
  contracts, including missing nodes, bad positions, approaches, graph edges,
  camera fields, glass depth, mesh descendants, colours, materials and budgets.
- A disposable copy at `ai_tmp/cabin/renamed-nav.glb` has `nav.7` renamed.
  `just check-cabin ai_tmp/cabin/renamed-nav.glb` exits 1 and identifies the missing
  node and the approach/edges referring to it.
- `just assets-inspect blender/out/cabin-raw.glb`: confirms the counts above and
  the two embedded 512² PNG images.

The first visual review on 2026-09-25 requested a cozier room with more detail
and less sterile surfaces. The revision adds rounded upholstery, a loose cushion,
striped throws, folded curtains, books, mantel artwork and unlit candles, firewood,
subtle wood and stone value variations, and a patterned rug with fringe. New props
share their item's existing material groups; this first revision had 23 primitives
and two texture maps. Cloth faces point toward their visible surface for runtime
front-face rendering. The table book has separate cover boards and exposed pages.
The original images remain at `ai_tmp/cabin/*-before-review.png` for comparison.

A second review on 2026-09-25 identified a floating chair cushion and the shelf
blocking the room view. The cushion now leans 8° against the back and rests on the
seat. An evaluated-mesh diagnostic through `just model-diagnose` measures its
lowest point at (1.820547, 0.417000, 0.185000), within the seat's flat top: 0.003 m
of overlap with the 0.420 m seat surface. The shelf is now a 0.80 m low, open-backed
unit. It retains three levels, books, six records on the middle level, and a dark
gap beneath. That revision kept its original root and facing; the next request
below superseded its placement. The previous images remain at
`ai_tmp/cabin/*-before-contact-fix.png`; all four views were rendered again, and
the raw contract, eleven negative cases and Python checks pass after these fixes.

A third request on 2026-09-25 moved the shelf to the left wall opposite the chair
and added more windows. The shelf root is now (−2.30, 0, −0.40), facing +X. Its
extent along the wall stops at z 0.390, leaving 0.040 m before the water bowl
begins at z 0.430, so the bowls and their approach nodes need no move. The left pane above it and the
hearth pane beside the fireplace use the positions in Step 2. Wall openings,
deep frames, sills and curtains are authored around each. All three panes remain
separate transparent meshes under `item.window`; its existing origin and shared
interaction are retained. CONVENTIONS.md §5.2 and the P07a/P07b handoffs now cover
all three panes, including phase sky materials and weather outside each wall
within the existing total particle budget. This ticket adds no runtime effects.
The prior views are preserved as `ai_tmp/cabin/*-before-windows.png`.

The required revised review images are `ai_tmp/cabin/hearth.png`,
`ai_tmp/cabin/window.png` and `ai_tmp/cabin/chair.png`; an additional
`ai_tmp/cabin/overview.png` shows the set. The maintainer approved this revision
through the gallery on 2026-09-25. The exact chair position, target and 36° vertical field
of view produce a tight seat-and-arm crop at portrait aspect, with the table mostly
outside the frame. P07a's specified distance adjustment on portrait resize must address the
play framing; these contract camera values have not been silently changed.

The dark top plane is included as Step 2 directs. No door was added: that remains
the maintainer's open product choice. Baked 0.62 shadow values are retained for
P07a to assess alongside its runtime ramp. Review-only lights are omitted from
the export; their shadows are disabled to avoid Eevee's patterned translucent
glass shadow and leave the authored value planes visible.

## Open points

- **A door.** The PRD's room has no door; a cabin without one reads oddly from the
  window camera. Recommend a door on the −X wall near the +Z corner as set dressing,
  non-interactive, if the maintainer wants it; it costs nothing in the contract.
- **The ceiling plane.** Whether the dark plane at 2.4 is wanted or the cameras are
  framed so the top edge never shows; P07a can tell once it frames portrait.
- **Baked value steps versus lights.** §5.3 puts the separation in value; this ticket
  bakes some of it into vertex colour (shaded faces at 0.62) and the runtime's ramp adds
  the rest. If the two together over-darken, the baked step is the one to lift; the
  runtime's ramp is P07a's.
