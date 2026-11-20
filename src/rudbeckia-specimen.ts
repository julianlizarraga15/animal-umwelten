import {
  BufferGeometry,
  CatmullRomCurve3,
  ClampToEdgeWrapping,
  Color,
  ConeGeometry,
  type DataTexture,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { randomStream, reliefTexture, smoothstep, tileableNoise, type Random } from "./procedural";

type RingSample = (u: number, theta: number, position: Vector3, color: Color) => void;

export type SpecimenFrame = { target: Vector3; direction: Vector3; distance: number };

const HEAD_POSITION = new Vector3(0.006, 0.145, 0.004);
const HEAD_TILT = { x: 0.62, z: -0.2 };

export const RUDBECKIA_FRAMES = {
  close: { target: new Vector3(0.006, 0.15, 0.012), direction: new Vector3(0.35, 0.55, 1), distance: 0.17 },
  oblique: { target: new Vector3(0.035, 0.08, 0.035), direction: new Vector3(1, 0.14, 0.22), distance: 0.25 },
} as const satisfies Record<string, SpecimenFrame>;

/** Closed tube around a blade's centerline: u runs base to tip, theta runs around the cross-section. */
function ringSurface(rings: number, segments: number, sample: RingSample): BufferGeometry {
  const ringVertices = (rings + 1) * segments;
  const positions = new Float32Array((ringVertices + 2) * 3);
  const colors = new Float32Array((ringVertices + 2) * 3);
  const uvs = new Float32Array((ringVertices + 2) * 2);
  const position = new Vector3();
  const color = new Color();
  const capCenters = [new Vector3(), new Vector3()];
  const capColors = [new Color(0, 0, 0), new Color(0, 0, 0)];
  for (let ring = 0; ring <= rings; ring++) {
    const u = ring / rings;
    for (let segment = 0; segment < segments; segment++) {
      const theta = (segment / segments) * Math.PI * 2;
      sample(u, theta, position, color);
      const vertex = ring * segments + segment;
      position.toArray(positions, vertex * 3);
      color.toArray(colors, vertex * 3);
      uvs[vertex * 2] = u;
      uvs[vertex * 2 + 1] = (1 - Math.cos(theta)) / 2;
      const cap = ring === 0 ? 0 : ring === rings ? 1 : -1;
      if (cap >= 0) {
        capCenters[cap].addScaledVector(position, 1 / segments);
        capColors[cap].r += color.r / segments;
        capColors[cap].g += color.g / segments;
        capColors[cap].b += color.b / segments;
      }
    }
  }
  for (const cap of [0, 1]) {
    capCenters[cap].toArray(positions, (ringVertices + cap) * 3);
    capColors[cap].toArray(colors, (ringVertices + cap) * 3);
    uvs[(ringVertices + cap) * 2] = cap;
    uvs[(ringVertices + cap) * 2 + 1] = 0.5;
  }
  const indices: number[] = [];
  const at = (ring: number, segment: number) => ring * segments + (segment % segments);
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const a = at(ring, segment);
      const b = at(ring, segment + 1);
      const c = at(ring + 1, segment);
      const d = at(ring + 1, segment + 1);
      indices.push(a, b, c, b, d, c);
    }
  }
  for (let segment = 0; segment < segments; segment++) {
    indices.push(ringVertices, at(0, segment + 1), at(0, segment));
    indices.push(ringVertices + 1, at(rings, segment), at(rings, segment + 1));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData = { rings, segments };
  return geometry;
}

type HairSpec = {
  count: number;
  length: number;
  /** How far hairs lean from the surface normal toward the blade tip. */
  lean: number;
  accept: (u: number, theta: number) => boolean;
};

const HAIR_UP = new Vector3(0, 1, 0);

