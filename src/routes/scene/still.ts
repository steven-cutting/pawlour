import type { Camera, Scene, WebGLRenderer } from 'three';
import type { SceneState } from '$lib/domain/director';
import type { Phase } from '$lib/domain/phases';

export type StillActivity = 'idle' | 'sleep.bed' | 'sleep.chair' | 'drink' | 'eat' | 'play';
export type StillKey = `${StillActivity}.${Phase}`;

/** A key for the caller's imported URL table; never constructs a deployment path. */
export function stillFor(state: SceneState): StillKey {
  let activity: StillActivity = 'idle';
  const doing = state.activity === 'pet' ? state.resume?.activity : state.activity;
  if (doing === 'sleep') activity = state.at === 'chair' ? 'sleep.chair' : 'sleep.bed';
  else if (doing === 'drink' || doing === 'eat' || doing === 'play') activity = doing;
  return `${activity}.${state.phase}`;
}

export function renderOnce(
  renderer: Pick<WebGLRenderer, 'render'>,
  scene: Scene,
  camera: Camera
): void {
  renderer.render(scene, camera);
}
