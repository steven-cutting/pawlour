import {
  InstancedMesh,
  NoToneMapping,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer
} from 'three';
import type { BufferGeometry, Material, Object3D, Skeleton } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { SceneState } from '$lib/domain/director';
import type { FramePort } from '$lib/ports/frame';
import type { RandomPort } from '$lib/ports/random';
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
import { createFrameLoop, createMotion } from './motion';
import { createIdle } from './idle';
import { createFire } from './fire';
import { createWeather } from './weather';

export interface SceneAssets {
  biscuit: string;
  cabin: string;
  fire: string;
  clips: ClipTable;
  still(state: SceneState): string;
}

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  pixelRatio: number;
  size: Size;
  frames: FramePort;
  random: RandomPort;
  assets: SceneAssets;
  onProgress(fraction: number): void;
  onReady(): void;
  onContextLost(): void;
  onRestored(): void;
  onError(error: unknown): void;
  onArrived: () => void;
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
  const instances = new Set<InstancedMesh>();
  const images = new Set<unknown>();
  for (const root of roots)
    root.traverse((node) => {
      if (!isMesh(node)) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material])
        materials.add(material);
      if ('skeleton' in node) skeletons.add(node.skeleton as Skeleton);
      if (node instanceof InstancedMesh) instances.add(node as InstancedMesh);
    });
  for (const material of materials) {
    for (const value of Object.values(material) as unknown[])
      if (value instanceof Texture) textures.add(value as Texture);
    material.dispose();
  }
  for (const texture of textures) {
    // ImageBitmap.close releases the decoded CPU image as well as the GPU map.
    const image: unknown = texture.source.data;
    if (
      !images.has(image) &&
      image &&
      typeof image === 'object' &&
      'close' in image &&
      typeof image.close === 'function'
    )
      (image as { close(): void }).close();
    images.add(image);
    texture.dispose();
  }
  for (const geometry of geometries) geometry.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
  for (const mesh of instances) mesh.dispose();
}

