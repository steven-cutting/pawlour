// tests/route.test.ts
import { createFakePreferences } from '@steven-cutting/biscuit-games';
import type { DeviceAnswers } from '@steven-cutting/biscuit-games';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { GAME_NAME, GAME_TITLE } from '../src/lib/brand';
import { CAPTIONS } from '../src/lib/data/captions';
import { CLOCK_INTERVAL_MS, DURATION } from '../src/lib/domain/timing';
import { createFakeAudio } from '../src/lib/ports/audio';
import { createFakeClock } from '../src/lib/ports/clock';
import { createFakeFrames } from '../src/lib/ports/frame';
import type { Ports } from '../src/lib/ports/index';
import { createFakeRandom } from '../src/lib/ports/random';
import { createFakeStorage } from '../src/lib/ports/storage';
import { createFakeTimer } from '../src/lib/ports/timer';
import Page from '../src/routes/+page.svelte';

/*
 * The page, with every port a fake. CONVENTIONS.md §7 is the layout; the
 * clauses are `cabin.allium`'s (EveryItemIsAControl, HerControlSaysWhatSheIsDoing,
 * ACaptionIsShownAndAnnounced,
 * TimeFollowsTheClockUntilOverridden, SoundNeverStartsUnasked,
 * MotionOffIsAStillDiorama) and the platform's Dialog guarantees.
 *
 * Two things keep it deterministic. `phaseAt` reads the hour in this process's
 * zone, so clock values are built from local components. And with motion on,
 * a walk waits for the runtime's `arrived`, which never comes under jsdom, so
 * the device asks for reduced motion by default and the director resolves
 * every walk on the spot; the motion tests flip it.
 */

const NIGHT = new Date(2026, 0, 1, 23, 0).getTime();
const MORNING = new Date(2026, 0, 1, 9, 0).getTime();
const AFTERNOON = new Date(2026, 0, 1, 14, 0).getTime();
// In the morning both practical lights are off, and the lights' opener says so.
const BAR = [
  'Biscuit, standing on the floor. Send her somewhere',
  'Lights: lamp off, lights off',
  'Pet'
];
const THINGS = ['Bed', 'Chair', 'Water', 'Food', 'Toy'];

interface Fakes extends Ports {
  audio: ReturnType<typeof createFakeAudio>;
  clock: ReturnType<typeof createFakeClock>;
  timer: ReturnType<typeof createFakeTimer>;
  preferences: ReturnType<typeof createFakePreferences>;
}

function fakes(
  options: { at?: number; stored?: Record<string, string>; device?: DeviceAnswers } = {}
): Fakes {
  return {
    storage: createFakeStorage(options.stored ?? {}),
    clock: createFakeClock(options.at ?? MORNING),
    random: createFakeRandom([0]),
    timer: createFakeTimer(),
    frames: createFakeFrames(),
    audio: createFakeAudio(),
    preferences: createFakePreferences({ prefersReducedMotion: true, ...options.device })
  };
}

function mount(options: Parameters<typeof fakes>[0] = {}) {
  const ports = fakes(options);
  const rendered = render(Page, { props: { ports } });
  return { ...rendered, ports };
}

const button = (name: string) => screen.getByRole('button', { name });
const sentence = () => screen.getByText(/^Biscuit is /);

async function openSettings(): Promise<HTMLElement> {
  await userEvent.click(button('Settings'));
  return screen.findByRole('dialog', { name: 'Settings' });
}

const her = () => screen.getByRole('button', { name: /^Biscuit, / });

async function openSend(): Promise<HTMLElement> {
  await userEvent.click(her());
  return screen.findByRole('dialog', { name: 'Send Biscuit to' });
}

/** Sends her to a thing the way a thumb does: through her control's dialog. */
async function send(name: string): Promise<void> {
  const dialog = await openSend();
  await userEvent.click(within(dialog).getByRole('button', { name }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
}

async function openLights(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: /^Lights: / }));
  return screen.findByRole('dialog', { name: 'Lights' });
}

