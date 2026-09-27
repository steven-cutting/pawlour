---
id: P19
title: "Level the exported cameras: correct the roll in the room's build script and rebuild cabin.glb"
status: open
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

- [ ] The checker refuses the previous `cabin.glb` and accepts the new one.
- [ ] Positions, directions and fields of view unchanged to the checker's tolerance.
- [ ] `just check` green.

## Verification

```sh
git show <the commit before the rebuild>:src/lib/assets/cabin.glb > ai_tmp/cabin-rolled.glb && just check-cabin ai_tmp/cabin-rolled.glb; echo "rc=$?"
just check-cabin
just check
```

Expected: the old file refused naming the cameras; the new file accepted; green.

## Hand-back notes

Filled in by the agent that executes this ticket: the up vectors before and after, and
the manifest diff.

## Open points

- **None known.** The maintainer approved the levelled framing; this ticket makes the
  asset say what the runtime already shows.
