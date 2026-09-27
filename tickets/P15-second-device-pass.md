---
id: P15
title: "Second device pass: the 4G first frame, the frame-rate row retaken, and what P06 and P08 left to the phone"
status: open
depends_on: [P10, P11]
parallel_with: [P12, P13, P14, P16]
branch: ticket/p15-second-device-pass
estimated_size: S
---

# P15: Second device pass: the 4G first frame, the frame-rate row retaken, and what P06 and P08 left to the phone

## Context

P10 measured the budget on the maintainer's iPhone 17 Pro Max on 2026-09-26 and left
five things to a later pass, each recorded in `P10-device-verification.md`, `P06-director-and-ports.md`
and `P08-interface.md` and collected by P11 (`P11-follow-up.md`, items table):

- P10 hand-back, "First frame on 4G, not measured": Safari's Web Inspector has no
  throttling; the phone's Network Link Conditioner needs Xcode on the Mac and a restart
  the maintainer could not do that day. Unthrottled on the LAN the first frame came at
  416 ms and 487 ms. `PRD.md`'s row is "at most 3 seconds", and `PRD.md`'s acceptance
  says a miss needs a reason and a follow-up: this is the follow-up.
- P10 hand-back, "The hook called every tick a second": the frame-rate row in
  `docs/reference/budget.md` was read with the hook before its correction and stands
  within a 1.5% margin; the page says it "is retaken with the corrected hook at the next
  device pass".
- P10 open point, "The 4G profile": record the preset used and its stated figures rather
  than the word "4G".
- P06 hand-back, "g. `untilIdleChoice` counts idle time only" and P06 open point,
  "`idle.long`'s frequency": whether `idle.long` fires more often than "rare", and the
  one edge the state cannot close (a phase change in the middle of an idle stretch can
  say `idle.long` twice), are what a recording across a clock boundary shows.
- P08 open point, "`Notice` for a failed `enable()`": whether Safari ever rejects the
  `AudioContext` inside a gesture is unmeasured; P10 heard sound start, so the path was
  not exercised on the device.
- P08 hand-back, "Codex adversarial review", finding 2: the failed first load (the card
  gone, "The room could not be drawn." announced, the retry button reachable) was
  verified only by a Playwright script; P14 puts it in the gate in Chromium, and this pass
  sees it once on the phone by blocking `cabin.glb`.

Read first: `docs/how-to/test-on-a-phone.md` (the `?debug` hook and its calls, the
Network Link Conditioner paragraph, and how to copy a run out of the Web Inspector);
`docs/reference/budget.md`; `src/routes/scene/debug.ts`; `P10-device-verification.md`
hand-back notes whole; `tickets/CONVENTIONS.md` §10 (the maintainer drives the phone; the
agent writes).

## Goal

- Every row of `docs/reference/budget.md` carries a figure from the corrected hook, with
  the date and the build, and the "retaken at the next device pass" sentence is gone.
- The "First frame on a 4G profile" row carries a measurement, the throttle preset's
  name and its stated down, up and latency figures, or a miss with a reason.
- A recording of at least one idle stretch across a phase boundary, and a note in
  `docs/explanation/the-director.md` if `idle.long` needs `IDLE_LONG` raised
  (`src/lib/domain/timing.ts`; record the figure and change the constant only with the
  maintainer's word).
- The sound switch tried with the phone silenced and with the ring switch off, and
  whether `enable()` ever rejected recorded; if it did, that the switch stayed off with
  its notice.
- The failed first load seen once on the phone: `cabin.glb` blocked in the Web
  Inspector, the card gone, the notice read, the retry button tapped and the room drawn.

## Non-goals

- Accessibility on the device (reduced motion, the theme and contrast combinations):
  P16.
- Any change to the renderer, the assets or the director's constants beyond what the
  maintainer decides from the recording.
- Measuring in a desktop browser. A figure is never copied to the budget page from a
  desktop.

## Files touched

| Path | Class | Change |
| --- | --- | --- |
| `docs/reference/budget.md` | docs | the Measured column, every row; the caveat paragraph removed |
| `docs/how-to/test-on-a-phone.md` | docs | the preset used, named, if the page's description of the conditioner needs it |
| `docs/explanation/the-director.md` | docs | only if `IDLE_LONG` changes |
| `src/lib/domain/timing.ts`, `tests/director.test.ts` | repo | only if the maintainer raises `IDLE_LONG` |
| `tickets/P15-second-device-pass.md` | tickets | `status: done` |

## Steps

1. **Build and serve.** `just frontend-build` and `just preview-lan`; the maintainer
   opens `http://<the Mac's LAN address>:4173/?debug` on the phone with the Web Inspector
   attached, as the how-to says.
2. **Throttle.** Xcode installed and the Network Link Conditioner enabled under
   Settings → Developer; choose the LTE profile (or the closest to a 4G profile the
   version offers) and write down its name and figures. Reload; read the first-frame
   line from the hook twice. Record both, and the preset.
3. **Frame rate.** Repeat P10's run 2 (hearth, evening, rain, sound off, Safari in the
   foreground, bed → toy → water, at least two minutes) with the corrected hook; read
   `report()` for the median and minimum; record them.
4. **Idle across a boundary.** With the time control on Auto and the clock near a phase
   boundary (or with the Mac's clock and the phone's set to a minute before one), leave
   her idle through it and read the console for `idle.long` sentences; note how many
   times it fired per stretch over twenty minutes of idling. Put the count to the
   maintainer with the recommendation from `P06-director-and-ports.md` (raise `IDLE_LONG`
   toward the interval's maximum if it reads as often).
5. **Sound.** Turn the switch on with the phone silenced, then with the ring switch off,
   then inside a fresh load after the phone was locked. Record whether the notice "could
   not start" ever appeared and whether the console shows a rejected `enable()`.
6. **The failed load.** In the Web Inspector, block the request for `cabin.glb` (or
   serve the page with the file renamed), reload, and confirm: the loading card leaves,
   the page notice "The room could not be drawn." is shown, the retry button is reachable
   by touch, and unblocking then tapping it draws the room.
7. **Write.** Fill the budget page; remove the caveat; run `just check-docs`, then
   `just check`.

## Acceptance criteria

- [ ] No row of `docs/reference/budget.md` says "retaken" or "Not measured" without a
      reason and a follow-up ticket named.
- [ ] The 4G row names the preset and its figures.
- [ ] The `idle.long` count and the maintainer's decision are in the hand-back notes.
- [ ] `just check` green.

## Verification

```sh
grep -n 'retaken\|Not measured' docs/reference/budget.md
grep -n 'preset\|Conditioner' docs/reference/budget.md docs/how-to/test-on-a-phone.md
just check
```

## Hand-back notes

Filled in by the agent that executes this ticket: the phone, the OS and Safari versions,
the build, the preset, every figure, and whether `IDLE_LONG` changed.

## Open points

- **The preset's honesty.** The Network Link Conditioner's LTE profile is not a 4G
  network; record its figures beside the word so the row is reproducible, and let the
  maintainer say whether the profile is the budget's meaning of "4G".
