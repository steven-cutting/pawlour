import {
  NoToneMapping,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer
} from 'three';
import type { BufferGeometry, Material, Object3D, Skeleton } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { SceneState } from '$lib/domain/director';
import type { FramePort } from '$lib/ports/frame';
import manifest from '$lib/assets/manifest.json';
import { requireBiscuit } from './biscuit';
import type { Biscuit, ClipTable } from './biscuit';
import { isMesh, requireCabin } from './cabin';
import type { Cabin } from './cabin';
import { frameCamera } from './camera';
import type { Size } from './camera';
import { hitAt } from './hit';
import type { Hit } from './hit';
import { lighting } from './lighting';
import { biscuitRamp, cabinRamp, disc, fireStill, paint, vignette } from './materials';
import { renderOnce } from './still';

export interface SceneAssets {
  biscuit: string;
  cabin: string;
  clips: ClipTable;
  still(state: SceneState): string;
}

/** P07b owns playback and subscribes through the injected frame port. */
export interface MotionLayer {
  apply(state: SceneState): void;
  start(frames: FramePort): void;
  stop(): void;
  dispose(): void;
}

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  pixelRatio: number;
  size: Size;
  frames: FramePort;
  assets: SceneAssets;
  onProgress(fraction: number): void;
  onReady(): void;
  onContextLost(): void;
  onRestored(): void;
  onError(error: unknown): void;
  motion?: MotionLayer;
}
export interface SceneHandle {
  apply(state: SceneState, animations: boolean): void;
  resize(size: Size, pixelRatio: number): void;
  hit(x: number, y: number): Hit | null;
  capture(): string;
  restore(): void;
  dispose(): void;
  readonly lost: boolean;
}

/** Dispose shared geometry, materials, maps and skeletons just once. */
export function disposeObjects(
  roots: readonly Object3D[],
  retired: readonly Material[] = []
): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>(retired);
  const textures = new Set<Texture>();
  const skeletons = new Set<Skeleton>();
  for (const root of roots)
    root.traverse((node) => {
      if (!isMesh(node)) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material])
        materials.add(material);
      if ('skeleton' in node) skeletons.add(node.skeleton as Skeleton);
    });
  for (const material of materials) {
    for (const value of Object.values(material) as unknown[])
      if (value instanceof Texture) textures.add(value as Texture);
    material.dispose();
  }
  for (const texture of textures) {
    // ImageBitmap.close releases the decoded CPU image as well as the GPU map.
    const image: unknown = texture.source.data;
    if (image && typeof image === 'object' && 'close' in image && typeof image.close === 'function')
      (image as { close(): void }).close();
    texture.dispose();
  }
  for (const geometry of geometries) geometry.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
}

