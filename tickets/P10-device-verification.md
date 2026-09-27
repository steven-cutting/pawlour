---
id: P10
title: "Device verification: iPhone 17 Pro against the budget"
status: done
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

- [x] Every row of `PRD.md`'s budget table has a measured figure, a method and a date in
      the hand-back, and in `docs/reference/budget.md` if P09 has landed (the 4G row is
      recorded as not measured, with the reason).
- [x] `CONVENTIONS.md` §11 claims 6 and 7 recorded with their outcome.
- [x] Context loss shows the still and recovers on tap, recorded.
- [ ] Reduced motion stops the loop; the still diorama works; recorded (deferred by the
      maintainer to a follow-up; the loop-stop was verified in Chromium through the hook).
- [x] Sound starts only inside the gesture; recorded.
- [ ] Four screenshots under `ai_tmp/` for the four combinations (deferred by the
      maintainer to a follow-up).
- [x] Every miss is fixed and re-measured, or handed back with its figure.
- [x] `just check` green.

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

Executed 2026-09-26. The maintainer drove the phone and the Mac's Web Inspector and
relayed the figures; the agent built and verified the hook, then wrote the figures.

**The phone.** iPhone 17 Pro Max (the model name from Settings → General → About; the
model identifier is exposed neither there nor to a page), iOS 26.6.2, Safari 26.6.1
(from `navigator.userAgent`, whose "iPhone OS 18_7" is the frozen UA string). Served by
`just preview-lan` at `http://192.168.0.26:4173/`, build of this change on `668a92c`.

**The measured table.** Method for every row: the `?debug` hook's once-a-second console
line and its `report()`, read in the Mac's Web Inspector; sizes from the phone's Network
tab; file bytes from the manifest.

| Row | Measured | Outcome |
| --- | --- | --- |
| Frame rate | Run 2, hearth/evening/rain, sound off, Safari in the foreground, 147 contiguous samples over 149 s of bed → toy → water: median 60, minimum 53 in the sample at t=3 s (the load settling), minimum 58 from t=4 s on; walking 58–62, everything else 60–61. Run 1 (snow) read the same but had two gaps where the phone suspended the page; its 0 and 16–19 readings sit on those boundaries and were discarded. Timelines → Rendering Frames showed steady composite events, nothing flagged. | Pass |
| Device pixel ratio | 2 on a screen reporting 3 | Pass |
| Draw calls | 53–54 with fire and rain on; 59 with motion off (still fire, no particles) | Pass |
| Biscuit's triangles | `hideRoom()`: 28 calls, 173,656 triangles = 2 × 86,828, the file count P03 recorded, because the ink outline (`paint(…, true)`) draws every skinned mesh a second time | **Miss** against 45,000 |
| Biscuit, served | 2,525,000 bytes; 2.53 MB on the phone, loaded once | Pass |
| Room, served | 586,584 bytes; 586.6 KB on the phone, loaded once | Pass |
| First load | 4,263,135 bytes fetched up to the first frame, uncompressed from the preview: 3,111,584 models, 813,871 scripts, 278,963 fonts and page, 38,020 images, 20,697 styles (a Chromium capture on the Mac of the same build; on the phone only the two models were read off the Network tab, at 2.53 MB and 586.6 KB, and static file sizes do not depend on the device) | Pass |
| First frame on 4G | **Not measured.** Safari's Web Inspector has no throttling; the phone's Network Link Conditioner needs Xcode on the Mac and a restart the maintainer could not do today. Unthrottled on the LAN: 416 ms and 487 ms from navigation start. | Open, follow-up |
| Context loss | `__pawlour.loseContext()`: the still appeared; a tap brought the room back and the log resumed | Pass |

The figures are in `docs/reference/budget.md` (P09 had landed) with the device named
under the table. Working notes, including run 1, are in `ai_tmp/p10-measurements.md`
(gitignored).

