import {
  BufferGeometry, CatmullRomCurve3, Color, DodecahedronGeometry, DataTexture, DoubleSide, Float32BufferAttribute,
  FrontSide, Group, InstancedMesh, LatheGeometry, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, SphereGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';
import {
  colorTexture, mixRgb, randomStream, reliefTexture, rgb, smoothstep,
  type Field, type Random, type Raster, type Rgb,
} from './procedural';

export type View = 'human' | 'uv';

type Lamina = {
  surface(along: number, across: number, target: Vector3): Vector3;
  halfThickness(along: number, across: number): number;
};
type BladeGrid = { readonly rows: number; readonly columns: number };
const FACES = ['adaxial', 'abaxial'] as const;
type Face = (typeof FACES)[number];
type BladeMaterials = Readonly<Record<Face, MeshStandardMaterial>>;
type RaySpec = {
  readonly azimuth: number;
  readonly length: number;
  readonly halfWidth: number;
  readonly droop: number;
  readonly roll: number;
  readonly lift: number;
};
type RaySkin = {
  readonly adaxial: Readonly<Record<View, DataTexture>>;
  readonly relief: DataTexture;
};

const RAY_COUNT = 14;
const RAY_RASTER: Raster = { width: 256, height: 1024 };
const STEM_PATH = new CatmullRomCurve3([
  new Vector3(-0.12, -0.95, 0),
  new Vector3(-0.1, 0.2, 0.05),
  new Vector3(0, 1.5, 0),
]);
const STEM_RADIUS = 0.043;

function bladeGeometry(laminae: readonly Lamina[], grid: BladeGrid): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  const nodes = (grid.rows + 1) * (grid.columns + 1);
  const mid = new Vector3();
  const alongA = new Vector3();
  const alongB = new Vector3();
  const acrossA = new Vector3();
  const acrossB = new Vector3();
  const normal = new Vector3();
  for (const lamina of laminae) {
    for (const face of FACES) {
      const sign = face === 'adaxial' ? 1 : -1;
      for (let row = 0; row <= grid.rows; row++) {
        const along = row / grid.rows * 0.985;
        for (let column = 0; column <= grid.columns; column++) {
          const across = column / grid.columns * 2 - 1;
          lamina.surface(along, across, mid);
          lamina.surface(Math.max(0, along - 0.001), across, alongA);
          lamina.surface(Math.min(0.985, along + 0.001), across, alongB);
          lamina.surface(along, Math.max(-1, across - 0.001), acrossA);
          lamina.surface(along, Math.min(1, across + 0.001), acrossB);
          normal.subVectors(alongB, alongA).cross(acrossB.sub(acrossA)).normalize().multiplyScalar(sign);
          const point = mid.clone().addScaledVector(normal, lamina.halfThickness(along, across));
          positions.push(point.x, point.y, point.z);
          normals.push(normal.x, normal.y, normal.z);
          uvs.push(across * 0.5 + 0.5, along);
        }
      }
    }
  }
  for (let leaf = 0; leaf < laminae.length; leaf++) {
    const base = leaf * nodes * 2;
    for (let row = 0; row < grid.rows; row++) {
      for (let column = 0; column < grid.columns; column++) {
        const a = base + row * (grid.columns + 1) + column;
        const b = a + 1;
        const c = a + grid.columns + 1;
        upper.push(a, c, b, b, c, c + 1);
        const d = base + nodes + row * (grid.columns + 1) + column;
        const e = d + 1;
        const f = d + grid.columns + 1;
        lower.push(d, e, f, e, f + 1, f);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex([...upper, ...lower]);
  geometry.addGroup(0, upper.length, 0);
  geometry.addGroup(upper.length, lower.length, 1);
  return geometry;
}

function bladeMesh(laminae: readonly Lamina[], grid: BladeGrid, materials: BladeMaterials): Mesh {
  const mesh = new Mesh(bladeGeometry(laminae, grid), FACES.map((face) => materials[face]));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function raySpecs(random: Random): RaySpec[] {
  const spread = (amount: number) => (random() * 2 - 1) * amount;
  return Array.from({ length: RAY_COUNT }, (_, index) => ({
    azimuth: index / RAY_COUNT * Math.PI * 2 + spread(0.04),
    length: 1.72 * (1 + spread(0.07)),
    halfWidth: 0.29 * (1 + spread(0.08)),
    droop: 0.16 + spread(0.05),
    roll: spread(0.07),
    lift: (index % 2) * 0.02,
  }));
}

function rayLamina(spec: RaySpec): Lamina {
  return {
    surface(along, across, target) {
      const wave = Math.sin(Math.PI * along);
      const width = spec.halfWidth * Math.pow(Math.sin(Math.PI * Math.pow(along, 0.82)), 0.62)
        + 0.03 * Math.pow(1 - along, 2);
      let x = across * width;
      let y = 0.05 * across * across * wave
        - 0.012 * Math.exp(-Math.pow((Math.abs(across) - 0.45) / 0.12, 2)) * wave;
      const turn = spec.roll * along;
      [x, y] = [x * Math.cos(turn) - y * Math.sin(turn), x * Math.sin(turn) + y * Math.cos(turn)];
      y += 1.48 + spec.lift + 0.12 * Math.sin(0.85 * Math.PI * along) - spec.droop * along * along;
      const z = 0.22 + spec.length * along;
      return target.set(
        x * Math.cos(spec.azimuth) + z * Math.sin(spec.azimuth),
        y,
        -x * Math.sin(spec.azimuth) + z * Math.cos(spec.azimuth),
      );
    },
    halfThickness(along, across) {
      return 0.006 * Math.sqrt(Math.max(0, 1 - across * across)) * (0.4 + 0.6 * (1 - along));
    },
  };
}

function basalGuide(along: number, across: number): number {
  const edge = 0.48 - 0.07 * across * across;
  return 1 - smoothstep(edge - 0.003, edge + 0.003, along);
}

function venation(along: number, across: number): number {
  return Math.pow(Math.abs(Math.cos(Math.PI * across * 4.5)), 8)
    * smoothstep(0.02, 0.2, along) * (1 - smoothstep(0.75, 1, along));
}

function bladeTexel<T>(field: (along: number, across: number) => T): Field<T> {
  return (s, t) => field(t, s * 2 - 1);
}

function albedo(view: View): (along: number, across: number) => Rgb {
  const distal = rgb('#efbd32');
  const basal = rgb(view === 'uv' ? '#4d436b' : '#efbd32');
  return (along, across) => {
    const base = mixRgb(distal, basal, basalGuide(along, across));
    const shade = 1 - 0.1 * venation(along, across);
    return [base[0] * shade, base[1] * shade, base[2] * shade];
  };
}

function createRaySkin(): RaySkin {
  return {
    adaxial: {
      human: colorTexture(RAY_RASTER, bladeTexel(albedo('human'))),
      uv: colorTexture(RAY_RASTER, bladeTexel(albedo('uv'))),
    },
    relief: reliefTexture(RAY_RASTER, bladeTexel((along, across) =>
      0.5 + 0.35 * venation(along, across) - 0.2 * Math.exp(-Math.pow((Math.abs(across) - 0.45) / 0.12, 2)))),
  };
}

function createDisk(): Group {
  const root = new Group();
  const dome = new Mesh(new SphereGeometry(0.5, 40, 24), new MeshStandardMaterial({
    color: '#2a1c12',
    emissive: '#1a100c',
    emissiveIntensity: 0.28,
    roughness: 1,
  }));
  dome.position.y = 1.54;
  dome.scale.y = 0.64;
  dome.castShadow = true;
  root.add(dome);
  const geometry = new DodecahedronGeometry(0.024, 0);
  const florets = new InstancedMesh(geometry, new MeshStandardMaterial({
    emissive: '#24180f',
    emissiveIntensity: 0.35,
    roughness: 1,
    vertexColors: true,
  }), 610);
  const random = randomStream('florets');
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  const up = new Vector3(0, 1, 0);
  for (let index = 0; index < 610; index++) {
    const t = index / 610;
    const radius = 0.455 * Math.sqrt(t);
    const angle = index * 2.399963;
    const position = new Vector3(Math.cos(angle) * radius, 1.54 + 0.3 * Math.sqrt(1 - radius * radius / 0.2209), Math.sin(angle) * radius);
    const outward = new Vector3(position.x, 0.42, position.z).normalize();
    quaternion.setFromUnitVectors(up, outward);
    const size = 0.72 + 0.42 * smoothstep(0.15, 0.9, t);
    scale.setScalar(size);
    matrix.compose(position, quaternion, scale);
    florets.setMatrixAt(index, matrix);
    const color = new Color(t < 0.55 ? '#3a2718' : '#8d6a32').offsetHSL(0, 0, (random() - 0.5) * 0.06);
    florets.setColorAt(index, color);
  }
  florets.castShadow = true;
  root.add(florets);
  return root;
}

function leafLamina(at: number, azimuth: number, length: number, halfWidth: number, arch: number): Lamina {
  const origin = STEM_PATH.getPointAt(at);
  return {
    surface(along, across, target) {
      const q = Math.max(0, (along - 0.14) / 0.86);
      const width = along < 0.14 ? STEM_RADIUS * 0.6 : halfWidth * Math.pow(Math.sin(Math.PI * Math.pow(q, 0.7)), 0.8);
      const radial = length * along;
      return target.set(
        origin.x + Math.sin(azimuth) * radial + Math.cos(azimuth) * across * width,
        origin.y + 0.15 * length * along - arch * along * along + 0.1 * Math.abs(across) * width,
        origin.z + Math.cos(azimuth) * radial - Math.sin(azimuth) * across * width,
      );
    },
    halfThickness(_along, across) {
      return 0.008 * Math.sqrt(Math.max(0, 1 - across * across));
    },
  };
}

function createBee(): { readonly root: Group; readonly wings: readonly Mesh[] } {
  const root = new Group();
  const stripe = new MeshStandardMaterial({ color: '#e2b12a', roughness: 0.62 });
  const dark = new MeshStandardMaterial({ color: '#2b2418', roughness: 0.7 });
  const abdomen = new Mesh(new SphereGeometry(0.085, 14, 10), stripe);
  abdomen.scale.set(0.72, 0.68, 1.45);
  abdomen.castShadow = true;
  root.add(abdomen);
  for (const z of [-0.02, 0.035]) {
    const band = new Mesh(new SphereGeometry(0.062, 10, 8), dark);
    band.scale.set(0.78, 0.55, 0.28);
    band.position.z = z;
    root.add(band);
  }
  const thorax = new Mesh(new SphereGeometry(0.055, 12, 8), dark);
  thorax.position.set(0, 0.01, -0.1);
  thorax.castShadow = true;
  root.add(thorax);
  const head = new Mesh(new SphereGeometry(0.038, 10, 8), dark);
  head.position.set(0, 0.012, -0.16);
  root.add(head);
  const wingMaterial = new MeshStandardMaterial({
    color: '#f7f4ea',
    transparent: true,
    opacity: 0.55,
    roughness: 0.35,
    side: DoubleSide,
    depthWrite: false,
  });
  const wings = [-1, 1].map((side) => {
    const wing = new Mesh(new SphereGeometry(0.09, 10, 6), wingMaterial);
    wing.scale.set(1.15, 0.08, 1.7);
    wing.position.set(side * 0.07, 0.03, -0.02);
    root.add(wing);
    return wing;
  });
  return { root, wings };
}

export function createFlower(): { readonly root: Group; setView(view: View): void; setBee(progress: number, flutter?: number): void } {
  const root = new Group();
  const head = new Group();
  head.position.y = 1.5;
  head.rotation.x = 0.7;
  const skin = createRaySkin();
  const rayMaterials: BladeMaterials = {
    adaxial: new MeshStandardMaterial({ map: skin.adaxial.human, bumpMap: skin.relief, bumpScale: 0.06, roughness: 0.72, side: FrontSide }),
    abaxial: new MeshStandardMaterial({ color: '#dba82c', bumpMap: skin.relief, bumpScale: -0.04, roughness: 0.9, side: FrontSide }),
  };
  const petals = bladeMesh(raySpecs(randomStream('rays')).map(rayLamina), { rows: 32, columns: 12 }, rayMaterials);
  petals.position.y = -1.5;
  head.add(petals);
  const upperLeaf = new MeshStandardMaterial({ color: '#5c7544', roughness: 0.86, side: FrontSide });
  const lowerLeaf = new MeshStandardMaterial({ color: '#8eae6e', roughness: 0.9, side: FrontSide });
  const leafMaterials: BladeMaterials = { adaxial: upperLeaf, abaxial: lowerLeaf };
  root.add(bladeMesh([
    leafLamina(0.28, 2.2, 1.15, 0.26, 0.34),
    leafLamina(0.46, 4.4, 0.95, 0.2, 0.26),
    leafLamina(0.62, 0.4, 0.72, 0.15, 0.18),
  ], { rows: 24, columns: 8 }, leafMaterials));
  const stem = new Mesh(new TubeGeometry(STEM_PATH, 24, STEM_RADIUS, 9, false), upperLeaf);
  stem.castShadow = true;
  root.add(stem);
  const disk = createDisk();
  disk.position.y = -1.5;
  head.add(disk);
  const receptacle = new Mesh(new LatheGeometry([
    new Vector2(STEM_RADIUS, 1.3),
    new Vector2(0.28, 1.38),
    new Vector2(0.42, 1.47),
  ], 48), upperLeaf);
  receptacle.position.y = -1.5;
  receptacle.castShadow = true;
  head.add(receptacle);
  root.add(head);
  const bee = createBee();
  bee.root.scale.setScalar(0.7);
  root.add(bee.root);
  const hover = new Vector3(0.58, 1.86, 0.42);
  const approach = new Vector3(1.85, 2.25, 1.55);
  return {
    root,
    setView(view) {
      rayMaterials.adaxial.map = skin.adaxial[view];
    },
    setBee(progress, flutter = 0) {
      const t = Math.max(0, Math.min(1, progress));
      bee.root.position.lerpVectors(approach, hover, t);
      bee.root.rotation.y = (1 - t) * -0.6;
      bee.root.rotation.z = (1 - t) * 0.18;
      const flap = t < 1 ? Math.sin(t * Math.PI * 16) * 0.75 : 0.4 + flutter * 0.55;
      bee.wings[0].rotation.z = flap;
      bee.wings[1].rotation.z = -flap;
    },
  };
}
