---
id: P08
title: "Interface: the components, the page, the ports in `onMount`, captions, settings, photo mode, audio"
status: done
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

- [x] Eight components under `src/lib/components/`, each with a test that queries by
      role and name and a story whose narrowest-width play measures 44 px.
- [x] `src/routes/+page.svelte` constructs every port in `onMount` and nowhere else;
      `grep -n 'globalThis\|window\.\|document\.' src/lib/components/` finds nothing.
- [x] The Pet button in `ItemControls` dispatches `tapBiscuit` through
      `onselect('biscuit')`, is reachable and activated by keyboard, and is asserted by
      name in `tests/item-controls.test.ts` and `tests/route.test.ts`.
- [x] `audio.enable()` is called from `SoundControl`'s handler only, and a page test
      with the fake audio port proves no `play` precedes it.
- [x] `tests/overlay-contrast.test.ts` measures every text pair at or above 4.5 and the
      boundary pairs at or above 3.0, reading `overlay.css` from disk.
- [x] The five audio files are under 524,288 bytes each, listed with `licence: "cc0"`
      and a `made:` or `cc0:` source; `just check-assets` is green.
- [x] The hidden sentence names activity, phase and weather from `SceneState`.
- [x] Photo mode downloads a PNG whose card carries no first-person copy; §11 claim 12
      is recorded.
- [x] §11 claims 8 and 10 are recorded with the exact outcome.
- [x] `ai_tmp/p08-320.png` exists and the hand-back records every control's measured
      size at 320 px.
- [x] `just frontend-coverage` at or above 90 on all four figures; `just check` green.

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

Executed on branch `P08-interface` on 2026-09-26, from `main` at `3f72648`, with
`@steven-cutting/biscuit-games` 1.1.0. Every gate below ran on this machine.