/** Appends hair transforms rooted on a ringSurface, in that geometry's current space. */
function scatterHairs(geometry: BufferGeometry, spec: HairSpec, random: Random, into: Matrix4[]): void {
  const { rings, segments } = geometry.userData as { rings: number; segments: number };
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const base = new Vector3();
  const neighbor = new Vector3();
  const normal = new Vector3();
  const toward = new Vector3();
  const direction = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  for (let placed = 0, attempts = 0; placed < spec.count && attempts < spec.count * 30; attempts++) {
    const ring = 1 + Math.floor(random() * (rings - 2));
    const segment = Math.floor(random() * segments);
    if (!spec.accept(ring / rings, (segment / segments) * Math.PI * 2)) continue;
    const index = ring * segments + segment;
    const across = ring * segments + ((segment + 1) % segments);
    const blend = random();
    base.fromBufferAttribute(positions, index).lerp(neighbor.fromBufferAttribute(positions, across), blend);
    normal.fromBufferAttribute(normals, index).lerp(neighbor.fromBufferAttribute(normals, across), blend).normalize();
    toward.fromBufferAttribute(positions, index + segments).sub(neighbor.fromBufferAttribute(positions, index)).normalize();
    direction.copy(normal).addScaledVector(toward, spec.lean * (0.6 + 0.8 * random())).normalize();
    quaternion.setFromUnitVectors(HAIR_UP, direction);
    const length = spec.length * (0.6 + 0.8 * random());
    into.push(new Matrix4().compose(base.clone(), quaternion, scale.set(length * 0.07, length, length * 0.07)));
    placed++;
  }
}

function hairMesh(matrices: Matrix4[], color: string): InstancedMesh {
  const cone = new ConeGeometry(1, 1, 4, 1);
  cone.translate(0, 0.5, 0);
  const hairs = new InstancedMesh(cone, new MeshStandardMaterial({ color, roughness: 0.6 }), matrices.length);
  matrices.forEach((matrix, index) => hairs.setMatrixAt(index, matrix));
  hairs.userData.hair = true;
  return hairs;
}

/** Adds sunlight transmitted through thin tissue, ignoring the tissue's own shadow. */
function translucent<T extends MeshPhysicalMaterial>(material: T, amount: number, tint: string): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.translucency = { value: new Color(tint).multiplyScalar(amount) };
    shader.fragmentShader = `uniform vec3 translucency;\n${shader.fragmentShader}`.replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
#if NUM_DIR_LIGHTS > 0
  totalEmissiveRadiance += translucency * diffuseColor.rgb * directionalLights[0].color
    * max(0.0, -dot(normal, directionalLights[0].direction));
#endif`,
    );
  };
  material.customProgramCacheKey = () => "translucent-tissue";
  return material;
}

function petalRelief(random: Random): DataTexture {
  const noise = tileableNoise(random, 24);
  const relief = reliefTexture({ width: 128, height: 512 }, (s, t) => {
    const striation = 0.5 + 0.5 * Math.cos(t * Math.PI * 2 * 26 + 3 * noise(s * 0.5, t));
    return 0.65 * striation + 0.35 * noise(s * 3, t * 2);
  });
  relief.wrapS = relief.wrapT = ClampToEdgeWrapping;
  return relief;
}

function leafRelief(random: Random): DataTexture {
  const coarse = tileableNoise(random, 40);
  const fine = tileableNoise(random, 96);
  const relief = reliefTexture({ width: 512, height: 512 }, (s, t) => {
    const reticulum = 1 - Math.abs(2 * coarse(s, t) - 1);
    return 0.7 * reticulum ** 2 + 0.3 * fine(s, t);
  });
  relief.wrapS = relief.wrapT = ClampToEdgeWrapping;
  return relief;
}

function rimProfile(sine: number, exponent: number): number {
  return Math.sign(sine) * Math.abs(sine) ** exponent;
}

type PetalSpec = {
  length: number;
  width: number;
  thickness: number;
  cup: number;
  lift: number;
  droop: number;
  twist: number;
  hue: number;
};

