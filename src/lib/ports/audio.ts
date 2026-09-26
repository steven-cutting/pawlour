/**
 * The room's sound: loops that play while something is true, and one-shots.
 *
 * `SoundNeverStartsUnasked`: sound is off whenever the room opens, and turning
 * the switch on is the only thing that starts it. A browser agrees only inside
 * a user gesture, which is why `enable()` is its own call, made from the
 * switch's handler and nowhere else, and why nothing here makes a sound before
 * it has resolved. The port names no file: the page hands it a map of names to
 * the URLs Vite resolved.
 */
export interface AudioPort {
  enable(): Promise<void>; // only ever called inside a user gesture
  disable(): void;
  setBed(names: readonly string[]): void; // the loops that should be playing
  play(name: string): void; // a one-shot
  stop(name: string): void;
}

/** The part of the platform the Web Audio adapter uses. */
export interface AudioHost {
  AudioContext: new () => AudioContext;
  fetch(url: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> }>;
}

/**
 * Web Audio. The host is an argument rather than a global read, so a test
 * drives the real adapter with a context of its own and without stubbing
 * anything.
 *
 * Each file is fetched and decoded once, on first use, and kept: a loop is a
 * buffer played with `loop` set, which is gapless where an `<audio>` element is
 * not. Everything a call starts happens after a fetch, so every start checks
 * again that it is still wanted: a loop dropped, or the switch turned off,
 * while its file was loading must not start late.
 */
export function createWebAudio(
  sources: Record<string, string>,
  host: AudioHost = globalThis
): AudioPort {
  const buffers = new Map<string, Promise<AudioBuffer>>();
  const sounding = new Map<string, AudioBufferSourceNode>();
  const shots = new Set<string>();
  let bed = new Set<string>();
  let context: AudioContext | undefined;
  // Bumped by every enable and disable, so an enable that resolves after a later call gives way.
  let generation = 0;

  function decode(active: AudioContext, name: string, url: string): Promise<AudioBuffer> {
    let buffer = buffers.get(name);
    if (buffer === undefined) {
      buffer = host
        .fetch(url)
        .then((response) => response.arrayBuffer())
        .then((data) => active.decodeAudioData(data));
      buffers.set(name, buffer);
    }
    return buffer;
  }

  function halt(name: string): void {
    sounding.get(name)?.stop();
    sounding.delete(name);
  }

  function begin(name: string, loop: boolean, wanted: () => boolean): void {
    const active = context;
    const url = sources[name];
    if (active === undefined || url === undefined) {
      return;
    }
    void decode(active, name, url).then(
      (buffer) => {
        if (context !== active || !wanted()) {
          return;
        }
        halt(name);
        const source = active.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.connect(active.destination);
        source.start();
        sounding.set(name, source);
      },
      () => {
        // Sound is decoration: a file that would not load is tried again next time.
        buffers.delete(name);
      }
    );
  }

  return {
    async enable() {
      if (context !== undefined) {
        return;
      }
      generation += 1;
      const ticket = generation;
      const created = new host.AudioContext();
      await created.resume();
      if (ticket !== generation) {
        void created.close();
        return;
      }
      context = created;
    },
    disable() {
      generation += 1;
      for (const source of sounding.values()) {
        source.stop();
      }
      sounding.clear();
      shots.clear();
      bed = new Set();
      void context?.close();
      context = undefined;
    },
    setBed(names) {
      if (context === undefined) {
        return;
      }
      const next = new Set(names);
      for (const name of bed) {
        if (!next.has(name)) {
          halt(name);
        }
      }
      const previous = bed;
      bed = next;
      for (const name of next) {
        if (!previous.has(name)) {
          begin(name, true, () => bed.has(name));
        }
      }
    },
    play(name) {
      if (context === undefined) {
        return;
      }
      shots.add(name);
      // Taken rather than read, so two plays made while the file loads start it once.
      begin(name, false, () => shots.delete(name));
    },
    stop(name) {
      halt(name);
      bed.delete(name);
      shots.delete(name);
    }
  };
}

export interface FakeAudio extends AudioPort {
  readonly calls: readonly string[];
  readonly enabled: boolean;
}

/**
 * A recorder for tests: every call, in order, as `enable`, `disable`,
 * `bed:<names>` (comma-separated), `play:<name>` and `stop:<name>`. It records
 * what it is asked and refuses nothing, so a test can assert that nothing was
 * asked before `enable`.
 */
export function createFakeAudio(): FakeAudio {
  const calls: string[] = [];
  let enabled = false;

  return {
    calls,
    get enabled() {
      return enabled;
    },
    enable() {
      calls.push('enable');
      enabled = true;
      return Promise.resolve();
    },
    disable() {
      calls.push('disable');
      enabled = false;
    },
    setBed(names) {
      calls.push(`bed:${names.join(',')}`);
    },
    play(name) {
      calls.push(`play:${name}`);
    },
    stop(name) {
      calls.push(`stop:${name}`);
    }
  };
}
