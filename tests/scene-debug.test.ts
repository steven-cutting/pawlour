import { describe, expect, it, vi } from 'vitest';
import { initialState } from '../src/lib/domain/director';
import { createFakeTimer } from '../src/lib/ports/timer';
import { createDebugHook, debugRequested } from '../src/routes/scene/debug';
import type { DebugReading, DebugSource, PawlourDebug } from '../src/routes/scene/debug';

/*
 * The `?debug` hook P10 measures the phone with. It is gated by the query,
 * ticks on the timer port, counts drawn frames from the renderer's own frame
 * counter (a second frame subscription would keep ticking after the scene
 * stopped its loop, and read 60 in a still diorama), and is the one place the
 * scene writes to `window`. The host is an argument, so no global is stubbed.
 */

function fixture(
  initial: DebugReading | null = { frame: 0, calls: 0, triangles: 0, textures: 0, pixelRatio: 2 }
) {
  let reading = initial ?? undefined;
  const timer = createFakeTimer();
  const source: DebugSource = {
    read: vi.fn(() => reading),
    state: vi.fn(() => initialState('evening', 'rain', true)),
    hideRoom: vi.fn(),
    showRoom: vi.fn(),
    loseContext: vi.fn(),
    restoreContext: vi.fn(),
    setAnimations: vi.fn()
  };
  const host: { __pawlour?: PawlourDebug } = {};
  const log = vi.fn<(line: string) => void>();
  let clock = 0;
  const hook = createDebugHook({ timer, now: () => clock, source, log, host });
  return {
    timer,
    source,
    host,
    log,
    hook,
    tick: (frames: number, ms = 1000): void => {
      clock += ms;
      reading = reading && { ...reading, frame: reading.frame + frames };
      timer.advance(ms);
    }
  };
}

describe('debugRequested', () => {
  it('is on only when the query carries a debug key', () => {
    expect(debugRequested('?debug')).toBe(true);
    expect(debugRequested('?debug=1&x=y')).toBe(true);
    expect(debugRequested('?x=y&debug')).toBe(true);
    expect(debugRequested('')).toBe(false);
    expect(debugRequested('?debugger')).toBe(false);
    expect(debugRequested('?x=debug')).toBe(false);
  });
});

describe('createDebugHook', () => {
  it('installs window.__pawlour and forwards every call to the scene', () => {
    const { host, source } = fixture();
    const debug = host.__pawlour;
    if (!debug) throw new Error('The hook did not install');
    debug.hideRoom();
    debug.showRoom();
    debug.loseContext();
    debug.restoreContext();
    debug.setAnimations(false);
    expect(source.hideRoom).toHaveBeenCalledOnce();
    expect(source.showRoom).toHaveBeenCalledOnce();
    expect(source.loseContext).toHaveBeenCalledOnce();
    expect(source.restoreContext).toHaveBeenCalledOnce();
    expect(source.setAnimations).toHaveBeenCalledWith(false);
  });

  it('logs one line a second with the frames drawn since the last one', () => {
    const { log, tick, source } = fixture({
      frame: 10,
      calls: 41,
      triangles: 91234,
      textures: 9,
      pixelRatio: 2
    });
    expect(log).not.toHaveBeenCalled();
    tick(60);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toBe(
      'pawlour debug t=1.0s fps=60 calls=41 triangles=91234 textures=9 dpr=2 activity=idle.stand at=hearth/evening/rain'
    );
    tick(0);
    expect(log.mock.calls[1]?.[0]).toContain('fps=0');
    // One read to baseline at creation, one per second after.
    expect(source.read).toHaveBeenCalledTimes(3);
  });

  it('logs the first drawn frame once, with the time it was marked', () => {
    const { log, hook, tick } = fixture();
    tick(0, 1234);
    hook.markFirstFrame();
    hook.markFirstFrame();
    expect(log).toHaveBeenCalledWith('pawlour debug first frame at 1234ms');
    expect(log.mock.calls.filter(([line]) => line.includes('first frame'))).toHaveLength(1);
    expect(hook.report().firstFrameMs).toBe(1234);
  });

  it('reports the minimum and the median frame rate over every sample', () => {
    const { host, tick } = fixture();
    for (const frames of [60, 58, 61, 30, 59]) tick(frames);
    const report = host.__pawlour?.report();
    expect(report).toMatchObject({ samples: 5, min: 30, median: 59, firstFrameMs: null });
    expect(report?.last).toMatchObject({
      fps: 59,
      calls: 0,
      activity: 'idle.stand',
      at: 'hearth/evening/rain'
    });
    expect(host.__pawlour?.state().weather).toBe('rain');
  });

  it('takes no sample while the scene has nothing to read, then baselines its first reading', () => {
    const { log, hook, tick, source } = fixture(null);
    tick(60);
    expect(log).not.toHaveBeenCalled();
    expect(hook.report()).toMatchObject({ samples: 0, min: null, median: null });
    vi.mocked(source.read).mockReturnValue({
      frame: 500,
      calls: 1,
      triangles: 3,
      textures: 1,
      pixelRatio: 2
    });
    tick(0);
    expect(log).not.toHaveBeenCalled();
    vi.mocked(source.read).mockReturnValue({
      frame: 545,
      calls: 1,
      triangles: 3,
      textures: 1,
      pixelRatio: 2
    });
    tick(0);
    expect(log.mock.calls[0]?.[0]).toContain('fps=45');
  });

  it('reads zero, not a negative, when a rebuilt renderer restarts its counter', () => {
    const { log, tick, source } = fixture({
      frame: 500,
      calls: 1,
      triangles: 3,
      textures: 1,
      pixelRatio: 2
    });
    tick(60);
    vi.mocked(source.read).mockReturnValue({
      frame: 7,
      calls: 1,
      triangles: 3,
      textures: 1,
      pixelRatio: 2
    });
    tick(0);
    expect(log.mock.calls[1]?.[0]).toContain('fps=0');
    vi.mocked(source.read).mockReturnValue({
      frame: 67,
      calls: 1,
      triangles: 3,
      textures: 1,
      pixelRatio: 2
    });
    tick(0);
    expect(log.mock.calls[2]?.[0]).toContain('fps=60');
  });

  it('stops the timer and removes itself from the host', () => {
    const { host, hook, log, tick } = fixture();
    hook.stop();
    expect(host.__pawlour).toBeUndefined();
    tick(60);
    expect(log).not.toHaveBeenCalled();
  });
});
