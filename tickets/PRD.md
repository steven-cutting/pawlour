# Pawlour: product requirements

Pawlour is a room Biscuit lives in. The player taps things in it; she decides what to do
about that, on her own timing, and the player watches. It is a Biscuit Games game with no
board, no score and no end, built for a phone, drawn in the register of Persona 5 and
Catherine, and rendered in three.js from the approved poseable model of the real dog.

This document says what the game is and what v1 must do. `CONVENTIONS.md` says how it is
built and every ticket under `tickets/` cites that document by section. Where this
document and `CONVENTIONS.md` disagree about behaviour, this document wins and
`CONVENTIONS.md` is corrected; where they disagree about mechanism, `CONVENTIONS.md`
wins.

## Who it is for, and what it is not

Friends and family of the maintainer, on an iPhone 17 Pro or better, in Safari, with a
spare minute. Nobody younger than that audience is designed for, and nothing is designed
to hold attention: the game is finished the moment the player looks away.

It keeps every platform invariant: no account, no server, no telemetry, a static site on
GitHub Pages, the platform's dark shell and its typefaces around the scene. It is not a
virtual pet. There are no meters, no hunger, no neglect, no streaks, no unlocks. Nothing
the player does or fails to do has a consequence beyond the next minute.

## The character, unchanged

Biscuit is the platform's host, owned by the hub's `docs/design/character.md`, and this
game changes nothing about her. She has one face, learned by heart, and it does not break
in v1 because the rig has no facial bones; the rare break stays a later purchase. She
never speaks in the first person. The only prose about her is a dry third-person narrator
that observes, rarely: *Biscuit has gone to bed.* Everything functional is plain, warm
interface copy. The contrast between her disproportionate behaviour and the flat prose is
the whole joke, and the game does not add a second one.

Two hub rules move for this game and only this game, through a hub decision record
(ticket C01): she may be the surface itself rather than a boundary visitor, because a
room with nothing to think about has no board for her to compete with; and when motion is
off she becomes a still rather than reducing to the mark, because a room without her is
not a game. Everything else on both hub pages stands.

## Experience pillars

1. **Watching, not managing.** A tap is an invitation, not a command. She walks over
   when she is ready, does the thing for as long as it takes, and moves on. There is
   nothing to optimise.
2. **One room, fully alive.** The fire moves, the light through the window changes with
   the day, the weather changes with the visit, the tea steams. She is the one thing that
   is alive; everything else moves only because fire and weather do.
3. **Atlus, not Animal Crossing.** Hard-edged cel Biscuit with ink outlines. A painted
   cabin held to one warm hue axis, its planes separated by value rather than by hue.
   The photo frame in red, black and white with hard diagonals. No bounce, no bloom, no
   sparkles, no rounded friendliness anywhere.
4. **Everything reachable.** Every tappable thing is also a real control with a name. A
   thumb, a keyboard and a screen reader reach the same commands, at the same size the
   platform requires, down to 320 pixels wide.

## The room

One room in v1, the cabin's main room, seen as a diorama from three fixed camera
positions: **hearth** (the default, the fireplace on the left and her bed in front of
it), **window** (the armchair under the window, weather behind the glass), and **chair**
(close on the armchair and the side table). The camera control in Settings moves
between them; the move is a cut, not a pan. A tap or a swipe on the scene's edge is the
v1.1 route.

What is in it:

| Thing | Role |
| --- | --- |
| Log walls, plank floor, rug | the ground of the painting |
| Fireplace | the light source, the fire, the crackle |
| Window | the sky and the weather; the key light by day |
| Dog bed | sleep, in front of the fire |
| Leather armchair | sleep, curled up, under the window |
| Water bowl | drink |
| Food bowl | eat |
| Toy (a rope) | play |
| Treat jar | v1.1: a treat |
| Side table with a mug of tea | steam; set dressing |
| Bookshelf with records | set dressing |
| Floor lamp | a practical light, on at evening and night, tappable |
| String lights | a practical light, on at night, tappable |

Later rooms are joined by a Persona-style diagonal wipe. v1 has one room and no wipe: the
loading and saved card is still, and `wipe.ts` waits for a second room.

## What she does

Every tap on a thing is answered with a walk and an activity, unless she is already doing
that thing, in which case she keeps doing it. Tapping something else while she is busy
queues nothing: she finishes what she is doing, then the last tap wins. A tap on her is
the one exception: while she idles, drinks, eats or plays, the pet reaction plays at once
over what she is doing, and she goes back to it afterwards, the time she had already
spent on it intact. Mid-walk, or while sitting down, lying down or standing up, a tap on
her changes nothing; asleep, a tap wakes her once the four-second minimum has passed, as
any tap does, and inside it a tap on a thing waits while a tap on her changes nothing
(P06; corrected by P11).

| Tap | What she does | Caption, once she has settled |
| --- | --- | --- |
| Bed | walks over, lies down, sleeps | *Biscuit has gone to bed.* |
| Chair | walks over, climbs up, curls up, sleeps | *Biscuit has taken the chair.* |
| Water bowl | walks over, drinks, looks up | *Biscuit has had some water.* |
| Food bowl | walks over, eats | *Biscuit is eating. Nothing else is happening.* |
| Toy | walks over, plays: shakes it, drops it, paws it | *Biscuit has found the rope.* |
| Lamp or string lights | the light toggles; she looks toward it | none |
| Biscuit herself | a pet reaction: a lean, the tail, an ear | *Biscuit has allowed it.* |
| Empty floor | her head turns toward the tap; nothing else | none |
| Fire | nothing in v1; stoking is v1.1 | none |
| Treat jar | v1.1: comes over, sits, takes a treat | *Biscuit has noticed the jar.* |

