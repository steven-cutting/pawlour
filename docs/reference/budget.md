---
title: "Performance budget"
kind: "reference"
audience: [contributor, maintainer, agent]
canonical_for: [performance_budget]
requires: []
---

# Performance budget

The figures the game is held to on the device it is built for: an iPhone 17 Pro in
Safari. They are measured on that phone, not estimated on a laptop, and each is either
met or its miss is recorded with a reason and a follow-up.

## The figures

| Figure | Budget | Measured |
| --- | --- | --- |
| Frame rate, steady, hearth camera, fire and weather on | 60 frames a second | not yet |
| Device pixel ratio | capped at 2 | not yet |
| Draw calls per frame | at most 60 | not yet |
| Biscuit, triangles after processing | at most 45,000 (an unverified target; no decimation ships today) | not yet |
| Biscuit, served file | at most 6 MB | not yet |
| Room, served file | at most 3 MB | not yet |
| First load: the model, the room, the first still, the fire texture and the code (audio and the other stills load on demand) | at most 12 MB | not yet |
| First frame on a 4G profile | at most 3 seconds | not yet |
| WebGL context lost | a still with the caption; a tap recovers it | not yet |

The "Measured" column is filled from the device, with the date and the build measured,
by following [Test on a phone](../how-to/test-on-a-phone.md). A figure is never copied
here from a desktop browser.

## Which figures a gate already holds

Two rows are also enforced on every `just check`, per file rather than per visit: the
asset manifest gives `biscuit.glb` a budget of 6,291,456 bytes and `cabin.glb` one of
3,145,728, and `just check-assets` refuses a file over its budget. Every other served
file has a per-file budget of its own; [Asset manifest](asset-manifest.md) lists them.
The per-file budgets deliberately sum past 12 MB, because a visit loads only the two
models, one still and the fire texture before its first frame and fetches the rest on
demand. The first-load figure is therefore a measurement, not a rule the manifest can
check.

The device pixel ratio cap is in the renderer; see [Rendering](../explanation/rendering.md).
Every other row is only ever known from the phone.

## Related pages

- [Test on a phone](../how-to/test-on-a-phone.md)
- [Build assets](../how-to/build-assets.md)
- [Asset manifest](asset-manifest.md)
- [Rendering](../explanation/rendering.md)
