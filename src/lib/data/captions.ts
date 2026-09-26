/**
 * The narrator's sentences, keyed by what she has settled into.
 *
 * The narrator is dry and third person, and says nothing in the first person
 * (the hub's `docs/design/character.md`). Every sentence here is about her or
 * the room, in the present perfect or the present continuous, under twelve
 * words, with no exclamation mark and no question. `cabin.allium`'s
 * `ACaptionIsShownAndAnnounced` says none is shown twice in a visit and the
 * bank holds at least forty; `tests/captions.test.ts` holds the register and
 * the counts.
 */
import type { Settled } from '../domain/items';

export const CAPTIONS: Readonly<Record<Settled, readonly string[]>> = {
  'sleep.bed': [
    'Biscuit has gone to bed.',
    'Biscuit is asleep in front of the fire.',
    'Biscuit has stopped watching.',
    'The bed has been claimed.',
    'Biscuit has fallen asleep with her eyes open.',
    'Biscuit has retired for the day, whatever the hour.'
  ],
  'sleep.chair': [
    'Biscuit has taken the chair.',
    'The chair is occupied.',
    'Biscuit has decided the chair is hers now.',
    'Biscuit is sleeping in the good chair.',
    'The armchair has been reassigned.',
    'Biscuit has curled up where people usually sit.'
  ],
  drink: [
    'Biscuit has had some water.',
    'Biscuit is drinking. It is taking a while.',
    'The water level has gone down slightly.',
    'Biscuit is drinking with great concentration.',
    'Most of the water has stayed in the bowl.',
    'Biscuit has been attending to the water.'
  ],
  eat: [
    'Biscuit is eating. Nothing else is happening.',
    'Dinner has been located.',
    'Biscuit has found the food bowl.',
    'Biscuit is eating as though someone might stop her.',
    'The food bowl is being dealt with.',
    'Biscuit has made progress on the bowl.'
  ],
  play: [
    'Biscuit has found the rope.',
    'The rope has lost.',
    'Biscuit is shaking the rope. The rope is not winning.',
    'Biscuit has defeated the rope again.',
    'The rope has been thoroughly examined.',
    'Biscuit is playing. The rope has no say in it.'
  ],
  pet: [
    'Biscuit has allowed it.',
    'Biscuit has decided that was acceptable.',
    'Biscuit has accepted the attention.',
    'Biscuit has tolerated that nicely.',
    'The pat has been received.',
    'Biscuit is leaning into it, briefly.'
  ],
  'idle.long': [
    'Biscuit is considering her options.',
    'Nothing has happened for some time.',
    'Biscuit is waiting to see what happens.',
    'Biscuit has been here a while.',
    'Biscuit is thinking about something, possibly dinner.',
    'The room has been quiet for a bit.'
  ]
};
