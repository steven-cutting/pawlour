---
id: P06
title: "Director and ports: the reducer, phases, weather, captions, the timer, frame and audio ports"
status: open
depends_on: [P01]
parallel_with: [P02, P03, P04, P05, P09]
branch: ticket/p06-director-and-ports
estimated_size: L
---

# P06: Director and ports: the reducer, phases, weather, captions, the timer, frame and audio ports

## Context

Everything in Pawlour that has a decision in it lives under `src/lib/` as a pure module,
tested to the coverage floor, and everything that touches the browser sits behind a port
with a fake (CONVENTIONS.md §1 decision 17, §6). This ticket writes that half of the game:
the director, which is the reducer that decides what Biscuit does about a tap and a tick;
the phase, weather and caption logic it uses; and the three ports the scene and the page
need that the template does not ship (a timer, animation frames, audio). P07a and P07b
draw what this ticket decides; P08 wires it to the controls. Neither can start until the
types this ticket exports exist, which is why the exact shapes are embedded below and are
not the executing agent's to change without a hand-back.

Sources, at the commits CONVENTIONS.md §0 pins (read-only, never modified):

- T (rendered here by P00): `src/lib/ports/clock.ts`, `src/lib/ports/random.ts`
  (`RandomPort { uniformChoice<Value>(items: readonly Value[]): Value }`,
  `createFakeRandom(offsets)` walks the offsets and cycles), `src/lib/ports/storage.ts`,
  `tests/ports.test.ts` (the three `describe` blocks whose shape the new cases take;
  `docs/reference/testing.md` says a port this game adds appends its cases at the end),
  `docs/explanation/layering.md` (a port is an interface, a real adapter taking its
  platform object as a defaulted argument, and an in-memory fake, in one file; pure
  modules sit between components and ports), `AGENTS.md` invariants 2, 3 and 7.
- P `/Users/scutting/projects/poodl` at `a2860fc`: `src/lib/ports/timer.ts` (91 lines;
  `TimerPort`, `Scheduler`, `createIntervalTimer`, `FakeTimer`, `createFakeTimer`, and the
  comment on why the fake snapshots its set and re-checks membership) and
  `tests/ports.test.ts` lines 395–493 (the timer's six cases: a supplied scheduler, the
  platform scheduler by default, a fake a test advances, a stop the tick itself calls,
  every timer the fake holds).
- H `/Users/scutting/projects/biscuit_games` at `575e3dd`: `docs/design/character.md`
  lines 51–65 (the voice: plain interface copy for anything functional; rare moments a
  dry third-person narrator; never first person), `docs/specs/appearance.allium` line 140
  (`ReducedMotionOverridesTheAnimationSetting`), `docs/specs/operation.allium` line 240
  (`AChangeNobodyIsLookingAtIsAnnounced`).
- This repository after P01: `docs/specs/cabin.allium`, whose guarantees
  `ATapIsAnInvitation`, `ACaptionIsShownAndAnnounced`, `TimeFollowsTheClockUntilOverridden`
  and `MotionOffIsAStillDiorama` are what the director's tests are written from
  (CONVENTIONS.md §8). The spec wins over this ticket where they disagree.

