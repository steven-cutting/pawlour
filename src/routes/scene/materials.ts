import {
  BackSide,
  CircleGeometry,
  Color,
  DataTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  PlaneGeometry,
  RGBAFormat,
  ShaderChunk,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2
} from 'three';
import type { Material, Object3D } from 'three';
import { isMesh } from './cabin';

function ramp(colours: readonly (readonly number[])[]): DataTexture {
  const texture = new DataTexture(
    new Uint8Array(
      colours.flatMap((colour) => [...colour.map((channel) => Math.round(channel * 255)), 255])
    ),
    colours.length,
    1,
    RGBAFormat,
    UnsignedByteType
  );
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export function biscuitRamp(): DataTexture {
  return ramp([
    [0.32, 0.26, 0.245],
    [0.51, 0.43, 0.385],
    [0.82, 0.74, 0.66],
    [1, 1, 0.93]
  ]);
}

export function cabinRamp(): DataTexture {
  // Interpolate the six painted swatches in sRGB, before the texture's linear decode.
  const dark = [0x3a, 0x2a, 0x22];
  const light = [0xf2, 0xe2, 0xc8];
  return ramp(
    Array.from({ length: 6 }, (_, index) =>
      dark.map(
        (channel, component) =>
          (channel + (((light[component] ?? channel) - channel) * index) / 5) / 255
      )
    )
  );
}

export function toon(
  source: Material,
  gradientMap: DataTexture,
  biscuit: boolean
): MeshToonMaterial {
  const material = new MeshToonMaterial({ gradientMap });
  material.name = source.name;
  material.side = source.side;
  material.vertexColors = source.vertexColors;
  if (source instanceof MeshStandardMaterial) {
    material.color.copy(source.color);
    material.map = source.map;
    material.aoMap = source.aoMap;
    material.aoMapIntensity = 1;
    material.normalMap = source.normalMap;
    material.normalScale = new Vector2().setScalar(source.name.startsWith('face') ? 0.18 : 0.32);
  }
  if (!biscuit) material.vertexColors = true;
  // r186's toon shader deliberately discards green and blue. These are colour
  // ramps, so preserve RGB without changing how lights choose a ramp texel.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <gradientmap_pars_fragment>',
      ShaderChunk.gradientmap_pars_fragment.replace(
        'vec3( texture2D( gradientMap, coord ).r )',
        'texture2D( gradientMap, coord ).rgb'
      )
    );
  };
  material.customProgramCacheKey = () => 'pawlour-colour-ramp-v1';
  return material;
}

export function paint(root: Object3D, gradient: DataTexture, biscuit: boolean): Material[] {
  const replaced = new Set<Material>();
  const converted = new Map<Material, MeshToonMaterial>();
  root.traverse((node) => {
    if (!isMesh(node)) return;
    const replace = (source: Material): MeshToonMaterial => {
      replaced.add(source);
      let material = converted.get(source);
      if (!material) {
        material = toon(source, gradient, biscuit);
        converted.set(source, material);
      }
      return material;
    };
    node.material = Array.isArray(node.material)
      ? node.material.map(replace)
      : replace(node.material);
  });
  // Maps are shared with the replacements, and disposed with the complete scene.
  return [...replaced];
}

export function ink(): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ color: '#33221f', side: BackSide });
  material.onBeforeCompile = (shader) => {
    // After skinning, positions are dequantized. Root scaling then makes the
    // native .004 expansion .004 * scale in world units, exactly once.
    shader.vertexShader = shader.vertexShader.replace(
      '#include <skinning_vertex>',
      '#include <skinning_vertex>\ntransformed += normalize(objectNormal) * 0.004;'
    );
  };
  material.customProgramCacheKey = () => 'pawlour-skinned-ink-v1';
  return material;
}

export function disc(): Mesh<CircleGeometry, MeshBasicMaterial> {
  const mesh = new Mesh(
    new CircleGeometry(0.18, 32),
    new MeshBasicMaterial({
      color: 'black',
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  return mesh;
}

export function fireStill(): Mesh<PlaneGeometry, ShaderMaterial> {
  // A fixed middle flame; P07b replaces this quad's material with its flipbook.
  return new Mesh(
    new PlaneGeometry(0.38, 0.5),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      vertexShader:
        'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 vUv; void main(){float w=max(.001,(1.-vUv.y)*.45); float a=1.-smoothstep(w*.6,w,abs(vUv.x-.5)); gl_FragColor=vec4(mix(vec3(1.,.25,.025),vec3(1.,.8,.25),1.-vUv.y),a);\n#include <colorspace_fragment>\n}'
    })
  );
}

export function vignette(): Mesh<PlaneGeometry, ShaderMaterial> {
  const mesh = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { ink: { value: new Color('#33221f') } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:
        'varying vec2 vUv; uniform vec3 ink; void main(){float edge=smoothstep(.25,.72,length(vUv-.5)); gl_FragColor=vec4(ink,edge*.32);\n#include <colorspace_fragment>\n}'
    })
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = 100;
  return mesh;
}
