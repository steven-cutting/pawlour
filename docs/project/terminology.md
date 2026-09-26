---
title: "Terminology"
kind: "project"
audience: [contributor, maintainer, operator, agent]
canonical_for: [project_terminology]
requires: []
---

# Terminology

These words mean one thing here. Most of them come from the specifications, and using
them loosely is how a review ends up arguing about vocabulary instead of behaviour.

## The game

| Term | Meaning |
| --- | --- |
| Player | Whoever is at the device. One at a time, and nothing here knows of a second. |
| Play surface | Where Pawlour is played: the room drawn on a canvas, and beside it the named controls that reach every thing in it. `Play` is its name in the root module; `Cabin` is the surface `cabin.allium` states the game's rules on. |
| Room | The cabin's main room, the one room in v1, built in Blender and served as `cabin.glb`. See [The room](../design/the-room.md). |
| Item | A thing in the room she can be sent to or that answers a tap: bed, chair, water, food, toy, lamp, lights. In the room file each is an `item.<name>` node; the jar, the fire, the window, the table and the shelf are items of the room with nothing to do in v1. |
| Approach | Where she stands to use an item: the `item.<name>.approach` node, facing the item, naming its nearest waypoint. |
| Spot | Where she lies: `spot.bed` in front of the fire and `spot.chair` on the seat. |
| Waypoint | A point on the floor, `nav.<n>`, joined to its neighbours. She walks between items along the graph they form. |
| Phase | The time of day: morning (05:00 to 13:59), evening (14:00 to 20:59) or night (21:00 to 04:59). Each is a lighting rig and a bias in what she chooses. |
| Override | The player's choice of phase, which replaces the clock's until it is cleared. |
| Activity | What she is doing, one at a time: idling standing or sitting, walking, sitting down, lying down, standing up, sleeping, drinking, eating, playing, or being petted. |
| Clip | A named animation keyframed on the rig in Blender and exported in `biscuit.glb`, such as `walk` or `sleep`. A loop repeats; a one-shot plays once; `pet` is additive, played over another clip. See [Author a clip](../how-to/author-a-clip.md). |
| Still | A picture of her at an activity in a phase, served as `stills/<activity>.<phase>.webp`. Shown before the first frame is drawn and when the drawing context is lost. |
| Still diorama | The room when motion is off: drawn once per change, with nothing flickering or falling. |
| Caption | The narrator's one dry, third-person sentence about what has just settled, shown and announced in the same words, never twice in a visit. |
| Director | The pure function that decides what she does next. See [The director](../explanation/the-director.md). |
| Register | One of the three ways a layer is drawn: cel with ink for her, painted for the room, graphic panels for overlays. See [Art direction](../design/art-direction.md). |

## The repository

| Term | Meaning |
| --- | --- |
| Specification | An `.allium` file under `docs/specs/`. Decides behaviour. |
| Surface | A boundary in a specification: what is exposed, what operations are provided, and what is guaranteed. |
| Guarantee | A named prose assertion on a surface. Acceptance criteria, not aspiration. |
| Port | An interface standing in front of a side effect, with a real adapter and an in-memory fake. Six are in `src/lib/ports/` (the template's clock, random and storage, and this game's timer, frame and audio); the device's preferences and its keyboard are the platform package's. |
| Platform | Biscuit Games: the repository that decides everything Pawlour would share with another game. See [The platform upstream](platform.md). |
| Exact | The platform's name for a mark that is wholly right, after the token that paints it. A game whose rules use another word translates it where a mark reaches something rendered. |
| Fake | The in-memory implementation of a port, used by tests. Not a mock: it behaves, rather than recording calls. |
| Gate | A check that can fail the build. Listed in [Quality gates](../reference/quality-gates.md). |
| Recipe | A `Justfile` target. The only supported interface to the checks. |

## Related pages

- [Specifications](../explanation/specifications.md)
- [Repository map](repository-map.md)
- [Purpose and scope](purpose-and-scope.md)