Read first: `PRD.md` ("What she does", "Captions", "Time of day", "Weather", "Motion
off"); CONVENTIONS.md §1 decisions 7, 10, 13, 15; §6 whole; §8; §10; §11 claim 8.

## Goal

At the end of this ticket, on branch `ticket/p06-director-and-ports`:

- `src/lib/domain/director.ts` exports `step`, `initialState` and the types below, and
  every rule in CONVENTIONS.md §6.1 and every clause of `cabin.allium` this ticket is
  named against has a test in `tests/director.test.ts` that fails without it.
- `src/lib/domain/phases.ts`, `weather.ts`, `captions.ts`, `items.ts` and `timing.ts`
  exist with the signatures below; `src/lib/data/captions.ts` holds at least forty
  sentences in the register CONVENTIONS.md §6.3 states.
- `src/lib/ports/timer.ts`, `frame.ts` and `audio.ts` exist in the template's port
  shape, each with a real adapter that takes its platform object as a defaulted argument
  and a fake, and their cases are appended to `tests/ports.test.ts`.
- `just frontend-coverage` is at or above 90 on all four figures with every new module
  listed, and `just check` is green.

## Non-goals

- Drawing anything. No `three`, no canvas, no DOM: P07a and P07b.
- The page, the controls, persistence of the time and sound settings: P08. This ticket
  exposes `phaseOverride` and `sound` in the state and the commands that set them;
  reading and writing the storage port is the page's.
- The captions' visible and spoken presentation: P08 (`Caption.svelte`). This ticket
  chooses the sentence.
- Sound files: P08. This ticket's audio port takes a map of names to URLs and never
  names a file.
- Any edit to `package.json`, `vite.config.ts` or the coverage threshold (CONVENTIONS.md
  §10). Lower the code's complexity, not the floor.

## Files touched

| Path | Class | Source | Change |
| --- | --- | --- | --- |
| `src/lib/domain/director.ts` | repo | new; Step 2 (embedded types) | the reducer |
| `src/lib/domain/timing.ts` | repo | new; Step 2 (embedded constants) | the figures |
| `src/lib/domain/items.ts` | repo | new; Step 1 | items, their activities and spots |
| `src/lib/domain/phases.ts` | repo | new; Step 1 | hour to phase; phase biases |
| `src/lib/domain/weather.ts` | repo | new; Step 1 | the per-visit choice |
| `src/lib/domain/captions.ts` | repo | new; Step 4 | choose a sentence not yet shown |
| `src/lib/data/captions.ts` | repo | new; Step 4 | the bank |
| `src/lib/ports/timer.ts` | repo | P `src/lib/ports/timer.ts`, comment rewritten | new |
| `src/lib/ports/frame.ts` | repo | new; Step 5 (embedded interface) | new |
| `src/lib/ports/audio.ts` | repo | new; Step 5 (embedded interface) | new |
| `tests/director.test.ts`, `tests/phases.test.ts`, `tests/captions.test.ts` | repo | new; Steps 3, 1, 4 | to the floor |
| `tests/ports.test.ts` | repo (T managed, game-appended) | Step 6 | three `describe` blocks appended after `clock port` |
| `tickets/P06-director-and-ports.md` | tickets | this file | `status: done` |

No other path. `tests/ports.test.ts` is appended, never reordered: a later
`copier update` merges T's part.

## Steps

1. **Write the small modules first**, each pure, each with its test:

   - `items.ts`: `type Item = 'bed' | 'chair' | 'water' | 'food' | 'toy' | 'lamp' | 'lights'`
     (`jar` and `fire` are v1.1 and are not items the director accepts in v1; a tap on
     them is `tapFloor`); `type Settled = 'sleep.bed' | 'sleep.chair' | 'drink' | 'eat' |
     'play' | 'pet' | 'idle.long'`; `activityFor(item): { transition?: 'sit' | 'lie'; activity: Activity; settled?: Settled; spot: string }`
     with `bed → lie → sleep at spot.bed`, `chair → lie → sleep at spot.chair` (the climb
     is the same clip; the runtime places her on `spot.chair`), `water → drink at
     item.water.approach`, `food → eat`, `toy → play`, and `lamp`/`lights` → no
     activity (a light toggle and a `lookAt` at the item).
   - `phases.ts`: `type Phase = 'morning' | 'evening' | 'night'`; `phaseForHour(hour:
     number): Phase` (5–13 morning, 14–20 evening, otherwise night); `phaseAt(ms: number,
     hourOf: (ms: number) => number = (ms) => new Date(ms).getHours()): Phase` (the
     device's zone is what the player lives in; the function is injected so a test names
     the hour); `idleWeights(phase): readonly Item[]` returning a weighted list (repeat
     an item to weight it) from CONVENTIONS.md §6.1's table, and `fireLevel(phase)`
     (0.35, 0.7, 1.0).
   - `weather.ts`: `type Weather = 'clear' | 'rain' | 'snow'`; `chooseWeather(random:
     RandomPort): Weather` as `random.uniformChoice` over a ten-entry list (five clear,
     three rain, two snow), so `createFakeRandom([0])` gives clear and `[9]` gives snow.

2. **Write `timing.ts` and `director.ts` with exactly these exports** (the executor may
   add non-exported helpers and nothing else to the public shape):

   ```ts
   // src/lib/domain/timing.ts — seconds unless named otherwise
   export const TICK_MS = 250;
   export const MINIMUM_ACTIVITY = 4;
   export const DURATION = { drink: 6, eat: 10, play: 15, pet: 2 } as const;
   export const SLEEP = { morning: 90, evening: 150, night: 300 } as const;
   export const IDLE_INTERVAL = { min: 20, max: 40 } as const;
   export const IDLE_FACTOR = { morning: 0.7, evening: 1, night: 1.5 } as const;
   export const CLOCK_INTERVAL_MS = 60_000;
   ```

   ```ts
   // src/lib/domain/director.ts
   export type Activity =
     | 'idle.stand' | 'idle.sit' | 'walk' | 'sit' | 'lie' | 'stand'
     | 'sleep' | 'drink' | 'eat' | 'play' | 'pet';
   export type Camera = 'hearth' | 'window' | 'chair';
   export interface Point { x: number; z: number }
   export interface Target { spot: string; item: Item | 'floor' }
   export interface SceneState {
     activity: Activity;
     at: Item | 'floor';
     target?: Target;
     lookAt?: Point;
     phase: Phase;
     phaseOverride?: Phase;
     weather: Weather;
     lights: { lamp: boolean; strings: boolean };
     fire: number;
     camera: Camera;
     sound: boolean;
     caption?: { text: string; sequence: number };
     motion: boolean;
     elapsed: number;         // seconds in the current activity
     resume?: { activity: Activity; elapsed: number }; // what a pet interrupted
     untilIdleChoice: number; // seconds until she chooses for herself
     shown: readonly string[]; // captions shown this visit
   }
   export type Command =
     | { kind: 'tap'; item: Item }
     | { kind: 'tapBiscuit' }
     | { kind: 'tapFloor'; point: Point }
     | { kind: 'tick'; ms: number }
     | { kind: 'arrived' }
     | { kind: 'setPhase'; phase: Phase | 'auto' }
     | { kind: 'clockPhase'; phase: Phase }
     | { kind: 'setWeather'; weather: Weather }
     | { kind: 'toggleLight'; light: 'lamp' | 'strings' }
     | { kind: 'setSound'; on: boolean }
     | { kind: 'setCamera'; camera: Camera }
     | { kind: 'motionChanged'; active: boolean };
   export interface Deps { random: RandomPort }
   export function initialState(phase: Phase, weather: Weather, motion: boolean): SceneState;
   export function step(state: SceneState, command: Command, deps: Deps): SceneState;
   ```

   `arrived` is what the runtime sends when the walk reaches `target` (the director
   does not know distances). Rules the reducer implements, each a test in Step 3:

   - `tap(item)` when `at === item` and the activity is that item's: no change.
   - `tap(item)` otherwise: `target` is set; if `elapsed >= MINIMUM_ACTIVITY` or the
     activity is idle or `sleep`, `activity` becomes `stand` (when lying or sitting) or
     `walk` at once; else the target waits and `tick` starts the walk when the minimum
     has elapsed. A later tap replaces `target`: the last tap wins.
   - `arrived`: the item's transition (`sit` then `lie`, played by the runtime in that
     order; the director sets `activity: 'lie'` and lets `tick` advance to the settled
     activity after the transition's seconds), then the activity; `at` becomes the item;
     `elapsed` resets.
   - A settled activity sets `caption` once (`captions.ts`, Step 4) with the next
     `sequence`, on the tick that settles it, never on the tap; `shown` gains the text.
   - `drink`, `eat`, `play` end after `DURATION` and return to `idle.stand`; `pet` ends
     after `DURATION.pet` and restores `resume` (the activity and its `elapsed`, exactly
     as they were, and `resume` cleared) without settling that activity again, so it
     sets no second caption; `sleep` ends after `SLEEP[phase]` or on any tap, including
     a tap on her, through `stand`.
   - `tapBiscuit` while `idle.stand`, `idle.sit`, `drink`, `eat` or `play`: `resume`
     records the activity and its `elapsed`, `activity` becomes `pet`, `elapsed` resets,
     `lookAt` is cleared; `target` and any pending target are kept and keep waiting, so
     the interrupted activity's minimum is paused, not spent. A pet is a reaction, not
     an activity change (`ATapIsAnInvitation`, PRD "What she does"): it plays at once,
     never through the pending-target path. While `walk`, `sit`, `lie`, `stand` or
     `pet`: no change (a one-shot is not interrupted, and a tap on the thing she is
     using changes nothing). While `sleep`: the sleep ends as on any tap. A `tap(item)`
     during a pet sets `target` and waits; when the pet ends, the `tap(item)` rule above
     applies to the restored activity and its restored `elapsed`.
   - `tapFloor(point)`: `lookAt = point`; nothing else.
   - `tick(ms)`: advances `elapsed` and `untilIdleChoice`; when the latter reaches zero
     while idle, chooses an item by `idleWeights(phase)` through `deps.random`, issues it
     as a tap, and resets `untilIdleChoice` to a uniform draw in `IDLE_INTERVAL` ×
     `IDLE_FACTOR[phase]` (the draw through `deps.random` over a list of integers 20 to
     40); idle for longer than `IDLE_INTERVAL.max` without a choice sets the `idle.long`
     caption once.
   - `setPhase('auto')` clears the override; `setPhase(phase)` sets it; `clockPhase`
     sets `phase` only when no override; a phase change resets `lights` to the phase's
     (lamp by evening and night, strings by night) and `fire` to `fireLevel(phase)`.
   - `toggleLight` flips one light and holds it until the next phase change.
   - `setWeather`, `setSound`, `setCamera` set their field.
   - `motionChanged(false)` sets `motion` false and, if walking, jumps `at` to the
     target with the settled activity (the still shows her there); if `pet`, restores
     `resume` first (there is no `pet` still); `motionChanged(true)` sets `motion` true.

3. **Write `tests/director.test.ts`** from the rules above and from `cabin.allium`'s
   clauses, one `describe` per clause name, each test's title the plain sentence the
   clause states; use `createFakeRandom` with offsets that make the choice explicit, and
   a helper `run(state, ...commands)` folding `step`. Cover every branch: the coverage
   floor is measured over `src/lib/**` and the reducer is the largest module. Among the
   `ATapIsAnInvitation` cases: a pet during each of `drink`, `eat` and `play` resumes
   that activity with the same `elapsed` and no second caption; a pet while a target
   waits on the minimum leaves the target waiting and the minimum unspent; a tap on her
   while walking, in `sit`, `lie` or `stand`, or already being petted changes nothing; a
   tap on her while asleep ends the sleep through `stand`.

4. **Write the captions**: `src/lib/data/captions.ts` exporting `CAPTIONS: Record<Settled,
   readonly string[]>` with CONVENTIONS.md §6.3's seed sentences and enough more that
   every key has at least five and the total is at least forty; and
   `src/lib/domain/captions.ts` exporting `chooseCaption(key: Settled, shown: readonly
   string[], random: RandomPort): string | undefined` (a uniform choice among the key's
   sentences not in `shown`; `undefined` when none remain). `tests/captions.test.ts`
   asserts the counts, that no sentence contains `!` or `?` or the whole words `I`, `me`,
   `my` or `we`, that every sentence is under twelve words, that a chosen sentence is never in
   `shown`, and exhaustion.

5. **Write the three ports**, each in the template's shape (interface, real adapter with
   the platform object as a defaulted argument, fake):

   - `timer.ts`: P's file taken as its shape, its comment rewritten for this game (the
     director ticks every `TICK_MS` whether motion is on or off; a test that waited real
     seconds for a phase to change is not a test worth having).
   - `frame.ts`:

     ```ts
     export interface FramePort { each(callback: (ms: number) => void): () => void }
     export interface FrameHost {
       requestAnimationFrame(callback: (ms: number) => void): number;
       cancelAnimationFrame(handle: number): void;
     }
     export function createAnimationFrames(host: FrameHost = globalThis as unknown as FrameHost): FramePort;
     export interface FakeFrames extends FramePort { step(ms: number): void }
     export function createFakeFrames(): FakeFrames;
     ```

     `each` re-requests a frame after every callback until stopped; the fake's `step`
     calls every registered callback once with `ms`.
   - `audio.ts`:

     ```ts
     export interface AudioPort {
       enable(): Promise<void>;   // only ever called inside a user gesture
       disable(): void;
       setBed(names: readonly string[]): void; // the loops that should be playing
       play(name: string): void;  // a one-shot
       stop(name: string): void;
     }
     export interface AudioHost {
       AudioContext: new () => AudioContext;
       fetch(url: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> }>;
     }
     export function createWebAudio(sources: Record<string, string>, host: AudioHost = globalThis as unknown as AudioHost): AudioPort;
     export interface FakeAudio extends AudioPort { readonly calls: readonly string[]; readonly enabled: boolean }
     export function createFakeAudio(): FakeAudio;
     ```

     `createWebAudio` creates the context in `enable()`, decodes each source once into an
     `AudioBuffer` on first use, loops a bed entry with `loop = true` on a
     `AudioBufferSourceNode`, and does nothing before `enable()` has resolved
     (`SoundNeverStartsUnasked`). The fake records `enable`, `disable`, `bed:<names>`,
     `play:<name>`, `stop:<name>` in order.