const PETAL_TOP = { base: new Color("#d48616"), middle: new Color("#ec9d17"), tip: new Color("#f6bd36") };
const PETAL_BACK = { base: new Color("#b08a2e"), middle: new Color("#e6b04a"), tip: new Color("#f0c462") };
/** False color for the UV-absorbing basal region of the upper ray surface (see docs/research/bee-vision.md). */
const UV_ABSORBING = new Color("#4d436b");

function uvGuide(u: number, across: number): number {
  const edge = 0.45 - 0.07 * across * across;
  return 1 - smoothstep(edge - 0.035, edge + 0.035, u);
}

/** With `guide`, the upper face shows the UV display encoding; the back never does. */
function petalSample(spec: PetalSpec, guide = false): RingSample {
  const top = new Color();
  const back = new Color();
  return (u, theta, position, color) => {
    const across = Math.cos(theta);
    const side = Math.sin(theta);
    const tip = Math.sqrt(Math.max(0, 1 - Math.max(0, (u - 0.8) / 0.2) ** 2));
    const halfWidth = (spec.width / 2) * (0.36 + 0.64 * smoothstep(0, 0.38, u)) * tip;
    const notch = 0.035 * Math.max(0, Math.sin(Math.PI * Math.abs(across) * 1.6)) * smoothstep(0.85, 1, u);
    const thickness = spec.thickness * (1 - 0.35 * u) * tip * (0.25 + 0.75 * (1 - across * across));
    const grooves = 0.035 * Math.cos(across * Math.PI * 4.5) * smoothstep(0.08, 0.45, u) * tip;
    const y = halfWidth * across;
    const z = spec.width * (spec.cup * across * across + grooves) + thickness * rimProfile(side, 0.55);
    const angle = spec.twist * u;
    position.set(
      spec.length * (u - notch),
      y * Math.cos(angle) - z * Math.sin(angle),
      y * Math.sin(angle) + z * Math.cos(angle) + spec.length * (spec.lift * u - spec.droop * u * u),
    );
    const palette = side >= 0 ? PETAL_TOP : PETAL_BACK;
    const target = side >= 0 ? top : back;
    target.lerpColors(palette.base, palette.middle, smoothstep(0.08, 0.4, u));
    target.lerp(palette.tip, smoothstep(0.5, 1, u));
    if (guide && side >= 0) target.lerp(palette.tip, 1 - smoothstep(0.4, 0.6, u)).lerp(UV_ABSORBING, uvGuide(u, across));
    const streak = 1 - 0.16 * (0.5 + 0.5 * Math.cos(across * Math.PI * 9)) * smoothstep(0.1, 0.4, u);
    color.copy(target).multiplyScalar(streak * spec.hue);
  };
}

function bractSample(length: number, width: number, thickness: number): RingSample {
  const base = new Color("#55673a");
  const tip = new Color("#7d8a52");
  return (u, theta, position, color) => {
    const across = Math.cos(theta);
    const halfWidth = (width / 2) * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95)) ** 0.7;
    const depth = thickness * (1 - u) ** 0.6 * rimProfile(Math.sin(theta), 0.5);
    position.set(length * u, halfWidth * across, width * 0.25 * across * across + depth - length * 0.25 * u * u);
    color.lerpColors(base, tip, u);
  };
}

