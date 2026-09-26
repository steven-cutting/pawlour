import { describe, expect, it } from 'vitest';

import { createFakeAudio, createWebAudio } from '../src/lib/ports/audio';
import type { AudioHost } from '../src/lib/ports/audio';
import { createFakeClock, createSystemClock } from '../src/lib/ports/clock';
import { createAnimationFrames, createFakeFrames } from '../src/lib/ports/frame';
import type { FrameHost } from '../src/lib/ports/frame';
import { createCryptoRandom, createFakeRandom } from '../src/lib/ports/random';
import { createFakeStorage, createWebStorage, deviceStore } from '../src/lib/ports/storage';
import { createFakeTimer, createIntervalTimer } from '../src/lib/ports/timer';

/**
 * A working `Storage`, supplied to the adapter as an argument.
 *
 * jsdom exposes no `localStorage` under Node 26 — Node's own experimental
 * global shadows it and stays undefined without `--localstorage-file`. That
 * costs nothing here: the adapter takes its backing store as a parameter, so
 * the real code path is exercised without a browser and without stubbing a
 * global.
 */
function memoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length(): number {
      return entries.size;
    },
    clear: () => {
      entries.clear();
    },
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    removeItem: (key: string) => {
      entries.delete(key);
    },
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    }
  };
}

/** A Storage whose every operation fails, as Safari's private mode does. */
function unusableStorage(): Storage {
  const refuse = (): never => {
    throw new Error('storage is unavailable');
  };
  return {
    get length(): number {
      return 0;
    },
    clear: refuse,
    getItem: refuse,
    key: refuse,
    removeItem: refuse,
    setItem: refuse
  };
}

/** A random source that hands out the given words in order. */
function sequenceSource(values: readonly number[]): Pick<Crypto, 'getRandomValues'> {
  let position = 0;
  return {
    getRandomValues<Target extends ArrayBufferView | null>(target: Target): Target {
      if (target instanceof Uint32Array) {
        target[0] = values[position] ?? 0;
        position += 1;
      }
      return target;
    }
  };
}

describe('storage port', () => {
  it('round-trips a value through the browser store', () => {
    const storage = createWebStorage(memoryStorage());

    expect(storage.read('game:game')).toBeNull();
    storage.write('game:game', '{"mode":"random"}');
    expect(storage.read('game:game')).toBe('{"mode":"random"}');

    storage.remove('game:game');
    expect(storage.read('game:game')).toBeNull();
  });

  it('stays usable where there is no store at all', () => {
    // The ambient default, in an environment that provides nothing. Losing
    // persistence must not cost the player the game.
    const storage = createWebStorage();

    expect(() => {
      storage.write('game:game', 'anything');
    }).not.toThrow();
    expect(storage.read('game:game')).toBeNull();
  });

  /*
   * Where the origin is opaque or the player has blocked site data, reading
   * `localStorage` throws rather than returning something unusable — which is
   * why the read cannot sit in a default argument. Nothing above this port sees
   * it: the page has to start.
   */
  it('stays usable where the store refuses to be read at all', () => {
    const storage = createWebStorage(
      deviceStore(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      })
    );

    expect(() => {
      storage.write('game:game', 'anything');
    }).not.toThrow();
    expect(storage.read('game:game')).toBeNull();
  });

  it('keeps working when the store refuses every operation', () => {
    const storage = createWebStorage(unusableStorage());

    expect(() => {
      storage.write('game:game', 'anything');
    }).not.toThrow();
    expect(() => {
      storage.remove('game:game');
    }).not.toThrow();
    expect(storage.read('game:game')).toBeNull();
  });

  it('offers the same contract in memory', () => {
    const storage = createFakeStorage({ 'game:settings': '{"hardMode":true}' });

    expect(storage.read('game:settings')).toBe('{"hardMode":true}');
    expect(storage.read('game:missing')).toBeNull();

    storage.write('game:settings', '{"hardMode":false}');
    expect(storage.read('game:settings')).toBe('{"hardMode":false}');

    storage.remove('game:settings');
    expect(storage.read('game:settings')).toBeNull();
  });

  it('starts empty when given nothing', () => {
    const storage = createFakeStorage();

    expect(storage.read('game:settings')).toBeNull();
  });
});