6. **Append the cases to `tests/ports.test.ts`** after `describe('clock port', ...)`,
   as three `describe` blocks `timer port`, `frame port`, `audio port`: the timer's six
   cases as P has them; the frame adapter with a supplied host (records the request and
   the cancel), the fake stepping every callback, a stop that is honoured; the audio
   adapter with a supplied host whose `AudioContext` is a small class the test writes
   recording `createBufferSource` calls and whose `fetch` returns a fixed buffer, proving
   nothing is created before `enable()`, that `setBed` starts a looping source per name
   and stops the ones dropped, that `play` starts a one-shot, and that `disable` closes;
   and the fake's record.

7. **Check CONVENTIONS.md §11 claim 8, first half.** Add to the `frame port` block a
   case titled `states whether this environment has animation frames` that records
   `typeof globalThis.requestAnimationFrame` into the assertion message and asserts only
   that `createAnimationFrames()` with no argument either throws a `TypeError` (no host
   member) or returns a port whose `each` can be stopped; whichever jsdom does is
   written into the hand-back notes. The port stays required either way (T's no-stubbing
   rule), so the claim changes documentation, not design.

8. **Run the gate**: `just frontend-coverage`, then `just check`. Set `status: done`.
   Commit. Pushing and the pull request are authorised separately.

