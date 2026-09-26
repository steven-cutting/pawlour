---
id: P10
title: "Device verification: iPhone 17 Pro against the budget"
status: open
depends_on: [P04, P07b, P08, P09]
parallel_with: []
branch: ticket/p10-device-verification
estimated_size: M
---

# P10: Device verification: iPhone 17 Pro against the budget

## Context

Every player has at least an iPhone 17 Pro (`PRD.md`, "Who it is for"), and `PRD.md`'s
"Performance budget" table is the contract the scene owes on that phone. Nothing before
this ticket has run on one: P03 counted triangles and draw calls on the built files, P07a
and P07b judged the look on a Mac, and the story job's headless Chromium is not a phone.
This ticket puts the built site on the phone, measures every row of the table by a
stated method, records the figures, fixes what is within its reach, and hands the rest
back.

What is within reach: figures in `src/routes/scene/` (the DPR cap, particle counts, the
fire's plane count, crossfade times, the lighting rigs' intensities) and the assets'
budgets through `scripts/build_assets.sh`'s parameters (texture size, WebP quality,
meshopt level). What is not: the director, the components, the clips, the room's
geometry, `CONVENTIONS.md`'s budgets themselves. A miss that needs one of those is a
hand-back to P11 with the measurement beside it.

`CONVENTIONS.md` §11 claim 6 (WebP and meshopt decode on the device) and claim 7 (draw
calls under 60 with the room) are proven here; claim 9 is P12's. `CONVENTIONS.md` §5.4
is what the runtime promises; §12 names the draw-call risk this ticket measures.

Sources, at the commits `CONVENTIONS.md` §0 pins (read-only): H `docs/specs/appearance.allium`
lines 140–144 (reduced motion wins) and `docs/explanation/accessibility.md` lines 126–136
(the `requestAnimationFrame` loop is the game's to stop), for the reduced-motion check;
T `template/Justfile` for `preview` (bound to `127.0.0.1`) beside this repository's
`preview-lan` (`CONVENTIONS.md` §2.3). This repository on `main`: `src/routes/scene/*`
(P07a, P07b), `src/routes/+page.svelte` (P08), `src/lib/assets/manifest.json`,
`docs/reference/budget.md` (P09, if it has landed; otherwise the figures wait in the
hand-back for P11 to carry).

**Authorisation.** Nothing here pushes or touches another repository. `just preview-lan`
opens a port on the local network; it is a local server, needs no asking, and is stopped
when the ticket ends. Pushing and the pull request are separately authorised.

## Goal

- Every row of `PRD.md`'s budget table measured on an iPhone 17 Pro in Safari by the
  method Step 3 states, with the figure, the method and the date in the hand-back and
  in `docs/reference/budget.md`'s "Measured" column.
- `CONVENTIONS.md` §11 claims 6 and 7 recorded with their outcome.
- Context loss, reduced motion, the sound switch and all four theme and contrast
  combinations exercised on the device.
- Every miss either fixed within `src/routes/scene/` or the asset parameters, with the
  figure re-measured, or handed back with its measurement.
- `just check` green.

## Non-goals

- Anything outside `src/routes/scene/`, `scripts/build_assets.sh`'s parameters and
  `docs/reference/budget.md`'s table. A clip that reads wrong on the phone, a control
  under 44 px, a caption that is off: hand-backs.
- Changing a budget. The figures are `PRD.md`'s; a budget this ticket believes wrong is
  an open point with the evidence, not an edit.
- Android, desktop browsers, older iPhones: `PRD.md` names the floor and this ticket
  measures the floor.
- The deploy (P12). Everything here runs from `just preview-lan` on the LAN.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `src/routes/scene/scene.ts`, `fire.ts`, `weather.ts`, `lighting.ts`, `camera.ts` | repo | P07a, P07b | figures only (DPR cap, counts, intensities, durations), each change recorded with the before and after measurement |
| `src/routes/scene/debug.ts` | repo | new | the `?debug` hook (Step 2); removed before the ticket is done, or kept behind the query with a comment if Open point 1 says so |
| `scripts/build_assets.sh` | repo | P03 | parameters only (texture size, WebP quality, meshopt level), and the rebuilt assets that follow |
| `src/lib/assets/biscuit.glb`, `cabin.glb`, `src/lib/assets/manifest.json` | repo | `just assets-build` | only if a parameter changed; the manifest diff read before commit |
| `docs/reference/budget.md` | repo | P09 | the "Measured" column filled |
| `tickets/P10-device-verification.md` | tickets | this file | `status: done` |

## Steps

1. **The phone and the Mac.** Build with `just frontend-build` (no `BASE_PATH`, so the
   site is served at `/`), run `just preview-lan`, and open the printed LAN address on
   the phone in Safari. On the phone, Settings → Safari → Advanced → Web Inspector on;
   on the Mac, Safari → Develop → the phone → the page. Record the iOS and Safari
   versions and the phone's model identifier.

2. **The debug hook.** Add `src/routes/scene/debug.ts`: when the page's URL carries
   `?debug` (read inside `onMount`, never at module scope: the route prerenders), the
   scene logs to the console once a second the frame rate averaged over the last second
   (from the frame port's timestamps), `renderer.info.render.calls`,
   `renderer.info.render.triangles`, `renderer.info.memory.textures` and the current
   `SceneState.activity`; and exposes `window.__pawlour = { loseContext(), restoreContext() }`
   using the `WEBGL_lose_context` extension. This is the only place the scene writes to
   `window`, it is gated by the query, and Step 8 decides whether it stays.

3. **The table, row by row.** For each row of `PRD.md`'s budget, the method:
   - *Frame rate*: hearth camera, evening, rain, sound off, Biscuit walking bed → toy →
     water in a loop for two minutes; the debug log's per-second figure, reported as the
     minimum and the median; the Web Inspector's Timelines tab (Rendering Frames) as
     the second opinion.
   - *Device pixel ratio*: the debug log's `renderer.getPixelRatio()`, expected 2 on a
     phone reporting 3.
   - *Draw calls*: `renderer.info.render.calls` at the hearth camera with fire and
     weather on; `CONVENTIONS.md` §11 claim 7.
   - *Biscuit's triangles*: `renderer.info.render.triangles` with the room hidden (the
     debug hook takes `hideRoom()`), and the figure P03 recorded from the file.
   - *Served files*: `ls -l src/lib/assets/` and the manifest; the sizes the Network tab
     reports on the phone (transfer size after Pages would serve them, which preview
     approximates: record both).
   - *First load*: the Mac's Web Inspector Network tab with the throttling profile
     nearest 4G, cache disabled, from a reload to the first drawn frame (the debug log's
     first line); reported three times, median taken.
   - *First frame on a 4G profile*: the same measurement.
   - *Context loss*: `__pawlour.loseContext()` from the console; the still for the
     current activity and phase appears with the caption as its alt; a tap on it calls
     `forceContextRestore` and the scene returns; recorded as pass or fail with what was
     seen.

4. **§11 claim 6 on the device.** The Network tab shows `biscuit.glb` and `cabin.glb`
   loaded once and the console shows no `EXT_texture_webp` or meshopt error; the
   textures are visible (not black or magenta). Record the outcome.

5. **Reduced motion and the setting.** Settings → Accessibility → Motion → Reduce Motion
   on the phone: the scene stops (the debug log's frame counter stays at 0 after one
   frame per state change), the fire holds its middle frame, tapping Bed cuts to the
   still, captions still appear, the time control still works. Then Reduce Motion off and
   the platform's animations setting off (if the game exposes it; if it does not, the
   `data-animations` attribute removed through the console): the same. Record both.

