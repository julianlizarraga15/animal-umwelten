import {
  BoxGeometry, BufferGeometry, Color, Euler, Float32BufferAttribute, Group, IcosahedronGeometry,
  InstancedMesh, LatheGeometry, Matrix4, Mesh, MeshStandardMaterial, PlaneGeometry,
  Quaternion, Vector2, Vector3,
} from 'three';
import {
  colorTexture, mixRgb, randomStream, reliefTexture, rgb, tileableNoise,
  type Field, type Random, type Raster, type Rgb,
} from './procedural';

type Surface = {
  readonly raster: Raster;
  readonly repeat: readonly [number, number];
  readonly roughness: number;
  readonly bumpScale: number;
  fields(random: Random): { readonly albedo: Field<Rgb>; readonly relief: Field<number> };
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
    raster: { width: 512, height: 512 }, repeat: [3.5, 3.5], roughness: 0.96, bumpScale: 0.08,
    fields(random) {
      const noise = tileableNoise(random, 16);
      const grout = rgb('#c8c1b0');
      const clay = rgb('#dfd9ca');
      return {
        albedo: (s, t) => {
          const edge = Math.min(s % 0.25, t % 0.25, 0.25 - s % 0.25, 0.25 - t % 0.25);
          return edge < 0.006 ? grout : mixRgb(clay, rgb('#d5cebd'), noise(s, t) * 0.22);
        },
        relief: (s, t) => Math.min(s % 0.25, t % 0.25, 0.25 - s % 0.25, 0.25 - t % 0.25) < 0.006 ? 0.25 : 0.62,
      };
    },
  },
  plaster: {
    raster: { width: 256, height: 256 }, repeat: [6, 2], roughness: 0.94, bumpScale: 0.06,
    fields: (random) => noisyFields('#ebe5d6', random, 8, 0.05),
  },
  trim: {
    raster: { width: 256, height: 256 }, repeat: [8, 1], roughness: 0.92, bumpScale: 0.05,
    fields: (random) => noisyFields('#ccc4b4', random, 8, 0.05),
  },
  terracotta: {
    raster: { width: 256, height: 256 }, repeat: [3, 1], roughness: 0.88, bumpScale: 0.08,
    fields(random) {
      const noise = tileableNoise(random, 8);
      const base = rgb('#b86846');
      return {
        albedo: (s, t) => {
          let shade = 0.9 + noise(s, t) * 0.17 + Math.sin(t * Math.PI * 44) * 0.018;
          shade *= t > lipT ? 0.62 - 0.17 * ((t - lipT) / (1 - lipT)) : 1;
          return [base[0] * shade, base[1] * shade, base[2] * shade];
        },
        relief: (s, t) => 0.45 + noise(s, t) * 0.25 + Math.sin(t * Math.PI * 44) * 0.08,
      };
    },
  },
  soil: {
    raster: { width: 128, height: 128 }, repeat: [3, 3], roughness: 1, bumpScale: 0.16,
    fields: (random) => noisyFields('#4a3b2c', random, 32, 0.45),
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

export function createPatio(): Group {
  const root = new Group();

  const floorMaterial = surfaceMaterial('tile');
  const floor = new Mesh(new PlaneGeometry(20, 20), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(2, -2.2, 2);
  floor.receiveShadow = true;
  root.add(floor);

  const wallMaterial = surfaceMaterial('plaster');
  const trimMaterial = surfaceMaterial('trim');

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
  const pot = new Mesh(new LatheGeometry(profile, 64), surfaceMaterial('terracotta'));
  pot.castShadow = true;
  pot.receiveShadow = true;
  root.add(pot);

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
  const clods = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshStandardMaterial({ color: '#4a3b2c', roughness: 1, vertexColors: true }), 90);
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
    clods.setColorAt(index, new Color('#4a3b2c').offsetHSL(0, 0, (random() - 0.5) * 0.18));
  }
  clods.castShadow = true;
  root.add(clods);

  return root;
}