## Acceptance criteria

- [ ] `src/lib/domain/director.ts` exports exactly the types and functions in Step 2,
      and `svelte-check --fail-on-warnings` is clean.
- [ ] `tests/director.test.ts` has a `describe` per `cabin.allium` clause among
      `ATapIsAnInvitation`, `ACaptionIsShownAndAnnounced`, `TimeFollowsTheClockUntilOverridden`,
      `MotionOffIsAStillDiorama`, and each of Step 2's rules has a failing-first test.
- [ ] The pet cases Step 3 names (resume with `elapsed` intact and no second caption, a
      pending target kept, walking and transitions untouched, sleep ended) are among
      them.
- [ ] `CAPTIONS` holds at least forty sentences, at least five per key, and
      `tests/captions.test.ts` proves the register rules.
- [ ] The three ports each have a real adapter taking its platform object as a defaulted
      argument and a fake; no test stubs a global.
- [ ] `tests/ports.test.ts` has T's cases unchanged above and the three new blocks below.
- [ ] `just frontend-coverage` is at or above 90 on branches, functions, lines and
      statements with every file under `src/lib/domain/`, `src/lib/data/` and
      `src/lib/ports/` listed.
- [ ] `just check` is green.

## Verification

```sh
just frontend-static
just frontend-coverage
grep -c "^describe('" tests/ports.test.ts
node -e "const c=require('./src/lib/data/captions.ts')" 2>/dev/null; npx vitest run tests/captions.test.ts
just check
```

