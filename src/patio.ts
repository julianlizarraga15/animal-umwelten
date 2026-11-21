import {
  BoxGeometry, BufferGeometry, CircleGeometry, Color, Euler, Float32BufferAttribute, Group,
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

/** Courtyard soil. Side walls run past both opening cameras so the floor does not end in open space. */
const FLOOR_Y = -2.2;
const COURTYARD = { x0: -4.55, x1: 4.9, z0: -4.6, z1: 16.4, top: 3.9 };
const SOIL_Y = FLOOR_Y + 0.1;
const WALL_T = 0.46;
/** Local height of the small pot lip after the profile is shifted onto the floor. */
const REPAIRED_POT = { rimY: 0.754, soilRadius: 0.4 };

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
    floret.scale.set(0.72, 1.28, 0.72);
    floret.position.set((random() - 0.5) * 0.08, 0.35 + i * 0.09, (random() - 0.5) * 0.08);
    group.add(floret);
  }
  group.position.copy(origin);
  group.scale.setScalar(scale);
  parent.add(group);
}

type CaneLeaf = { t: number; scale: number; yaw: number; lift: number; pitch?: number };

/** A stem through world-space points, with blades whose bases sit on that stem. */
function growCane(
  parent: Group,
  material: MeshStandardMaterial,
  blades: readonly Mesh[],
  points: readonly (readonly [number, number, number])[],
  leaves: readonly CaneLeaf[],
  radius = 0.016,
): void {
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
  const stem = new Mesh(new TubeGeometry(curve, 24, radius, 5, false), material);
  stem.castShadow = true;
  stem.receiveShadow = true;
  parent.add(stem);
  leaves.forEach((leaf, index) => {
    const node = curve.getPoint(leaf.t);
    addBroadLeaf(parent, blades[index % blades.length], leaf.scale, {
      x: node.x,
      y: node.y,
      z: node.z,
      yaw: leaf.yaw,
      lift: leaf.lift,
      pitch: leaf.pitch ?? -0.35,
    }, false);
  });
}

