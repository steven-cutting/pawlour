---
id: P08
title: "Interface: the components, the page, the ports in `onMount`, captions, settings, photo mode, audio"
status: open
depends_on: [P06, P07a]
parallel_with: [P04, P05, P07b, P09]
branch: ticket/p08-interface
estimated_size: L
---

# P08: Interface: the components, the page, the ports in `onMount`, captions, settings, photo mode, audio

## Context

Everything the player touches outside the canvas is this ticket: the row of item
controls, the settings dialog with its time, sound and camera controls, the caption and
its announcement, the loading and photo title card, the photo button, the page that
mounts all of it, constructs every port in `onMount` and hands the director's state down
as props, and the five audio loops the sound switch plays. `CONVENTIONS.md` §7 is the
layout and the behaviour of each control; §5.3 is the graphic register the title card
wears; §6.2 is the audio port this ticket feeds; §3 is where the audio files live and how
they are licensed; §8 names the guarantees each control answers to.

The scene itself is P07a's (`src/routes/scene/SceneCanvas.svelte`, already on `main`)
and P07b's, which runs beside this ticket and touches only `src/routes/scene/`. The
director, the captions bank and the three game ports are P06's, on `main`. This ticket
consumes both and adds nothing under `src/routes/scene/` or `src/lib/domain/`.

