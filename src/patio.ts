import {
  BoxGeometry, BufferGeometry, Color, DoubleSide, Euler, Float32BufferAttribute, Group,
  IcosahedronGeometry, InstancedMesh, LatheGeometry, Matrix4, Mesh, MeshStandardMaterial,
  PlaneGeometry, Quaternion, TorusGeometry, TubeGeometry, CatmullRomCurve3, Vector2, Vector3,
} from 'three';
import {
  colorTexture, mixRgb, randomStream, reliefTexture, rgb, smoothstep, tileableNoise,
  type Field, type Random, type Raster, type Rgb, type Rgba,
} from './procedural';

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
    fields: (random) => noisyFields('#4a392a', random, 32, 0.45),
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

export function createPatio(): PatioScene {
  const root = new Group();

  const floorMaterial = surfaceMaterial('tile');
  const floor = new Mesh(new PlaneGeometry(20, 20), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(2, -2.2, 2);
  floor.receiveShadow = true;
  root.add(floor);

  const wallMaterial = surfaceMaterial('plaster');
  const trimMaterial = surfaceMaterial('trim');
  const terracottaMaterial = surfaceMaterial('terracotta');
  const sageForegroundMat = new MeshStandardMaterial({ color: '#6b825d', roughness: 0.88, side: DoubleSide });
  const sageSproutMat = new MeshStandardMaterial({ color: '#758b64', roughness: 0.9, side: DoubleSide });

  const backWall = new Mesh(new BoxGeometry(15.4, 5.4, 0.4), wallMaterial);
  backWall.position.set(3.5, 0.5, -4.0);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  root.add(backWall);

  const sideWall = new Mesh(new BoxGeometry(0.4, 5.4, 15.4), wallMaterial);
  sideWall.position.set(-4.0, 0.5, 3.5);
  sideWall.castShadow = true;
  sideWall.receiveShadow = true;
  root.add(sideWall);

  // Subtle water stain on the back plaster wall near the shaded corner
  const stainMat = surfaceMaterial('waterStain');
  stainMat.transparent = true;
  stainMat.depthWrite = false;
  const wallStain = new Mesh(new PlaneGeometry(2.1, 2.2), stainMat);
  wallStain.position.set(-1.55, -0.95, -3.79);
  wallStain.receiveShadow = true;
  root.add(wallStain);

  const backPlinth = new Mesh(new BoxGeometry(15.2, 0.36, 0.48), trimMaterial);
  backPlinth.position.set(3.5, -2.02, -3.98);
  backPlinth.receiveShadow = true;
  root.add(backPlinth);

  const sidePlinth = new Mesh(new BoxGeometry(0.48, 0.36, 15.2), trimMaterial);
  sidePlinth.position.set(-3.98, -2.02, 3.5);
  sidePlinth.receiveShadow = true;
  root.add(sidePlinth);

  const backCoping = new Mesh(new BoxGeometry(15.5, 0.2, 0.56), trimMaterial);
  backCoping.position.set(3.5, 3.28, -4.0);
  backCoping.castShadow = true;
  root.add(backCoping);

  const sideCoping = new Mesh(new BoxGeometry(0.56, 0.2, 15.5), trimMaterial);
  sideCoping.position.set(-4.0, 3.28, 3.5);
  sideCoping.castShadow = true;
  root.add(sideCoping);

  const profile = [...POT.outer, ...POT.inner].map(([radius, y]) => new Vector2(radius, y));
  const pot = new Mesh(new LatheGeometry(profile, 64), terracottaMaterial);
  pot.castShadow = true;
  pot.receiveShadow = true;
  root.add(pot);

  // Repaired companion pot in the shaded left corner
  const repairedPot = createRepairedPot(terracottaMaterial);
  repairedPot.position.set(-2.55, -2.2, 0.45);
  repairedPot.scale.setScalar(1.25);
  repairedPot.rotation.y = 0.65;
  root.add(repairedPot);

  // Plant sprouting between tiles in the sunlit midground
  const tileSprout = createTileSprout(sageSproutMat);
  tileSprout.position.set(2.35, -2.19, 0.15);
  tileSprout.scale.setScalar(1.35);
  root.add(tileSprout);

  // Broad curved foreground leaf framing the lower-left edge without blocking targets
  const fgLeafGroup = new Group();
  fgLeafGroup.position.set(1.15, -0.62, 3.65);
  fgLeafGroup.rotation.set(0.28, 2.38, -0.22);
  const fgLeaf = new Mesh(curvedLeafGeometry(1.22, 0.27, 0.36, 0.045), sageForegroundMat);
  fgLeaf.castShadow = true;
  fgLeaf.receiveShadow = true;
  fgLeafGroup.add(fgLeaf);

  const fgLeafSecondary = new Mesh(curvedLeafGeometry(0.92, 0.21, 0.28, 0.03), sageForegroundMat);
  fgLeafSecondary.rotation.set(0.08, -0.42, 0.14);
  fgLeafSecondary.castShadow = true;
  fgLeafGroup.add(fgLeafSecondary);
  root.add(fgLeafGroup);

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
  soil.receiveShadow = true;
  root.add(soil);

  const random = randomStream('soil-clods');
  const clods = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshStandardMaterial({ color: '#4a392a', roughness: 1, vertexColors: true }), 90);
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  for (let index = 0; index < 90; index++) {
    const radius = soilRadius * 0.94 * Math.sqrt(random());
    const angle = Math.PI * 2 * random();
    const size = 0.015 + random() * 0.035;
    quaternion.setFromEuler(new Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI));
    scale.set(size, size * (0.6 + random() * 0.5), size);
    matrix.compose(new Vector3(Math.cos(angle) * radius, soilY + size * 0.4, Math.sin(angle) * radius), quaternion, scale);
    clods.setMatrixAt(index, matrix);
    clods.setColorAt(index, new Color('#4a392a').offsetHSL(0, 0, (random() - 0.5) * 0.18));
  }
  clods.castShadow = true;
  root.add(clods);

  return {
    root,
    setSway(amount: number) {
      fgLeafGroup.rotation.z = -0.14 + amount * 0.045;
      fgLeafGroup.rotation.x = 0.18 + amount * 0.025;
      tileSprout.rotation.z = amount * 0.06;
    },
  };
}