When nothing is tapped she idles: standing or sitting where she is, breathing, an ear
twitch, the tail swaying, all procedural and always on. After a while she chooses
something herself, biased by the time of day: at night she goes to bed sooner and wakes
slower; in the morning she plays sooner. Yawning, stretching and circling before lying
down are v1.1 clips; in v1 she lies down without ceremony.

Her eyes stay open, including asleep, because the rig has no eyelids. The sleep clips
tuck her head under a paw or turn it away from the default camera so she is not sleeping
at the player.

## Captions

A caption is the narrator's one sentence, shown and announced by the platform's `Notice`,
which is itself a status region; an `Announcer` beside it would be heard twice (P08;
corrected by P11). It is shown once an activity has settled, never on the tap, except the
pet's, which comes as the pet plays (P01, P06; corrected by P11), and never twice in a
session. The bank holds at least forty; each is dry, third person, present
perfect or present continuous, and none carries an exclamation mark. There is no caption
log in v1.

## Time of day

Three phases: **morning** (05:00 to 13:59), **evening** (14:00 to 20:59) and **night**
(21:00 to 04:59), read from the device's clock through the clock port at load and once a
minute. A three-way control overrides the clock; the override persists through the
storage port until the player clears it. Each phase is a lighting rig (the window as key
light by day, the fire's share of the light, which practical lights are on, the phase's
palette on the warm axis) and a behaviour bias.

## Weather

Chosen per visit through the random port, weighted clear, rain, snow, and visible
through the window as cel particles. Rain and wind are the ambient bed when sound is on.
Weather never enters the room.

## Sound

Off by default, with a visible switch. When on: fire crackle always, rain or wind by
weather, lapping while she drinks, a squeak while she plays. Nothing plays before the
player has turned it on, and turning it on is the only gesture that starts audio. Every
file is public domain or made in this repository, and its licence is recorded beside it.

## Motion off

When the device asks for reduced motion, or the platform's animations setting is off, the
room is a still diorama: no fire flicker, no particles, no clips, no idle motion, no
wipe. Tapping a thing cuts to a still of her at that thing; the lights, the time control
and the captions all still work; time still advances. Nothing the player can do depends
on motion.

## Photo mode

Freezes the scene and frames it with a title card in the graphic register: the word
PAWLOUR, the current caption if there is one, the time of day. Saved as a PNG through a
plain download in v1; the share sheet is the v1.1 route. The card carries no first-person
copy. The "Saved" card shown over the room afterwards is the platform's chrome, like the
loading card.

## Loading

A card in the platform's own chrome, with the lockup and a progress rule, shown from
the first paint until the model, the room and the first frame are ready, and never for
less than one second, even when everything is already downloaded. A room that cannot
be drawn dismisses it at once. The copy is plain interface copy.

## Performance budget

Measured on an iPhone 17 Pro in Safari (an iPhone 17 Pro Max, in the event; corrected by
P11) and recorded in the device verification ticket and `docs/reference/budget.md`:

| Figure | Budget |
| --- | --- |
| Frame rate, steady, hearth camera, fire and weather on | 60 frames a second |
| Device pixel ratio | capped at 2 |
| Draw calls per frame | at most 60 |
| Biscuit, triangles after processing | 86,828 in the file, 173,656 drawn, because the ink outline draws her twice; 60 fps holds at that count on the device, so no decimation ships and the earlier 45,000 target is withdrawn (P10; corrected by P11) |
| Biscuit, served file | at most 6 MB |
| Room, served file | at most 3 MB |
| First load: the model, the room, the first still, the fire texture and the code (audio and the other stills load on demand) | at most 12 MB |
| First frame on a 4G profile | at most 3 seconds |
| WebGL context lost | a still with the caption; a tap recovers it |

## Non-goals for v1

More than one room; a facial rig or a face break; accounts, progress, achievements,
notifications, streaks; a caption log; stoking the fire; free orbit or pinch-zoom of the
scene (the page still zooms, as the platform requires); generative art in the shipped
game; sound on by default; any first-person copy anywhere, including the loading card.

## Acceptance for v1

- Every row of the interaction table works from touch, from the keyboard and from a
  screen reader, at 320 pixels wide, with every control at least 44 pixels across.
- All three phases and all three weathers render, and the override persists.
- Motion off gives the still diorama, and the still per activity exists.
- Sound never starts unasked, and every audio file carries a licence.
- The budget table is measured on the device and every figure is met or the miss is
  recorded with a reason and a follow-up ticket.
- Every hub clause the game restates in `tests/restated.ts` holds against the shipped
  package, `just check` is green, the hub decision record has landed, and the site is
  live on GitHub Pages.

## Open questions

- Whether the sweater comes off at night. The model has a dressed and an undressed
  display and the exporter can carry both; it is a decision about her, so it is the
  maintainer's.
- Whether forty captions is enough to feel rare. The number is a floor; the tickets
  count what ships (42 shipped, P06).
- Whether the cabin has a door. It has none; P05 recommends a non-interactive one on the
  −X wall near the +Z corner as set dressing, if wanted. Recorded by P11.
- Whether the dark ceiling plane at 2.4 m stays, or the cameras are framed so its edge
  never shows. P05 left it in and P07a frames the floor, not the ceiling. Recorded by P11.
