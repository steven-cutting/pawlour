<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import type { SceneState } from '$lib/domain/director';
  import type { FramePort } from '$lib/ports/frame';
  import type { RandomPort } from '$lib/ports/random';
  import { createScene } from './scene';
  import type { SceneAssets, SceneDiagnostics, SceneHandle } from './scene';
  import { tapGesture } from './hit';
  import type { Hit } from './hit';

  interface Props {
    state: SceneState;
    animations: boolean;
    frames: FramePort;
    random: RandomPort;
    assets: SceneAssets;
    onProgress: (fraction: number) => void;
    onReady: () => void;
    onTap: (hit: Hit) => void;
    onArrived: () => void;
    onContextLost: () => void;
    onError: () => void;
    webgl?: boolean;
  }
  let {
    state: sceneState,
    animations,
    frames,
    random,
    assets,
    onProgress,
    onReady,
    onTap,
    onArrived,
    onContextLost,
    onError,
    webgl = true
  }: Props = $props();
  let ready = $state(false);
  let lost = $state(false);
  let failed = $state(false);
  let capable = $state(false);
  let canvas: HTMLCanvasElement | undefined = $state();
  let container: HTMLDivElement | undefined = $state();
  let scene: SceneHandle | undefined;
  let boot: (() => void) | undefined;
  const gesture = tapGesture();
  const alt = $derived(sceneState.caption?.text ?? 'Biscuit in the cabin');

  export function capture(): string {
    if (!scene) throw new Error('The scene has no drawable frame to capture');
    return scene.capture();
  }
  export function forceContextRestore(): void {
    if (scene) scene.restore();
    else boot?.();
  }
  /** The `?debug` hook's view of the scene (P10); undefined until it exists. */
  export function diagnostics(): SceneDiagnostics | undefined {
    return scene?.diagnostics();
  }

  onMount(() => {
    let alive = true;
    const measure = (): void => {
      if (container)
        scene?.resize(
          { width: container.clientWidth, height: container.clientHeight },
          window.devicePixelRatio || 1
        );
    };
    boot = (): void => {
      if (!canvas || !container || !webgl || !capable || !alive || scene) return;
      try {
        scene = createScene({
          canvas,
          pixelRatio: window.devicePixelRatio || 1,
          size: { width: container.clientWidth, height: container.clientHeight },
          frames,
          random,
          assets,
          onArrived: () => {
            onArrived();
          },
          onProgress: (fraction) => {
            onProgress(fraction);
          },
          onReady: () => {
            ready = true;
            failed = false;
            onReady();
          },
          onContextLost: () => {
            lost = true;
            gesture.cancel();
            onContextLost();
          },
          onRestored: () => {
            lost = false;
            failed = false;
            ready = true;
          },
          onError: () => {
            failed = true;
            ready = false;
            onError();
          }
        });
        scene.apply(sceneState, animations);
      } catch {
        failed = true;
        onError();
      }
    };
    capable = typeof window.WebGL2RenderingContext !== 'undefined';
    void tick().then(() => {
      if (alive) boot?.();
    });
    const observer = capable ? new window.ResizeObserver(measure) : undefined;
    if (container) observer?.observe(container);
    window.addEventListener('resize', measure);
    return () => {
      alive = false;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      boot = undefined;
      scene?.dispose();
      scene = undefined;
    };
  });

  $effect(() => {
    const enabled = webgl;
    const target = canvas;
    untrack(() => {
      if (!enabled) {
        scene?.dispose();
        scene = undefined;
        ready = lost = failed = false;
        gesture.cancel();
      } else if (target) boot?.();
    });
  });

  $effect(() => {
    // Only the two inputs schedule apply; readiness must not draw a second frame.
    const next = sceneState;
    const active = animations;
    untrack(() => {
      scene?.apply(next, active);
    });
  });

  function tapped(event: PointerEvent): void {
    if (!gesture.up(event) || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hit = scene?.hit(event.clientX - rect.left, event.clientY - rect.top);
    if (hit) onTap(hit);
  }
</script>

<div class="scene" bind:this={container}>
  {#if capable && webgl}
    <canvas
      bind:this={canvas}
      aria-hidden="true"
      tabindex="-1"
      onpointerdown={(event) => {
        gesture.down(event);
      }}
      onpointermove={(event) => {
        gesture.move(event);
      }}
      onpointerup={tapped}
      onpointercancel={() => {
        gesture.cancel();
      }}
      onpointerleave={() => {
        gesture.cancel();
      }}
    ></canvas>
  {/if}
  {#if !ready || lost || !webgl}
    {#if lost || failed}
      <button type="button" onclick={forceContextRestore} aria-label="Retry 3D scene">
        <img {alt} src={assets.still(sceneState)} />
        <span>The room is still. Tap to try drawing it again.</span>
      </button>
    {:else}
      <img {alt} src={assets.still(sceneState)} />
    {/if}
  {/if}
</div>

<style>
  .scene {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 12rem;
    overflow: hidden;
    background: var(--background);
  }
  canvas,
  img,
  button {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  canvas {
    touch-action: manipulation;
  }
  img {
    position: absolute;
    inset: 0;
    object-fit: contain;
  }
  button {
    position: absolute;
    inset: 0;
    padding: 0;
    border: 0;
    color: var(--text);
    background: var(--background);
    cursor: pointer;
    touch-action: manipulation;
  }
  button:focus-visible {
    outline: 3px solid var(--text);
    outline-offset: -4px;
  }
  button:active {
    filter: brightness(0.9);
  }
  span {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    padding: 1rem;
    color: var(--text);
    background: var(--background);
  }
</style>
