---
title: "Test on a phone"
kind: "how-to"
audience: [contributor, maintainer, agent]
canonical_for: [device_testing]
requires: []
---

# Test on a phone

Pawlour is built for an iPhone 17 Pro in Safari, and the figures in
[the performance budget](../reference/budget.md) mean nothing measured anywhere else.
This page is how to put a local build on the phone, inspect it from the Mac, and measure
it. It needs a Mac and the phone on the same network, and nothing outside it.

## Serve a build to the phone

1. Build the site. Leave `BASE_PATH` unset, so it is served from `/`:

   ```console
   just frontend-build
   ```

2. Serve it on every interface:

   ```console
   just preview-lan
   ```

   `just preview` binds `127.0.0.1` only, which the phone cannot reach; `preview-lan`
   binds `0.0.0.0` and prints the Mac's LAN address. Anyone on the same network can open
   it while it runs, so stop it when you are done.

3. Open the printed LAN address in Safari on the phone.

## Inspect it from the Mac

1. On the phone: Settings → Safari → Advanced → Web Inspector, on.
2. Connect the phone to the Mac. On the Mac: Safari → Develop → the phone → the page.
3. Record the phone's model, and the iOS and Safari versions, with every figure you take.

The Network tab shows what loaded and how large it was; the Timelines tab's Rendering
Frames shows the frame rate. Adding `?debug` to the address makes the scene log its frame
rate, draw calls, triangles and textures to the console once a second, and exposes
`window.__pawlour.loseContext()` and `restoreContext()` for testing context loss.

## Measure the budget

Take each row of [the performance budget](../reference/budget.md) in turn:

- **Frame rate:** the hearth camera, evening, rain, sound off, with her walking between
  things for two minutes. Record the minimum and the median frame rate.
- **Device pixel ratio, draw calls, triangles:** from the renderer's own counters.
- **Served files and first load:** the Network tab with the cache disabled and the
  throttling profile nearest 4G, from a reload to the first drawn frame, three times;
  record the median.
- **Context loss:** lose the context from the console. The still for the current activity
  and phase must appear with the caption as its description, and a tap on it must bring
  the scene back.

Then check what the budget does not list: with Reduce Motion on, the room is a still
diorama that still answers every control; sound starts only from the switch, and only
inside that tap; the header, controls, caption and settings are legible in light and dark
and with Increase Contrast on and off.

Write each figure into the "Measured" column of the budget with the date, and name the
phone and its versions under the table. When a figure is missed, record the miss, its
reason and a follow-up rather than leaving the row blank.

## Related pages

- [Performance budget](../reference/budget.md)
- [Rendering](../explanation/rendering.md)
- [Develop locally](develop-locally.md)
- [Commands](../reference/commands.md)
