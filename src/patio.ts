import {
  BoxGeometry, BufferGeometry, Color, DoubleSide, Euler, Float32BufferAttribute, Group,
  IcosahedronGeometry, InstancedMesh, LatheGeometry, Matrix4, Mesh, MeshStandardMaterial,
  PlaneGeometry, Quaternion, TorusGeometry, TubeGeometry, CatmullRomCurve3, Vector2, Vector3,
} from 'three';
import { WEB_CENTER } from './spider-web';
import {
  colorTexture, mixRgb, randomStream, reliefTexture, rgb, smoothstep, tileableNoise,
  type Field, type Random, type Raster, type Rgb, type Rgba,
} from './procedural';
import { createBroadLeaf } from './rudbeckia-specimen';

type Surface = {
  readonly raster: Raster;
  readonly repeat: readonly [number, number];
  readonly roughness: number;
  readonly bumpScale: number;
  fields(random: Random): { readonly albedo: Field<Rgb | Rgba>; readonly relief: Field<number> };
};

export type PatioScene = {
  readonly root: Group;
  readonly setSway: (amount: number) => void;
};

/** Hero flower and its pot share this bed. The flower head sits about 1.5 units above it. */
export const FLOWER_BED = new Vector3(-1.12, 0, 0.28);

function noisyFields(base: string, random: Random, period: number, amount: number) {
  const noise = tileableNoise(random, period);
  const color = rgb(base);
  return {
    albedo: (s: number, t: number) => {
      const shade = 1 + (noise(s, t) - 0.5) * amount;
      return [color[0] * shade, color[1] * shade, color[2] * shade] as Rgb;
    },
    relief: noise,
  };
}

const POT = {
  rimTop: -0.56,
  soilDrop: 0.16,
  outer: [[0.78, -2.2], [0.8, -2.14], [1.1, -0.84], [1.19, -0.82], [1.2, -0.62], [1.185, -0.575], [1.15, -0.56]],
  inner: [[1.1, -0.56], [1.07, -0.575], [1.055, -0.62], [1.0, -0.86]],
} as const;
const FOREGROUND_HAIR_DENSITY = 0.25;
const lipT = (POT.outer.length - 1) / (POT.outer.length + POT.inner.length - 1);