export function createScene(
  options: SceneOptions,
  rendererFactory: (canvas: HTMLCanvasElement) => WebGLRenderer = (canvas) =>
    new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false })
): SceneHandle {
  const { canvas, assets, frames, random } = options;
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
  let stillFire: ReturnType<typeof fireStill> | undefined;
  let motion: ReturnType<typeof createMotion> | undefined;
  let idle: ReturnType<typeof createIdle> | undefined;
  let fire: ReturnType<typeof createFire> | undefined;
  let weather: ReturnType<typeof createWeather> | undefined;
  let pendingTexture: Texture | undefined;
  let live = false;
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
    loop.stop();
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
  const transforms = (): void => {
    if (!biscuit || !contact) return;
    contact.position.copy(biscuit.root.position).y += 0.002;
    world.updateMatrixWorld(true);
  };
  const update = (): void => {
    if (!state || !cabin || !biscuit || !lights || !contact) return;
    frameCamera(camera, cabin.cameras[state.camera], size);
    idle?.clear();
    if (animations) {
      if (!live) {
        biscuit.apply(state, cabin);
        biscuit.stop();
        live = true;
      }
      motion?.apply(state);
      motion?.update(0);
      idle?.clear();
      idle?.update(state, 0);
    } else {
      if (live) motion?.reset();
      live = false;
      biscuit.apply(state, cabin);
    }
    if (fire) fire.root.visible = animations;
    if (weather) {
      weather.root.visible = animations;
      weather.apply(state.weather);
    }
    if (stillFire) stillFire.visible = !animations;
    lights.apply(state, animations);
    if (animations) {
      lights.update(0, fire?.update(0, camera));
      weather?.update(0, camera);
    }
    transforms();
  };
  const canAnimate = (): boolean => ready && animations && !lost && !disposed;
  const loop = createFrameLoop(
    frames,
    (dt) => {
      if (!canAnimate() || !state) return;
      idle?.clear();
      motion?.update(dt);
      // An arrival callback may synchronously apply a motion-off state.
      if (!canAnimate()) return;
      idle?.clear();
      idle?.update(state, dt);
      lights?.update(dt, fire?.update(dt, camera));
      weather?.update(dt, camera);
      transforms();
      draw();
    },
    fail
  );
  const apply = (next: SceneState, active: boolean): void => {
    state = next;
    animations = active;
    if (!ready || lost || disposed) return;
    update();
    // A running loop draws this state on its next frame; a draw here would double it.
    if (canAnimate() && loop.running) return;
    if (draw() && canAnimate()) loop.start();
    else loop.stop();
  };
  const clear = (): void => {
    ready = false;
    loop.stop();
    idle?.clear();
    motion?.dispose();
    pendingTexture?.dispose();
    pendingTexture = undefined;
    biscuit?.dispose();
    disposeObjects([world], retired);
    retired = [];
    world = new Scene();
    biscuit = undefined;
    cabin = undefined;
    lights = undefined;
    contact = undefined;
    stillFire = undefined;
    motion = undefined;
    idle = undefined;
    fire = undefined;
    weather = undefined;
    live = false;
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
    const fireTexture = new TextureLoader().loadAsync(assets.fire);
    const [results, texture] = await Promise.all([
      Promise.allSettled(
        [assets.biscuit, assets.cabin].map(async (url, index) => {
          const gltf = await loader.loadAsync(url, (event) => {
            progress(index, event.loaded);
          });
          progress(index, expected[index] ?? 0);
          return gltf;
        })
      ),
      fireTexture.then(
        (value) => ({ value }),
        (error: unknown) => ({ error })
      )
    ]);
    const roots = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value.scene] : []
    );
    if (disposed || current !== generation) {
      disposeObjects(roots);
      if ('value' in texture) texture.value.dispose();
      return;
    }
    const model = results[0];
    const room = results[1];
    if (model?.status !== 'fulfilled' || room?.status !== 'fulfilled' || !('value' in texture)) {
      disposeObjects(roots);
      if ('value' in texture) texture.value.dispose();
      throw new Error('The scene assets could not be loaded', {
        cause:
          results.find((result) => result.status === 'rejected') ??
          ('error' in texture ? texture.error : undefined)
      });
    }
    // Own both roots before validation, so even a rejected contract is cleaned up.
    world.add(...roots);
    // Own the texture before validating either GLB, including failure cleanup.
    pendingTexture = texture.value;
    cabin = requireCabin(room.value.scene);
    retired.push(
      ...paint(model.value.scene, biscuitRamp(), true),
      ...paint(cabin.root, cabinRamp(), false)
    );
    biscuit = requireBiscuit(model.value, assets.clips);
    world.add(biscuit.root);
    lights = lighting(cabin);
    contact = disc();
    stillFire = fireStill();
    stillFire.position.copy(cabin.fireAnchor.getWorldPosition(new Vector3())).y += 0.25;
    stillFire.quaternion.copy(cabin.fireAnchor.getWorldQuaternion(new Quaternion()));
    world.add(lights.root, contact, stillFire, vignette());
    motion = createMotion({
      biscuit,
      clips: model.value.animations,
      table: assets.clips,
      cabin,
      onArrived: options.onArrived
    });
    idle = createIdle(biscuit, cabin, random);
    fire = createFire(cabin, texture.value, random);
    world.add(fire.root);
    pendingTexture = undefined;
    weather = createWeather(cabin, random);
    world.add(weather.root);
    ready = true;
    options.onProgress(1);
    update();
    if (!renderer.getContext().isContextLost()) {
      if (draw() && canAnimate()) loop.start();
    }
  };
  const contextLost = (event: Event): void => {
    event.preventDefault();
    if (disposed || lost) return;
    lost = true;
    loop.stop();
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
    if (draw() && canAnimate()) loop.start();
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
      if (draw() && canAnimate()) loop.start();
      else loop.stop();
    },
    hit(x, y) {
      if (!ready || lost || !cabin || !biscuit) return null;
      // Raycasting reads each skinned mesh's cached sphere. The renderer refreshes
      // skeletons itself every frame, so both are brought up to date here, at tap
      // rate, rather than over every vertex on every frame.
      for (const mesh of biscuit.meshes) {
        mesh.skeleton.update();
        mesh.computeBoundingSphere();
      }
      return hitAt(x, y, size, camera, cabin, biscuit);
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
      clear();
      renderer.dispose();
    },
    get lost() {
      return lost;
    }
  };
}
