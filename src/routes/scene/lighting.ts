import {
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

export function lighting(cabin: Cabin): { root: Group; apply(state: SceneState): void } {
  const root = new Group();
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
    group.add(new HemisphereLight(recipe.sky, recipe.ground, recipe.ambient), sun, sun.target);
    point('#ff9a3c', recipe.fire, 4, cabin.lights.fire.getWorldPosition(new Vector3()));
    const lamp = point('#ffd08a', 1.4, 3, cabin.lights.lamp.getWorldPosition(new Vector3()));
    const strings = cabin.lights.strings.map((anchor) =>
      point('#ffe1a8', 0.25, 1, anchor.getWorldPosition(new Vector3()))
    );
    root.add(group);
    return { phase, group, lamp, strings };
  });
  return {
    root,
    apply(state) {
      for (const rig of rigs) {
        rig.group.visible = rig.phase === state.phase;
        rig.lamp.visible = state.lights.lamp;
        for (const lamp of rig.strings) lamp.visible = state.lights.strings;
      }
      for (const pane of cabin.glass) {
        const materials = Array.isArray(pane.material) ? pane.material : [pane.material];
        for (const material of materials) {
          if (!(material instanceof MeshToonMaterial)) continue;
          material.transparent = true;
          material.opacity = 0.35;
          material.depthWrite = false;
          material.emissive.set(RIGS[state.phase].window);
        }
      }
    }
  };
}
