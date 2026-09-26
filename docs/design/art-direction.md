---
title: "Art direction"
kind: "explanation"
audience: [contributor, maintainer, agent]
canonical_for: [art_direction]
requires: []
---

# Art direction

Pawlour is drawn in the register of Persona 5 and Catherine: Atlus, not Animal Crossing.
The rule that makes that hold is one rendering register per layer. Biscuit, the room and
the overlays are each drawn one way, the three ways are different, and nothing mixes
them. This page says what each register is and why; [Rendering](../explanation/rendering.md)
says how the runtime produces it.

## What the platform decides

Biscuit is the platform's character, and this game changes nothing about her. The
platform's dark shell, its header, its two typefaces — Bricolage Grotesque for display,
Instrument Sans for interface — and its controls surround the scene; the warm room exists
inside the play surface and nowhere else. Two platform pages own those rules:

- [Design direction](https://github.com/steven-cutting/biscuit_games/blob/main/docs/design/direction.md)
  — the aesthetic, the type, the motion and the voice.
- [The Biscuit character](https://github.com/steven-cutting/biscuit_games/blob/main/docs/design/character.md)
  — who she is, where she may appear, and how she is voiced.

Those are whole-page links into another repository. Nothing in `just check` resolves
them, so a page renamed there rots here silently until `just check-links-online` is run
by hand; [The platform upstream](../project/platform.md) explains why that is accepted.

As written, both pages forbid much of what this game is: a warm ground, 3D rendering,
decoration that moves, sound, and Biscuit as the surface rather than a visitor to it. A
platform decision record narrows them for this game, and until it lands nothing here
deploys.

## Biscuit: cel over gradient, with ink

Persona 5's first rendering system: hard-edged cel shading in a few flat bands of light
over the model's own colours, with ink outlines. This is the approved look of the model
in Blender, and the runtime reproduces it rather than inventing one. Her ink is a warm
near-black, not pure black, so her face lines read as coloured ink. She casts no soft
shadow; a flat, hard-edged contact shape under her sits at 0.60 to 0.65 of the lit floor
value, as Catherine's backgrounds do it.

Her face does not change. The rig has no facial bones and no eyelids, so her eyes stay
open even asleep, and the sleep clips turn her head away from the default camera so she
is not sleeping at the player.

## The room: a painted ground

Catherine's backgrounds: figure and ground are two rendering systems. The room has no
ink. It is held to one warm hue axis — every surface between hue 20° and 35° — and its
planes are separated by value and by the light's bands, never by hue. Vertex colours
carry the painting: faces turned down or away are darker, logs and stone vary slightly.
Dark masses such as the inside of the hearth are pushed toward a warm black rather than
greyed.

The one colour allowed off the axis is the sky through the window: pale in the morning,
amber in the evening, cool at night, a few percent of the frame. A soft vignette sits over
the whole frame and never inside a shape.

## Overlays: red, black and white

Persona 5's second system: the title card, the loading card, the photo frame and the
wipe between rooms are flat scarlet, black and white panels split by hard diagonals.
They are drawn in the DOM, not on the canvas, set in the platform's display type,
alternating white on black and black on white. No halftone, no gradient, no rotated or
ransom lettering, which would read as noise beside the platform's type. The scarlet is
this game's own token, declared once with its contrast measured against the platform's
floors, because the card carries words. The warm family the platform rations to its mark
is not used.

## What is out

No bounce, no bloom, no sparkles, no rounded friendliness. No physically based gloss and
no realistic lighting. Nothing in the room moves of its own accord except the fire, the
weather and the steam from the tea.

## Where the references are

The style references are in the `biscuit_pics` repository and are cited, never copied:
`inspiration/persona_5/ann_takamaki/INDEX.md` for the five Persona 5 rendering systems,
and `inspiration/catherine/katherine/INDEX.md`, section "The core", for figure and ground,
one hue axis per picture, and the contact shadow. Everything under `inspiration/` is
third-party copyrighted reference material, and the fonts beside it are commercial;
neither ships here.

## Related pages

- [Rendering](../explanation/rendering.md)
- [The room](the-room.md)
- [Purpose and scope](../project/purpose-and-scope.md)
- [The platform upstream](../project/platform.md)
