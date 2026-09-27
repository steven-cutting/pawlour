---
id: P17
title: "The five audio loops need an ear: fire that reads as fire, a squeak, and lapping"
status: open
depends_on: [P11]
parallel_with: [P12, P13, P14, P15, P16]
branch: ticket/p17-the-audio-loops-need-an-ear
estimated_size: S
---

# P17: The five audio loops need an ear: fire that reads as fire, a squeak, and lapping

## Context

P08 synthesised the five loops in `scripts/make_audio.py` (standard library, seeded,
noise shaped by filters and envelopes, a 200 ms tail-into-head crossfade, encoded by
`ffmpeg` to `.mp3`): `fire.mp3` 85,211 bytes, `rain.mp3` 73,248, `wind.mp3` 110,938,
`lapping.mp3` 51,765, `squeak.mp3` 33,794, mono, 44.1 kHz, each `made:2026-09-26`, `cc0`,
budget 524,288 (`P08-interface.md`, hand-back notes, "Audio"). The mechanism passed on the
phone: the switch started sound inside the gesture, squeak on play and lapping on drink
were heard (`P10-device-verification.md`, "Sound (Step 6)").

The character did not. P10 hand-back, "The character of the synthesised sounds is a
hand-back to P11": the maintainer heard "static that kind of sounds like rain, but it
plays even when it is not raining" (the fire crackle reads as rain), the squeak "kind of
sounds like chirping" and the drinking "sounds like spanking". `scripts/make_audio.py`'s
output needs an ear, or real recordings.

`PRD.md`, "Sound": fire crackle always, rain or wind by weather, lapping while she
drinks, a squeak while she plays; every file public domain or made in this repository,
its licence recorded beside it. `CONVENTIONS.md` §3, "Audio": mono, 44.1 kHz, loops of 8
to 20 seconds, each under 524,288 bytes; synthesis here (`made:`, `cc0`) or a CC0 download
recorded as `cc0:<url>`; nothing `unsettled` ships, and `just check-assets` refuses it.

Read first: `scripts/make_audio.py` whole; `src/lib/cues.ts` (which loop plays when; the
bed is the fire plus rain or wind by weather, so the fire is heard in every visit with
sound on, which is why a fire that reads as rain is wrong); `src/lib/ports/audio.ts` (the
source map; the file names are the contract); `docs/reference/asset-manifest.md`.

## Goal

- Five loops the maintainer, listening on the phone, names correctly without being told:
  a fire, rain, wind, a dog lapping, a rope toy's squeak.
- The same file names, formats and budgets, so nothing outside `src/lib/assets/audio/`
  and the manifest changes; the manifest's `source` and `licence` say where each came
  from.
- If synthesis stays: `scripts/make_audio.py` reworked with the maintainer's ear as the
  gate, and each loop's recipe described in its docstring. If recordings replace it: each
  file's CC0 source URL in the manifest, and the script deleted or kept for the loops it
  still makes.

## Non-goals

- New sounds (eating, sleeping, a pet): `src/lib/cues.ts` says those make no sound, and
  `cabin.allium` says nothing about them.
- Sound on by default, or on the shell (H `docs/design/direction.md`, as C01 narrows it).
- Any change to when a cue plays; that is `cues.test.ts`'s and stays.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `scripts/make_audio.py` | repo | the loops reworked, or reduced to what is still synthesised |
| `src/lib/assets/audio/*.mp3` | repo | the five files |
| `src/lib/assets/manifest.json` | repo | through `just assets-manifest`; `source` and `licence` by hand |
| `docs/reference/asset-manifest.md` | docs | only if a `cc0:<url>` source appears for the first time |
| `tickets/P17-the-audio-loops-need-an-ear.md` | tickets | `status: done` |

## Steps

1. **Decide the route with the maintainer**: rework the synthesis, or find CC0
   recordings (a source whose licence page says CC0, recorded as `cc0:<url>`; no
   commercial library, no "free for personal use").
2. **Make candidates.** For each loop, two or three variants under `ai_tmp/audio/`, with
   an HTML gallery the maintainer can play on the phone over `just preview-lan`.
3. **The ear is the gate.** The maintainer names each candidate blind; the one named
   right is the one that ships. Record the choice and the date.
4. **Ship.** Encode to `.mp3` as the script does today (mono, 44.1 kHz, 8 to 20 s, the
   crossfade), copy into `src/lib/assets/audio/`, run `just assets-manifest`, set the
   three hand fields, `just check-assets`, then `just check`.

## Acceptance criteria

- [ ] The maintainer's blind naming of all five, recorded in the hand-back notes.
- [ ] Every file under budget and `cc0`, and `just check-assets` green.
- [ ] `tests/cues.test.ts` unchanged and green.
- [ ] `just check` green.

## Verification

```sh
ls -l src/lib/assets/audio/
just check-assets
just check
```

## Hand-back notes

Filled in by the agent that executes this ticket: the route taken, each file's source,
the maintainer's naming, and whether `scripts/make_audio.py` survives.

## Open points

- **The fire's level.** If the fire reads as fire but sits under the rain, the mix is
  `src/lib/ports/audio.ts`'s to set per loop; say whether a gain per source is needed
  and hand it back rather than adding it here.