/** Basal leaf: x along the blade, y across, z toward the upper (adaxial) face. */
function leafSample(length: number, width: number, random: Random): RingSample {
  const topBlade = new Color("#5f806c");
  const topVein = new Color("#a2b8a4");
  const underBlade = new Color("#9cb3a6");
  const underVein = new Color("#c2d0c4");
  const paleMargin = new Color("#c6d3c2");
  const mottling = Array.from({ length: 24 }, () => random());
  return (u, theta, position, color) => {
    const across = Math.cos(theta);
    const side = Math.sin(theta);
    const reach = Math.abs(across);
    const margin = 1 + 0.03 * Math.sin(u * Math.PI * 15) * smoothstep(0.12, 0.3, u) * (1 - smoothstep(0.85, 1, u));
    const halfWidth = (width / 2) * Math.sin(Math.PI * u ** 0.72) ** 0.85 * margin;
    const y = halfWidth * across;
    const fold = 0.48 * Math.sqrt(y * y + 0.0016 ** 2);
    const vein = Math.max(0, Math.cos(2 * Math.PI * 7 * (u - 0.2 * reach ** 0.8))) ** 14
      * smoothstep(0.04, 0.16, reach) * (1 - smoothstep(0.82, 0.97, reach))
      * smoothstep(0.05, 0.14, u) * (1 - smoothstep(0.86, 0.98, u));
    const midrib = Math.exp(-((y / 0.0019) ** 2));
    const envelope = Math.sin(Math.PI * u) ** 0.3;
    const lamina = 0.0011 * (1 - 0.45 * reach) * envelope;
    const upper = lamina - 0.00045 * vein - 0.0007 * midrib * envelope;
    const lower = lamina + 0.0007 * vein + 0.0026 * midrib * envelope;
    const edgeWave = 0.005 * Math.sin(u * Math.PI * 4.5 + (across > 0 ? 0 : 1.8)) * reach ** 4;
    const arch = length * (0.62 * u - 0.72 * u * u);
    const face = side >= 0 ? upper * rimProfile(side, 0.35) : lower * rimProfile(side, 0.35);
    position.set(length * u, y, arch + fold + edgeWave + face);
    const mottle = 0.94 + 0.12 * mottling[Math.floor(u * 23.99)] * (0.5 + 0.5 * Math.sin(across * 9 + u * 17));
    const veinAmount = Math.min(1, vein * 0.8 + midrib);
    if (side >= 0) color.lerpColors(topBlade, topVein, veinAmount);
    else color.lerpColors(underBlade, underVein, veinAmount);
    color.lerp(paleMargin, 0.6 * smoothstep(0.86, 1, reach));
    color.multiplyScalar(mottle);
  };
}

function bladeMatrix(azimuth: number, pitch: number, radius: number, height: number): Matrix4 {
  const toHead = new Matrix4().makeRotationX(-Math.PI / 2);
  const tilt = new Matrix4().makeRotationZ(pitch);
  const spin = new Matrix4().makeRotationY(azimuth);
  const place = new Matrix4().makeTranslation(radius * Math.cos(azimuth), height, -radius * Math.sin(azimuth));
  return place.multiply(spin).multiply(tilt).multiply(toHead);
}

const DISK_RADIUS = 0.0118;
const DISK_HEIGHT = 0.0115;

function domeHeight(radius: number): number {
  return DISK_HEIGHT * Math.max(0, 1 - (radius / DISK_RADIUS) ** 2) ** 0.62;
}

