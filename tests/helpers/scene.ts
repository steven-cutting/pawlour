import { readFile } from 'node:fs/promises';
import { DataTexture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import sharp from 'sharp';

/** Decode embedded images locally: exercise GLTFLoader without browser globals. */
export function loader(): GLTFLoader {
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).register((parser) => ({
    name: 'EXT_texture_webp',
    async loadTexture(index: number) {
      const json = parser.json as {
        textures: { source?: number; extensions?: { EXT_texture_webp?: { source: number } } }[];
        images: { bufferView: number }[];
      };
      const texture = json.textures[index];
      const source = texture?.extensions?.EXT_texture_webp?.source ?? texture?.source;
      const image = source === undefined ? undefined : json.images[source];
      if (!image) throw new Error('Missing embedded test texture');
      const bytes = (await parser.getDependency('bufferView', image.bufferView)) as ArrayBuffer;
      const { data, info } = await sharp(Buffer.from(bytes))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const result = new DataTexture(new Uint8Array(data), info.width, info.height);
      result.flipY = false;
      result.needsUpdate = true;
      return result;
    }
  }));
}

export async function asset(path: string): Promise<GLTF> {
  return loader().parseAsync(new Uint8Array(await readFile(path)).buffer, '');
}