const SURFACES = {
  tile: {
    raster: { width: 512, height: 512 }, repeat: [3.5, 3.5], roughness: 0.94, bumpScale: 0.08,
    fields(random) {
      const noise = tileableNoise(random, 16);
      const warmNoise = tileableNoise(random, 6);
      const grout = rgb('#b8a894');
      const clay = rgb('#dfd0bc');
      const aged = rgb('#cfbda6');
      return {
        albedo: (s, t) => {
          const edge = Math.min(s % 0.25, t % 0.25, 0.25 - s % 0.25, 0.25 - t % 0.25);
          if (edge < 0.007) return grout;
          return mixRgb(clay, aged, noise(s, t) * 0.26 + warmNoise(s, t) * 0.18);
        },
        relief: (s, t) => Math.min(s % 0.25, t % 0.25, 0.25 - s % 0.25, 0.25 - t % 0.25) < 0.007 ? 0.2 : 0.64,
      };
    },
  },
  plaster: {
    raster: { width: 256, height: 256 }, repeat: [5, 2], roughness: 0.94, bumpScale: 0.06,
    fields(random) {
      const fine = tileableNoise(random, 12);
      const broad = tileableNoise(random, 4);
      const peach = rgb('#e7c4ad');
      const warm = rgb('#dfb397');
      return {
        albedo: (s, t) => mixRgb(peach, warm, fine(s, t) * 0.35 + broad(s, t) * 0.25),
        relief: (s, t) => 0.45 + fine(s, t) * 0.3 + broad(s, t) * 0.15,
      };
    },
  },
  trim: {
    raster: { width: 256, height: 256 }, repeat: [8, 1], roughness: 0.92, bumpScale: 0.05,
    fields: (random) => noisyFields('#d5bcab', random, 8, 0.06),
  },
  terracotta: {
    raster: { width: 256, height: 256 }, repeat: [3, 1], roughness: 0.88, bumpScale: 0.08,
    fields(random) {
      const noise = tileableNoise(random, 8);
      const wear = tileableNoise(random, 4);
      const base = rgb('#ba6947');
      const salt = rgb('#cbb29e');
      return {
        albedo: (s, t) => {
          let shade = 0.9 + noise(s, t) * 0.16 + Math.sin(t * Math.PI * 44) * 0.018;
          shade *= t > lipT ? 0.62 - 0.17 * ((t - lipT) / (1 - lipT)) : 1;
          const weathered = mixRgb(base, salt, smoothstep(0.55, 0.95, wear(s, t)) * (t < 0.28 ? 0.35 : 0.1));
          return [weathered[0] * shade, weathered[1] * shade, weathered[2] * shade];
        },
        relief: (s, t) => 0.45 + noise(s, t) * 0.25 + Math.sin(t * Math.PI * 44) * 0.08,
      };
    },
  },
  soil: {
    raster: { width: 128, height: 128 }, repeat: [3, 3], roughness: 1, bumpScale: 0.16,
    fields: (random) => noisyFields('#6b5140', random, 32, 0.4),
  },
  path: {
    raster: { width: 256, height: 512 }, repeat: [1.4, 6], roughness: 0.96, bumpScale: 0.07,
    fields(random) {
      const noise = tileableNoise(random, 8);
      const wear = tileableNoise(random, 4);
      const clay = rgb('#c48462');
      const worn = rgb('#a56a4e');
      const grout = rgb('#8d735f');
      return {
        albedo: (s, t) => {
          const brick = Math.min(s % 0.5, 0.5 - s % 0.5, (t + (Math.floor(s * 2) % 2) * 0.08) % 0.16, 0.16 - (t + (Math.floor(s * 2) % 2) * 0.08) % 0.16);
          if (brick < 0.012) return grout;
          return mixRgb(clay, worn, noise(s, t) * 0.45 + wear(s, t) * 0.35);
        },
        relief: (s, t) => 0.55 + noise(s, t) * 0.3 - wear(s, t) * 0.12,
      };
    },
  },
  waterStain: {
    raster: { width: 128, height: 128 }, repeat: [1, 1], roughness: 0.96, bumpScale: 0.02,
    fields(random) {
      const noise = tileableNoise(random, 6);
      const damp = rgb('#8a6b5e');
      return {
        albedo: (s, t) => {
          const edgeFade = smoothstep(0.05, 0.25, s) * (1 - smoothstep(0.75, 0.95, s))
            * smoothstep(0.04, 0.22, t) * (1 - smoothstep(0.7, 0.96, t));
          const drip = Math.exp(-Math.pow((s - 0.5) / 0.24, 2)) * (1 - smoothstep(0.45, 0.95, t));
          const alpha = edgeFade * drip * (0.38 + 0.42 * noise(s * 2, t * 2));
          return [damp[0], damp[1], damp[2], alpha];
        },
        relief: (s, t) => 0.5 + noise(s, t) * 0.12,
      };
    },
  },
} satisfies Record<string, Surface>;

type SurfaceId = keyof typeof SURFACES;

function surfaceMaterial(id: SurfaceId): MeshStandardMaterial {
  const surface = SURFACES[id];
  const fields = surface.fields(randomStream(`surface:${id}`));
  const map = colorTexture(surface.raster, fields.albedo);
  const bumpMap = reliefTexture(surface.raster, fields.relief);
  map.repeat.set(...surface.repeat);
  bumpMap.repeat.set(...surface.repeat);
  return new MeshStandardMaterial({ map, bumpMap, bumpScale: surface.bumpScale, roughness: surface.roughness });
}