export function createScene(
  options: SceneOptions,
  rendererFactory: (canvas: HTMLCanvasElement) => WebGLRenderer = (canvas) =>
    new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false })
): SceneHandle {
  const { canvas, assets, frames, motion } = options;
  let size = options.size;
  let ratio = options.pixelRatio;
  let renderer: WebGLRenderer;
  let contextRecovery: WEBGL_lose_context | null;
  const makeRenderer = (): WebGLRenderer => {
    const next = rendererFactory(canvas);
    next.outputColorSpace = SRGBColorSpace;
    next.toneMapping = NoToneMapping;
    next.setPixelRatio(Math.min(ratio, 2));
    next.setSize(Math.max(1, size.width), Math.max(1, size.height), false);
    // getExtension returns null once a context is lost; retain the live handle.
    contextRecovery = next.getContext().getExtension('WEBGL_lose_context');
    return next;
  };
  renderer = makeRenderer();
  let world = new Scene();
  const camera = new PerspectiveCamera();
  let cabin: Cabin | undefined;
  let biscuit: Biscuit | undefined;
  let lights: ReturnType<typeof lighting> | undefined;
  let contact: ReturnType<typeof disc> | undefined;
  let retired: Material[] = [];
  let state: SceneState | undefined;
  let animations = false;
  let lost = false;
  let failed = false;
  let disposed = false;
  let ready = false;
  let announced = false;
  let generation = 0;

  const fail = (error: unknown): void => {
    if (disposed) return;
    failed = true;
    ready = false;
    motion?.stop();
    options.onError(error);
  };
  const draw = (): boolean => {
    if (!ready || !state || disposed || size.width <= 0 || size.height <= 0) return false;
    try {
      renderOnce(renderer, world, camera);
      if (renderer.getContext().isContextLost()) return false;
      if (!announced) {
        announced = true;
        options.onReady();
      }
      if (lost || failed) {
        lost = false;
        failed = false;
        options.onRestored();
      }
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  };
  const update = (): void => {
    if (!state || !cabin || !biscuit || !lights || !contact) return;
    biscuit.apply(state, cabin);
    contact.position.copy(biscuit.root.position).y += 0.002;
    lights.apply(state);
    frameCamera(camera, cabin.cameras[state.camera], size);
    world.updateMatrixWorld(true);
  };
  const apply = (next: SceneState, active: boolean): void => {
    state = next;
    animations = active;
    if (!ready || lost || disposed) return;
    update();
    if (active && motion) {
      motion.apply(next);
      motion.start(frames);
    } else {
      motion?.stop();
      draw();
    }
  };
  const clear = (): void => {
    ready = false;
    biscuit?.dispose();
    disposeObjects([world], retired);
    retired = [];
    world = new Scene();
    biscuit = undefined;
    cabin = undefined;
    lights = undefined;
    contact = undefined;
  };
  const load = async (): Promise<void> => {
    const current = ++generation;
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const expected = ['biscuit', 'cabin'].map((name) => {
      const bytes = manifest.assets.find(
        (asset) => asset.path === `src/lib/assets/${name}.glb`
      )?.bytes;
      if (!bytes) throw new Error(`Asset manifest is missing ${name}.glb`);
      return bytes;
    });
    const total = expected.reduce((sum, bytes) => sum + bytes, 0);
    const received = [0, 0];
    const progress = (index: number, bytes: number): void => {
      received[index] = Math.max(received[index] ?? 0, Math.min(bytes, expected[index] ?? 0));
      if (current === generation && !disposed)
        options.onProgress(
          Math.min(0.999, received.reduce((sum, value) => sum + value, 0) / total)
        );
    };
    options.onProgress(0);
    const results = await Promise.allSettled(
      [assets.biscuit, assets.cabin].map(async (url, index) => {
        const gltf = await loader.loadAsync(url, (event) => {
          progress(index, event.loaded);
        });
        progress(index, expected[index] ?? 0);
        return gltf;
      })
    );
    const roots = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value.scene] : []
    );
    if (disposed || current !== generation) {
      disposeObjects(roots);
      return;
    }
    const model = results[0];
    const room = results[1];
    if (model?.status !== 'fulfilled' || room?.status !== 'fulfilled') {
      disposeObjects(roots);
      throw new Error('The scene assets could not be loaded', {
        cause: results.find((result) => result.status === 'rejected')
      });
    }
    // Own both roots before validation, so even a rejected contract is cleaned up.
    world.add(...roots);
    cabin = requireCabin(room.value.scene);
    retired.push(
      ...paint(model.value.scene, biscuitRamp(), true),
      ...paint(cabin.root, cabinRamp(), false)
    );
    biscuit = requireBiscuit(model.value, assets.clips);
    world.add(biscuit.root);
    lights = lighting(cabin);
    contact = disc();
    const fire = fireStill();
    fire.position.copy(cabin.fireAnchor.getWorldPosition(new Vector3())).y += 0.25;
    fire.quaternion.copy(cabin.fireAnchor.getWorldQuaternion(new Quaternion()));
    world.add(lights.root, contact, fire, vignette());
    ready = true;
    options.onProgress(1);
    update();
    if (!renderer.getContext().isContextLost()) {
      draw();
      if (animations && motion && state) {
        motion.apply(state);
        motion.start(frames);
      }
    }
  };
  const contextLost = (event: Event): void => {
    event.preventDefault();
    if (disposed || lost) return;
    lost = true;
    motion?.stop();
    options.onContextLost();
  };
  const contextRestored = (): void => {
    if (disposed) return;
    renderer.setPixelRatio(Math.min(ratio, 2));
    renderer.setSize(Math.max(1, size.width), Math.max(1, size.height), false);
    // three.js reinitializes its caches before this listener. Recompile the
    // custom materials and redraw the current state before removing the still.
    world.traverse((node) => {
      if (isMesh(node))
        for (const material of Array.isArray(node.material) ? node.material : [node.material])
          material.needsUpdate = true;
    });
    update();
    draw();
    if (!lost && animations && motion && state) {
      motion.apply(state);
      motion.start(frames);
    }
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  void load().catch(fail);
  return {
    apply,
    resize(next, pixelRatio) {
      if (disposed) return;
      if (next.width === size.width && next.height === size.height && ratio === pixelRatio) return;
      size = next;
      ratio = pixelRatio;
      if (lost) return;
      renderer.setPixelRatio(Math.min(ratio, 2));
      renderer.setSize(Math.max(1, size.width), Math.max(1, size.height), false);
      update();
      draw();
    },
    hit(x, y) {
      return ready && !lost && cabin && biscuit ? hitAt(x, y, size, camera, cabin, biscuit) : null;
    },
    capture() {
      if (!ready || lost || disposed || !state || size.width <= 0 || size.height <= 0)
        throw new Error('The scene has no drawable frame to capture');
      if (!draw()) throw new Error('The scene could not be captured');
      return canvas.toDataURL('image/png');
    },
    restore() {
      if (disposed || (!lost && !failed)) return;
      if (lost && renderer.getContext().isContextLost()) {
        // Without the extension the browser restores on its own: preventDefault
        // in contextLost asked for it. A renderer built on a lost context throws.
        contextRecovery?.restoreContext();
        return;
      }
      try {
        clear();
        renderer.dispose();
        renderer = makeRenderer();
        // A replacement renderer registers new listeners. Its restoration must
        // still run before ours, so the first redraw uses its rebuilt caches.
        canvas.removeEventListener('webglcontextrestored', contextRestored);
        canvas.addEventListener('webglcontextrestored', contextRestored);
        // The replacement renderer is live, but the still stays until draw().
        lost = false;
        failed = true;
        void load().catch(fail);
      } catch (error) {
        fail(error);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      motion?.dispose();
      clear();
      renderer.dispose();
    },
    get lost() {
      return lost;
    }
  };
}
