import {
  BoxGeometry, BufferGeometry, Color, Euler, Float32BufferAttribute, Group,
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
const GARDEN_LEAF = { rings: 48, segments: 32 };
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

/** Places a shared modeled blade; `lift` raises the tip, then `yaw` turns the blade about the vertical. */
function addBroadLeaf(parent: Group, blade: Mesh, scale: number, pose: { x: number; y: number; z: number; yaw: number; lift: number; pitch?: number; faceCamera?: boolean }, cast = true): void {
  const leaf = blade.clone();
  leaf.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = cast && child.userData.hair !== true;
    child.receiveShadow = true;
  });
  const holder = new Group();
  holder.add(leaf);
  holder.position.set(pose.x, pose.y, pose.z);
  if (pose.faceCamera) {
    const tip = new Vector3(Math.sin(pose.lift), Math.cos(pose.lift), 0).normalize();
    const face = new Vector3(0, 0, 1);
    const across = new Vector3().crossVectors(face, tip).normalize();
    leaf.rotation.setFromRotationMatrix(new Matrix4().makeBasis(tip, across, face));
  } else {
    holder.rotation.set(pose.pitch ?? 0, pose.yaw, pose.lift);
  }
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

  const broadLeaves = [
    createBroadLeaf(randomStream('foreground-leaf-a'), FOREGROUND_HAIR_DENSITY),
    createBroadLeaf(randomStream('foreground-leaf-b'), FOREGROUND_HAIR_DENSITY),
  ];
  const leftFrame = new Group();
  leftFrame.position.set(-2.75, -1.05, 5.5);
  addBroadLeaf(leftFrame, broadLeaves[0], 8.5, { x: 0, y: 0, z: 0, yaw: 0.3, lift: 0.3 });
  addBroadLeaf(leftFrame, broadLeaves[1], 12, { x: 0.25, y: -0.3, z: 0.55, yaw: -0.1, lift: 0.22 });
  root.add(leftFrame);

  const rightFrame = new Group();
  rightFrame.position.set(3.2, -0.75, 5.5);
  addBroadLeaf(rightFrame, broadLeaves[1], 10, { x: 0, y: 0, z: 0, yaw: Math.PI + 0.25, lift: 0.36 });
  addBroadLeaf(rightFrame, broadLeaves[0], 8, { x: 0.1, y: 0.1, z: -0.45, yaw: Math.PI - 0.35, lift: 0.5 });
  root.add(rightFrame);

  const gardenLeaves = [
    createBroadLeaf(randomStream('garden-leaf-a'), 0, GARDEN_LEAF),
    createBroadLeaf(randomStream('garden-leaf-b'), 0, GARDEN_LEAF),
  ];
  const canopy = new Group();
  const canopyLeaves = [
    { blade: 0, scale: 19, x: 6.4, y: 3.05, z: 6.3, yaw: Math.PI - 0.4, lift: 0.68 },
    { blade: 1, scale: 15, x: 3.8, y: 3.6, z: 5.5, yaw: Math.PI - 0.9, lift: 0.45 },
  ] as const;
  for (const leaf of canopyLeaves) {
    addBroadLeaf(canopy, gardenLeaves[leaf.blade], leaf.scale, leaf, false);
  }
  root.add(canopy);

  const wallGarden = new Group();
  const wallRandom = randomStream('wall-garden');
  const wallColumns = [-5.7, -4.8, -3.9, -3.0, -2.1, -1.2, -0.3, 0.6, 1.5, 2.5, 3.4, 4.3, 5.2];
  const wallRows = [-1.2, -0.4, 0.4, 1.15, 1.85, 2.45];
  wallRows.forEach((row, rowIndex) => {
    wallColumns.forEach((column) => {
      const x = column + (rowIndex % 2) * 0.42;
      const coversWindow = x > 2.25 && x < 3.2 && row > 0.1 && row < 1.4;
      const coversDoor = x > 0.05 && x < 1.15 && row < 0.95;
      if (coversWindow || coversDoor) return;
      addBroadLeaf(wallGarden, gardenLeaves[wallRandom() > 0.5 ? 0 : 1], 7.2 + wallRandom() * 2.4, {
        x: x + (wallRandom() - 0.5) * 0.18,
        y: row + (wallRandom() - 0.5) * 0.16,
        z: -5.35 - wallRandom() * 0.35,
        yaw: 0,
        lift: (wallRandom() - 0.5) * 1.15,
        faceCamera: true,
      }, false);
    });
  });
  root.add(wallGarden);

  const nearPath = createRepairedPot(terracottaMaterial);
  nearPath.position.set(1.15, -2.2, -1.55);
  nearPath.scale.setScalar(0.72);
  nearPath.rotation.y = 0.6;
  const farPath = createRepairedPot(terracottaMaterial);
  farPath.position.set(-0.85, -2.2, -3.45);
  farPath.scale.setScalar(0.48);
  farPath.rotation.y = -0.8;
  root.add(nearPath, farPath);
  addBroadLeaf(wallGarden, gardenLeaves[0], 5.5, { x: 1.35, y: -1.55, z: -1.2, yaw: -0.8, lift: 0.4, pitch: -0.4 }, false);
  addBroadLeaf(wallGarden, gardenLeaves[1], 4.2, { x: -0.7, y: -1.85, z: -3.1, yaw: 0.9, lift: -0.25, pitch: -0.3 }, false);

  const garden = new Group();
  const groundRandom = randomStream('ground-leaves');
  for (let index = 0; index < 16; index++) {
    const side = index % 2 === 0 ? -1 : 1;
    addBroadLeaf(garden, gardenLeaves[index % 2], 6.2 + groundRandom() * 1.6, {
      x: side * (1.7 + groundRandom() * 0.8),
      y: -1.45,
      z: 1.8 - Math.floor(index / 2) * 0.55,
      yaw: side * (0.4 + groundRandom() * 0.8),
      lift: side * 0.15,
      pitch: -0.95,
    }, false);
  }
  for (const [index, side] of [[0, -1], [1, -1], [2, 1], [3, 1]] as const) {
    plantSpike(
      garden,
      randomStream(`spike-${index}`),
      new Vector3(FLOWER_BED.x + side * (1.15 + index * 0.15), -2.15, FLOWER_BED.z - 1.3 - index * 0.35),
      0.85,
    );
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

  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const scale = new Vector3();
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
      canopy.rotation.z = amount * 0.012;
    },
  };
}
