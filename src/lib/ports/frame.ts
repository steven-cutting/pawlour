/**
 * The display's own rhythm: a callback once per frame, until told to stop.
 *
 * It drives drawing and nothing else. The director is ticked by the timer
 * port whether motion is on or off; frames stop altogether while motion is
 * off, because `MotionOffIsAStillDiorama` has the room drawn once per change.
 * The platform's `--dur-*` tokens do nothing for a loop like this one, so the
 * scene stops asking for frames itself.
 */
export interface FramePort {
  /** Call `callback` with the frame's timestamp every frame. The returned function stops it. */
  each(callback: (ms: number) => void): () => void;
}

/** The part of the platform the frame adapter uses. */
export interface FrameHost {
  requestAnimationFrame(callback: (ms: number) => void): number;
  cancelAnimationFrame(handle: number): void;
}

/**
 * The browser's animation frames. The host is an argument rather than a global
 * read, so a test drives the real adapter without stubbing anything.
 */
export function createAnimationFrames(host: FrameHost = globalThis): FramePort {
  return {
    each(callback) {
      let running = true;
      let handle = 0;

      /*
       * A frame is requested after the callback rather than before it, so a
       * callback that stops the loop leaves nothing pending behind it.
       */
      const frame = (ms: number): void => {
        callback(ms);
        if (running) {
          handle = host.requestAnimationFrame(frame);
        }
      };
      handle = host.requestAnimationFrame(frame);

      return () => {
        running = false;
        host.cancelAnimationFrame(handle);
      };
    }
  };
}

export interface FakeFrames extends FramePort {
  /** Run one frame: every callback still registered is called once with `ms`. */
  step(ms: number): void;
}

/** Frames a test runs by hand. Nothing happens between steps. */
export function createFakeFrames(): FakeFrames {
  const callbacks = new Set<(ms: number) => void>();

  return {
    each(callback) {
      // Wrapped, so the same function registered twice runs twice and stops once each.
      const entry = (ms: number): void => {
        callback(ms);
      };
      callbacks.add(entry);

      return () => {
        callbacks.delete(entry);
      };
    },
    /*
     * As the timer's fake: a callback registered during a step waits for the
     * next one, and one stopped during a step is not called for the rest of it,
     * because `cancelAnimationFrame` takes effect at once.
     */
    step(ms) {
      for (const callback of [...callbacks]) {
        if (callbacks.has(callback)) {
          callback(ms);
        }
      }
    }
  };
}