6. **Sound.** Turn the switch on: the fire crackle starts inside the gesture with no
   error; rain joins when the weather is rain; `lapping` on drink, `squeak` on play.
   Reload with the switch persisted on: nothing plays until the switch is touched (the
   `AudioContext` needs the gesture again, and `SoundControl` handles it; if it does not,
   that is a hand-back to P11 with the console error).

7. **The four combinations.** With the phone's Appearance light and dark, and
   Accessibility → Display → Increase Contrast on and off: the header, the item
   controls, the caption and the settings dialog are legible; the title card is the
   same in all four; screenshots to `ai_tmp/p10-<combination>.png`. This is an eye
   check; the ratios are proven by tests already.

8. **Fix what is within reach, then re-measure.** A frame-rate miss: lower the DPR cap
   to 1.5, halve the weather's instance count, drop the fire to two planes, in that order,
   each re-measured. A size miss: `build_assets.sh`'s WebP quality to 75, colour maps to
   768², meshopt level `high`, each rebuilt with `just assets-build`, `just check-assets`,
   and the manifest diff read. Every change is one figure with its before and after in
   the hand-back. Decide whether `debug.ts` stays: recommend keeping it behind the query
   with a comment naming this ticket, since P12's first deploy is measured the same way.

9. **Write the figures.** Fill `docs/reference/budget.md`'s "Measured" column with the
   figure and the date, and add a line under the table naming the phone, iOS and Safari
   versions. If P09 has not landed, the figures go in the hand-back and P11 carries them.

10. **Gates.** `just frontend-static`, `just check-assets`, `just check`. Set `status:
    done`. Commit. Pushing and the pull request are authorised separately.

## Acceptance criteria

- [ ] Every row of `PRD.md`'s budget table has a measured figure, a method and a date in
      the hand-back, and in `docs/reference/budget.md` if P09 has landed.
- [ ] `CONVENTIONS.md` §11 claims 6 and 7 recorded with their outcome.
- [ ] Context loss shows the still and recovers on tap, recorded.
- [ ] Reduced motion stops the loop; the still diorama works; recorded.
- [ ] Sound starts only inside the gesture; recorded.
- [ ] Four screenshots under `ai_tmp/` for the four combinations.
- [ ] Every miss is fixed and re-measured, or handed back with its figure.
- [ ] `just check` green.

## Verification

```sh
just frontend-build
just preview-lan
ls -l src/lib/assets/*.glb src/lib/assets/audio/ src/lib/assets/stills/ | head -30
just check-assets
git diff --stat main -- src/routes/scene scripts/build_assets.sh docs/reference/budget.md
just check
```

Expected: a build; a server printing a LAN address the phone reaches; sizes under the
budgets; `check-assets` green; a diff touching only the listed files; `just check` green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- The phone's model identifier, iOS and Safari versions, the date.
- The measured table: every row, figure, method, minimum and median where a range was
  taken.
- §11 claims 6 and 7 outcomes.
- Every figure changed in `src/routes/scene/` or `build_assets.sh`, with before and
  after.
- Every miss handed back, with its figure and the ticket it is addressed to.
- Whether `debug.ts` was kept.
- The screenshot paths.
- Which open points below were settled.

## Open points

- **Keep the debug hook.** It writes to `window` behind a query and is the only way to
  measure on a phone without a desktop tool; recommend keeping it, gated, with a
  comment, and recording it in `docs/how-to/test-on-a-phone.md` through P11.
- **The 4G profile.** The Mac's Web Inspector throttling presets change by version;
  record the preset used and its stated figures rather than the word "4G".
- **A budget that is wrong.** If 60 fps holds only at DPR 1.5 on this phone, the DPR
  row's budget of 2 and the frame-rate row conflict; record which the maintainer prefers
  as an open point for P11, and ship the frame rate.