describe('the page', () => {
  it('carries the heading the platform header draws for this game', () => {
    mount();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `biscuit games / ${GAME_NAME}`
    );
  });

  it('titles the document after the game', () => {
    mount();

    expect(document.title).toBe(GAME_TITLE);
  });

  it('has a main landmark to put the game in', () => {
    mount();

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});

describe('the controls', () => {
  it('offer her, the lights, Pet and a photo by name, and the things behind her control', async () => {
    mount();

    for (const name of [...BAR, 'Photo']) {
      expect(button(name)).toBeInTheDocument();
    }
    expect(her()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button('Lights: lamp off, lights off')).toHaveAttribute('aria-haspopup', 'dialog');

    const dialog = await openSend();
    for (const name of THINGS) {
      expect(within(dialog).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('open the settings dialog from the header and close it on Escape', async () => {
    mount();
    const settings = button('Settings');
    expect(settings).toHaveAttribute('aria-haspopup', 'dialog');

    const dialog = await openSettings();

    expect(within(dialog).getByRole('group', { name: 'Time of day' })).toBeInTheDocument();
    expect(within(dialog).getByRole('switch', { name: 'Ambient sound' })).not.toBeChecked();
    expect(within(dialog).getByRole('group', { name: 'Camera' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('the hidden sentence', () => {
  it('states the scene from the clock and the weather drawn for the visit', async () => {
    mount({ at: NIGHT });

    await waitFor(() => {
      expect(sentence()).toHaveTextContent('Biscuit is standing on the floor. It is night. Clear.');
    });
    expect(sentence()).toHaveAttribute('aria-live', 'polite');
  });

  it('follows her', async () => {
    mount({ at: NIGHT });

    await send('Water');

    await waitFor(() => {
      expect(sentence()).toHaveTextContent('Biscuit is drinking at the water bowl.');
    });
  });
});

describe('a tap on her', () => {
  it('captions the pet in a status region, and the still says the same', async () => {
    mount();
    const caption = CAPTIONS.pet[0] ?? '';

    await userEvent.click(button('Pet'));

    const text = await screen.findByText(caption);
    expect(text.closest('[role="status"]')).not.toBeNull();
    expect(screen.getByRole('img', { name: caption })).toBeInTheDocument();
  });

  it('marks where she is once she has settled somewhere, and her control follows her', async () => {
    mount();

    await send('Chair');

    await waitFor(() => {
      expect(her()).toHaveAccessibleName(/^Biscuit, [a-z ]+ in the chair\. Send her somewhere$/);
    });
    const dialog = await openSend();
    expect(within(dialog).getByRole('button', { name: 'Chair, she is here' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });
});

describe('sound', () => {
  it('plays nothing until the switch is turned on, then the bed and her sounds', async () => {
    const { ports } = mount();
    const { audio, timer } = ports;

    await send('Water');
    await screen.findByText(CAPTIONS.drink[0] ?? '');
    expect(audio.calls).toEqual([]);

    const dialog = await openSettings();
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Ambient sound' }));
    await waitFor(() => {
      expect(audio.calls).toContain('bed:fire');
    });
    expect(audio.calls[0]).toBe('enable');
    await userEvent.keyboard('{Escape}');

    timer.advance(DURATION.drink * 1_000);
    await send('Toy');

    await waitFor(() => {
      expect(audio.calls).toContain('play:squeak');
    });
    const enabled = audio.calls.indexOf('enable');
    expect(audio.calls.findIndex((call) => call.startsWith('play:'))).toBeGreaterThan(enabled);
    expect(audio.calls.slice(0, enabled).some((call) => call.startsWith('play:'))).toBe(false);
  });

  it('stops everything when the switch is turned off', async () => {
    const { ports } = mount();
    const { audio } = ports;
    const dialog = await openSettings();
    const toggle = within(dialog).getByRole('switch', { name: 'Ambient sound' });
    await userEvent.click(toggle);
    await waitFor(() => {
      expect(audio.calls).toContain('bed:fire');
    });

    await userEvent.click(toggle);
    await userEvent.keyboard('{Escape}');
    await send('Water');
    await screen.findByText(CAPTIONS.drink[0] ?? '');

    expect(audio.calls.at(-1)).toBe('disable');
  });

  it('lets Off overtake an On still starting, and the next On starts the bed', async () => {
    // The real port resolves an enable that a later disable overtook without
    // starting anything (`generation` in `createWebAudio`), so the page must
    // not take a stale resolution for sound on. `enable` here settles only
    // when the test says so.
    const resolvers: (() => void)[] = [];
    const audio = createFakeAudio();
    const deferred = {
      ...audio,
      enable(): Promise<void> {
        void audio.enable();
        return new Promise((resolve) => resolvers.push(resolve));
      }
    };
    const ports = { ...fakes(), audio: deferred };
    render(Page, { props: { ports } });
    const dialog = await openSettings();
    const toggle = within(dialog).getByRole('switch', { name: 'Ambient sound' });

    await userEvent.click(toggle);
    await userEvent.click(toggle);
    resolvers[0]?.();
    await waitFor(() => {
      expect(toggle).not.toBeChecked();
    });
    expect(audio.calls).toEqual(['enable', 'disable']);

    await userEvent.click(toggle);
    resolvers[1]?.();
    await waitFor(() => {
      expect(audio.calls).toContain('bed:fire');
    });
    expect(toggle).toBeChecked();
    expect(audio.calls).toEqual(['enable', 'disable', 'enable', 'bed:fire']);
  });
});

describe('time', () => {
  it('persists a chosen phase and hands Auto back to the clock', async () => {
    const { ports } = mount({ at: MORNING });
    const dialog = await openSettings();

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Night' }));
    await waitFor(() => {
      expect(sentence()).toHaveTextContent('It is night.');
    });
    expect(ports.storage.read('pawlour.time')).toBe('night');

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Auto' }));
    await waitFor(() => {
      expect(sentence()).toHaveTextContent('It is morning.');
    });
    expect(ports.storage.read('pawlour.time')).toBeNull();
  });

  it('honours a stored phase and camera on opening', async () => {
    mount({ at: MORNING, stored: { 'pawlour.time': 'evening', 'pawlour.camera': 'chair' } });

    await waitFor(() => {
      expect(sentence()).toHaveTextContent('It is evening.');
    });
    const dialog = await openSettings();
    expect(within(dialog).getByRole('radio', { name: 'Evening' })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: 'Chair' })).toBeChecked();
  });

  it('ignores stored nonsense', async () => {
    mount({ at: MORNING, stored: { 'pawlour.time': 'teatime', 'pawlour.camera': 'roof' } });

    await waitFor(() => {
      expect(sentence()).toHaveTextContent('It is morning.');
    });
    const dialog = await openSettings();
    expect(within(dialog).getByRole('radio', { name: 'Auto' })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: 'Hearth' })).toBeChecked();
  });

  it('reads the clock once a minute', async () => {
    const { ports } = mount({ at: MORNING });
    await waitFor(() => {
      expect(sentence()).toHaveTextContent('It is morning.');
    });

    ports.clock.set(AFTERNOON);
    ports.timer.advance(CLOCK_INTERVAL_MS);

    await waitFor(() => {
      expect(sentence()).toHaveTextContent('It is evening.');
    });
  });
});

describe('the camera', () => {
  it('persists the chosen preset', async () => {
    const { ports } = mount();
    const dialog = await openSettings();

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Window' }));

    expect(ports.storage.read('pawlour.camera')).toBe('window');
    expect(within(dialog).getByRole('radio', { name: 'Window' })).toBeChecked();
  });
});

describe('motion', () => {
  it('writes the animations attribute from the device, and the device wins', async () => {
    const { ports, unmount } = mount({ device: { prefersReducedMotion: false } });

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-animations', 'on');
    });

    ports.preferences.set({ prefersReducedMotion: true });
    expect(document.documentElement).not.toHaveAttribute('data-animations');

    ports.preferences.set({ prefersReducedMotion: false });
    expect(document.documentElement).toHaveAttribute('data-animations', 'on');

    unmount();
    expect(document.documentElement).not.toHaveAttribute('data-animations');
  });

  it('leaves a walk to the runtime when motion is on', async () => {
    // With motion on the director waits for the canvas's `arrived` (P07b),
    // which the page dispatches; under jsdom the canvas never boots, so this
    // states the contract the page relies on rather than exercising the walk.
    mount({ device: { prefersReducedMotion: false } });

    await send('Water');

    expect(sentence()).toHaveTextContent('Biscuit is walking to the water bowl.');
    expect(her()).toHaveAccessibleName('Biscuit, walking to the water bowl. Send her somewhere');
    expect(screen.queryByText(CAPTIONS.drink[0] ?? '')).toBeNull();
  });
});

describe('the lights', () => {
  it('name their state on the opener and in the dialog, and a tap flips it', async () => {
    mount();

    const dialog = await openLights();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lamp, off' }));

    expect(within(dialog).getByRole('button', { name: 'Lamp, on' })).toHaveTextContent('on');
    expect(within(dialog).getByRole('button', { name: 'Lights, off' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(button('Lights: lamp on, lights off')).toHaveTextContent('on');
  });
});

describe('a photo', () => {
  it('says so when the room has no frame to capture, and leaves nothing behind', async () => {
    mount();

    await userEvent.click(button('Photo'));

    await screen.findByText('The room could not be photographed.');
    expect(button('Photo')).toBeEnabled();
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
