import { BufferGeometry, CylinderGeometry, CircleGeometry, CatmullRomCurve3, DoubleSide, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector3 } from 'three';
import { createBroadLeaf } from './rudbeckia-specimen';

export const WEB_SECTORS = [
  { id: 1, label: 'Sector 1', x: 0, z: -1 },
  { id: 2, label: 'Sector 2', x: 1, z: 0 },
  { id: 3, label: 'Sector 3', x: 0, z: 1 },
  { id: 4, label: 'Sector 4', x: -1, z: 0 },
] as const;
export type Sector = typeof WEB_SECTORS[number];
export type WebView = 'human' | 'vibrations';
type Round = { kind: 'explore' } | { kind: 'search'; source: Sector } | { kind: 'found'; source: Sector };
type Signal = { kind: 'quiet' } | { kind: 'pulse'; source: Sector; started: number } | { kind: 'static'; source: Sector };
export const WEB_CENTER = new Vector3(2.05, 0.22, 1.22);
const PULSE_DURATION = 1800;
const SPIDER_APPROACH_MS = 650;

export function createSpiderWeb() {
  const root = new Group();
  root.position.copy(WEB_CENTER);
  root.scale.setScalar(1);
  const silk = new LineBasicMaterial({ color: '#d5e3c4', transparent: true, opacity: 0.82 });
  const dark = new MeshStandardMaterial({ color: '#352c25', roughness: 0.75 });
  function line(points: Vector3[], material: LineBasicMaterial, parent = root) {
    const object = new Line(new BufferGeometry().setFromPoints(points), material);
    parent.add(object);
    return object;
  }
  const point = (angle: number, radius: number) => new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  // A loose capture spiral and fewer spoke lines make the web read as silk,
  // while the four lesson sectors remain easy to identify.
  const spiralPoints = Array.from({ length: 161 }, (_, i) => {
    const t = i / 160;
    return point(t * Math.PI * 2 * 3.2, 0.12 + t * 1.28);
  });
  line(spiralPoints, silk);
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    line([point(angle, 0.08), point(angle, 1.4)], silk);
  }
  line(Array.from({ length: 65 }, (_, i) => point(i / 64 * Math.PI * 2, 1.4)), silk);
  const stemMaterial = new MeshStandardMaterial({ color: '#526847', roughness: 1 });
  const leafPrototype = createBroadLeaf(() => 0.5, 0, { rings: 20, segments: 16 });
  for (const angle of [0.15, Math.PI * 0.7, Math.PI * 1.28]) {
    const anchor = point(angle, 1.72);
    const outward = point(angle, 1);
    const curve = new CatmullRomCurve3([
      new Vector3(anchor.x, 0.05, anchor.z),
      new Vector3(anchor.x + outward.x * 0.13, -0.8, anchor.z + outward.z * 0.13),
      new Vector3(anchor.x - outward.x * 0.08, -1.75, anchor.z - outward.z * 0.08),
      new Vector3(anchor.x + outward.x * 0.24, -2.42, anchor.z + outward.z * 0.24),
    ]);
    const stem = new Mesh(new TubeGeometry(curve, 18, 0.018, 6, false), stemMaterial);
    stem.castShadow = true;
    root.add(stem);
    line([point(angle, 1.35), anchor], silk);
    const branchPoints = curve.getPoints(36);
    for (const [height, side] of [[-0.75, -1], [-1.38, 1], [-1.95, -1]] as const) {
      const node = branchPoints.reduce((nearest, candidate) =>
        Math.abs(candidate.y - height) < Math.abs(nearest.y - height) ? candidate : nearest,
      );
      const leafPosition = node.clone().add(new Vector3(Math.cos(angle + side * 0.6) * 0.1, 0.04, Math.sin(angle + side * 0.6) * 0.1));
      const petiole = new Mesh(new TubeGeometry(new CatmullRomCurve3([node, leafPosition]), 4, 0.006, 5, false), stemMaterial);
      petiole.castShadow = true;
      root.add(petiole);
      const leaf = leafPrototype.clone();
      leaf.scale.setScalar(1.7);
      leaf.rotation.y = angle + side * 0.72;
      leaf.position.copy(leafPosition);
      leaf.castShadow = true;
      root.add(leaf);
    }
  }
  const spider = new Group();
  const abdomen = new Mesh(new SphereGeometry(0.12, 20, 14), new MeshStandardMaterial({ color: '#47342b', roughness: 0.62 }));
  abdomen.scale.set(0.82, 0.72, 1.28);
  abdomen.position.set(0, 0.095, 0.105);
  spider.add(abdomen);
  const cephalothorax = new Mesh(new SphereGeometry(0.075, 16, 12), new MeshStandardMaterial({ color: '#302921', roughness: 0.58 }));
  cephalothorax.scale.set(0.92, 0.72, 1.12);
  cephalothorax.position.set(0, 0.085, -0.105);
  spider.add(cephalothorax);
  const head = new Mesh(new SphereGeometry(0.044, 12, 8), dark);
  head.position.set(0, 0.105, -0.17);
  spider.add(head);
  const legs = new MeshStandardMaterial({ color: '#302921', roughness: 0.7 });
  const joint = new MeshStandardMaterial({ color: '#655044', roughness: 0.76 });
  function limb(start: Vector3, end: Vector3, radius: number, material: MeshStandardMaterial, parent: Group): void {
    const delta = end.clone().sub(start);
    const segment = new Mesh(new CylinderGeometry(radius * 0.68, radius, delta.length(), 7), material);
    segment.position.copy(start).add(end).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
    parent.add(segment);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const start = new Vector3(side * 0.045, 0.075, -0.11 + i * 0.07);
      const knee = new Vector3(side * (0.19 + (i % 2) * 0.025), 0.12, -0.28 + i * 0.18);
      const foot = new Vector3(side * (0.34 - (i % 2) * 0.025), 0.012, -0.39 + i * 0.25);
      limb(start, knee, 0.018, legs, spider);
      limb(knee, foot, 0.012, legs, spider);
      const jointMesh = new Mesh(new SphereGeometry(0.022, 8, 6), joint);
      jointMesh.position.copy(knee);
      spider.add(jointMesh);
    }
  }
  root.add(spider);
  const digits: Record<Sector['id'], number[][][]> = {
    1: [[[0, 0.06], [0, -0.06]]],
    2: [[[-0.04, -0.06], [0.04, -0.06], [0.04, 0], [-0.04, 0.06], [0.04, 0.06]]],
    3: [[[-0.04, -0.06], [0.04, -0.06], [0, 0], [0.04, 0.06], [-0.04, 0.06]]],
    4: [[[0.02, 0.06], [0.02, -0.06]], [[-0.04, -0.06], [-0.04, 0], [0.05, 0]]],
  };
  for (const sector of WEB_SECTORS) {
    const badge = new Mesh(new CircleGeometry(0.125, 24), new MeshBasicMaterial({ color: '#263c30', side: DoubleSide }));
    badge.rotation.x = -Math.PI / 2;
    badge.position.set(sector.x * 1.2, 0.015, sector.z * 1.2);
    root.add(badge);
    for (const stroke of digits[sector.id]) line(stroke.map(([x, z]) => new Vector3(sector.x * 1.2 + x, 0.022, sector.z * 1.2 + z)), silk);
  }
  const hitArea = new Mesh(new CircleGeometry(1.4, 64), new MeshBasicMaterial({ visible: false, side: DoubleSide }));
  hitArea.rotation.x = -Math.PI / 2;
  root.add(hitArea);
  const cueMaterial = new LineBasicMaterial({ color: '#07d1ba' });
  const cue = line([new Vector3(), new Vector3(0, 0.03, -1.1)], cueMaterial);
  const pulse = new Mesh(new TorusGeometry(0.09, 0.018, 6, 24), new MeshBasicMaterial({ color: '#07d1ba' }));
  pulse.rotation.x = -Math.PI / 2;
  root.add(pulse);
  const fly = new Group();
  const flyBody = new Mesh(new SphereGeometry(0.055, 12, 8), dark);
  flyBody.scale.z = 1.6;
  fly.add(flyBody);
  for (const side of [-1, 1]) {
    const wing = new Mesh(new SphereGeometry(0.065, 12, 8), new MeshStandardMaterial({ color: '#e6eee8', transparent: true, opacity: 0.8 }));
    wing.scale.set(1, 0.12, 1.6);
    wing.position.set(side * 0.06, 0.025, 0.02);
    fly.add(wing);
  }
  root.add(fly);
  let round: Round = { kind: 'explore' };
  let signal: Signal = { kind: 'quiet' };
  let view: WebView = 'vibrations';
  let feedback = 'Toca la red o elige un sector para crear una señal.';
  let spiderApproach: { source: Sector; started: number } | null = null;
  function setSpiderPose(source: Sector | null, progress: number) {
    if (!source) {
      spider.position.set(0, 0, 0);
      spider.rotation.y = 0;
      return;
    }
    const targetYaw = Math.atan2(-source.x, -source.z);
    const eased = progress * progress * (3 - 2 * progress);
    spider.position.set(source.x * 0.28 * eased, 0, source.z * 0.28 * eased);
    spider.rotation.y = Math.atan2(Math.sin(targetYaw), Math.cos(targetYaw)) * eased;
  }
  function refresh() {
    cue.visible = view === 'vibrations' && signal.kind !== 'quiet';
    pulse.visible = cue.visible;
    fly.visible = round.kind === 'found';
    if (round.kind === 'found') fly.position.set(round.source.x * 0.95, 0.06, round.source.z * 0.95);
    else setSpiderPose(null, 0);
  }
  function send(source: Sector, now: number, reduced: boolean) {
    signal = reduced ? { kind: 'static', source } : { kind: 'pulse', source, started: now };
    cue.geometry.setFromPoints([new Vector3(0, 0.025, 0), new Vector3(source.x * 1.08, 0.025, source.z * 1.08)]);
    pulse.position.set(source.x * 1.08, 0.035, source.z * 1.08);
    pulse.scale.setScalar(1);
    refresh();
  }
  refresh();
  return {
    root, hitArea,
    get phase() { return round.kind; },
    get status() {
      const information = view === 'vibrations' && signal.kind !== 'quiet'
        ? `Señal más intensa hacia el sector ${signal.source.id}.` : view === 'human' ? 'Referencia humana: activa Vibraciones para seguir la señal.' : 'Aún no hay una señal: toca un sector o busca una mosca.';
      return `${feedback} ${information}`;
    },
    setView(next: WebView) { view = next; refresh(); },
    sectorAt(world: Vector3): Sector {
      const local = root.worldToLocal(world.clone());
      return WEB_SECTORS.reduce((nearest, sector) => local.x * sector.x + local.z * sector.z > local.x * nearest.x + local.z * nearest.z ? sector : nearest);
    },
    touch(source: Sector, now: number, reduced: boolean) {
      if (round.kind === 'search') {
        if (source.id === round.source.id) {
          round = { kind: 'found', source };
          feedback = '¡Encontrada! La mosca aparece en la red. Puedes iniciar otra ronda.';
          if (reduced) {
            spiderApproach = null;
            setSpiderPose(source, 1);
          } else {
            spiderApproach = { source, started: now };
          }
        } else feedback = 'Ese sector no es. Sigue la señal más intensa e inténtalo de nuevo.';
        refresh();
      } else {
        feedback = `Has tocado el sector ${source.id}.`;
        send(source, now, reduced);
      }
    },
    newRound(now: number, reduced: boolean) {
      const source = WEB_SECTORS[Math.floor(Math.random() * WEB_SECTORS.length)] ?? WEB_SECTORS[0];
      round = { kind: 'search', source };
      spiderApproach = null;
      feedback = 'Una mosca ha caído. Está oculta en ambos modos: busca el sector de la señal más intensa.';
      send(source, now, reduced);
    },
    repeat(now: number, reduced: boolean) {
      if (round.kind !== 'explore') send(round.source, now, reduced);
      else if (signal.kind !== 'quiet') send(signal.source, now, reduced);
    },
    clear() { round = { kind: 'explore' }; signal = { kind: 'quiet' }; spiderApproach = null; feedback = 'Toca la red o elige un sector para crear una señal.'; refresh(); },
    update(now: number, reduced: boolean): boolean {
      let active = false;
      if (spiderApproach) {
        const elapsed = now - spiderApproach.started;
        if (reduced || elapsed >= SPIDER_APPROACH_MS) {
          setSpiderPose(spiderApproach.source, 1);
          spiderApproach = null;
        } else {
          setSpiderPose(spiderApproach.source, Math.max(0, elapsed / SPIDER_APPROACH_MS));
          active = true;
        }
      }
      if (signal.kind === 'pulse') {
        const elapsed = now - signal.started;
        if (reduced || elapsed >= PULSE_DURATION) {
          signal = { kind: 'static', source: signal.source };
          pulse.position.set(signal.source.x * 1.08, 0.035, signal.source.z * 1.08);
          pulse.scale.setScalar(1);
        } else {
          const distance = 1 - (elapsed % 600) / 600;
          pulse.position.set(signal.source.x * 1.08 * distance, 0.035, signal.source.z * 1.08 * distance);
          pulse.scale.setScalar(0.6 + distance * 0.8);
          active = active || view === 'vibrations';
        }
      }
      return active;
    },
  };
}
