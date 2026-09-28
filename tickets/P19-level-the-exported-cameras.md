---
id: P19
title: "Level the exported cameras: correct the roll in the room's build script and rebuild cabin.glb"
status: done
depends_on: [P11]
parallel_with: [P12, P13, P14, P15, P16, P17, P18]
branch: ticket/p19-level-the-exported-cameras
estimated_size: S
---

# P19: Level the exported cameras: correct the roll in the room's build script and rebuild cabin.glb

## Context

P07a found that the three camera presets P05 exported look where they should but are
rolled: their up vectors tilt the room sideways (the hearth camera's up is approximately
`(-.724913, -.593110, .350317)`). The maintainer approved levelling the runtime cameras
on 2026-09-25, so `src/routes/scene/camera.ts` keeps each preset's position, direction
and field of view and holds the horizon level itself (`P07a-scene-static.md`, hand-back
notes: "**P05 asset follow-up:** correct the exported camera roll"; open points: "P05
owns the exported camera-roll correction"). P05 was done, so P11 carried the asset
correction here.

The contract is `CONVENTIONS.md` §5.2: `camera.hearth`, `camera.window`, `camera.chair`
are empties whose position and −Z view direction are the preset, with `extras.fov` in
vertical degrees; `scripts/check_cabin.py` holds every position within a centimetre and
every facing, but says nothing about roll, which is how the roll shipped.

Read first: `blender/cabin/build.py` and the module that places the cameras (find it
with `grep -rn 'camera\.' blender/cabin/`); `scripts/check_cabin.py` (the facing check,
to extend with an up-vector check); `src/routes/scene/camera.ts` (the levelling, which
stays); `docs/design/the-room.md` "What checks what"; `docs/how-to/build-assets.md`.

## Goal

- The three camera empties export with local +Y up (world Y-up after export) and their
  −Z unchanged, so a viewer that does not level them shows a level room.
- `scripts/check_cabin.py` refuses a rolled camera (the up vector within a degree of
  world +Y), and its self-test has a fifteenth broken contract for it.
- `src/lib/assets/cabin.glb` rebuilt through `just cabin-export` and
  `just assets-build cabin` (which now ends with the checker), the manifest updated, and
  the runtime's own levelling left in place as a belt beside the braces.
- `docs/design/the-room.md`'s checker row names the roll among what it holds.

## Non-goals

- Moving any camera, or changing a field of view: the three presets' framing was
  approved.
- Removing the levelling from `camera.ts`; it costs nothing and guards the next export.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `blender/cabin/*.py` | repo | the camera empties' rotation |
| `scripts/check_cabin.py` | repo | the up-vector check and its self-test case |
| `src/lib/assets/cabin.glb`, `src/lib/assets/manifest.json` | repo | rebuilt; `source` `built:<date>` |
| `docs/design/the-room.md` | docs | the checker row |
| `tickets/P19-level-the-exported-cameras.md` | tickets | `status: done` |

## Steps

1. Write the checker's up-vector assertion first and run it against the committed
   `cabin.glb`: it must fail on all three cameras with the measured up vectors. Add the
   self-test case.
2. Correct the rotation in the build script (an empty looking along −Z with +Y up in
   glTF is a Blender empty with its local −Y forward and +Z up before `export_yup`;
   `CONVENTIONS.md` §1 fact 6), `just cabin-export`, `just check-cabin
   blender/out/cabin-raw.glb`.
3. `just assets-build cabin`; read the manifest diff; `just check`.
4. Confirm in `tests/scene-assets.test.ts` that the camera tests (horizons and portrait
   framing) still pass unchanged: the runtime levels a level camera to itself.

## Acceptance criteria

- [x] The checker refuses the previous `cabin.glb` and accepts the new one.
- [x] Positions, directions and fields of view unchanged to the checker's tolerance.
- [x] `just check` green.

## Verification

```sh
git show <the commit before the rebuild>:src/lib/assets/cabin.glb > ai_tmp/cabin-rolled.glb && just check-cabin ai_tmp/cabin-rolled.glb; echo "rc=$?"
just check-cabin
just check
```

Expected: the old file refused naming the cameras; the new file accepted; green.

## Hand-back notes

**The cause.** `layout.py` tracked each camera with `to_track_quat("-Z", "Y")` on a
vector in glTF coordinates and then carried the rotation into Blender. mathutils always
takes world Z as the up reference, and in glTF space Z is horizontal. So every preset
had a local +X with zero Z (rather than zero Y), and the up vector followed the view
direction round. The fix tracks in Blender space with `to_track_quat("Y", "Z")`. An
empty's local +Y exports as its glTF −Z, and its local +Z as glTF +Y. The `"-Z"` facing
in `empty()` is rotation 0, and `to_blender((0, 0, -1))` is Blender +Y. So step 2's
"local −Y forward" is not right for these empties. The facing check settled it on the
first export.

**The check, as agreed with the maintainer.** "Within a degree of world +Y" would refuse
a correct camera, because all three presets pitch down (about 9°, 13° and 23°). The
checker therefore holds the roll: local +Y within a degree of `normalise(Y − (Y·f)f)`,
where f is the preset's facing. This is the notion of level that
`tests/scene-assets.test.ts` asserts of the runtime camera. The fifteenth self-test case
is the rotation P05 shipped on `camera.hearth`: the right facing, rolled.

**Up vectors (world, local +Y), before → after.** −Z and `extras.fov` are identical to
six places:

| Camera | Before | After | −Z |
| --- | --- | --- | --- |
| hearth | (−0.724913, −0.593110, 0.350317) | (−0.061683, 0.975085, −0.213086) | (−0.271130, −0.221834, −0.936631) |
| window | (0.552109, −0.106175, 0.826984) | (0.128405, 0.987730, −0.088896) | (0.812104, −0.156174, −0.562226) |
| chair | (0.585346, −0.365841, 0.723554) | (0.254772, 0.923548, −0.286618) | (0.613572, −0.383483, −0.690268) |

**What changed in the file.** The rebuild is deterministic. A node-by-node comparison of
the old and new `cabin.glb` found identical binary chunks and identical top-level JSON.
The only differences are the three camera nodes' `rotation`, so no position, mesh or
extra moved.

**Manifest diff** (the `cabin.glb` entry only):

```diff
-  {"path": "src/lib/assets/cabin.glb", "bytes": 586584, "sha256": "1064f47b92d48128ce4b36ddfb6bad043a6484e338b278e09c65da278da44d07", "source": "built:2026-09-25", "licence": "cc0", "budget": 3145728},
+  {"path": "src/lib/assets/cabin.glb", "bytes": 586592, "sha256": "0990eb3867c5d38a263a032cbc63c552a8c997571f465d0cd92411fd680246a9", "source": "built:2026-09-28", "licence": "cc0", "budget": 3145728},
```

**Evidence.**

```text
just check-cabin (old file)   camera.hearth / camera.window / camera.chair: rolled; rc=1
just check-cabin blender/out/cabin-raw.glb   contract valid; 25,634 triangles, 25 primitives, all 47 positions within 0.01 m
just check-cabin-self-test    valid input accepted, 15 broken contracts refused
just assets-build cabin       src/lib/assets/cabin.glb: cabin contract valid (same line)
tests/scene-assets.test.ts    13 passed, the three camera fits among them, tests/ unchanged
just check                    All checks passed and the worktree is unchanged.
```

**Also touched.** `camera.ts` got a comment-only change: the levelling stays, and the
comment no longer says the presets roll. `CONVENTIONS.md` §5.4 now reads "(corrected by
P19)". `docs/design/the-room.md` names the roll in the contract row and the checker row,
and "fifteen" in the self-test row. The review renders in `build.py` are Blender cameras
tracked in Blender space; they were already level and are unchanged. Pushing and the pull
request were not done; each is a separately authorised action.

## Open points

- **None known.** The maintainer approved the levelled framing; this ticket makes the
  asset say what the runtime already shows.
