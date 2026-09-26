import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MeshToonMaterial,
  PointLight,
  Vector3
} from 'three';
import type { SceneState } from '$lib/domain/director';
import type { Phase } from '$lib/domain/phases';
import type { Cabin } from './cabin';

const RIGS: Record<
  Phase,
  { sky: string; ground: string; ambient: number; sun: number; fire: number; window: string }
> = {
  morning: {
    sky: '#f6ead8',
    ground: '#5a3a2a',
    ambient: 0.9,
    sun: 2.2,
    fire: 0.6,
    window: '#e8f0f8'
  },
  evening: {
    sky: '#d9a066',
    ground: '#3a2418',
    ambient: 0.5,
    sun: 0.6,
    fire: 1.6,
    window: '#e69a5a'
  },
  night: { sky: '#1a2236', ground: '#2a160f', ambient: 0.35, sun: 0, fire: 3, window: '#141a2c' }
};
const LAMP = 1.4;
const STRING = 0.25;
const BLEND = 0.6;

export function lighting(cabin: Cabin) {
  const root = new Group();
  const glass = cabin.glass.flatMap((pane) =>
    (Array.isArray(pane.material) ? pane.material : [pane.material]).filter(
      (material): material is MeshToonMaterial => material instanceof MeshToonMaterial
    )
  );
  for (const material of glass) {
    material.transparent = true;
    material.opacity = 0.35;
    material.depthWrite = false;
  }
  const rigs = Object.entries(RIGS).map(([phase, recipe]) => {
    const group = new Group();
    const sun = new DirectionalLight(recipe.sky, recipe.sun);
    sun.position.copy(cabin.lights.window.getWorldPosition(new Vector3()));
    const point = (
      colour: string,
      intensity: number,
      distance: number,
      position: Vector3
    ): PointLight => {
      const lamp = new PointLight(colour, intensity, distance);
      lamp.position.copy(position);
      group.add(lamp);
      return lamp;
    };
    const ambient = new HemisphereLight(recipe.sky, recipe.ground, recipe.ambient);
    group.add(ambient, sun, sun.target);
    const fire = point(
      '#ff9a3c',
      recipe.fire,
      4,
      cabin.lights.fire.getWorldPosition(new Vector3())
    );
    const lamp = point('#ffd08a', LAMP, 3, cabin.lights.lamp.getWorldPosition(new Vector3()));
    const strings = cabin.lights.strings.map((anchor) =>
      point('#ffe1a8', STRING, 1, anchor.getWorldPosition(new Vector3()))
    );
    root.add(group);
    const window = new Color(recipe.window);
    return { phase, recipe, group, ambient, sun, fire, lamp, strings, window };
  });
  const glow = new Color();
  const share = new Color();
  let phase: Phase | undefined;
  let state: SceneState | undefined;
  let weights = rigs.map(() => 0);
  let from = [...weights];
  let to = [...weights];
  let elapsed = BLEND;
  const render = (flicker = 1): void => {
    glow.setRGB(0, 0, 0);
    for (const [index, rig] of rigs.entries()) {
      const weight = weights[index] ?? 0;
      rig.group.visible = weight > 0;
      rig.ambient.intensity = rig.recipe.ambient * weight;
      rig.sun.intensity = rig.recipe.sun * weight;
      rig.fire.intensity = rig.recipe.fire * weight * flicker;
      rig.lamp.intensity = LAMP * weight;
      rig.lamp.visible = state?.lights.lamp ?? false;
      for (const lamp of rig.strings) {
        lamp.intensity = STRING * weight;
        lamp.visible = state?.lights.strings ?? false;
      }
      glow.add(share.copy(rig.window).multiplyScalar(weight));
    }
    for (const material of glass) material.emissive.copy(glow);
  };
  return {
    root,
    apply(next: SceneState, animations = false) {
      state = next;
      if (phase !== next.phase || !animations) {
        to = rigs.map((rig) => Number(rig.phase === next.phase));
        from = [...weights];
        // The first rig and a still cut land at once; a live phase change blends.
        elapsed = !phase || !animations ? BLEND : 0;
        if (elapsed === BLEND) weights = [...to];
        phase = next.phase;
      }
      render();
    },
    update(dt: number, flicker = 1) {
      elapsed = Math.min(BLEND, elapsed + dt);
      weights = to.map(
        (target, index) => (from[index] ?? 0) + (target - (from[index] ?? 0)) * (elapsed / BLEND)
      );
      render(flicker);
    }
  };
}