Why the components live under `src/lib/components/`: T's contract says every component
lands with a test and a story in the same change (T `template/AGENTS.md.jinja`, "A new
component lands with its test and its story"), stories run axe with `test: 'error'`, and
`src/lib/**` is measured at 90 on all four coverage figures. A component here is
therefore small, takes state and callbacks as props, and reaches no global; the page is
the one place a port is constructed, inside `onMount`, as P `src/routes/+page.svelte`
lines 68–83 do it (`createStore({ storage: createWebStorage(), clock:
createSystemClock(), random: createCryptoRandom(), ..., preferences:
createMediaPreferences(), timer: createIntervalTimer() })`).

Sources, at the commits `CONVENTIONS.md` §0 pins (read-only):

- T at `v2.1.0` (`git -C /Users/scutting/projects/biscuit_games_template fetch --tags`,
  then `git show v2.1.0:<path>`): `template/stories/Lockup.stories.svelte` (the Svelte
  CSF shape: `defineMeta`, an `OVERVIEW` string, a play that measures against
  `MINIMUM_TOUCH_TARGET` at `NARROWEST_SUPPORTED_WIDTH` under a pinned viewport),
  `template/tests/lockup.test.ts` and `template/tests/route.test.ts` (query by role and
  name, never by class), `template/src/routes/+page.svelte` (the seed this ticket
  replaces, and its two comments on `onMount` and unused selectors),
  `template/.agents/skills/accessibility-review/SKILL.md` (seven steps), and
  `template/vitest.storybook.config.ts` (`optimizeDeps.include`).
- H at `575e3dd`: `src/lib/index.ts` lines 26–48 (the components: `Announcer`, `Button`,
  `HeaderBar`, `IconButton`, `Modal`, `Notice`, `SegmentedControl`, `Switch` are the ones
  used here), `src/lib/components/Modal.svelte` and `Switch.svelte` (props and the
  accessible names they take), `tests/contrast.test.ts` lines 1–60 (the shape of a
  contrast measurement read from a stylesheet on disk, driven through the root
  attributes for all four combinations), `docs/specs/operation.allium` lines 118–252 and
  258–287 (the direct-manipulation and dialog clauses), `docs/explanation/accessibility.md`
  lines 126–136 (motion) and 200–205 (`Announcer`).
- P at `a2860fc`: `src/routes/+page.svelte` lines 40–90 (ports in `onMount`, the state
  held in the page), `src/lib/components/` for how a Poodl component takes callbacks.
- This repository on `main`: `src/lib/domain/director.ts` and `src/lib/data/captions.ts`
  (P06), `src/lib/ports/{timer,frame,audio}.ts` (P06), `src/routes/scene/SceneCanvas.svelte`
  and its props (P07a), `docs/specs/cabin.allium` (P01), `src/lib/assets/manifest.json`.

**Authorisation.** No step pushes, opens a pull request or touches another repository.
Downloading a CC0 audio file (Step 9) is a network read and needs no asking, but the URL
and licence page are recorded. Pushing and the pull request are separately authorised.

## Goal

- Eight components under `src/lib/components/`, each with `tests/<name>.test.ts` and
  `stories/<Name>.stories.svelte`, built from platform components only, taking state and
  callbacks as props, reaching no global.
- `src/routes/+page.svelte` replacing T's seed with the layout of `CONVENTIONS.md` §7:
  `HeaderBar` with the `Lockup` and a Settings `IconButton`, `SceneCanvas`, the hidden
  sentence naming the scene state, `Caption`, `ItemControls`, `SettingsDialog`; every
  port constructed in `onMount`; the director's state in a `$state` in the page; the
  timer ticking the director at 250 ms; `clockPhase` read once a minute.
- `src/lib/photo.ts`, pure and tested: the title-card composition for photo mode.
- `src/lib/components/overlay.css`: the graphic register's tokens, measured against the
  platform floors in all four combinations by a test.
- Five audio loops under `src/lib/assets/audio/`, each under 524,288 bytes, listed in the
  manifest with a settled licence, and `audio.enable()` called only inside the switch's
  handler.
- `tests/route.test.ts` updated for the new page; `just frontend-coverage` at or above 90
  on all four figures; `just check` green.
- The accessibility review at 320 px with every control measured at 44 px and a
  screenshot recorded.

## Non-goals

- Anything under `src/routes/scene/`: P07a and P07b. This ticket passes props to
  `SceneCanvas` and calls the functions it exports; it changes none of them. A change it
  needs there is handed back.
- The director's rules, the captions bank, the ports' shapes: P06. A caption this ticket
  finds wanting is handed back, not edited.
- The share sheet for photo mode (`PRD.md`, v1.1), the caption log, the treat jar's
  control (v1.1: `ItemControls` takes its items as a prop, so adding `jar` later is a
  data change).
- The handbook pages describing the interface: P09. The device measurements: P10.
- `docs/manifest.yml`, `docs/README.md`, `package.json`, `vitest.storybook.config.ts`
  and every other file `CONVENTIONS.md` §10 reserves. Step 4 checks
  `optimizeDeps.include`; if it needs a change, that is a hand-back to P11, and the
  story that needs it is written so that it passes once the change lands and is marked
  `skip` with a named reason until then.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `src/lib/components/ItemControls.svelte` | repo | new | a wrapping grid of platform `Button`s, one per entry prop (the seven items and Pet), three per row at 320 px |
| `src/lib/components/TimeControl.svelte` | repo | new | `SegmentedControl` Auto, Morning, Evening, Night |
| `src/lib/components/SoundControl.svelte` | repo | new | `Switch`, off by default; `onenable` and `ondisable` callbacks |
| `src/lib/components/CameraControl.svelte` | repo | new | `SegmentedControl` Hearth, Window, Chair |
| `src/lib/components/Caption.svelte` | repo | new | a `Notice` and an `Announcer` fed the same sentence |
| `src/lib/components/TitleCard.svelte` | repo | new | the loading and photo overlay, `progress` and `mode` props |
| `src/lib/components/PhotoButton.svelte` | repo | new | a `Button`; `oncapture` callback |
| `src/lib/components/SettingsDialog.svelte` | repo | new | a platform `Modal` holding the three controls |
| `src/lib/components/overlay.css` | repo | new | the graphic register's tokens (Step 6) |
| `src/lib/photo.ts` | repo | new | pure composition of the photo card |
| `src/routes/+page.svelte` | repo | T's seed | replaced (Step 7) |
| `tests/item-controls.test.ts`, `tests/time-control.test.ts`, `tests/sound-control.test.ts`, `tests/camera-control.test.ts`, `tests/caption.test.ts`, `tests/title-card.test.ts`, `tests/photo-button.test.ts`, `tests/settings-dialog.test.ts` | repo | new | one per component, by role and name |
| `tests/photo.test.ts` | repo | new | the pure composition |
| `tests/overlay-contrast.test.ts` | repo | new | Step 6 |
| `tests/route.test.ts` | repo | T's seed | the page's landmarks, controls and hidden sentence |
| `stories/ItemControls.stories.svelte`, `stories/TimeControl.stories.svelte`, `stories/SoundControl.stories.svelte`, `stories/CameraControl.stories.svelte`, `stories/Caption.stories.svelte`, `stories/TitleCard.stories.svelte`, `stories/PhotoButton.stories.svelte`, `stories/SettingsDialog.stories.svelte` | repo | new | Svelte CSF, one per component, each with a narrowest-width story measuring 44 px |
| `stories/SceneCanvas.stories.svelte` | repo | new | renders the fallback still only (`CONVENTIONS.md` §12, Chromatic) |
| `scripts/make_audio.py` | repo | new | Step 9; synthesises the loops |
| `src/lib/assets/audio/fire.mp3`, `rain.mp3`, `wind.mp3`, `lapping.mp3`, `squeak.mp3` | repo | Step 9 | new; `made:` or `cc0:` source |
| `src/lib/assets/manifest.json` | repo | `just assets-manifest` | five entries added, licences set by hand in the diff before commit (`licence` is kept by `write`; the first write says `unsettled` and the executor edits it to `cc0`, which is the one hand edit the field allows) |
| `tickets/P08-interface.md` | tickets | this file | `status: done` |

## Steps

1. **Read the contract.** `CONVENTIONS.md` §5.3, §6.1 (the commands and `SceneState`),
   §6.2, §6.3, §7, §8, §10, §11 claims 8, 10 and 12, §12; `docs/specs/cabin.allium` on
   `main`; the exported surface of `src/routes/scene/SceneCanvas.svelte` (its props and
   the two functions it exports, `capture` and `forceContextRestore`) and of
   `src/lib/domain/director.ts`. Write down, in the hand-back, every prop `SceneCanvas`
   takes and every command the director accepts, because the page is where they meet.

2. **The components, test first.** For each of the eight, write the test from the
   guarantee it answers, then the component, then the story. Query by accessible role
   and name only. Shapes:
   - `ItemControls`: props `items: readonly { id: Item | 'biscuit'; label: string; icon: IconName }[]`,
     `active: Item | 'floor'`, `onselect: (id: Item | 'biscuit') => void`. A `Button`
     per entry; the active one carries `aria-pressed="true"` and a word ("Bed, she is
     here"), never colour alone. The Pet button is the `biscuit` entry, mirroring P07a's
     `Hit` kinds: the canvas hit-test offers her, so the row must (`EveryItemIsAControl`),
     and a keyboard or screen reader reaches the pet the same way a thumb does. It never
     carries `aria-pressed`, since she is not somewhere to be at. The test asserts that
     activating the button named "Pet" calls `onselect('biscuit')`. Three per row at
     320 px through a CSS grid on `--shell-pad`.
   - `TimeControl`: props `value: Phase | 'auto'`, `onchange`. A `SegmentedControl`
     with four options; the group is one tab stop and arrows move within it (the
     platform control does this; the test asserts the role and the names).
   - `SoundControl`: props `on: boolean`, `onenable: () => Promise<void>`,
     `ondisable: () => void`. A `Switch` named "Ambient sound". `onenable` is awaited
     inside the change handler, so the `AudioContext` starts inside the gesture; if it
     rejects, the switch stays off and a `Notice` says "Sound could not start."
   - `CameraControl`: props `value: Camera` (P06's type), `onchange`.
   - `Caption`: props `caption?: { text: string; sequence: number }`. A `Notice` showing
     the text and an `Announcer` saying it; the `sequence` prop is what makes the same
     sentence announce again if the director ever repeats one (it does not, §6.3).
   - `TitleCard`: props `mode: 'loading' | 'photo' | 'hidden'`, `progress: number`,
     `caption?: string`, `phase: Phase`. Two panels split by a diagonal (`clip-path`),
     the word PAWLOUR in `--font-display`, a progress rule, plain copy ("Loading the
     room", "Saved"). Rendered as DOM over the canvas, `aria-live="polite"` on the copy.
   - `PhotoButton`: props `oncapture: () => Promise<void>`, `busy: boolean`. A `Button`
     named "Photo".
   - `SettingsDialog`: props `open`, `onclose`, and the three controls' props passed
     through. A platform `Modal` (focus enters, Escape closes, Tab held, focus returns:
     the platform's guarantees, asserted once here through the `Modal`'s own behaviour
     by role).

3. **Stories.** One file per component, Svelte CSF as T's `Lockup.stories.svelte`: a
   `defineMeta` with an `OVERVIEW` naming the `cabin.allium` guarantee the component
   answers, a default story, and a story at `NARROWEST_SUPPORTED_WIDTH` whose play
   measures every control's `getBoundingClientRect()` at or above `MINIMUM_TOUCH_TARGET`
   in both directions. `stories/SceneCanvas.stories.svelte` renders `SceneCanvas` with
   `webgl={false}` (P07a's prop) so the still is what Chromatic sees. Run `just
   storybook-build` and `just storybook-test`.

4. **§11 claim 10, `optimizeDeps.include`.** `SceneCanvas` imports `three` and
   `three/addons/...`. Run `just storybook-test` twice from a cold cache (`rm -rf
   node_modules/.vite`) and record whether the first run fails on a dependency first met
   inside the story. If it does and `'three'` alone (P00's entry) is not enough, the
   subpaths that need listing are a hand-back to P11 naming them exactly, and the
   `SceneCanvas` story is marked `skip` with that reason until it lands.

5. **§11 claim 8, headless WebGL.** In the same run, mount `SceneCanvas` with WebGL on
   in a story that is *not* committed (write it under `ai_tmp/`, copy it in, run, remove)
   and record whether headless Chromium creates a WebGL2 context and draws a frame. The
   committed story stays the still either way; the finding is what P10 and the handbook
   need.

6. **The graphic register's tokens and their floors.** `overlay.css` declares
   `--overlay-scarlet`, `--overlay-black`, `--overlay-white` and the two text pairings
   (white on black, black on white, and white on scarlet for the word) once, under
   `:root`, unchanged by theme: the card is the same in every combination because it
   covers the page. `tests/overlay-contrast.test.ts` reads the file from disk as H
   `tests/contrast.test.ts` does, resolves the pairs, and asserts every text pair at or
   above `MINIMUM_TEXT_CONTRAST` and the diagonal's edge (scarlet against black, scarlet
   against white) at or above `MINIMUM_BOUNDARY_CONTRAST`. Pick the scarlet that passes:
   a P5 scarlet near `#e60012` fails white text at 4.5, so the word is set black on
   scarlet or white on black, never white on scarlet, and the test is what decides. The
   platform's `--biscuit-*` family is not used (`CONVENTIONS.md` §5.3).

7. **The page.** Replace T's seed. `<svelte:head>` from `brand.ts`. `HeaderBar` with
   the `Lockup` as the `brand` snippet and one action, the Settings `IconButton`
   (`popup: 'dialog'`). `<main>` holding, in order: `SceneCanvas` (props: the
   `SceneState`, the frame port, `animationsActive`, the asset URLs imported from
   `$lib/assets/`, callbacks `onTap`, `onProgress`, `onReady`, `onContextLost`, as P07a
   names them), a visually hidden
   `<p aria-live="polite">` built from `SceneState` ("Biscuit is asleep in the bed. It is
   night. Snow."), `Caption`, `ItemControls`, `PhotoButton`, `TitleCard`. Everything
   per-visitor happens in `onMount`: construct `createWebStorage()`,
   `createSystemClock()`, `createCryptoRandom()`, `createMediaPreferences()`,
   `createIntervalTimer()`, `createAnimationFrames()`, `createWebAudio(sources)`; read
   `pawlour.time`, `pawlour.sound` and `pawlour.camera` from storage; derive
   `animationsActive` from the preferences port and subscribe to it, writing
   `data-animations` on `document.documentElement` as H's how-to says; start the timer at
   250 ms calling `director.step(state, tick)` and, every 240th tick, `clockPhase` from
   the clock; return the unsubscribes. `onTap` maps `item.<name>` to `tap(item)`,
   `biscuit` to `tapBiscuit`, `floor` to `tapFloor(point)`; `ItemControls`' `onselect`
   maps the same way, an item to `tap(item)` and `biscuit` to `tapBiscuit`, so the
   control row and the canvas issue identical commands. `SceneState` lives in one
   `$state`; components receive slices and callbacks. Every selector in the page's
   `<style>` names an element or class the markup carries (T's seed comment;
   `svelte-check --fail-on-warnings`).

8. **Photo mode and §11 claim 12.** `PhotoButton`'s `oncapture` in the page: call the
   `SceneCanvas` instance's `capture()` (P07a's: a synchronous render, then `toDataURL`;
   if it returns a blank image the fix is P07a's and is handed back with the evidence,
   because the claim says the capture must be taken synchronously after a render or the
   renderer created with the flag), compose the card with
   `src/lib/photo.ts` (pure: `composePhoto({ width, height, caption, phase }) → { panels:
   Polygon[]; texts: Placed[] }`, tested for every phase and with and without a caption),
   draw it on an offscreen canvas in the page, and trigger a download named
   `pawlour-<phase>-<n>.png` through an `<a download>` the page creates and removes.
   The director is sent nothing for a photo: a walk or a pet in progress is what the
   picture shows, and `motionChanged` stays the preferences port's. `TitleCard` shows
   "Saved" for `--dur-3`.

9. **Audio.** `scripts/make_audio.py` (standard library only: `wave`, `struct`,
   `random`, `math`) writes five mono 44.1 kHz WAV loops under `ai_tmp/audio/`: `fire`
   (filtered noise with random crackle impulses, 12 s), `rain` (dense filtered noise,
   10 s), `wind` (slow-modulated low noise, 16 s), `lapping` (periodic short noise
   bursts, 8 s), `squeak` (a pitched sine with vibrato and a fast envelope, 8 s; the
   runtime plays it once per shake). Each loop is made seamless by a 200 ms crossfade of
   its tail into its head. Encode to mp3 with `ffmpeg -i in.wav -codec:a libmp3lame -q:a
   6 out.mp3` if `ffmpeg` is on the PATH, else on macOS `afconvert -f mp4f -d aac` to
   `.m4a` and then the file extension in §3 and the port's `sources` map change to
   `.m4a`, which is recorded as a hand-back to `CONVENTIONS.md` §3; which encoder ran is
   recorded. Alternatively a CC0 file from a source whose licence page says CC0 (record
   the URL as the manifest `source`). Copy the five into `src/lib/assets/audio/`, run
   `just assets-manifest`, edit each new entry's `licence` from `unsettled` to `cc0` in
   the diff, set `budget` to 524288, run `just check-assets`. No file whose licence is
   not settled is committed.

10. **Wire the audio port.** `createWebAudio` takes the five URLs imported from
    `$lib/assets/audio/`; the page calls `setBed(['fire'])` by default and adds `rain` or
    `wind` by weather; `play('lapping')` on `drink`, `play('squeak')` on `play`; nothing
    is called before `enable()` has resolved, and `enable()` is called only from
    `SoundControl`'s handler. The fake audio port in a page test asserts that no `play`
    call precedes `enable`.

11. **The route test.** Extend `tests/route.test.ts`: the heading, the title, the main
    landmark, the item buttons by name (Bed, Chair, Water, Food, Toy, Lamp, Lights,
    Pet), the Settings button, the hidden sentence's text
    for a fake state, the caption's `role="status"`. The page under jsdom mounts
    `SceneCanvas` in its fallback (no WebGL): assert the still's `alt` is the caption.

12. **Accessibility review.** Run the `accessibility-review` skill's seven steps against
    `cabin.allium` and H `operation.allium`: colour never alone (`aria-pressed` plus the
    word), keyboard operation of every control and the dialog, announcements through
    `Announcer`, nothing withheld exposed, motion gated. Then `just preview` at 320 px
    in a browser, measure every control at 44 px in both directions, screenshot to
    `ai_tmp/p08-320.png`, and confirm nothing scrolls sideways. `touch-action:
    manipulation` on the canvas; no `user-scalable=no` anywhere (`src/app.html` is T's
    and carries none).

13. **Gates.** `just frontend-coverage` (the eight components, `photo.ts` and the
    overlay test in the table, all four figures at or above 90), `just storybook-test`,
    `just check-assets`, `just check`. Set `status: done`. Commit. Pushing and the pull
    request are authorised separately.

## Acceptance criteria

- [ ] Eight components under `src/lib/components/`, each with a test that queries by
      role and name and a story whose narrowest-width play measures 44 px.
- [ ] `src/routes/+page.svelte` constructs every port in `onMount` and nowhere else;
      `grep -n 'globalThis\|window\.\|document\.' src/lib/components/` finds nothing.
- [ ] The Pet button in `ItemControls` dispatches `tapBiscuit` through
      `onselect('biscuit')`, is reachable and activated by keyboard, and is asserted by
      name in `tests/item-controls.test.ts` and `tests/route.test.ts`.
- [ ] `audio.enable()` is called from `SoundControl`'s handler only, and a page test
      with the fake audio port proves no `play` precedes it.
- [ ] `tests/overlay-contrast.test.ts` measures every text pair at or above 4.5 and the
      boundary pairs at or above 3.0, reading `overlay.css` from disk.
- [ ] The five audio files are under 524,288 bytes each, listed with `licence: "cc0"`
      and a `made:` or `cc0:` source; `just check-assets` is green.
- [ ] The hidden sentence names activity, phase and weather from `SceneState`.
- [ ] Photo mode downloads a PNG whose card carries no first-person copy; §11 claim 12
      is recorded.
- [ ] §11 claims 8 and 10 are recorded with the exact outcome.
- [ ] `ai_tmp/p08-320.png` exists and the hand-back records every control's measured
      size at 320 px.
- [ ] `just frontend-coverage` at or above 90 on all four figures; `just check` green.

## Verification

```sh
just frontend-coverage
just storybook-build && just storybook-test
just check-assets
ls -l src/lib/assets/audio/
grep -rn 'enable()' src/ | grep -v SoundControl.svelte
grep -n 'onMount' src/routes/+page.svelte
just check
```

Expected: all four figures at or above 90 with every component and `photo.ts` listed;
the story run green with the eight component stories and the still-only canvas story;
`check-assets` green with five audio entries; five files each under 524,288 bytes; the
`enable()` grep prints only the page's construction of the port and nothing that calls
it; one `onMount` in the page; `just check` green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- Every prop `SceneCanvas` takes and every director command, as read from `main`.
- §11 claim 10: whether the cold-cache story run needed subpaths listed, and which.
- §11 claim 8 (second half): whether headless Chromium drew a WebGL2 frame.
- §11 claim 12: whether the capture was blank, and what P07a was handed.
- The scarlet chosen and the measured ratios for every overlay pair.
- Which encoder produced the audio (`ffmpeg`, `afconvert`) or which CC0 URLs, and each
  file's bytes.
- The measured size of every control at 320 px and the screenshot path.
- Which open points below were settled.

## Open points

- **Jar in v1.** `ItemControls` takes its items as a prop; the treat jar's button is a
  one-line addition when the `treat` clip lands (v1.1). Recommend leaving it out of the
  row rather than shipping a button that does nothing.
- **The camera control's place.** §7 puts it in the dialog. The edge tap or swipe on the
  canvas is v1.1 (`PRD.md`, "The room"), so the dialog control is the only route in v1.
- **The `.m4a` fallback.** If `ffmpeg` is absent, the extension change touches §3 and
  the port's map; record it and let P11 carry the `CONVENTIONS.md` edit.
- **`Notice` for a failed `enable()`.** Whether Safari ever rejects inside a gesture is
  unmeasured; P10 tries it on the device.
