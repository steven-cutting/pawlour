import { AnimationMixer, Bone, Box3, Group, Quaternion, SkinnedMesh, Vector3 } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { SceneState } from '$lib/domain/director';
import { isWalkItem } from '$lib/domain/items';
import { assetName } from './cabin';
import type { Cabin } from './cabin';
import { ink } from './materials';

export interface ClipTable {
  height: number;
  clips: readonly { name: string; seconds: number; loop: boolean; stride: number }[];
}

// Kept equal to blender/model/rig.json by scene-assets.test.ts, without shipping
// that modelling file's rest matrices, controls and descriptions to the browser.
export const BONE_NAMES = [
  'root',
  'pelvis',
  'spine',
  'chest',
  'neck',
  'head',
  ...['L', 'R'].flatMap((side) =>
    [
      'front.upper',
      'front.lower',
      'front.paw',
      'hind.thigh',
      'hind.shin',
      'hind.hock',
      'hind.paw',
      'ear.1',
      'ear.2',
      'ear.3'
    ].map((part) => `${part}.${side}`)
  ),
  ...Array.from({ length: 7 }, (_, index) => `tail.${String(index + 1)}`)
];

export interface Biscuit {
  root: Group;
  model: Group;
  meshes: SkinnedMesh[];
  outlines: SkinnedMesh[];
  bones: Map<string, Bone>;
  scale: number;
  bindBounds: Box3;
  apply(state: SceneState, cabin: Cabin): void;
  dispose(): void;
}

export function requireBiscuit(gltf: GLTF, clips: ClipTable): Biscuit {
  const bones = new Map<string, Bone>();
  const meshes: SkinnedMesh[] = [];
  const names = new Set<string>();
  gltf.scene.traverse((node) => {
    names.add(assetName(node));
    if (node instanceof Bone) bones.set(assetName(node), node as Bone);
    if (node instanceof SkinnedMesh) meshes.push(node as SkinnedMesh);
  });
  if (!names.has('Biscuit.Rig')) throw new Error('biscuit.glb is missing Biscuit.Rig');
  for (const name of BONE_NAMES) {
    if (
      !bones.has(name) ||
      meshes.some((mesh) => !mesh.skeleton.bones.some((bone) => assetName(bone) === name))
    ) {
      throw new Error(`biscuit.glb is missing bone ${name}`);
    }
  }
  if (!meshes.length) throw new Error('biscuit.glb has no skinned meshes');
  if (!Number.isFinite(clips.height) || clips.height <= 0)
    throw new Error('biscuit.clips.json needs a positive height');
  const idle = gltf.animations.find((clip) => clip.name === 'idle.stand');
  if (!idle) throw new Error('biscuit.glb is missing idle.stand');
  const scale = 0.55 / clips.height;
  const root = new Group();
  root.name = 'biscuit';
  root.add(gltf.scene);
  gltf.scene.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);
  // Precise bounds call SkinnedMesh.getVertexPosition: raw quantized geometry
  // bounds miss the dequantization stored in this GLB's inverse-bind matrices.
  const bindBounds = new Box3().setFromObject(gltf.scene, true);
  gltf.scene.position.y -= bindBounds.min.y;
  root.updateMatrixWorld(true);
  bindBounds.setFromObject(gltf.scene, true);
  const material = ink();
  const outlines = meshes.map((mesh) => {
    const outline = mesh.clone(false);
    outline.name = `${mesh.name}_ink`;
    outline.material = material;
    outline.morphTargetInfluences = mesh.morphTargetInfluences;
    outline.frustumCulled = false;
    // Sharing skeleton, bind transforms and morph weights preserves every pose.
    mesh.parent?.add(outline);
    mesh.frustumCulled = false;
    return outline;
  });
  const mixer = new AnimationMixer(gltf.scene);
  const facing = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);
  return {
    root,
    model: gltf.scene,
    meshes,
    outlines,
    bones,
    scale,
    bindBounds,
    apply(state, cabin) {
      const anchor = isWalkItem(state.at)
        ? state.at === 'bed' || state.at === 'chair'
          ? cabin.spots[state.at]
          : cabin.approaches[state.at]
        : cabin.nav.get('nav.0')?.node;
      if (anchor) {
        root.position.copy(anchor.getWorldPosition(new Vector3()));
        root.quaternion.copy(
          isWalkItem(state.at)
            ? anchor.getWorldQuaternion(new Quaternion()).multiply(facing)
            : new Quaternion()
        );
      }
      const activity =
        state.activity === 'pet' ? (state.resume?.activity ?? 'idle.stand') : state.activity;
      const clip = gltf.animations.find((entry) => entry.name === activity) ?? idle;
      mixer.stopAllAction();
      mixer.clipAction(clip).reset().play();
      // Match P04's still samples (30 fps), independent of state.elapsed.
      mixer.setTime(
        activity === 'drink' || activity === 'eat' ? 1 : activity === 'play' ? 40 / 30 : 0
      );
      root.updateMatrixWorld(true);
      for (const mesh of meshes) {
        mesh.skeleton.update();
        mesh.computeBoundingSphere();
      }
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
    }
  };
}
