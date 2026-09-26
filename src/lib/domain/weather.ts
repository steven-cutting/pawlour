/**
 * What is behind the window for a visit.
 *
 * `cabin.allium` says it is chosen once per visit and never comes into the
 * room. The weights are tuning, stated here: half the visits clear, three in
 * ten rain, one in five snow.
 */
import type { RandomPort } from '../ports/random';

export type Weather = 'clear' | 'rain' | 'snow';

const WEIGHTED: readonly Weather[] = [
  'clear',
  'clear',
  'clear',
  'clear',
  'clear',
  'rain',
  'rain',
  'rain',
  'snow',
  'snow'
];

export function chooseWeather(random: RandomPort): Weather {
  return random.uniformChoice(WEIGHTED);
}
