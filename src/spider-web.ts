import { BufferGeometry, CylinderGeometry, CircleGeometry, DoubleSide, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3 } from 'three';

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
  root.scale.setScalar(0.78);
  const silk = new LineBasicMaterial({ color: '#e9edda' });
  const dark = new MeshStandardMaterial({ color: '#352c25', roughness: 0.75 });
  function line(points: Vector3[], material: LineBasicMaterial, parent = root) {
    const object = new Line(new BufferGeometry().setFromPoints(points), material);
    parent.add(object);
    return object;
  }
  const point = (angle: number, radius: number) => new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  for (let radius = 0.17; radius <= 1.31; radius += 0.14) {
    line(Array.from({ length: 65 }, (_, i) => point(i / 64 * Math.PI * 2, radius)), silk);
  }
  for (let i = 0; i < 24; i++) line([new Vector3(), point(i / 24 * Math.PI * 2, 1.4)], silk);
  line(Array.from({ length: 65 }, (_, i) => point(i / 64 * Math.PI * 2, 1.4)), silk);
  const stemMaterial = new MeshStandardMaterial({ color: '#676b3f', roughness: 1 });
  const leafMaterial = new MeshStandardMaterial({ color: '#667b48', roughness: 1 });
  for (const angle of [0.15, Math.PI * 0.7, Math.PI * 1.28]) {
    const anchor = point(angle, 1.72);
    const drop = 3.5;
    const stem = new Mesh(new CylinderGeometry(0.016, 0.04, drop, 7), stemMaterial);
    stem.position.set(anchor.x, -drop / 2 + 0.04, anchor.z);
    stem.castShadow = true;
    root.add(stem);
    line([point(angle, 1.35), anchor], silk);
    for (const height of [0.45, 1.15, 1.9]) {
      for (const side of [-1, 1]) {
        const leaf = new Mesh(new SphereGeometry(0.1, 8, 5), leafMaterial);
        leaf.scale.set(1, 0.14, 2.15);
        leaf.rotation.z = side * 0.42;
        leaf.rotation.y = angle + side * 0.25;
        leaf.position.set(
          anchor.x * (0.45 + height * 0.12) + Math.cos(angle + side) * 0.08,
          -height,
          anchor.z * (0.45 + height * 0.12) + Math.sin(angle + side) * 0.08,
        );
        leaf.castShadow = true;
        root.add(leaf);
      }
    }
  }
  const spider = new Group();
  const abdomen = new Mesh(new SphereGeometry(0.115, 16, 12), dark);
  abdomen.scale.set(0.85, 0.7, 1.3);
  abdomen.position.set(0, 0.09, 0.07);
  spider.add(abdomen);
  const head = new Mesh(new SphereGeometry(0.075, 12, 8), dark);
  head.position.set(0, 0.08, -0.1);
  spider.add(head);
  const legs = new LineBasicMaterial({ color: '#352c25' });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      line([new Vector3(side * 0.04, 0.08, -0.1 + i * 0.05), new Vector3(side * (0.21 + i * 0.015), 0.14, -0.27 + i * 0.16), new Vector3(side * (0.3 + i * 0.015), 0.015, -0.35 + i * 0.22)], legs, spider);
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
