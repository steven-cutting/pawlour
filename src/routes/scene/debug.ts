/**
 * The `?debug` hook: how the scene is measured on a phone (P10).
 *
 * With `?debug` in the address the page logs, once a second, the frames drawn
 * over the last second, the renderer's draw calls, triangles and textures, its
 * pixel ratio and the current activity; and installs `window.__pawlour` with
 * the calls a Web Inspector session needs to lose and restore the context,
 * hide the room, switch motion, and read the run's minimum and median. It is
 * kept because P12's first deploy is measured the same way, and it stays
 * behind the query: without it nothing here runs and nothing is written to
 * `window`.
 *
 * Frames are counted from the renderer's own frame counter rather than from a
 * second frame-port subscription. A second subscriber keeps asking for frames
 * after the scene has stopped its loop and would read 60 in a still diorama,
 * where the counter must stay at 0 between changes. The host and the clock are
 * arguments, as the ports' are, so a test drives the hook without stubbing.
 */
import type { SceneState } from '$lib/domain/director';
import type { TimerPort } from '$lib/ports/timer';

/** What the renderer reports at one instant. */
export interface DebugReading {
  /** Frames drawn since the renderer was made. */
  frame: number;
  calls: number;
  triangles: number;
  textures: number;
  pixelRatio: number;
}

/** What the page lends the hook. `read` is undefined until the scene exists. */
export interface DebugSource {
  read: () => DebugReading | undefined;
  /** The director's current state, for the activity and where the room stands. */
  state: () => SceneState;
  hideRoom: () => void;
  showRoom: () => void;
  loseContext: () => void;
  restoreContext: () => void;
  setAnimations: (active: boolean) => void;
}

export interface DebugSample {
  /** Milliseconds since the hook started, from the clock the page gave it. */
  elapsedMs: number;
  fps: number;
  calls: number;
  triangles: number;
  textures: number;
  pixelRatio: number;
  activity: string;
  /** `camera/phase/weather`, so a run's conditions are in every line. */
  at: string;
}

export interface DebugReport {
  firstFrameMs: number | null;
  samples: number;
  min: number | null;
  median: number | null;
  last: DebugSample | null;
  all: readonly DebugSample[];
}

/** What `window.__pawlour` carries while `?debug` is on. */
export interface PawlourDebug {
  loseContext: () => void;
  restoreContext: () => void;
  hideRoom: () => void;
  showRoom: () => void;
  setAnimations: (active: boolean) => void;
  report: () => DebugReport;
  /** The director's state as it stands, for reading in the console. */
  state: () => SceneState;
}

export interface DebugHook {
  /** Called once, when the scene has drawn its first frame. */
  markFirstFrame: () => void;
  report: () => DebugReport;
  stop: () => void;
}

declare global {
  interface Window {
    __pawlour?: PawlourDebug;
  }
}

const SAMPLE_MS = 1000;
/** Two minutes of samples is the run the budget asks for; keep five. */
const KEEP = 600;

/** Whether a search string asks for the hook: a `debug` key, with or without a value. */
export function debugRequested(search: string): boolean {
  return new URLSearchParams(search).has('debug');
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  const lower = sorted[middle - 1] ?? upper;
  return sorted.length % 2 === 0 ? (lower + upper) / 2 : upper;
}

export function createDebugHook(options: {
  timer: TimerPort;
  /** Milliseconds, on any monotonic clock; the page passes `performance.now`. */
  now: () => number;
  source: DebugSource;
  log: (line: string) => void;
  host: { __pawlour?: PawlourDebug };
}): DebugHook {
  const { timer, now, source, log, host } = options;
  const started = now();
  const samples: DebugSample[] = [];
  // The baseline is the scene's counter now, so the first line counts only
  // the frames drawn after the hook started; a scene that appears later is
  // baselined at its first reading and counted from the sample after it.
  let lastFrame: number | undefined = source.read()?.frame;
  let firstFrameMs: number | null = null;

  const report = (): DebugReport => {
    const rates = samples.map((sample) => sample.fps);
    return {
      firstFrameMs,
      samples: samples.length,
      min: rates.length ? Math.min(...rates) : null,
      median: median(rates),
      last: samples.at(-1) ?? null,
      all: samples
    };
  };
  const sample = (): void => {
    const reading = source.read();
    if (!reading) return;
    if (lastFrame === undefined) {
      lastFrame = reading.frame;
      return;
    }
    // A rebuilt renderer restarts its counter; the sample after it is not negative.
    const fps = Math.max(0, reading.frame - lastFrame);
    lastFrame = reading.frame;
    const state = source.state();
    const next: DebugSample = {
      elapsedMs: now() - started,
      fps,
      calls: reading.calls,
      triangles: reading.triangles,
      textures: reading.textures,
      pixelRatio: reading.pixelRatio,
      activity: state.activity,
      at: `${state.camera}/${state.phase}/${state.weather}`
    };
    samples.push(next);
    if (samples.length > KEEP) samples.shift();
    log(
      `pawlour debug t=${(next.elapsedMs / 1000).toFixed(1)}s fps=${String(fps)} calls=${String(next.calls)} ` +
        `triangles=${String(next.triangles)} textures=${String(next.textures)} ` +
        `dpr=${String(next.pixelRatio)} activity=${next.activity} at=${next.at}`
    );
  };
  const stopTimer = timer.every(SAMPLE_MS, sample);
  host.__pawlour = {
    loseContext: () => {
      source.loseContext();
    },
    restoreContext: () => {
      source.restoreContext();
    },
    hideRoom: () => {
      source.hideRoom();
    },
    showRoom: () => {
      source.showRoom();
    },
    setAnimations: (active) => {
      source.setAnimations(active);
    },
    report,
    state: () => source.state()
  };
  return {
    markFirstFrame() {
      if (firstFrameMs !== null) return;
      firstFrameMs = now();
      log(`pawlour debug first frame at ${String(Math.round(firstFrameMs))}ms`);
    },
    report,
    stop() {
      stopTimer();
      delete host.__pawlour;
    }
  };
}