**§11 claim 6:** holds on the device. Both GLBs loaded once, no `EXT_texture_webp` or
meshopt error in the console, textures visible (the maintainer saw the room drawn; the
console's only mentions of "texture" were info lines).
**§11 claim 7:** holds on the device. Biscuit alone 28 calls (the claim says at most 30);
with the room, fire and rain 54 (under 60). Chromium on the Mac at a 361 × 468 canvas
read 63 and 33: the count depends on what the framing leaves in the frustum, so the
phone's figure is the one that counts and CONVENTIONS §11.7 needs no correction.

**Figures changed in `src/routes/scene/` or `build_assets.sh`:** none. No frame-rate or
size miss, so the DPR cap (2), the particle counts (300/200/6), the fire's three planes
and the asset parameters are as P07a, P07b and P03 left them. No asset was rebuilt.

**Changes beyond the file table, each agreed with the maintainer on 2026-09-26:**

- `src/routes/scene/scene.ts` gains `SceneHandle.diagnostics()` (`read()`, `hideRoom()`,
  `showRoom()`, `loseContext()`): the renderer, the room and the kept `WEBGL_lose_context`
  extension are closure locals, so the hook could not reach them otherwise. `hideRoom`
  hides every child of the world but Biscuit's root, because the fire, weather, disc,
  vignette and still-fire plane sit beside the room, not under it.
- `src/routes/scene/SceneCanvas.svelte` exports `diagnostics()`, and `src/routes/+page.svelte`
  installs the hook inside `onMount` (the route prerenders), passing the timer port,
  `performance.now`, `window` as the host, `console.log`, and a source that reaches the
  canvas, the director's state and the motion switch.
- `src/routes/+page.svelte`: **a defect found by the hook and fixed here** ("Fix it",
  maintainer). With motion off the still diorama was redrawn four times a second, one
  draw per director tick, on `main` with no hook involved: `animations={scene.motion}`
  made the canvas's effect track the whole `scene` signal, so every tick re-ran it and
  `apply()` drew once. `const motion = $derived(scene.motion)` memoises the boolean;
  verified in Chromium (counter 0 between changes) and the route tests still pass. No
  jsdom test can hold this (it needs a drawing scene); it belongs to the WebGL2 lane
  (P14). `MotionOffIsAStillDiorama`'s "drawn once per change" now holds.
- `tests/scene-debug.test.ts` (new) and a row in `docs/reference/testing.md`;
  `docs/how-to/test-on-a-phone.md` names the hook's calls and the Safari throttling fact.

**Frame counting.** The delta is clamped at zero: the failure-path `restore()` rebuilds the renderer and its counter restarts, so the first sample after it would otherwise read negative. Step 2 said "from the frame port's timestamps". The hook counts the
renderer's own `info.render.frame` on the timer port instead: a second frame-port
subscriber keeps requesting frames after the scene has stopped its loop and would read
60 in a still diorama, where Step 5 needs the counter at 0. The baseline is taken when
the hook is created, so the first line counts only frames drawn after it started.

**Misses and hand-backs, with figures:**

- *Biscuit's triangles*, 86,828 in the file and 173,656 drawn against a 45,000 target:
  to **P11**, with P03's open point. 60 fps holds at this count, so P03's recommendation
  (no `simplify` stage) stands; the PRD row is the thing to revisit, and the outline
  pass doubles whatever the file holds.
- *First frame on 4G*, not measured: to a **follow-up** once Xcode is on the Mac; the
  how-to now says how.
- *Reduced motion on the device* (Step 5, both halves) and *the four theme and contrast
  combinations* (Step 7): **deferred by the maintainer** to an optional follow-up ticket
  ("Let's deal with accessibility later"). The hook's `setAnimations(false)` path was
  verified in Chromium; no phone screenshots were taken, so the "four screenshots"
  acceptance criterion is unmet by decision. Note for that ticket: `src/app.html`
  hard-codes `data-theme="dark"`, so the phone's Light appearance may not change the
  page, and nothing in the page reads `prefers-contrast`.
- *Sound* (Step 6): the mechanism passes — the switch started sound inside the gesture
  with no console error, squeak on play and lapping on drink were heard. The character
  of the synthesised sounds is a hand-back to **P11**: the maintainer heard "static that
  kind of sounds like rain, but it plays even when it is not raining" (the fire crackle
  reads as rain), the squeak "kind of sounds like chirping" and the drinking "sounds like
  spanking". `scripts/make_audio.py`'s output needs an ear, or real recordings. The
  "reload with the switch persisted on" half is moot: sound is not persisted
  (`SoundNeverStartsUnasked`); a reload starts silent with the switch off.
- *The redraw-per-tick defect* was fixed here rather than handed back (above).
- *The maintainer's copy of the run*: `copy()` in the Web Inspector returns `undefined`
  and puts the text on the Mac's clipboard; `JSON.stringify(__pawlour.report())` prints
  it instead. The how-to says so.

**`debug.ts` was kept**, gated by the query, with a comment naming this ticket and why
it stays; `docs/how-to/test-on-a-phone.md` documents it (Open point 1 settled: keep).
Without `?debug` nothing is written to `window` (verified in Chromium and by the unit
test).

**Screenshot paths:** none on the phone (deferred, above). Chromium evidence of the hook
on the Mac: `ai_tmp/p10-local-debug.png` (the room drawn at `?debug`) and
`ai_tmp/p10-local-lost.png` (the still and retry after `loseContext()`), gitignored.

**Open points settled:** 1, keep the hook (kept, documented). 2, the 4G profile: Safari
has no presets; the phone's Network Link Conditioner is the throttle, not measured today.
3, a wrong budget: not reached, 60 fps holds at DPR 2; the triangles budget is the one
that is wrong, handed to P11 with the figure.

## Open points

- **Keep the debug hook.** It writes to `window` behind a query and is the only way to
  measure on a phone without a desktop tool; recommend keeping it, gated, with a
  comment, and recording it in `docs/how-to/test-on-a-phone.md` through P11.
- **The 4G profile.** The Mac's Web Inspector throttling presets change by version;
  record the preset used and its stated figures rather than the word "4G".
- **A budget that is wrong.** If 60 fps holds only at DPR 1.5 on this phone, the DPR
  row's budget of 2 and the frame-rate row conflict; record which the maintainer prefers
  as an open point for P11, and ship the frame rate.