export function createPatio(): PatioScene {
  const root = new Group();

  const bedMaterial = surfaceMaterial('path');
  bedMaterial.roughness = 0.96;
  bedMaterial.map?.repeat.set(9, 18);
  bedMaterial.bumpMap?.repeat.set(9, 18);
  const floorSpan = {
    x: (COURTYARD.x0 + COURTYARD.x1) / 2,
    z: (COURTYARD.z0 - WALL_T / 2 + COURTYARD.z1) / 2,
    width: COURTYARD.x1 - COURTYARD.x0 + WALL_T,
    depth: COURTYARD.z1 - COURTYARD.z0 + WALL_T,
  };
  const floor = new Mesh(new PlaneGeometry(floorSpan.width, floorSpan.depth), bedMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(floorSpan.x, FLOOR_Y, floorSpan.z);
  floor.receiveShadow = true;
  root.add(floor);
  const gardenSoil = surfaceMaterial('soil');
  gardenSoil.roughness = 1;
  const addBed = (x: number, z: number, width: number, depth: number): void => {
    const bed = new Mesh(new BoxGeometry(width, 0.14, depth), gardenSoil);
    bed.position.set(x, FLOOR_Y + 0.07, z);
    bed.receiveShadow = true;
    bed.castShadow = true;
    root.add(bed);
  };
  addBed(-3.5, 3.6, 2.1, 16.4);
  addBed(4.05, 3.6, 1.7, 16.4);
  addBed(-2.6, -3.85, 3.7, 1.35);
  addBed(3.25, -3.85, 3.1, 1.35);
  const flowerBed = new Mesh(new CircleGeometry(2.05, 40), gardenSoil);
  flowerBed.rotation.x = -Math.PI / 2;
  flowerBed.position.set(FLOWER_BED.x, SOIL_Y, FLOWER_BED.z);
  flowerBed.receiveShadow = true;
  root.add(flowerBed);
  const webBed = new Mesh(new CircleGeometry(1.25, 32), gardenSoil);
  webBed.rotation.x = -Math.PI / 2;
  webBed.position.set(WEB_CENTER.x + 0.2, SOIL_Y, WEB_CENTER.z + 0.35);
  webBed.receiveShadow = true;
  root.add(webBed);

  const wallMaterial = surfaceMaterial('plaster');
  wallMaterial.map?.repeat.set(6, 4);
  wallMaterial.bumpMap?.repeat.set(6, 4);
  const trimMaterial = surfaceMaterial('trim');
  const terracottaMaterial = surfaceMaterial('terracotta');

  const house = new Group();
  const wallHeight = COURTYARD.top - FLOOR_Y;
  const wallCenterY = (COURTYARD.top + FLOOR_Y) / 2;
  const courtCenterX = (COURTYARD.x0 + COURTYARD.x1) / 2;
  const sideDepth = COURTYARD.z1 - COURTYARD.z0;
  const sideCenterZ = (COURTYARD.z0 + COURTYARD.z1) / 2;
  const backWall = new Mesh(new BoxGeometry(COURTYARD.x1 - COURTYARD.x0 + WALL_T * 2, wallHeight, WALL_T), wallMaterial);
  backWall.position.set(courtCenterX, wallCenterY, COURTYARD.z0 - WALL_T / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  house.add(backWall);
  const leftWall = new Mesh(new BoxGeometry(WALL_T, wallHeight, sideDepth), wallMaterial);
  leftWall.position.set(COURTYARD.x0 - WALL_T / 2, wallCenterY, sideCenterZ);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  const rightWall = new Mesh(new BoxGeometry(WALL_T, wallHeight, sideDepth), wallMaterial);
  rightWall.position.set(COURTYARD.x1 + WALL_T / 2, wallCenterY, sideCenterZ);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  house.add(leftWall, rightWall);
  const openingZ = COURTYARD.z0 + 0.06;
  const arch = new Mesh(new BoxGeometry(2.05, 3.05, 0.2), new MeshStandardMaterial({ color: '#6a4638', roughness: 1 }));
  arch.position.set(0.45, -0.62, openingZ);
  house.add(arch);
  const windowFrame = new Mesh(new BoxGeometry(1.28, 1.62, 0.12), trimMaterial);
  windowFrame.position.set(2.65, 0.82, openingZ);
  house.add(windowFrame);
  const windowGlass = new Mesh(new PlaneGeometry(0.92, 1.22), new MeshStandardMaterial({
    color: '#f3c98a',
    emissive: '#e7a15a',
    emissiveIntensity: 0.55,
    roughness: 0.35,
  }));
  windowGlass.position.set(2.65, 0.82, openingZ + 0.22);
  house.add(windowGlass);
  const mullionV = new Mesh(new BoxGeometry(0.045, 1.22, 0.04), trimMaterial);
  mullionV.position.set(2.65, 0.82, openingZ + 0.26);
  const mullionH = new Mesh(new BoxGeometry(0.92, 0.045, 0.04), trimMaterial);
  mullionH.position.set(2.65, 0.82, openingZ + 0.26);
  house.add(mullionV, mullionH);
  const copingY = COURTYARD.top + 0.08;
  const backCoping = new Mesh(new BoxGeometry(COURTYARD.x1 - COURTYARD.x0 + WALL_T * 2 + 0.12, 0.16, 0.64), trimMaterial);
  backCoping.position.set(courtCenterX, copingY, COURTYARD.z0 - WALL_T / 2);
  backCoping.castShadow = true;
  const leftCoping = new Mesh(new BoxGeometry(0.64, 0.16, sideDepth), trimMaterial);
  leftCoping.position.set(COURTYARD.x0 - WALL_T / 2, copingY, sideCenterZ);
  leftCoping.castShadow = true;
  const rightCoping = new Mesh(new BoxGeometry(0.64, 0.16, sideDepth), trimMaterial);
  rightCoping.position.set(COURTYARD.x1 + WALL_T / 2, copingY, sideCenterZ);
  rightCoping.castShadow = true;
  house.add(backCoping, leftCoping, rightCoping);
  const plinthY = FLOOR_Y + 0.14;
  const backPlinth = new Mesh(new BoxGeometry(COURTYARD.x1 - COURTYARD.x0, 0.28, 0.42), trimMaterial);
  backPlinth.position.set(courtCenterX, plinthY, COURTYARD.z0 + 0.12);
  backPlinth.receiveShadow = true;
  const leftPlinth = new Mesh(new BoxGeometry(0.36, 0.28, sideDepth - 0.2), trimMaterial);
  leftPlinth.position.set(COURTYARD.x0 + 0.16, plinthY, sideCenterZ + 0.1);
  leftPlinth.receiveShadow = true;
  const rightPlinth = new Mesh(new BoxGeometry(0.36, 0.28, sideDepth - 0.2), trimMaterial);
  rightPlinth.position.set(COURTYARD.x1 - 0.16, plinthY, sideCenterZ + 0.1);
  rightPlinth.receiveShadow = true;
  house.add(backPlinth, leftPlinth, rightPlinth);
  const stainMat = surfaceMaterial('waterStain');
  stainMat.transparent = true;
  stainMat.depthWrite = false;
  const wallStain = new Mesh(new PlaneGeometry(1.6, 1.8), stainMat);
  wallStain.position.set(-1.55, -0.55, openingZ);
  house.add(wallStain);
  root.add(house);

  const profile = [...POT.outer, ...POT.inner].map(([radius, y]) => new Vector2(radius, y));
  const pot = new Mesh(new LatheGeometry(profile, 48), terracottaMaterial);
  pot.castShadow = true;
  pot.receiveShadow = true;
  pot.position.copy(FLOWER_BED);
  root.add(pot);

  const broadLeaves = [
    createBroadLeaf(randomStream('foreground-leaf-a'), FOREGROUND_HAIR_DENSITY),
    createBroadLeaf(randomStream('foreground-leaf-b'), FOREGROUND_HAIR_DENSITY),
  ];
  const gardenLeaves = [
    createBroadLeaf(randomStream('garden-leaf-a'), 0, GARDEN_LEAF),
    createBroadLeaf(randomStream('garden-leaf-b'), 0, GARDEN_LEAF),
  ];
  const vineMaterial = new MeshStandardMaterial({ color: '#536947', roughness: 1 });
  const potSoil = surfaceMaterial('soil');
  const fan = (yaw: number, count = 5): CaneLeaf[] => Array.from({ length: count }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    return {
      t: 0.14 + index * (0.78 / (count - 1)),
      scale: 6.4 + (index % 3) * 0.8,
      yaw: yaw + side * 0.65,
      lift: side * 0.55,
      pitch: -1.05,
    };
  });
  const seatPot = (x: number, z: number, scale: number, yaw: number): Vector3 => {
    const planted = createRepairedPot(terracottaMaterial);
    planted.position.set(x, FLOOR_Y, z);
    planted.scale.setScalar(scale);
    planted.rotation.y = yaw;
    root.add(planted);
    const rim = new Vector3(x, FLOOR_Y + REPAIRED_POT.rimY * scale, z);
    const disk = new Mesh(new CircleGeometry(REPAIRED_POT.soilRadius * scale, 28), potSoil);
    disk.rotation.x = -Math.PI / 2;
    disk.position.set(x, rim.y - 0.04 * scale, z);
    disk.receiveShadow = true;
    root.add(disk);
    return rim;
  };
  const potCane = (rim: Vector3, height: number, leanX: number, leanZ: number, yaw: number, scale: number): void => {
    growCane(root, vineMaterial, gardenLeaves, [
      [rim.x, rim.y - 0.02, rim.z],
      [rim.x + leanX * 0.4, rim.y + height * 0.55, rim.z + leanZ * 0.4],
      [rim.x + leanX, rim.y + height, rim.z + leanZ],
    ], [
      { t: 0.48, scale, yaw: yaw - 0.7, lift: 0.4, pitch: -0.5 },
      { t: 0.74, scale: scale * 1.08, yaw: yaw + 0.65, lift: -0.22, pitch: -0.45 },
      { t: 0.96, scale: scale * 0.92, yaw, lift: 0.5, pitch: -0.2 },
    ], 0.011);
  };

  const vineZ = COURTYARD.z0 + 0.12;
  for (const vine of [
    { x: -3.55, bends: [-0.18, 0.22, -0.1], yaw: 0.35 },
    { x: -1.65, bends: [-0.2, -0.28, -0.08], yaw: 0.15 },
    { x: 1.78, bends: [0.14, 0.24, 0.08], yaw: -0.15 },
    { x: 4.05, bends: [0.1, -0.18, 0.14], yaw: -0.3 },
  ]) {
    growCane(root, vineMaterial, gardenLeaves, [
      [vine.x, SOIL_Y, vineZ],
      [vine.x + vine.bends[0], -1.05, vineZ + 0.14],
      [vine.x + vine.bends[1], 0.05, vineZ + 0.2],
      [vine.x + vine.bends[2], 1.15, vineZ + 0.12],
    ], fan(vine.yaw, 5), 0.022);
  }
  for (const vine of [
    { x: -4.28, z: -3.2, yaw: 1.1 },
    { x: -4.32, z: -1.15, yaw: 1.0 },
    { x: -4.26, z: 0.85, yaw: 0.95 },
    { x: -4.3, z: 2.7, yaw: 0.85 },
    { x: -4.24, z: 4.7, yaw: 0.75 },
    { x: -4.2, z: 7.3, yaw: 0.7 },
    { x: -4.18, z: 9.6, yaw: 0.62 },
    { x: -4.16, z: 11.8, yaw: 0.55 },
    { x: 4.66, z: -3.0, yaw: -1.05 },
    { x: 4.7, z: -0.7, yaw: -0.95 },
    { x: 4.64, z: 1.45, yaw: -0.9 },
    { x: 4.68, z: 3.3, yaw: -0.8 },
    { x: 4.62, z: 5.05, yaw: -0.7 },
    { x: 4.58, z: 7.5, yaw: -0.62 },
    { x: 4.56, z: 9.8, yaw: -0.55 },
    { x: 4.54, z: 12.0, yaw: -0.5 },
  ]) {
    const intoCourt = Math.sign(vine.yaw);
    growCane(root, vineMaterial, gardenLeaves, [
      [vine.x, SOIL_Y, vine.z],
      [vine.x + intoCourt * 0.22, -0.85, vine.z + 0.1],
      [vine.x + intoCourt * 0.3, 0.35, vine.z],
      [vine.x + intoCourt * 0.16, 1.45, vine.z - 0.04],
      [vine.x + intoCourt * 0.08, 2.45, vine.z + 0.06],
    ], fan(vine.yaw, 6).map((leaf) => ({ ...leaf, scale: leaf.scale + 1.6 })), 0.026);
  }
  for (const bed of [
    { x: -3.75, z: -3.5, lean: 0.34, yaw: 0.55 },
    { x: -3.55, z: -1.35, lean: 0.26, yaw: 0.4 },
    { x: -3.8, z: 0.75, lean: 0.3, yaw: 0.5 },
    { x: -3.5, z: 2.85, lean: 0.22, yaw: 0.7 },
    { x: -3.65, z: 4.75, lean: 0.16, yaw: 0.85 },
    { x: 3.95, z: -3.2, lean: -0.3, yaw: -0.55 },
    { x: 4.1, z: -1.05, lean: -0.22, yaw: -0.4 },
    { x: 3.85, z: 1.7, lean: -0.28, yaw: -0.5 },
    { x: 4.05, z: 3.45, lean: -0.18, yaw: -0.7 },
    { x: 3.9, z: 5.05, lean: -0.14, yaw: -0.85 },
  ]) {
    growCane(root, vineMaterial, gardenLeaves, [
      [bed.x, SOIL_Y, bed.z],
      [bed.x + bed.lean * 0.45, -1.35, bed.z + 0.05],
      [bed.x + bed.lean, -0.72, bed.z + 0.1],
    ], [
      { t: 0.58, scale: 5.4, yaw: bed.yaw, lift: 0.45, pitch: -0.85 },
      { t: 0.82, scale: 6.6, yaw: bed.yaw + 0.7, lift: -0.1, pitch: -1.05 },
      { t: 0.97, scale: 5.8, yaw: bed.yaw - 0.45, lift: 0.2, pitch: -0.7 },
    ], 0.014);
  }
  for (const clump of [
    { x: -2.45, z: -1.05, yaw: 0.4 },
    { x: -2.6, z: 1.25, yaw: 0.9 },
    { x: -2.2, z: -2.55, yaw: 0.2 },
    { x: 3.9, z: -3.55, yaw: -0.4 },
    { x: -3.85, z: -3.65, yaw: 0.5 },
  ]) {
    growCane(root, vineMaterial, gardenLeaves, [
      [clump.x, SOIL_Y, clump.z],
      [clump.x + 0.08, -1.35, clump.z + 0.06],
      [clump.x - 0.04, -0.55, clump.z - 0.02],
    ], fan(clump.yaw, 3).map((leaf) => ({ ...leaf, scale: leaf.scale + 0.4 })), 0.014);
  }

  const webRim = seatPot(WEB_CENTER.x + 0.35, WEB_CENTER.z + 0.85, 1.35, -0.4);
  potCane(webRim, 0.48, 0.1, 0.18, -0.5, 2.3);
  const leftRim = seatPot(-3.05, 5.35, 2.05, 0.5);
  const rightRim = seatPot(3.22, 4.95, 1.9, -0.65);
  potCane(leftRim, 0.42, 0.16, -0.12, 0.7, 3.1);
  potCane(rightRim, 0.4, -0.14, -0.1, -0.8, 2.9);
  potCane(seatPot(2.35, -2.55, 0.7, 0.45), 0.55, 0.06, 0.08, 0.3, 2.6);
  potCane(seatPot(-2.2, -3.6, 0.58, -0.4), 0.46, -0.05, 0.06, -0.2, 2.2);

  const leftFrame = new Group();
  leftFrame.position.copy(leftRim);
  addBroadLeaf(leftFrame, broadLeaves[0], 8.4, { x: 0.02, y: 0.05, z: 0, yaw: 0.62, lift: 0.7, pitch: -0.12 });
  addBroadLeaf(leftFrame, gardenLeaves[0], 6.2, { x: -0.08, y: 0.02, z: 0.05, yaw: 1.25, lift: 0.15, pitch: -0.55 });
  root.add(leftFrame);
  const rightFrame = new Group();
  rightFrame.position.copy(rightRim);
  addBroadLeaf(rightFrame, broadLeaves[1], 7.8, { x: 0.02, y: 0.04, z: 0, yaw: Math.PI - 0.28, lift: 0.64, pitch: -0.1 });
  addBroadLeaf(rightFrame, gardenLeaves[1], 5.8, { x: 0.06, y: 0.02, z: -0.04, yaw: Math.PI + 0.55, lift: -0.2, pitch: -0.5 });
  root.add(rightFrame);

  const canopy = new Group();
  root.add(canopy);

  for (const [index, spike] of ([
    [-2.55, -0.95],
    [-2.7, 1.15],
    [-3.25, -2.2],
    [3.7, -2.55],
    [-3.9, -2.45],
    [-3.6, 1.85],
    [4.15, -2.15],
    [4.0, 2.15],
  ] as const).entries()) {
    plantSpike(root, randomStream(`spike-${index}`), new Vector3(spike[0], SOIL_Y, spike[1]), 0.9);
  }

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