Expected: clean; all four figures at or above 90 with `director.ts`, `timing.ts`,
`items.ts`, `phases.ts`, `weather.ts`, `captions.ts` (both), `timer.ts`, `frame.ts` and
`audio.ts` listed; `6` (T's three blocks and the three new ones); the captions test
green; green.

## Hand-back notes

Filled in by the agent that executes this ticket.

- The four coverage figures and the per-file table for `src/lib/**`.
- The number of captions shipped, per key.
- Whether jsdom exposes `requestAnimationFrame` here (§11 claim 8, first half), with
  the recorded `typeof`.
- Any rule in Step 2 that the tests showed to be underspecified, with the reading taken
  (a hand-back to P07a or P08 where it changes what they draw or wire).
- Which open points below were settled.

## Open points

- **`pet` while walking.** Step 2 refuses `tapBiscuit` while she walks. Whether a tap
  on her mid-walk should stop her and pet her instead is a product question; recommend:
  keep refusing in v1, since a stop mid-path needs P07b to hand back a position.
- **The chair's climb.** `chair` uses the `lie` transition on `spot.chair`; a real climb
  is a v1.1 clip. The director does not need to change when it arrives, only `items.ts`.
- **`idle.sit`.** Nothing in Step 2 chooses `idle.sit`; recommend the idle choice may
  pick `sit` (a transition then `idle.sit`) as one of its weighted entries so she is not
  always standing, and the executing agent adds it to `idleWeights` if the spec's
  `SheIsTheOnlyThingAlive` reading allows a self-chosen sit.
