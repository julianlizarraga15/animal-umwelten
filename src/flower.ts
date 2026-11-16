import {
  BackSide, BufferGeometry, Float32BufferAttribute, Group, InstancedMesh,
  Matrix4, Mesh, MeshStandardMaterial, Quaternion, SphereGeometry,
  TubeGeometry, Vector3, CatmullRomCurve3,
} from 'three';

export type View = 'human' | 'uv';

type Palette = { basal: string; distal: string };
const palettes: Record<View, Palette> = {
  human: { basal: '#efbd32', distal: '#efbd32' },
  uv: { basal: '#4d436b', distal: '#efbd32' },
};

export function createFlower(): { root: Group; setView(view: View): void } {
  const root = new Group();
  const basal = new MeshStandardMaterial({ color: palettes.human.basal, roughness: 0.82 });
  const distal = new MeshStandardMaterial({ color: palettes.human.distal, roughness: 0.82 });
  const reverse = new MeshStandardMaterial({ color: '#dba82c', roughness: 0.9, side: BackSide });
  const stemMaterial = new MeshStandardMaterial({ color: '#617648', roughness: 1 });
  const diskMaterial = new MeshStandardMaterial({ color: '#382a1e', roughness: 1 });
  const seedMaterial = new MeshStandardMaterial({ color: '#70502d', roughness: 1 });

  const rows = 24;
  const columns = 10;
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const u = row / rows;
    const width = 0.245 * Math.pow(Math.sin(Math.PI * u), 0.66) + 0.025 * (1 - u);
    for (let column = 0; column <= columns; column++) {
      const v = column / columns * 2 - 1;
      positions.push(v * width, 1.48 + 0.14 * Math.sin(Math.PI * u) - 0.28 * u * u + 0.085 * v * v * Math.sin(Math.PI * u), 0.22 + u * 1.55);
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      indices.push(a, c, b, b, c, c + 1);
    }
  }
  geometry.setIndex(indices);
  const basalCount = 11 * columns * 6;
  geometry.addGroup(0, basalCount, 0);
  geometry.addGroup(basalCount, indices.length - basalCount, 1);
  geometry.computeVertexNormals();
  const reverseGeometry = geometry.clone();
  reverseGeometry.clearGroups();
  for (let petal = 0; petal < 14; petal++) {
    const upper = new Mesh(geometry, [basal, distal]);
    upper.rotation.y = petal / 14 * Math.PI * 2;
    upper.rotation.z = Math.sin(petal * 2.4) * 0.025;
    upper.scale.z = 1 + 0.055 * Math.sin(petal * 4.7);
    upper.castShadow = true;
    upper.receiveShadow = true;
    root.add(upper);
    const lower = new Mesh(reverseGeometry, reverse);
    lower.rotation.copy(upper.rotation);
    lower.scale.copy(upper.scale);
    root.add(lower);
  }
  const disk = new Mesh(new SphereGeometry(0.47, 40, 24), diskMaterial);
  disk.position.y = 1.54;
  disk.scale.y = 0.64;
  disk.castShadow = true;
  root.add(disk);
  const seeds = new InstancedMesh(new SphereGeometry(0.024, 5, 4), seedMaterial, 430);
  const transform = new Matrix4();
  const rotation = new Quaternion();
  const scale = new Vector3(1, 1.5, 1);
  for (let seed = 0; seed < 430; seed++) {
    const radius = 0.455 * Math.sqrt(seed / 430);
    const angle = seed * 2.399963;
    const y = 1.54 + 0.30 * Math.sqrt(1 - radius * radius / (0.47 * 0.47));
    transform.compose(new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius), rotation, scale);
    seeds.setMatrixAt(seed, transform);
  }
  seeds.castShadow = true;
  root.add(seeds);
  const curve = new CatmullRomCurve3([new Vector3(-0.12, -0.95, 0), new Vector3(-0.1, 0.2, 0.05), new Vector3(0, 1.5, 0)]);
  const stem = new Mesh(new TubeGeometry(curve, 24, 0.043, 9, false), stemMaterial);
  stem.castShadow = true;
  root.add(stem);
  const leaf = new Mesh(new SphereGeometry(1, 18, 12), stemMaterial);
  leaf.scale.set(0.16, 0.032, 0.52);
  leaf.position.set(-0.24, 0.14, 0.2);
  leaf.rotation.set(0.22, -0.8, -0.4);
  leaf.castShadow = true;
  root.add(leaf);
  return {
    root,
    setView(view) {
      const palette = palettes[view];
      basal.color.set(palette.basal);
      distal.color.set(palette.distal);
    },
  };
}