function createDisk(random: Random): Group {
  const disk = new Group();
  const profile: Vector2[] = [];
  for (let step = 0; step <= 24; step++) {
    const radius = DISK_RADIUS * 0.97 * Math.sin((step / 24) * Math.PI / 2);
    profile.push(new Vector2(radius, domeHeight(radius) - 0.0008));
  }
  profile.push(new Vector2(DISK_RADIUS * 0.8, -0.003));
  const dome = new Mesh(
    new LatheGeometry(profile, 48),
    new MeshStandardMaterial({ color: 0x24120b, roughness: 0.9 }),
  );
  dome.castShadow = true;
  disk.add(dome);

  const florets = 300;
  const floretMesh = new InstancedMesh(
    new SphereGeometry(1, 8, 6),
    new MeshPhysicalMaterial({ roughness: 0.62, sheen: 0.5, sheenColor: new Color("#7a3d22") }),
    florets,
  );
  const pollen = new InstancedMesh(
    new SphereGeometry(1, 6, 4),
    new MeshStandardMaterial({ roughness: 0.75 }),
    florets,
  );
  const up = new Vector3(0, 1, 0);
  const normal = new Vector3();
  const quaternion = new Quaternion();
  const matrix = new Matrix4();
  const dark = new Color("#2e140c");
  const maroon = new Color("#5a2414");
  const gold = new Color("#d9a12c");
  const color = new Color();
  let pollenCount = 0;
  for (let index = 0; index < florets; index++) {
    const reach = Math.sqrt((index + 0.5) / florets);
    const radius = DISK_RADIUS * 0.95 * reach;
    const azimuth = index * 2.39996323;
    const height = domeHeight(radius);
    const slope = (domeHeight(radius + 0.0002) - domeHeight(Math.max(0, radius - 0.0002))) / 0.0004;
    normal.set(-slope * Math.cos(azimuth), 1, -slope * Math.sin(azimuth)).normalize();
    quaternion.setFromUnitVectors(up, normal);
    const size = 0.00075 + 0.00035 * reach + 0.0002 * random();
    const center = new Vector3(radius * Math.cos(azimuth), height, radius * Math.sin(azimuth));
    matrix.compose(center, quaternion, new Vector3(size, size * 1.5, size));
    floretMesh.setMatrixAt(index, matrix);
    floretMesh.setColorAt(index, color.lerpColors(dark, maroon, random() * 0.7 + reach * 0.3));
    if (reach > 0.62 && random() < 0.55) {
      const tipSize = size * (0.45 + 0.25 * random());
      matrix.compose(center.addScaledVector(normal, size * 1.4), quaternion, new Vector3(tipSize, tipSize, tipSize));
      pollen.setMatrixAt(pollenCount, matrix);
      pollen.setColorAt(pollenCount, color.copy(gold).multiplyScalar(0.8 + 0.3 * random()));
      pollenCount++;
    }
  }
  pollen.count = pollenCount;
  for (const mesh of [floretMesh, pollen]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    disk.add(mesh);
  }
  return disk;
}

export type RudbeckiaHead = { readonly root: Group; setUvGuide(visible: boolean): void };