describe('random port', () => {
  it('draws from the platform source', () => {
    const random = createCryptoRandom(sequenceSource([7]));

    expect(random.uniformChoice(['a', 'b', 'c'])).toBe('b');
  });

  it('rejects a draw that would bias the low indices', () => {
    // With three candidates the top value of the 32-bit range has no partner,
    // so it is discarded and the next draw is used instead.
    const random = createCryptoRandom(sequenceSource([0xff_ff_ff_ff, 7]));

    expect(random.uniformChoice(['a', 'b', 'c'])).toBe('b');
  });

  it('uses the real platform source by default', () => {
    const random = createCryptoRandom();

    expect(['a', 'b', 'c']).toContain(random.uniformChoice(['a', 'b', 'c']));
  });

  it('walks a fixed sequence in tests, cycling when it runs out', () => {
    const random = createFakeRandom([2, 0]);
    const items = ['a', 'b', 'c'];

    expect(random.uniformChoice(items)).toBe('c');
    expect(random.uniformChoice(items)).toBe('a');
    expect(random.uniformChoice(items)).toBe('c');
  });

  it('wraps an offset that overruns the collection', () => {
    expect(createFakeRandom([4]).uniformChoice(['a', 'b', 'c'])).toBe('b');
    expect(createFakeRandom([]).uniformChoice(['a', 'b'])).toBe('a');
  });

  it('refuses to draw from nothing', () => {
    expect(() => createFakeRandom().uniformChoice([])).toThrow(/at least one candidate/);
    expect(() => createCryptoRandom(sequenceSource([0])).uniformChoice([])).toThrow(
      /at least one candidate/
    );
  });
});

describe('clock port', () => {
  it('reads the supplied time source', () => {
    expect(createSystemClock(() => 1_234).now()).toBe(1_234);
  });

  it('reads the system clock by default', () => {
    expect(createSystemClock().now()).toBeGreaterThan(0);
  });

  it('only moves when a test moves it', () => {
    const clock = createFakeClock(1_000);

    expect(clock.now()).toBe(1_000);
    clock.advance(5_000);
    expect(clock.now()).toBe(6_000);
    clock.set(0);
    expect(clock.now()).toBe(0);
  });

  it('starts at the epoch by default', () => {
    expect(createFakeClock().now()).toBe(0);
  });
});

/*
 * The director is ticked every quarter second, and the clock read every
 * minute, whether motion is on or off. A test that waited real seconds for her
 * to wake or for the evening to arrive would not be worth having.
 */
