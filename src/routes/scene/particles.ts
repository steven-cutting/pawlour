import { Color, InstancedBufferAttribute, InstancedMesh, ShaderMaterial } from 'three';
import type { BufferGeometry } from 'three';
import type { RandomPort } from '$lib/ports/random';

const FRACTIONS = Array.from({ length: 256 }, (_, index) => index / 256);

export function randomFraction(random: RandomPort): number {
  return random.uniformChoice(FRACTIONS);
}

/** Unlit instanced quads/discs with independent alpha, shared by the small effects. */
export function particles(count: number, geometry: BufferGeometry, colour: string) {
  const opacity = new InstancedBufferAttribute(new Float32Array(count), 1);
  geometry.setAttribute('instanceOpacity', opacity);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { colour: { value: new Color(colour) } },
    vertexShader: `
      attribute float instanceOpacity;
      varying float alpha;
      void main() {
        alpha = instanceOpacity;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 colour;
      varying float alpha;
      void main() {
        gl_FragColor = vec4(colour, alpha);
        #include <colorspace_fragment>
      }`
  });
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  return { mesh, opacity };
}