/** Head centered on the disk, facing +y. `withUvGuide` adds the swappable UV encoding of the upper ray faces. */
export function createRudbeckiaHead(random: Random, withUvGuide = false): RudbeckiaHead {
  const head = new Group();
  const petals: BufferGeometry[] = [];
  const petalHairs: Matrix4[] = [];
  const bractHairs: Matrix4[] = [];
  const whorls = [
    { count: 7, offset: 0, pitch: 0.14, height: 0.0014, length: 0.047 },
    { count: 7, offset: Math.PI / 7, pitch: -0.02, height: -0.0014, length: 0.052 },
  ];
  for (const whorl of whorls) {
    for (let index = 0; index < whorl.count; index++) {
      const spec: PetalSpec = {
        length: whorl.length * (0.92 + 0.16 * random()),
        width: 0.019 * (0.9 + 0.16 * random()),
        thickness: 0.0011,
        cup: 0.1 + 0.1 * random(),
        lift: 0.1,
        droop: 0.24 + 0.26 * random(),
        twist: (random() - 0.5) * 0.6,
        hue: 0.9 + 0.14 * random(),
      };
      const geometry = ringSurface(48, 32, petalSample(spec));
      if (withUvGuide) {
        const guided = ringSurface(48, 32, petalSample(spec, true));
        geometry.setAttribute("colorUv", guided.getAttribute("color"));
        guided.dispose();
      }
      const azimuth = whorl.offset + (index / whorl.count) * Math.PI * 2 + (random() - 0.5) * 0.22;
      geometry.applyMatrix4(bladeMatrix(azimuth, whorl.pitch + (random() - 0.5) * 0.14, DISK_RADIUS * 0.72, whorl.height));
      scatterHairs(geometry, {
        count: 40,
        length: 0.0006,
        lean: 1.4,
        accept: (u, theta) => Math.sin(theta) < -0.5 && u > 0.05 && u < 0.85,
      }, random, petalHairs);
      petals.push(geometry);
    }
  }
  const petalMesh = new Mesh(
    mergeGeometries(petals),
    translucent(new MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.74,
      sheen: 0.45,
      sheenRoughness: 0.5,
      sheenColor: new Color("#ffd27a"),
      bumpMap: petalRelief(random),
      bumpScale: 0.35,
    }), 0.5, "#ffb060"),
  );

  const bracts: BufferGeometry[] = [];
  for (let index = 0; index < 13; index++) {
    const geometry = ringSurface(18, 14, bractSample(0.019 + 0.004 * random(), 0.0042, 0.0007));
    const azimuth = (index / 13) * Math.PI * 2 + random() * 0.2;
    geometry.applyMatrix4(bladeMatrix(azimuth, -0.55 - 0.25 * random(), DISK_RADIUS * 0.55, -0.0038));
    scatterHairs(geometry, { count: 70, length: 0.0014, lean: 0.7, accept: () => true }, random, bractHairs);
    bracts.push(geometry);
  }
  const bractMesh = new Mesh(
    mergeGeometries(bracts),
    translucent(new MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.8, sheen: 1, sheenRoughness: 0.4, sheenColor: new Color("#d5dcb6"),
    }), 0.3, "#a8d070"),
  );
  const receptacle = new Mesh(
    new SphereGeometry(DISK_RADIUS * 0.7, 24, 16),
    new MeshPhysicalMaterial({ color: 0x5b6a3c, roughness: 0.8, sheen: 1, sheenColor: new Color("#cfd6b0") }),
  );
  receptacle.scale.set(1, 0.6, 1);
  receptacle.position.y = -0.0045;
  head.add(petalMesh, bractMesh, receptacle, createDisk(random));
  head.add(hairMesh(petalHairs, "#f3d48a"), hairMesh(bractHairs, "#d2d8bb"));
  const petalGeometry = petalMesh.geometry;
  const humanColors = petalGeometry.getAttribute("color");
  const uvColors = petalGeometry.getAttribute("colorUv");
  return {
    root: head,
    setUvGuide(visible) {
      if (!uvColors) throw new Error("Rudbeckia head was built without the UV guide.");
      petalGeometry.setAttribute("color", visible ? uvColors : humanColors);
    },
  };
}

function createStem(head: Group, random: Random): Group {
  const stem = new Group();
  head.updateMatrixWorld(true);
  const top = head.localToWorld(new Vector3(0, -0.009, 0));
  const axis = new Vector3(0, 1, 0).applyQuaternion(head.quaternion);
  const curve = new CatmullRomCurve3([
    new Vector3(0, -0.004, 0),
    new Vector3(0.004, 0.045, -0.003),
    new Vector3(0.002, 0.085, -0.004),
    top.clone().addScaledVector(axis, -0.022),
    top,
  ]);
  const stalkMaterial = new MeshPhysicalMaterial({ color: 0x5f7040, roughness: 0.78, sheen: 1, sheenColor: new Color("#c4cca4") });
  const stalk = new Mesh(new TubeGeometry(curve, 160, 0.0024, 10, false), stalkMaterial);
  stem.add(stalk);

  const hairCount = 520;
  const hairs = new InstancedMesh(
    new ConeGeometry(0.00011, 0.0017, 4),
    new MeshStandardMaterial({ color: 0xc2c8a6, roughness: 0.7 }),
    hairCount,
  );
  const frames = curve.computeFrenetFrames(200, false);
  const up = new Vector3(0, 1, 0);
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const radial = new Vector3();
  const direction = new Vector3();
  const scale = new Vector3(1, 1, 1);
  for (let index = 0; index < hairCount; index++) {
    const t = random();
    const frame = Math.min(200, Math.round(t * 200));
    const angle = random() * Math.PI * 2;
    radial.copy(frames.normals[frame]).multiplyScalar(Math.cos(angle)).addScaledVector(frames.binormals[frame], Math.sin(angle));
    direction.copy(radial).multiplyScalar(0.75).addScaledVector(frames.tangents[frame], 0.65).normalize();
    quaternion.setFromUnitVectors(up, direction);
    const base = curve.getPointAt(t).addScaledVector(radial, 0.0024).addScaledVector(direction, 0.0007);
    scale.setScalar(0.7 + 0.6 * random());
    matrix.compose(base, quaternion, scale);
    hairs.setMatrixAt(index, matrix);
  }
  hairs.userData.hair = true;
  stem.add(hairs);
  return stem;
}

