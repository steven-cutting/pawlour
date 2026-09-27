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
| Frame rate, steady, hearth camera, fire and weather on | 60 frames a second | 60 median, 58 minimum once loaded (53 in the first three seconds), over 147 s of walking bed, toy and water in evening rain; 2026-09-26 |
| Device pixel ratio | capped at 2 | 2, on a screen reporting 3; 2026-09-26 |
| Draw calls per frame | at most 60 | 53 to 54 with fire and rain on; 28 for Biscuit alone; 2026-09-26 |
| Biscuit, triangles after processing | at most 45,000 (an unverified target; no decimation ships today) | **Missed**: 86,828 in the file, 173,656 drawn because the ink outline draws her twice; 60 fps holds regardless, so no decimation is added (P03's open point stands); 2026-09-26 |
| Biscuit, served file | at most 6 MB | 2,525,000 bytes in the file, 2.53 MB on the phone's Network tab, loaded once, uncompressed; 2026-09-26 |
| Room, served file | at most 3 MB | 586,584 bytes in the file, 586.6 KB on the phone's Network tab, loaded once, uncompressed; 2026-09-26 |
| First load: the model, the room, the first still, the fire texture and the code (audio and the other stills load on demand) | at most 12 MB | 4,263,135 bytes: the same build's static files summed from a Chromium capture on the Mac of everything fetched up to the first frame, uncompressed from the preview server (3.11 MB models, 814 KB scripts, 279 KB fonts and page, 38 KB images, 21 KB styles); the two models confirmed on the phone's Network tab at 2.53 MB and 586.6 KB. Static file sizes do not depend on the device; 2026-09-26 |
| First frame on a 4G profile | at most 3 seconds | **Not measured**: no throttle was available (see below). Unthrottled on the LAN: 416 ms and 487 ms from navigation start; 2026-09-26 |
| WebGL context lost | a still with the caption; a tap recovers it | Passed: the still appeared, a tap brought the room back and the frame log resumed; 2026-09-26 |

Measured on an iPhone 17 Pro Max, iOS 26.6.2, Safari 26.6.1, on 2026-09-26, from the
build of the P10 device-verification change on top of commit `668a92c`, served over the
LAN by `just preview-lan` and read through the `?debug` hook and the Mac's Web Inspector.
The 4G row waits on the phone's Network Link Conditioner, which needs Xcode on the Mac;
Safari's Web Inspector cannot throttle on its own.

The frame-rate row was read from a hook that counted the frames drawn between two timer
ticks and called that a second; the hook now divides by the time that actually passed.
The run bounds the difference: 147 samples over 149 s, so the ticks drifted by under
1.5% on average, which moves a reading at 60 by less than one frame. The row stands
within that margin and is retaken with the corrected hook at the next device pass.

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
