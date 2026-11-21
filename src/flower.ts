import {
  CatmullRomCurve3, Color, DoubleSide, Group, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { randomStream } from './procedural';
import { createBroadLeaf, createRudbeckiaHead } from './rudbeckia-specimen';

export type View = 'human' | 'uv';

/** Garden units per specimen meter for the head; rays reach about 1.9 units from the disk center. */
const HEAD_SCALE = 32;
const HEAD_TILT = 0.7;
const HEAD_CENTER = new Vector3(0, 1.5, 0);
const STEM_PATH = new CatmullRomCurve3([
  new Vector3(-0.12, -0.95, 0.05),
  new Vector3(-0.09, 0.25, -0.05),
  new Vector3(-0.02, 1.0, -0.2),
  new Vector3(0, 1.36, -0.12),
]);
const BASAL_LEAVES = [
  { yaw: 2.3, lift: 0.5, scale: 7.6 },
  { yaw: 4.4, lift: 0.42, scale: 7 },
  { yaw: 0.7, lift: 0.55, scale: 6.4 },
] as const;
const LEAF_HAIR_DENSITY = 0.25;

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

function createBasalLeaves(): Group {
  const rosette = new Group();
  const blade = createBroadLeaf(randomStream('garden-basal-leaf'), LEAF_HAIR_DENSITY);
  for (const spec of BASAL_LEAVES) {
    const leaf = new Group();
    leaf.add(blade.clone());
    leaf.scale.setScalar(spec.scale);
    leaf.rotation.set(0, spec.yaw, spec.lift);
    leaf.position.set(-0.12, -0.66, 0.05);
    rosette.add(leaf);
  }
  return rosette;
}

/** Rudbeckia from the accepted specimen, with the bee UV guide on the upper ray faces only. */
export function createFlower(): { readonly root: Group; setView(view: View): void; setBee(progress: number, flutter?: number): void } {
  const root = new Group();
  const head = createRudbeckiaHead(randomStream('rudbeckia-specimen'), true);
  head.root.scale.setScalar(HEAD_SCALE);
  head.root.position.copy(HEAD_CENTER);
  head.root.rotation.x = HEAD_TILT;
  root.add(head.root);
  const stem = new Mesh(
    new TubeGeometry(STEM_PATH, 48, 0.045, 10, false),
    new MeshPhysicalMaterial({ color: 0x5f7040, roughness: 0.78, sheen: 1, sheenColor: new Color('#c4cca4') }),
  );
  root.add(stem, createBasalLeaves());
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const hair = child.userData.hair === true;
    child.castShadow = !hair;
    child.receiveShadow = true;
    if (hair) child.raycast = () => {};
  });
  const bee = createBee();
  bee.root.scale.setScalar(1.05);
  root.add(bee.root);
  const hover = new Vector3(0.58, 1.86, 0.42);
  const approach = new Vector3(1.85, 2.25, 1.55);
  return {
    root,
    setView(view) {
      head.setUvGuide(view === 'uv');
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