export type LeafDetail = { rings: number; segments: number };

const HERO_LEAF: LeafDetail = { rings: 150, segments: 240 };

/**
 * Broad leaf blade, 0.19 m long: x runs base to tip, y is up toward the adaxial face.
 * `hairDensity` scales the 7,100 surface hairs. `detail` defaults to the specimen resolution.
 */
export function createBroadLeaf(random: Random, hairDensity = 1, detail: LeafDetail = HERO_LEAF): Mesh {
  const length = 0.19;
  const geometry = ringSurface(detail.rings, detail.segments, leafSample(length, 0.098, random));
  const blade = new Mesh(
    geometry,
    translucent(new MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.85,
      sheen: 0.8,
      sheenRoughness: 0.45,
      sheenColor: new Color("#c4d4c4"),
      bumpMap: leafRelief(random),
      bumpScale: 0.5,
    }), 0.22, "#8fc060"),
  );
  const hairs: Matrix4[] = [];
  const rim = (theta: number) => Math.abs(Math.sin(theta)) < 0.3;
  const count = (full: number) => Math.round(full * hairDensity);
  scatterHairs(geometry, { count: count(1600), length: 0.0012, lean: 0.5, accept: (_u, theta) => rim(theta) }, random, hairs);
  scatterHairs(geometry, { count: count(3500), length: 0.001, lean: 1.1, accept: (_u, theta) => Math.sin(theta) > 0.3 }, random, hairs);
  scatterHairs(geometry, { count: count(2000), length: 0.0009, lean: 1.1, accept: (_u, theta) => Math.sin(theta) < -0.3 }, random, hairs);
  if (hairs.length > 0) blade.add(hairMesh(hairs, "#d3dccd"));
  blade.rotation.x = -Math.PI / 2;
  return blade;
}

function createLeaf(random: Random): Group {
  const leaf = new Group();
  const blade = createBroadLeaf(random);
  blade.position.set(0.018, 0.006, 0);
  const petiole = new Mesh(
    new TubeGeometry(new CatmullRomCurve3([
      new Vector3(-0.002, -0.004, 0),
      new Vector3(0.008, 0.002, 0),
      new Vector3(0.019, 0.006, 0),
    ]), 24, 0.0022, 8, false),
    new MeshPhysicalMaterial({ color: 0x6f7c4e, roughness: 0.8, sheen: 1, sheenColor: new Color("#cfd6b0") }),
  );
  leaf.add(blade, petiole);
  leaf.rotation.y = -0.85 + (random() - 0.5) * 0.1;
  leaf.rotation.z = 0.08;
  leaf.position.set(0.004, 0, 0.004);
  return leaf;
}

/** Stylized Rudbeckia hirta head on a short stem with one broad basal leaf. Units are meters. */
export function createRudbeckiaSpecimen(): Group {
  const random = randomStream("rudbeckia-specimen");
  const specimen = new Group();
  const head = createRudbeckiaHead(random).root;
  head.position.copy(HEAD_POSITION);
  head.rotation.set(HEAD_TILT.x, 0, HEAD_TILT.z);
  specimen.add(head);
  specimen.add(createStem(head, random));
  specimen.add(createLeaf(random));
  specimen.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = child.userData.hair !== true;
    child.receiveShadow = true;
  });
  return specimen;
}