function curvedLeafGeometry(length: number, maxWidth: number, arch: number, curl: number): BufferGeometry {
  const rows = 18;
  const cols = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let r = 0; r <= rows; r++) {
    const along = r / rows;
    const width = maxWidth * Math.sin(Math.PI * Math.pow(along, 0.72)) * (0.22 + 0.78 * (1 - along * 0.35));
    const y = Math.sin(along * Math.PI * 0.78) * arch - along * along * (arch * 0.58);
    const z = along * length;
    for (let c = 0; c <= cols; c++) {
      const across = (c / cols) * 2 - 1;
      const x = across * width;
      const cup = Math.abs(across) * width * 0.16 + across * across * curl * along;
      positions.push(x, y + cup, z);
      uvs.push(c / cols, along);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + 1;
      const d = a + cols + 1;
      indices.push(a, d, b, b, d, d + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRepairedPot(terracottaMat: MeshStandardMaterial): Group {
  const group = new Group();
  const smallProfile = POT.outer.map(([r, y]) => new Vector2(r * 0.44, (y + 2.2) * 0.46));
  const potMesh = new Mesh(new LatheGeometry(smallProfile, 40), terracottaMat);
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  group.add(potMesh);

  // Subtle lime/clay repair seam & two small metal staples along a hairline crack
  const seamCurve = new CatmullRomCurve3([
    new Vector3(0.49, 0.68, 0.12),
    new Vector3(0.47, 0.52, 0.16),
    new Vector3(0.43, 0.34, 0.18),
    new Vector3(0.39, 0.16, 0.15),
  ]);
  const seamMat = new MeshStandardMaterial({ color: '#d8c5b2', roughness: 0.92 });
  const seam = new Mesh(new TubeGeometry(seamCurve, 12, 0.012, 6, false), seamMat);
  seam.castShadow = true;
  group.add(seam);

  const stapleMat = new MeshStandardMaterial({ color: '#6b5e57', roughness: 0.6, metalness: 0.35 });
  for (const [y, z] of [[0.54, 0.155], [0.32, 0.175]] as const) {
    const staple = new Mesh(new TorusGeometry(0.036, 0.007, 6, 12, Math.PI), stapleMat);
    staple.position.set(0.455, y, z);
    staple.rotation.y = Math.PI * 0.42;
    group.add(staple);
  }

  return group;
}

function createTileSprout(sageMat: MeshStandardMaterial): Group {
  const sprout = new Group();
  const leafSpecs = [
    { len: 0.34, w: 0.085, arch: 0.16, yaw: 0.25, pitch: 0.22 },
    { len: 0.29, w: 0.075, arch: 0.14, yaw: 2.15, pitch: 0.28 },
    { len: 0.26, w: 0.07, arch: 0.12, yaw: -1.65, pitch: 0.25 },
    { len: 0.22, w: 0.06, arch: 0.15, yaw: 0.95, pitch: 0.38 },
  ];
  for (const spec of leafSpecs) {
    const leaf = new Mesh(curvedLeafGeometry(spec.len, spec.w, spec.arch, 0.02), sageMat);
    leaf.rotation.y = spec.yaw;
    leaf.rotation.x = -spec.pitch;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    sprout.add(leaf);
  }
  return sprout;
}

function addLeaf(parent: Group, material: MeshStandardMaterial, length: number, width: number, arch: number, pose: { x: number; y: number; z: number; yaw: number; pitch: number; roll?: number }, cast = true): Mesh {
  const leaf = new Mesh(curvedLeafGeometry(length, width, arch, 0.04), material);
  leaf.position.set(pose.x, pose.y, pose.z);
  leaf.rotation.set(pose.pitch, pose.yaw, pose.roll ?? 0);
  leaf.castShadow = cast;
  leaf.receiveShadow = true;
  parent.add(leaf);
  return leaf;
}

/** Places a shared modeled blade; `lift` raises the tip, then `yaw` turns the blade about the vertical. */
function addBroadLeaf(parent: Group, blade: Mesh, scale: number, pose: { x: number; y: number; z: number; yaw: number; lift: number }): void {
  const leaf = blade.clone();
  leaf.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = child.userData.hair !== true;
    child.receiveShadow = true;
  });
  const holder = new Group();
  holder.add(leaf);
  holder.position.set(pose.x, pose.y, pose.z);
  holder.rotation.set(0, pose.yaw, pose.lift);
  holder.scale.setScalar(scale);
  parent.add(holder);
}

function plantSpike(parent: Group, random: Random, origin: Vector3, scale: number): void {
  const stem = new Mesh(
    new TubeGeometry(new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3((random() - 0.5) * 0.08, 0.45, (random() - 0.5) * 0.08),
      new Vector3((random() - 0.5) * 0.12, 0.95, 0),
    ]), 6, 0.012, 5, false),
    new MeshStandardMaterial({ color: '#5d7348', roughness: 1 }),
  );
  const blossom = new MeshStandardMaterial({ color: random() > 0.5 ? '#7d68b8' : '#c46b93', roughness: 0.8 });
  const group = new Group();
  group.add(stem);
  for (let i = 0; i < 7; i++) {
    const floret = new Mesh(new IcosahedronGeometry(0.045, 0), blossom);
    floret.position.set((random() - 0.5) * 0.08, 0.35 + i * 0.09, (random() - 0.5) * 0.08);
    group.add(floret);
  }
  group.position.copy(origin);
  group.scale.setScalar(scale);
  parent.add(group);
}

