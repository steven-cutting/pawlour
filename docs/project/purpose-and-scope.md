---
title: "Purpose and scope"
kind: "project"
audience: [user, contributor, maintainer, agent]
canonical_for: [project_purpose, project_non_goals]
requires: []
---

# Purpose and scope

Pawlour is a room Biscuit lives in. The player taps things in it; she decides what to do
about that, on her own timing, and the player watches. It is a Biscuit Games game with no
board, no score and no end, built for a phone, drawn in the register of Persona 5 and
Catherine, and rendered in three.js from the approved poseable model of the real dog.

It runs entirely in the browser as a static site: there is no server, no account and no
database. The platform package `@steven-cutting/biscuit-games` supplies the dark shell
around the scene, the type, the shared controls and the ports for the device's
preferences, so what this repository decides is the room, Biscuit's behaviour in it, and
how both are drawn.

## Who it is for

Friends and family of the maintainer, on an iPhone 17 Pro or better, in Safari, with a
spare minute. Nobody younger than that audience is designed for, and nothing is designed
to hold attention: the game is finished the moment the player looks away.

## What it does

One room, the main room of a log cabin, seen as a diorama from three fixed camera
positions — hearth, window and chair — that the player cuts between in Settings. In it
are a fireplace, a window with the weather behind it, a dog bed, a leather armchair, two
bowls, a rope toy, a treat jar, a side table with a mug of tea, a bookshelf with records,
a floor lamp and string lights.

A tap on a thing is an invitation. She walks over when she is ready, does the thing for
as long as it takes, and moves on; a tap while she is busy queues nothing, and the last
tap wins once she has finished. A tap on her is a reaction she plays over whatever she is
doing. Left alone, she idles and then chooses something herself, biased by the time of
day. Once an activity has settled, a dry third-person narrator may say one sentence about
it, never twice in a visit.

The time of day follows the device's clock in three phases, morning, evening and night,
until the player overrides it. The weather is chosen once per visit. Sound is off until
the player turns it on. When the device asks for less motion, the room becomes a still
diorama that still answers every tap. Photo mode frames the scene with a title card and
saves it as a PNG.

What the game does is stated precisely in `docs/specs/`, and the specification wins
where this page is looser; see [Specifications](../explanation/specifications.md).

## What it holds to

1. **Watching, not managing.** A tap is an invitation, not a command. There is nothing
   to optimise.
2. **One room, fully alive.** The fire moves, the light through the window changes with
   the day, the weather changes with the visit, the tea steams. She is the one thing that
   is alive; everything else moves only because fire and weather do.
3. **Atlus, not Animal Crossing.** Hard-edged cel Biscuit with ink outlines, a painted
   cabin held to one warm hue axis, overlays in red, black and white with hard diagonals.
   No bounce, no bloom, no sparkles. [Art direction](../design/art-direction.md) says
   how.
4. **Everything reachable.** Every tappable thing is also a real control with a name. A
   thumb, a keyboard and a screen reader reach the same commands, at the size the
   platform requires, down to 320 pixels wide.

## What it deliberately does not do

- **It is not a virtual pet.** No meters, no hunger, no neglect, no streaks, no unlocks.
  Nothing the player does or fails to do has a consequence beyond the next minute.
- **No accounts, no sync, no server, no telemetry.** The few settings it remembers belong
  to one browser on one device. See [Security model](../explanation/security-model.md).
- **One room.** Later rooms, and the diagonal wipe that joins them, are for later; the
  wipe exists in v1 only for loading and photo mode.
- **No face break.** The rig has no facial bones, so her face does not change.
- **No first-person copy anywhere,** including the loading card. She never speaks.
- **Not in v1:** a caption log, stoking the fire, the treat jar's interaction, free orbit
  or pinch-zoom of the scene (the page itself still zooms, as the platform requires),
  generative art in the shipped game, and sound on by default.

## Related pages

- [Terminology](terminology.md)
- [Repository map](repository-map.md)
- [The director](../explanation/the-director.md)
- [Performance budget](../reference/budget.md)
- [Architecture](../explanation/architecture.md)
