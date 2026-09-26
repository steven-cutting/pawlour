---
title: "The director"
kind: "explanation"
audience: [contributor, maintainer, agent]
canonical_for: [director_model]
requires: []
---

# The director

Everything Biscuit decides is decided in one pure function, `step(state, command, deps)`
in `src/lib/domain/director.ts`. It takes the scene's state and one command and returns
the next state. It draws nothing, reads no clock and touches no browser global; the only
thing it is handed is the random port. That is what lets her behaviour be tested to the
coverage floor in jsdom while the canvas that draws it cannot be
([Decision 0013](../decisions/0013-the-canvas-lives-outside-the-coverage-glob.md)).

The rules below are the code's. What she must do is stated in `docs/specs/cabin.allium`,
and where this page and the specification disagree, the specification wins.

## The state

`SceneState` is a plain, serialisable object: what she is doing (`activity`), which
thing she is at (`at`, or the floor), where she is going (`target`, a named node in the
room and the item it belongs to), what she is looking toward (`lookAt`, a floor point or
an item), the `phase` and any `phaseOverride`, the `weather`, the two practical `lights`,
the `fire` level, the `camera`, whether `sound` is on, the current `caption` with a
sequence number, and whether `motion` is on.

Five more fields are bookkeeping: `elapsed` in the current activity, `untilIdleChoice`,
the captions already `shown` this visit, what a pet interrupted (`resume`) and which
pose she is standing up from (`standFrom`).

The activities are `idle.stand`, `idle.sit`, `walk`, `sit`, `lie`, `stand`, `sleep`,
`drink`, `eat`, `play` and `pet`. `stand` is the transitions played in reverse. The items
she can be sent to are `bed`, `chair`, `water`, `food`, `toy`, and the two lights, `lamp`
and `lights`; the jar and the fire are in the room but not in that list until v1.1.

## The commands

Each command is an object with a `kind`: `tap` (an item), `tapBiscuit`, `tapFloor` (a
point), `tick` (milliseconds), `arrived`, `setPhase` (a phase or `auto`), `clockPhase`,
`setWeather`, `toggleLight`, `setSound`, `setCamera` and `motionChanged`. The page sends
them; the director never asks for anything.

`arrived` is the one command the renderer sends. The director does not know how far she
walks or how fast: it sets `walk` with a target and waits for the scene to say she got
there.

## How a tap is answered

- **A tap on a thing is an invitation.** It sets the target, replacing any earlier one,
  so the last tap wins. If she is idle she sets off at once; if she is drinking, eating,
  playing or asleep she finishes the minimum of four seconds first; if she is walking,
  sitting down, lying down, standing up or being petted, the tap waits.
- **A tap on the thing she is using, or already heading for, changes nothing.**
- **A tap on a light** toggles it and turns her head toward it. It never walks her.
- **A tap on her is a reaction, not an activity.** While she idles, drinks, eats or plays,
  `pet` plays at once over what she is doing, the time she had spent on it is set aside,
  and after two seconds she goes back to it with that time intact. Any waiting tap is
  still waiting. Mid-walk or mid-transition a tap on her changes nothing; asleep, it wakes
  her once the minimum has passed.
- **A tap on the floor** turns her head toward the point. Nothing else.

Arriving at the bed or the chair plays `sit` then `lie`, each for its clip's length, then
`sleep` at that item's spot. Arriving at a bowl or the toy starts the activity directly.
Getting up from lying plays `stand` for the length of both transitions, from sitting for
one.

## Time

The page ticks the director every 250 milliseconds through the timer port, whether
motion is on or off, so behaviour and time advance in still mode too. The durations live
in `src/lib/domain/timing.ts`: drink 6 seconds, eat 10, play 15, pet 2; `sit` 1.0 and `lie`
1.2, which are the clips' lengths; sleep 90 seconds by morning, 150 by evening and 300 by
night.

When she has been idle long enough she chooses something herself. The interval is a
whole number of seconds between 20 and 40, multiplied by 0.7 in the morning and 1.5 at
night, and counts only idle time. The choice is weighted by phase in
`src/lib/domain/phases.ts`: in the morning she mostly plays; in the evening she favours
the chair; at night the bed. She never chooses the food bowl herself. If she has idled
past the scaled twenty seconds without choosing, the `idle.long` caption may appear once.

The phase comes from the device's clock, read through the clock port at load and once a
minute: morning from 05:00, evening from 14:00, night from 21:00. `setPhase` overrides
it until `setPhase('auto')` clears the override, after which the next clock reading
applies. A phase change resets the lights (the lamp is on in the evening and at night,
the string lights at night only) and the fire (0.35, 0.7, 1.0); a toggled light holds
until the phase actually changes. The weather is drawn once per visit through the random
port, weighted five clear to three rain to two snow.

## Captions

A caption is the narrator's one sentence, chosen by `src/lib/domain/captions.ts` from the
bank in `src/lib/data/captions.ts` through the random port. The bank is keyed by what
settled — `sleep.bed`, `sleep.chair`, `drink`, `eat`, `play`, `pet` and `idle.long` — with
six sentences each. A sentence already in `shown` is never picked again that visit, and
an exhausted key simply settles without one.

A caption is set when an activity settles, and for `pet` as the pet begins. It is cleared
when she sets off, stands up, arrives, or finishes drinking, eating or playing. The page
shows it and announces it in the same words.

## Motion off

With `motion` false, `step` finishes every movement at once after each command: a walk
arrives and settles, a transition completes, a stand gets up and sets off, a pet hands
her back. So the state is always one the renderer can draw as a still of her at the
thing, and every control and caption behaves as it does with motion on.

## The ports it runs on

The director itself takes only the random port. Around it, the page uses the timer port
(`every(ms, tick)`) for the 250 millisecond tick and the minute clock read, the clock
port for the hour, the storage port for the time override, and the audio port for sound.
The frame port drives rendering only, never the director. Each has an in-memory fake in
the same file, and the three this game adds — timer, frame and audio — have their cases
in `tests/ports.test.ts` after the template's.

## Related pages

- [Rendering](rendering.md)
- [Terminology](../project/terminology.md)
- [Specifications](specifications.md)
- [Decision 0002: Side effects behind ports](../decisions/0002-ports-and-fakes.md)