describe('timer port', () => {
  it('repeats until it is stopped', () => {
    const scheduled: (() => void)[] = [];
    let cleared = 0;

    const timer = createIntervalTimer({
      setInterval: (tick: () => void) => {
        scheduled.push(tick);
        return scheduled.length;
      },
      clearInterval: () => {
        cleared += 1;
      }
    });

    const stop = timer.every(250, () => undefined);

    expect(scheduled).toHaveLength(1);

    stop();

    expect(cleared).toBe(1);
  });

  // The adapter's own default, which is the code path the browser takes.
  it('uses the platform scheduler when it is given none', async () => {
    const timer = createIntervalTimer();
    let ticks = 0;

    const stop = timer.every(1, () => {
      ticks += 1;
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    stop();
    const settled = ticks;
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(settled).toBeGreaterThan(0);
    expect(ticks).toBe(settled);
  });

  it('has a fake a test can advance', () => {
    const timer = createFakeTimer();
    let ticks = 0;

    const stop = timer.every(250, () => {
      ticks += 1;
    });

    timer.advance(1_000);

    expect(ticks).toBe(4);

    stop();
    timer.advance(1_000);

    expect(ticks).toBe(4);
  });

  /*
   * The stop above is called between advances, which is the easy half. A tick
   * may also stop its own timer, and `clearInterval` takes effect at once, so
   * the fake has to honour a stop mid-advance. A fake that ran to the end of the
   * advance regardless would report a cancelled timer and a coincidence
   * identically.
   */
  it('honours a stop the tick itself calls', () => {
    const timer = createFakeTimer();
    let stop: (() => void) | null = null;
    let ticks = 0;

    stop = timer.every(250, () => {
      ticks += 1;
      stop?.();
    });

    timer.advance(1_000);

    expect(ticks).toBe(1);
  });

  it('runs every timer the fake is holding', () => {
    const timer = createFakeTimer();
    const ticked: string[] = [];

    timer.every(100, () => ticked.push('fast'));
    timer.every(300, () => ticked.push('slow'));
    timer.advance(300);

    expect(ticked.filter((name) => name === 'fast')).toHaveLength(3);
    expect(ticked.filter((name) => name === 'slow')).toHaveLength(1);
  });
});

/** A frame host that runs nothing on its own: the test calls each request it holds. */
function recordingFrameHost(): {
  host: FrameHost;
  requested: ((ms: number) => void)[];
  cancelled: number[];
} {
  const requested: ((ms: number) => void)[] = [];
  const cancelled: number[] = [];
  return {
    requested,
    cancelled,
    host: {
      requestAnimationFrame: (callback) => {
        requested.push(callback);
        return requested.length;
      },
      cancelAnimationFrame: (handle) => {
        cancelled.push(handle);
      }
    }
  };
}

/*
 * Frames drive drawing and nothing else, and stop altogether while motion is
 * off. The loop asks for its next frame only after the callback has run, so a
 * callback that stops it leaves nothing pending.
 */
describe('frame port', () => {
  it('asks the host for a frame after every frame, and cancels the pending one when stopped', () => {
    const { host, requested, cancelled } = recordingFrameHost();
    const seen: number[] = [];

    const stop = createAnimationFrames(host).each((ms) => seen.push(ms));

    expect(requested).toHaveLength(1);
    requested[0]?.(16);
    expect(seen).toEqual([16]);
    expect(requested).toHaveLength(2);

    stop();

    expect(cancelled).toEqual([2]);
  });

  it('honours a stop the callback itself calls', () => {
    const { host, requested } = recordingFrameHost();
    let stop: (() => void) | null = null;
    let frames = 0;

    stop = createAnimationFrames(host).each(() => {
      frames += 1;
      stop?.();
    });
    requested[0]?.(16);

    expect(frames).toBe(1);
    expect(requested).toHaveLength(1);
  });

  it('has a fake that calls every callback once a step', () => {
    const frames = createFakeFrames();
    const seen: string[] = [];

    const stopFirst = frames.each((ms) => seen.push(`first:${String(ms)}`));
    frames.each((ms) => seen.push(`second:${String(ms)}`));
    frames.step(16);

    expect(seen).toEqual(['first:16', 'second:16']);

    stopFirst();
    frames.step(33);

    expect(seen).toEqual(['first:16', 'second:16', 'second:33']);
  });

  it('honours a stop made by another callback during a step', () => {
    const frames = createFakeFrames();
    const seen: string[] = [];
    let stopSecond: (() => void) | null = null;

    frames.each(() => {
      seen.push('first');
      stopSecond?.();
    });
    stopSecond = frames.each(() => seen.push('second'));
    frames.step(16);

    expect(seen).toEqual(['first']);
  });

  /*
   * CONVENTIONS.md §11 claim 8, first half: whether jsdom here has animation
   * frames at all. The port is required either way, because tests never stub a
   * global, so this only records the answer: the default host either lacks the
   * member and the first `each` throws a TypeError, or it has one and the loop
   * it starts can be stopped.
   */
  it('states whether this environment has animation frames', () => {
    const available = typeof globalThis.requestAnimationFrame;
    let outcome: string;
    try {
      const stop = createAnimationFrames().each(() => undefined);
      stop();
      outcome = 'stopped';
    } catch (error) {
      outcome = error instanceof TypeError ? 'TypeError' : String(error);
    }

    expect(outcome, `typeof requestAnimationFrame is ${available}`).toMatch(
      /^(stopped|TypeError)$/
    );
  });
});

/*
 * A Web Audio context small enough to read. It records what the adapter asks
 * of it, and decodes each file into a buffer that remembers which file it was,
 * so the log says which file started, stopped, looped or played once.
 */
function recordingAudioHost(refuseOnce: readonly string[] = []): {
  host: AudioHost;
  log: string[];
  fetched: string[];
} {
  const log: string[] = [];
  const fetched: string[] = [];
  const refusing = new Set(refuseOnce);
  const files = new Map<ArrayBuffer, string>();

  class RecordingContext {
    readonly destination = {};

    constructor() {
      log.push('context');
    }

    resume(): Promise<void> {
      log.push('resume');
      return Promise.resolve();
    }

    close(): Promise<void> {
      log.push('close');
      return Promise.resolve();
    }

    decodeAudioData(data: ArrayBuffer): Promise<{ file: string }> {
      return Promise.resolve({ file: files.get(data) ?? 'unknown' });
    }

    createBufferSource(): object {
      const source = {
        buffer: null as { file: string } | null,
        loop: false,
        connect: () => undefined,
        start: () => {
          log.push(`start:${source.buffer?.file ?? 'nothing'}:${source.loop ? 'loop' : 'once'}`);
        },
        stop: () => {
          log.push(`stop:${source.buffer?.file ?? 'nothing'}`);
        }
      };
      return source;
    }
  }

  return {
    log,
    fetched,
    host: {
      AudioContext: RecordingContext as unknown as AudioHost['AudioContext'],
      fetch: (url) => {
        fetched.push(url);
        if (refusing.delete(url)) {
          return Promise.reject(new Error(`${url} is unavailable`));
        }
        const data = new ArrayBuffer(8);
        files.set(data, url);
        return Promise.resolve({ arrayBuffer: () => Promise.resolve(data) });
      }
    }
  };
}

const SOUNDS = { fire: 'fire.mp3', rain: 'rain.mp3', squeak: 'squeak.mp3' };

/** Lets every fetch, decode and start the adapter has queued run to the end. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/*
 * SoundNeverStartsUnasked: nothing is heard until the player turns sound on,
 * and turning it off stops all of it. A browser starts audio only inside a
 * gesture, so `enable()` is the switch's and the adapter makes nothing before
 * it has resolved.
 */
describe('audio port', () => {
  it('creates nothing before enable() has resolved', async () => {
    const { host, log, fetched } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);

    audio.setBed(['fire']);
    audio.play('squeak');
    await settle();

    expect(log).toEqual([]);
    expect(fetched).toEqual([]);

    const enabling = audio.enable();
    audio.setBed(['fire']);
    await enabling;
    await settle();

    expect(log).toEqual(['context', 'resume']);
    expect(fetched).toEqual([]);
  });

  it('starts a looping source for each name in the bed, and stops the ones dropped', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.setBed(['fire', 'rain']);
    await settle();

    expect(log).toContain('start:fire.mp3:loop');
    expect(log).toContain('start:rain.mp3:loop');

    log.length = 0;
    audio.setBed(['fire']);
    await settle();

    expect(log).toEqual(['stop:rain.mp3']);
  });

  it('decodes each file once, on first use', async () => {
    const { host, log, fetched } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.setBed(['fire']);
    await settle();
    audio.setBed([]);
    audio.setBed(['fire']);
    await settle();

    expect(fetched).toEqual(['fire.mp3']);
    expect(log.filter((entry) => entry === 'start:fire.mp3:loop')).toHaveLength(2);
  });

  it('does not start a loop that was dropped while its file was loading', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.setBed(['rain']);
    audio.setBed([]);
    await settle();

    expect(log).toEqual(['context', 'resume']);
  });

  it('plays a one-shot once, however often it is asked while its file loads', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.play('squeak');
    audio.play('squeak');
    await settle();

    expect(log.filter((entry) => entry.startsWith('start:'))).toEqual(['start:squeak.mp3:once']);
  });

  it('stops one sound by name, and starts it again when the bed next asks', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.setBed(['fire']);
    await settle();
    audio.stop('fire');

    expect(log.at(-1)).toBe('stop:fire.mp3');

    audio.setBed(['fire']);
    await settle();

    expect(log.at(-1)).toBe('start:fire.mp3:loop');
  });

  it('does not play a one-shot stopped while its file was loading', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.play('squeak');
    audio.stop('squeak');
    await settle();

    expect(log).toEqual(['context', 'resume']);
  });

  it('stops everything and closes the context when disabled', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();
    audio.setBed(['fire']);
    audio.play('squeak');
    await settle();
    log.length = 0;

    audio.disable();
    audio.setBed(['rain']);
    await settle();

    expect(log).toEqual(['stop:fire.mp3', 'stop:squeak.mp3', 'close']);
  });

  it('lets a disable win over an enable still resolving', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);

    const enabling = audio.enable();
    audio.disable();
    await enabling;
    audio.setBed(['fire']);
    await settle();

    expect(log).toEqual(['context', 'resume', 'close']);
  });

  it('keeps one context however often it is enabled', async () => {
    const { host, log } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);

    await Promise.all([audio.enable(), audio.enable()]);
    await audio.enable();

    expect(log.filter((entry) => entry === 'context')).toHaveLength(2);
    expect(log.filter((entry) => entry === 'close')).toHaveLength(1);
  });

  it('ignores a name it has no file for', async () => {
    const { host, fetched } = recordingAudioHost();
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.setBed(['wind']);
    audio.play('thunder');
    await settle();

    expect(fetched).toEqual([]);
  });

  it('tries a file again after it failed to load', async () => {
    const { host, log, fetched } = recordingAudioHost(['rain.mp3']);
    const audio = createWebAudio(SOUNDS, host);
    await audio.enable();

    audio.setBed(['rain']);
    await settle();
    audio.setBed([]);
    audio.setBed(['rain']);
    await settle();

    expect(fetched).toEqual(['rain.mp3', 'rain.mp3']);
    expect(log.at(-1)).toBe('start:rain.mp3:loop');
  });

  // The adapter's own default: before enable() it touches nothing, so it is safe anywhere.
  it('uses the platform audio when it is given none, and touches it only on enable', () => {
    const audio = createWebAudio(SOUNDS);

    expect(() => {
      audio.setBed(['fire']);
      audio.play('squeak');
      audio.stop('squeak');
      audio.disable();
    }).not.toThrow();
  });

  it('has a fake that records every call in order', async () => {
    const audio = createFakeAudio();

    expect(audio.enabled).toBe(false);
    await audio.enable();
    expect(audio.enabled).toBe(true);
    audio.setBed(['fire', 'rain']);
    audio.play('squeak');
    audio.stop('squeak');
    audio.disable();

    expect(audio.enabled).toBe(false);
    expect(audio.calls).toEqual([
      'enable',
      'bed:fire,rain',
      'play:squeak',
      'stop:squeak',
      'disable'
    ]);
  });
});