**Every prop `SceneCanvas` takes and every director command, as read from `main`.**
`SceneCanvas` (`src/routes/scene/SceneCanvas.svelte`) takes `state: SceneState`,
`animations: boolean` (the ticket's `animationsActive`), `frames: FramePort`,
`assets: SceneAssets` (`{ biscuit, cabin, clips, still(state) }`), `onProgress(fraction)`,
`onReady()`, `onTap(hit: Hit)`, `onContextLost()` and `webgl?: boolean`; it exports
`capture(): string` (throws `'The scene has no drawable frame to capture'` before the
first frame, after a loss and under jsdom) and `forceContextRestore(): void`. `Hit` is
`{ kind: 'item'; item: 'item.<name>' }` for all twelve room items, `{ kind: 'biscuit' }`
or `{ kind: 'floor'; point }`; the page strips `item.` and dispatches `tap` for the seven
director items only, so a tap on the jar, fire, window, table or shelf sends nothing
(v1.1). The director is `step(state, command, deps: { random })` returning only the next
state (no effects), with `initialState(phase, weather, motion)`; the twelve command kinds
are `tap`, `tapBiscuit`, `tapFloor`, `tick`, `arrived`, `setPhase`, `clockPhase`,
`setWeather`, `toggleLight`, `setSound`, `setCamera` and `motionChanged`. `tap`,
`tapBiscuit`, `tapFloor` and `clockPhase` are command kinds, not exported functions, and
`step(state, tick)` in Step 7 reads as `step(state, { kind: 'tick', ms: TICK_MS }, deps)`.

**Where the build departs from the ticket's text, and why.** Each is a hand-back to
P11 for the ticket wording or `CONVENTIONS.md`:

- `ItemControls` marks where she is with the platform `Button`'s `current` prop, which
  renders `aria-current="true"`, plus the words "she is here" in the accessible name.
  The platform `Button` has no `aria-pressed` and takes no rest props; `aria-current`
  is the right semantics for "where she is". The maintainer chose this on 2026-09-26.
- `Caption` is one platform `Notice` and no `Announcer`. `Notice` is a visible sentence
  with `role="status"`, stays mounted while silent, and re-announces on `sequence`; its
  own comment says a message there must not be duplicated into `Announcer` or it is
  heard twice. §7's "a `Notice` … and an `Announcer`" is corrected accordingly.
- The platform's icon map (22 names) has no bed, chair, bowl, lamp, string lights, paw
  or camera. The row's icons are the game's own: nine Lucide SVGs under
  `src/lib/icons/` (bed, armchair, glass-water, bone, toy-brick, lamp-floor, sparkles,
  hand, camera; fetched from
  `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/<name>.svg`,
  restroked to 1.5 as the platform's are, with `LICENSE-lucide.txt` beside them),
  rendered by `src/lib/components/GameIcon.svelte`. They live outside
  `src/lib/assets/` because the manifest checker walks that directory and has no source
  form for an ISC file. Hand-back to the hub: add item icons upstream so a game need not
  carry them.
- `pawlour.sound` is not persisted. `cabin.allium`'s `SoundNeverStartsUnasked` says sound
  is off whenever the room opens, and P01 and P06 already recorded that §7's
  "persisted under `pawlour.sound`" is to be dropped. Only `pawlour.time` and
  `pawlour.camera` are read and written, and a stored value that is not a phase or a
  camera is ignored.
- `setPhase('auto')` only clears the override (P06 hand-back 4i), so the page follows it
  at once with `clockPhase(phaseAt(clock.now()))`.
- The installed Vite 8.2.1 does not list `glb` in its known asset types (`webp` and
  `mp3` it does), and `vite.config.ts` is reserved, so the page imports the GLBs with
  `?url`. `CONVENTIONS.md` §1 fact 8 is corrected: `.glb` needs `?url`.
- The page takes one optional prop, `ports?: Ports` (`src/lib/ports/index.ts`), so the
  route test can inject the seven fakes; the app passes nothing and `onMount` builds the
  real adapters. `eslint-plugin-svelte`'s `valid-prop-names-in-kit-pages` refuses any
  prop on a route, so that one line carries a single-rule disable with the reason.
- Four pure modules beyond the ticket's list, because decision 17 puts anything with a
  decision in it under coverage: `src/lib/sentence.ts` (the hidden sentence),
  `src/lib/cues.ts` (the audio the page derives from one state and the next; the
  director returns no effects), `src/lib/data/controls.ts` (the row's entries) and
  `src/lib/drawn.ts` (below).
- The runtime draws once per state it is handed (`scene.ts` `apply` has no comparison
  of its own) and every tick returns a new state object, so a page that handed the
  canvas `scene` directly would redraw the still four times a second. The page hands
  it the previous state again unless a field the runtime draws changed
  (`drawsTheSame` in `src/lib/drawn.ts`: activity, at, target, lookAt, phase, weather,
  lights, fire, camera, caption, motion), which is MotionOffIsAStillDiorama's "drawn
  once per change".
- The loading card is for the first load only. A restore after a context loss reloads
  the assets and reports `onProgress` again but never `onReady` a second time
  (`scene.ts` announces it once), so without the guard the card would return and stay.
- The platform `SegmentedControl` with four choices runs to 293 px at its own padding,
  wider than the `Modal`'s body at 320 px, and Night was cut off. `TimeControl`
  narrows the segment padding under a scoped `:global` so the four fit on one row with
  every segment past 44 px (the story measures it). Hand-back to the hub: the control
  is written for two or three choices; a four-choice fit belongs upstream.
- `TitleCard` paints its whole box black under the scarlet panel, so the diagonal's cut
  corner shows black and never the page.
- P07b adds one manifest entry beside this ticket's five; `CONVENTIONS.md` §10's rule
  applies: whichever lane merges second re-runs `just assets-manifest` on the merged
  tree, re-sets its own entries' three hand fields, and reads the diff.
- `stories/SceneCanvas.stories.svelte` already existed from P07a, still-only, and was
  left as it was. `stories/narrowest.ts` holds the viewport pin and the 44 px
  measurement the nine component stories share.
- The clock is read through a second `timer.every(CLOCK_INTERVAL_MS, …)` rather than
  every 240th tick; the constant already existed in `timing.ts`.
- "Saved" is held for `SAVED_MS` (1500 ms in the page) through the timer port as a
  self-stopping one-shot; `--dur-3` is 180 ms, which is the sweep, not a hold a person
  can read, and a CSS animation would never end with animations off.
- Photo mode has no readiness gate: `capture()` is wrapped, and a failure shows a page
  `Notice` "The room could not be photographed." `SceneCanvas` reports a loss but not a
  restore, so a gated button could never be re-enabled.
- `PhotoButton` is the ninth cell of the item grid (`ItemControls` takes a trailing
  `children` snippet), so 320 px shows Bed Chair Water / Food Toy Lamp / Lights Pet Photo.
- The Verification grep `grep -rn 'enable()' src/ | grep -v SoundControl.svelte` prints
  the port's own definitions in `src/lib/ports/audio.ts`, a comment in `cues.ts`, and
  the page's `await p.audio.enable()` inside the `onenable` callback the switch's change
  handler invokes; nothing else calls it.
- `just assets-manifest` exits 1 on its first run over new audio, by design: `write`
  runs `check` after writing and the new entries are `unsettled`. The three hand fields
  were then set and `just check-assets` is green.
- The accessibility review ran the skill's seven steps (findings below) and the 320 px
  measurements in Playwright's Chromium against `just preview`, because the Claude in
  Chrome extension was not connected in this session.

**§11 claim 10.** Two `just storybook-test` runs from a cold cache, the first straight
after `just sync` and the second after `rm -rf node_modules/.vite`, with the SceneCanvas
story (which imports `three` and `three/addons/...`) among them. Both green: Vite logged
"Forced re-optimization of dependencies" once and no "new dependencies optimized" reload;
no story failed on a dependency first met inside it. `'three'` alone in
`optimizeDeps.include` is enough. Held; no subpaths to list.

**§11 claim 8 (second half).** An uncommitted probe story (`ai_tmp/claim8/`, copied into
`stories/` for one run and removed) mounted `SceneCanvas` with `webgl` on and the real
`?url` assets under the story job's headless Chromium: `onReady` fired, and the frame
`capture()` returned decoded to more than 50 distinct colours. Against the built page in
the same Chromium: a WebGL2 context exists, renderer
"ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)),
SwiftShader driver)", canvas 358×460, first frame drawn. Held.

**§11 claim 12.** Not blank. Under `just preview` in headless Chromium at 320×568, Photo
downloaded `pawlour-night-1.png`, 576×512, 12,472 distinct colours, 10 % of pixels near
black (the hearth wall), with the card drawn over it (`ai_tmp/pawlour-night-1.png`). The
premise holds too: `gl.readPixels` on the live canvas after a frame returned
`[0, 0, 0, 0]` because the renderer is created with `preserveDrawingBuffer: false`, which
is why P07a's `capture()` renders synchronously first. Nothing handed to P07a.

**The scarlet and the measured ratios.** `--overlay-scarlet: #f5222d`, `--overlay-black:
#000000`, `--overlay-white: #ffffff`, the same in all four combinations. Black on
scarlet 5.15; white on black 21.00; black on white 21.00; scarlet against black 5.15;
scarlet against white 4.08; white on scarlet 4.08, which is below 4.5 and is the record
of why the word is black. `tests/overlay-contrast.test.ts` reads the file from disk and
asserts every pair per combination.

**Audio.** Encoder: `ffmpeg` at `/opt/homebrew/bin/ffmpeg` (`libmp3lame`, `-q:a 6`),
from `scripts/make_audio.py` (standard library, seeded, 200 ms tail-into-head crossfade),
so the extension is `.mp3` and §3 is unchanged. Bytes: `fire.mp3` 85,211 (11.8 s),
`rain.mp3` 73,248 (9.8 s), `wind.mp3` 110,938 (15.8 s), `lapping.mp3` 51,765 (8.0 s),
`squeak.mp3` 33,794 (8.0 s); mono, 44.1 kHz; manifest `source` `made:2026-09-26`,
`licence` `cc0`, `budget` 524288.

**Every control at 320 px** (Playwright Chromium, 320×568, `ai_tmp/p08-320.png`; the
dialog in `ai_tmp/p08-320-settings.png`; the figures in `ai_tmp/p08-review.json`).
Settings 44×44; Bed, Chair, Water, Food, Toy, Lamp, Lights, Pet, Photo each 90.66×48;
in the dialog Close 44×44, Auto 61.67×44, Morning 83.83×44, Evening 81.22×44, Night
66.05×44, the Ambient sound row 254×75.56, Hearth 74.48×44, Window 83.16×44, Chair
65.31×44 (radios and the switch measured on the label that contains them).
`documentElement.scrollWidth` 320 = `clientWidth`; the canvas's `touch-action` is
`manipulation`; the viewport meta is `width=device-width, initial-scale=1`;
`data-animations="on"` with no reduced-motion preference. Focus enters the dialog, Escape
closes it and focus returns to Settings; Enter on Pet captions the pet.

**Accessibility review** (the skill's seven steps against `cabin.allium` and H
`operation.allium`): no findings. Colour: where she is carries `aria-current` and the
words; the switch's state is the knob, the word and `checked`; the progress rule carries
`aria-valuenow` and the copy. Keyboard: every control is a platform control; the canvas
is `aria-hidden` and out of the tab order, and the row is the control. Announcements:
the caption through `Notice`'s `role="status"`, the room in words through the polite
hidden sentence, the card's copy through a polite region, failures through `Notice`.
Nothing withheld is exposed. Motion: `animationsActive(true, prefersReducedMotion)`
writes `data-animations` and the director's `motion`, the device wins, and the canvas
stops its loop when it is false. Step 7's gates, `just frontend-static` and `just check`,
ran green. The built Storybook was also looked at, not only tested: screenshots of the
title card (loading and saved), the dialog open and at 320 px, the icon set, the row
with her at the bed, the failed sound switch and the caption are under `ai_tmp/story-*.png`
and `ai_tmp/story2-*.png`; the two defects they showed (the card's ground and the time
control's fit, above) were fixed and re-shot.

**Verification, as run.**

```text
$ just frontend-coverage
 Test Files  24 passed (24)   Tests  320 passed (320)
All files          |     100 |    97.93 |     100 |     100 |
$ just storybook-build && just storybook-test
 Test Files  11 passed (11)   Tests  34 passed (34)
$ just check-assets
check-assets: checked 26 file(s) against src/lib/assets/manifest.json
$ ls -l src/lib/assets/audio/
85211 fire.mp3  51765 lapping.mp3  73248 rain.mp3  33794 squeak.mp3  110938 wind.mp3
$ grep -rn 'enable()' src/ | grep -v SoundControl.svelte
src/lib/cues.ts:8 (comment), src/lib/ports/audio.ts:6,12,92,171 (the port), src/routes/+page.svelte:214 (comment), :220 `await p.audio.enable();`
$ grep -n 'onMount' src/routes/+page.svelte
8 (import), 75 and 90 (comments), 321 `onMount(() => {`
$ grep -n 'globalThis\|window\.\|document\.' src/lib/components/
(nothing)
$ just check
All checks passed and the worktree is unchanged.
```

## Open points

- **Jar in v1.** `ItemControls` takes its items as a prop; the treat jar's button is a
  one-line addition when the `treat` clip lands (v1.1). Recommend leaving it out of the
  row rather than shipping a button that does nothing. *Settled: left out; the row is
  `ITEM_CONTROLS` in `src/lib/data/controls.ts`.*
- **The camera control's place.** §7 puts it in the dialog. The edge tap or swipe on the
  canvas is v1.1 (`PRD.md`, "The room"), so the dialog control is the only route in v1.
  *Settled: in the dialog only.*
- **The `.m4a` fallback.** If `ffmpeg` is absent, the extension change touches §3 and
  the port's map; record it and let P11 carry the `CONVENTIONS.md` edit. *Settled: not
  needed; `ffmpeg` was present and the files are `.mp3`. The script keeps the fallback.*
- **`Notice` for a failed `enable()`.** Whether Safari ever rejects inside a gesture is
  unmeasured; P10 tries it on the device. *Carried forward to P10: the path is built and
  tested with a rejecting `onenable` (`tests/sound-control.test.ts`, the "Could not
  start" story), not measured on a device.*
