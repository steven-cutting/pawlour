---
id: P18
title: "Stills captured from the runtime at the hearth camera, under the same eighteen names"
status: open
depends_on: [P11]
parallel_with: [P12, P13, P14, P15, P16, P17]
branch: ticket/p18-stills-from-the-runtime
estimated_size: M
---

# P18: Stills captured from the runtime at the hearth camera, under the same eighteen names

## Context

The eighteen stills under `src/lib/assets/stills/` are what still mode shows before the
renderer has drawn, what context loss shows, and what a device without WebGL 2 sees.
P04 rendered them in Blender on a neutral ground from a fixed review camera, because the
room was not in Blender (`P04-clips.md`, hand-back notes, "The still renderer uses the
six specified activity frames"; open point "Stills from the runtime": "Once P07a draws
the room, stills captured from the runtime at the hearth camera would match what the
player sees; whether P07a or P11 re-renders them is the maintainer's call. Recommend:
P11, after the look is approved, with the same file names so nothing else changes.").
P11 carried it here rather than doing it, because it is asset work with the maintainer's
eye as its gate, not a fix.

The look was approved on 2026-09-25 (`P07a-scene-static.md`, "The maintainer approved
all three screenshots"). The runtime can draw a still of any state: `still.ts` draws one
frame for a `SceneState`, `SceneCanvas` exports `capture()` (a synchronous render, then
`toDataURL('image/png')`), and `just scene-review <script>` drives a disposable route in
Playwright's Chromium with WebGL 2 (`docs/reference/testing.md`). `CONVENTIONS.md` §3,
"Stills": 1170×2532, WebP at quality 80, each under 262,144 bytes, `built:` files.

Read first: `CONVENTIONS.md` §3 "Stills" and §5.4; `src/routes/scene/still.ts` (which
still a state names, and how sleep is drawn in the bed and the chair); `scripts/contact_sheet.py`
(the still mode, to retire or keep); `scripts/placeholder_still.mjs` (encoding to the size
and budget with `sharp`); `Justfile` (`model-stills`, `scene-review`); `docs/how-to/author-a-clip.md`
and `docs/how-to/build-assets.md` where the stills are described.

## Goal

- Eighteen new files under the same names, each a frame of the real room at the hearth
  camera in the right phase, with her at the right thing in the right activity's pose
  (the six activities × three phases), 1170×2532 WebP under budget.
- A recipe, `just scene-stills` or the name the maintainer prefers, that captures them
  from the runtime in Chromium so they can be rebuilt after a look change, and the
  handbook page that owns the procedure says so.
- The maintainer's approval of a contact sheet of all eighteen under `ai_tmp/` before
  the ticket is done.

## Non-goals

- Changing what still a state names, or the still's place in the interface.
- Running Chromium inside `just check`; the recipe is a build step like the Blender
  ones, and the committed files are what ship.
- A change to the clips or the room.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `src/lib/assets/stills/*.webp` | repo | the eighteen files |
| `src/lib/assets/manifest.json` | repo | through `just assets-manifest`; `source` `built:<date>` |
| `scripts/capture_stills.mjs` (or a name in the script's register) | repo | new: the capture, on Playwright's Chromium and `sharp` |
| `Justfile` | repo, reserved (§10) | the recipe |
| `scripts/contact_sheet.py` | repo | its still mode removed if nothing uses it, or kept and said why |
| `docs/how-to/build-assets.md`, `docs/how-to/author-a-clip.md` | docs | where the stills come from |
| `tickets/CONVENTIONS.md` | tickets | §3 "Stills": the source sentence, marked "(corrected by P18)" |
| `tickets/P18-stills-from-the-runtime.md` | tickets | `status: done` |

## Steps

1. **A state per still.** Build the eighteen `SceneState`s (activity, `at`, phase, the
   phase's lights, the fire level, clear weather, the hearth camera) from
   `initialState` and the director's shape; sleep is `sleep.bed` at the bed and
   `sleep.chair` at the chair, as `still.ts` names them.
2. **Capture.** A `just scene-review` script that mounts the real scene at 1170×2532
   (device pixel ratio 1), applies each state with motion off, waits on `onReady`, calls
   `capture()`, and writes a PNG per state under `ai_tmp/stills/`. Frame the clip at a
   settled moment (the pose each activity holds, not its first frame).
3. **Encode.** WebP quality 80 through `sharp`, refuse any file over 262,144 bytes, and
   write a contact sheet of the eighteen for the maintainer.
4. **Approve.** Stop; the maintainer's eye is the gate (§10). Record the path and the
   date.
5. **Ship.** Copy into place, `just assets-manifest`, set `source` to `built:<date>`,
   `just check-assets`, the docs, `just check`.

## Acceptance criteria

- [ ] Eighteen files under the existing names, each under budget, each a runtime frame.
- [ ] The maintainer's approval recorded with the sheet's path.
- [ ] `tests/scene-canvas.test.ts` and the stories that show a still unchanged and
      green (they load the files by name).
- [ ] `just check` green.

## Verification

```sh
ls src/lib/assets/stills/ | wc -l
just check-assets
just check
```

## Hand-back notes

Filled in by the agent that executes this ticket: the recipe's name, the largest file,
and whether `scripts/contact_sheet.py`'s still mode survives.

## Open points

- **The pixel ratio.** The phone draws at a capped ratio of 2 on a 390-pixel-wide
  viewport; a capture at 1170×2532 and ratio 1 frames the same picture at the same pixel
  size. Confirm the framing matches a phone screenshot before encoding all eighteen.
