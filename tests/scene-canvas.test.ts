import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { initialState } from '../src/lib/domain/director';
import { createFakeFrames } from '../src/lib/ports/frame';
import { createFakeRandom } from '../src/lib/ports/random';
import SceneCanvas from '../src/routes/scene/SceneCanvas.svelte';
import { stillFor } from '../src/routes/scene/still';

function props() {
  const frames = createFakeFrames();
  const each = vi.spyOn(frames, 'each');
  return {
    state: initialState('morning', 'clear', false),
    animations: false,
    frames,
    random: createFakeRandom(),
    each,
    assets: {
      biscuit: '/biscuit.glb',
      cabin: '/cabin.glb',
      fire: '/fire.webp',
      clips: { height: 3.113, clips: [] },
      still: (state: ReturnType<typeof initialState>) => `/stills/${stillFor(state)}.webp`
    },
    onProgress: vi.fn(),
    onReady: vi.fn(),
    onTap: vi.fn(),
    onArrived: vi.fn(),
    onContextLost: vi.fn(),
    onError: vi.fn()
  };
}

describe('SceneCanvas fallback', () => {
  it('prerenders an accessible still without constructing a canvas when WebGL is absent', () => {
    const fixture = props();
    const { container } = render(SceneCanvas, fixture);
    expect(screen.getByRole('img', { name: 'Biscuit in the cabin' })).toHaveAttribute(
      'src',
      '/stills/idle.morning.webp'
    );
    expect(container.querySelector('canvas')).toBeNull();
    expect(fixture.each).not.toHaveBeenCalled();
    expect(fixture.onReady).not.toHaveBeenCalled();
    expect(fixture.onProgress).not.toHaveBeenCalled();
  });

  it('keeps the still in sync with state and captions when WebGL is explicitly off', async () => {
    const fixture = props();
    const { rerender, container } = render(SceneCanvas, { ...fixture, webgl: false });
    const state = {
      ...fixture.state,
      activity: 'sleep' as const,
      at: 'chair' as const,
      phase: 'night' as const,
      caption: { text: 'The chair has been claimed.', sequence: 1 }
    };
    await rerender({ state });
    expect(screen.getByRole('img', { name: state.caption.text })).toHaveAttribute(
      'src',
      '/stills/sleep.chair.night.webp'
    );
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    fixture.frames.step(1000);
    expect(fixture.each).not.toHaveBeenCalled();
    expect(fixture.onTap).not.toHaveBeenCalled();
  });

  it('fails capture clearly when there is no drawable frame', () => {
    const { component } = render(SceneCanvas, { ...props(), webgl: false });
    const instance = component as { capture(): string; forceContextRestore(): void };
    expect(() => instance.capture()).toThrow('no drawable frame');
    expect(() => {
      instance.forceContextRestore();
    }).not.toThrow();
  });
});