function wornPath(): Mesh {
  const centers = [
    new Vector3(0.05, 0, 4.35),
    new Vector3(0.22, 0, 2.4),
    new Vector3(0.48, 0, 0.55),
    new Vector3(0.62, 0, -1.35),
    new Vector3(0.4, 0, -3.35),
    new Vector3(0.5, 0, -5.6),
  ];
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  centers.forEach((center, index) => {
    const next = centers[Math.min(index + 1, centers.length - 1)];
    const prev = centers[Math.max(index - 1, 0)];
    const tangent = next.clone().sub(prev).setY(0);
    if (tangent.lengthSq() < 1e-6) tangent.set(0, 0, -1);
    tangent.normalize();
    const side = new Vector3(-tangent.z, 0, tangent.x);
    const half = 0.62 - index * 0.04;
    for (const sign of [-1, 1]) {
      const point = center.clone().addScaledVector(side, sign * half);
      positions.push(point.x, -2.165, point.z);
      uvs.push(sign * 0.5 + 0.5, index / (centers.length - 1));
    }
    if (index < centers.length - 1) {
      const a = index * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, surfaceMaterial('path'));
  mesh.receiveShadow = true;
  return mesh;
}

export function createPatio(): PatioScene {
  const root = new Group();

  const bedMaterial = surfaceMaterial('soil');
  bedMaterial.roughness = 1;
  const floor = new Mesh(new PlaneGeometry(24, 24), bedMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.4, -2.2, 0.2);
  floor.receiveShadow = true;
  root.add(floor);
  root.add(wornPath());

  const wallMaterial = surfaceMaterial('plaster');
  const trimMaterial = surfaceMaterial('trim');
  const terracottaMaterial = surfaceMaterial('terracotta');
  const sunLeaf = new MeshStandardMaterial({ color: '#7d9a62', roughness: 0.82, side: DoubleSide, emissive: '#314226', emissiveIntensity: 0.12 });
  const shadeLeaf = new MeshStandardMaterial({ color: '#4e6846', roughness: 0.9, side: DoubleSide });
  const sageSproutMat = new MeshStandardMaterial({ color: '#758b64', roughness: 0.9, side: DoubleSide });

  const house = new Group();
  const backWall = new Mesh(new BoxGeometry(14, 4.8, 0.42), wallMaterial);
  backWall.position.set(0.8, 0.15, -6.4);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  house.add(backWall);
  const arch = new Mesh(new BoxGeometry(1.7, 2.5, 0.2), new MeshStandardMaterial({ color: '#6a4638', roughness: 1 }));
  arch.position.set(0.55, -0.55, -6.16);
  house.add(arch);
  const windowFrame = new Mesh(new BoxGeometry(0.95, 1.15, 0.12), trimMaterial);
  windowFrame.position.set(2.7, 0.7, -6.16);
  house.add(windowFrame);
  const windowGlass = new Mesh(new PlaneGeometry(0.62, 0.82), new MeshStandardMaterial({
    color: '#f3c98a',
    emissive: '#e7a15a',
    emissiveIntensity: 0.45,
    roughness: 0.35,
  }));
  windowGlass.position.set(2.7, 0.7, -5.92);
  house.add(windowGlass);
  const mullionV = new Mesh(new BoxGeometry(0.04, 0.82, 0.04), trimMaterial);
  mullionV.position.set(2.7, 0.7, -5.88);
  const mullionH = new Mesh(new BoxGeometry(0.62, 0.04, 0.04), trimMaterial);
  mullionH.position.set(2.7, 0.7, -5.88);
  house.add(mullionV, mullionH);
  const coping = new Mesh(new BoxGeometry(14.2, 0.18, 0.62), trimMaterial);
  coping.position.set(0.8, 2.62, -6.4);
  coping.castShadow = true;
  house.add(coping);
  const plinth = new Mesh(new BoxGeometry(14.1, 0.28, 0.55), trimMaterial);
  plinth.position.set(0.8, -2.05, -6.3);
  plinth.receiveShadow = true;
  house.add(plinth);
  const stainMat = surfaceMaterial('waterStain');
  stainMat.transparent = true;
  stainMat.depthWrite = false;
  const wallStain = new Mesh(new PlaneGeometry(1.6, 1.8), stainMat);
  wallStain.position.set(-1.4, -0.7, -6.16);
  house.add(wallStain);
  root.add(house);

  const profile = [...POT.outer, ...POT.inner].map(([radius, y]) => new Vector2(radius, y));
  const pot = new Mesh(new LatheGeometry(profile, 48), terracottaMaterial);
  pot.castShadow = true;
  pot.receiveShadow = true;
  pot.position.copy(FLOWER_BED);
  root.add(pot);

  const repairedPot = createRepairedPot(terracottaMaterial);
  repairedPot.position.set(WEB_CENTER.x + 0.35, -2.2, WEB_CENTER.z + 0.85);
  repairedPot.scale.setScalar(1.35);
  repairedPot.rotation.y = -0.4;
  root.add(repairedPot);

  const midPot = createRepairedPot(terracottaMaterial);
  midPot.position.set(1.35, -2.2, -1.15);
  midPot.scale.setScalar(0.85);
  midPot.rotation.y = 1.2;
  root.add(midPot);

  const tileSprout = createTileSprout(sageSproutMat);
  tileSprout.position.set(0.95, -2.16, 1.55);
  root.add(tileSprout);

  const broadLeaves = [
    createBroadLeaf(randomStream('foreground-leaf-a'), FOREGROUND_HAIR_DENSITY),
    createBroadLeaf(randomStream('foreground-leaf-b'), FOREGROUND_HAIR_DENSITY),
  ];
  const leftFrame = new Group();
  leftFrame.position.set(-2.75, -1.05, 5.5);
  addBroadLeaf(leftFrame, broadLeaves[0], 13.5, { x: 0, y: 0, z: 0, yaw: 0.3, lift: 0.58 });
  addBroadLeaf(leftFrame, broadLeaves[1], 12, { x: 0.25, y: -0.3, z: 0.55, yaw: -0.1, lift: 0.22 });
  root.add(leftFrame);

  const rightFrame = new Group();
  rightFrame.position.set(3.2, -0.75, 5.5);
  addBroadLeaf(rightFrame, broadLeaves[1], 10, { x: 0, y: 0, z: 0, yaw: Math.PI + 0.25, lift: 0.36 });
  addBroadLeaf(rightFrame, broadLeaves[0], 8, { x: 0.1, y: 0.1, z: -0.45, yaw: Math.PI - 0.35, lift: 0.5 });
  root.add(rightFrame);

  const canopy = new Group();
  const canopyLeaf = new MeshStandardMaterial({ color: '#718653', roughness: 0.88, side: DoubleSide, emissive: '#4b6037', emissiveIntensity: 0.7 });
  const canopyLight = new MeshStandardMaterial({ color: '#9aad73', roughness: 0.84, side: DoubleSide, emissive: '#647b49', emissiveIntensity: 0.52 });
  const canopyStem = new MeshStandardMaterial({ color: '#4d5940', roughness: 0.96 });
  const archSpecs = [
    { x: -4.4, y: 3.15, z: 4.5, yaw: 1.18, length: 3.3, width: 0.58, roll: 0.08 },
    { x: 4.0, y: 3.0, z: 4.25, yaw: -1.12, length: 3.1, width: 0.55, roll: -0.1 },
    { x: -2.2, y: 3.5, z: 4.0, yaw: 1.43, length: 2.45, width: 0.46, roll: 0.12 },
    { x: 2.05, y: 3.42, z: 4.35, yaw: -1.44, length: 2.35, width: 0.48, roll: -0.08 },
  ];
  for (const [index, spec] of archSpecs.entries()) {
    addLeaf(canopy, index % 2 === 0 ? canopyLeaf : canopyLight, spec.length, spec.width, 0.42, {
      x: spec.x, y: spec.y, z: spec.z, yaw: spec.yaw, pitch: -0.08, roll: spec.roll,
    }, false);
  }
  for (const [x, side] of [[-4.2, 1], [4.0, -1]] as const) {
    const branch = new Mesh(new TubeGeometry(new CatmullRomCurve3([
      new Vector3(x, -1.8, 4.0), new Vector3(x + side * 0.25, 0.3, 4.35),
      new Vector3(x + side * 0.7, 2.2, 4.8), new Vector3(x + side * 1.1, 3.5, 5.0),
    ]), 18, 0.075, 7, false), canopyStem);
    branch.castShadow = true;
    canopy.add(branch);
    for (let leaf = 0; leaf < 5; leaf++) {
      const level = leaf * 0.68 - 0.2;
      addLeaf(canopy, leaf % 2 === 0 ? canopyLight : canopyLeaf, 1.65 + (leaf % 3) * 0.28, 0.43 + (leaf % 2) * 0.12, 0.3, {
        x: x + side * (0.14 + leaf * 0.13), y: -0.65 + level, z: 4.1 + leaf * 0.13,
        yaw: side * (0.8 + (leaf % 3) * 0.32), pitch: -0.62 + (leaf % 2) * 0.15, roll: side * 0.08,
      }, false);
    }
  }
  root.add(canopy);

  const climbers = new Group();
  const vineStem = new MeshStandardMaterial({ color: '#4d6845', roughness: 0.96 });
  for (const [index, x] of [-4.8, -3.0, 0.5, 3.9, 5.15].entries()) {
    const random = randomStream(`climber-${index}`);
    const points = Array.from({ length: 7 }, (_, point) => new Vector3(
      x + Math.sin(point * 1.1 + index) * (0.15 + point * 0.045),
      -1.8 + point * 0.66,
      -6.12 + Math.sin(point * 0.8) * 0.045,
    ));
    const stem = new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 32, 0.025, 5, false), vineStem);
    stem.castShadow = true;
    climbers.add(stem);
    for (let leaf = 0; leaf < 11; leaf++) {
      const point = points[1 + Math.floor(leaf * 5 / 10)];
      addLeaf(climbers, leaf % 3 === 0 ? canopyLight : canopyLeaf, 0.78 + random() * 0.34, 0.27 + random() * 0.09, 0.18, {
        x: point.x + (leaf % 2 === 0 ? -0.2 : 0.2), y: point.y + (leaf % 2) * 0.16,
        z: point.z - 0.05, yaw: leaf % 2 === 0 ? -0.7 : 0.7, pitch: -0.18, roll: (random() - 0.5) * 0.3,
      }, false);
    }
  }
  const wallPlants = new Group();
  for (const [index, x] of [-4.6, -1.9, 1.7, 4.25].entries()) {
    const random = randomStream(`wall-plant-${index}`);
    for (let leaf = 0; leaf < 3; leaf++) {
      const side = leaf % 2 === 0 ? -1 : 1;
      addLeaf(wallPlants, leaf % 2 === 0 ? canopyLight : canopyLeaf, 1.35 + random() * 0.38, 0.46 + random() * 0.12, 0.25, {
        x: x + side * (0.2 + random() * 0.25), y: -0.1 + leaf * 0.62, z: -5.65,
        yaw: side * (0.58 + random() * 0.55), pitch: -0.5 + random() * 0.23, roll: side * 0.1,
      }, false);
    }
  }
  root.add(wallPlants);
  root.add(climbers);

  const shrubs = new Group();
  const shrubRandom = randomStream('shrubs');
  for (const [x, z] of [[-2.4, -1.6], [1.55, -2.2], [3.1, -0.8]] as const) {
    for (let leaf = 0; leaf < 4; leaf++) {
      addLeaf(shrubs, leaf % 2 === 0 ? sunLeaf : shadeLeaf, 0.95, 0.3, 0.42, {
        x: x + (shrubRandom() - 0.5) * 0.45,
        y: -1.85 + leaf * 0.08,
        z: z + (shrubRandom() - 0.5) * 0.35,
        yaw: shrubRandom() * Math.PI * 2,
        pitch: -0.55 - shrubRandom() * 0.5,
      }, false);
    }
  }
  root.add(shrubs);

  const garden = new Group();
  const bedRandom = randomStream('garden-leaves');
  const leafGeometry = curvedLeafGeometry(0.7, 0.18, 0.22, 0.03);
  const bedLeaves = new InstancedMesh(leafGeometry, shadeLeaf, 42);
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  const beds = [
    { x: -2.4, z: -0.4, spread: 1.5 },
    { x: -0.2, z: -2.2, spread: 1.3 },
    { x: 2.6, z: -0.6, spread: 1.4 },
    { x: 1.1, z: 1.8, spread: 0.8 },
  ];
  for (let index = 0; index < 42; index++) {
    const bed = beds[index % beds.length];
    const yaw = bedRandom() * Math.PI * 2;
    quaternion.setFromEuler(new Euler(-0.4 - bedRandom() * 0.8, yaw, (bedRandom() - 0.5) * 0.4));
    const size = 0.85 + bedRandom() * 0.9;
    scale.setScalar(size);
    matrix.compose(
      new Vector3(bed.x + (bedRandom() - 0.5) * bed.spread, -2.05 + bedRandom() * 0.15, bed.z + (bedRandom() - 0.5) * bed.spread),
      quaternion,
      scale,
    );
    bedLeaves.setMatrixAt(index, matrix);
  }
  bedLeaves.receiveShadow = true;
  garden.add(bedLeaves);
  for (let index = 0; index < 10; index++) {
    const side = index < 6 ? -1 : 1;
    plantSpike(
      garden,
      randomStream(`spike-${index}`),
      new Vector3(FLOWER_BED.x + side * (0.7 + (index % 3) * 0.35), -2.15, FLOWER_BED.z - 0.4 - (index % 4) * 0.45),
      0.95 + (index % 3) * 0.2,
    );
  }
  const smallFlower = new MeshStandardMaterial({ color: '#e0b03a', roughness: 0.7, side: DoubleSide });
  const smallDisk = new MeshStandardMaterial({ color: '#3a2918', roughness: 1 });
  for (const [x, z, spin] of [[-2.15, -1.35, 0.4], [0.15, -2.55, 1.1]] as const) {
    const bloom = new Group();
    bloom.position.set(x, -2.15, z);
    bloom.rotation.y = spin;
    const head = new Mesh(new IcosahedronGeometry(0.16, 1), smallDisk);
    head.position.y = 0.95;
    bloom.add(head);
    for (let petal = 0; petal < 8; petal++) {
      const angle = petal / 8 * Math.PI * 2;
      const ray = new Mesh(new PlaneGeometry(0.16, 0.42), smallFlower);
      ray.position.set(Math.cos(angle) * 0.28, 0.95, Math.sin(angle) * 0.28);
      ray.rotation.set(-0.7, -angle, 0);
      bloom.add(ray);
    }
    const stalk = new Mesh(new BoxGeometry(0.03, 0.95, 0.03), sageSproutMat);
    stalk.position.y = 0.45;
    bloom.add(stalk);
    garden.add(bloom);
  }
  root.add(garden);

  const soilY = POT.rimTop - POT.soilDrop;
  const soilRadius = 1.025;
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const rings = 8;
  const segments = 48;
  for (let ring = 0; ring <= rings; ring++) {
    const radius = soilRadius * ring / rings;
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push(x, soilY + 0.035 * (1 - radius * radius / (soilRadius * soilRadius)), z);
      uvs.push(x / (2 * soilRadius) + 0.5, z / (2 * soilRadius) + 0.5);
    }
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const next = (segment + 1) % segments;
      const a = ring * segments + segment;
      const b = ring * segments + next;
      const c = (ring + 1) * segments + segment;
      const d = (ring + 1) * segments + next;
      indices.push(a, b, c, b, d, c);
    }
  }
  const soilGeometry = new BufferGeometry();
  soilGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  soilGeometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  soilGeometry.setIndex(indices);
  soilGeometry.computeVertexNormals();
  const soil = new Mesh(soilGeometry, surfaceMaterial('soil'));
  soil.position.set(FLOWER_BED.x, 0, FLOWER_BED.z);
  soil.receiveShadow = true;
  root.add(soil);

  const random = randomStream('soil-clods');
  const clods = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshStandardMaterial({ color: '#4a392a', roughness: 1, vertexColors: true }), 90);
  for (let index = 0; index < 90; index++) {
    const radius = soilRadius * 0.94 * Math.sqrt(random());
    const angle = Math.PI * 2 * random();
    const size = 0.015 + random() * 0.035;
    quaternion.setFromEuler(new Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI));
    scale.set(size, size * (0.6 + random() * 0.5), size);
    matrix.compose(new Vector3(FLOWER_BED.x + Math.cos(angle) * radius, soilY + size * 0.4, FLOWER_BED.z + Math.sin(angle) * radius), quaternion, scale);
    clods.setMatrixAt(index, matrix);
    clods.setColorAt(index, new Color('#4a392a').offsetHSL(0, 0, (random() - 0.5) * 0.18));
  }
  clods.castShadow = true;
  root.add(clods);

  return {
    root,
    setSway(amount: number) {
      leftFrame.rotation.z = amount * 0.04;
      leftFrame.rotation.x = amount * 0.02;
      rightFrame.rotation.z = amount * -0.035;
      tileSprout.rotation.z = amount * 0.06;
    },
  };
}
