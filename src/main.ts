import './style.css';
import {
  ACESFilmicToneMapping, DirectionalLight, HemisphereLight, PCFShadowMap,
  PerspectiveCamera, Raycaster, Scene, Vector2, Vector3,
  WebGLRenderer,
} from 'three';
import { createFlower, type View } from './flower';
import { createPatio, FLOWER_BED } from './patio';
import { createSpiderWeb, WEB_CENTER, WEB_SECTORS, type Sector } from './spider-web';

type Pose = { position: Vector3; yaw: number; pitch: number };

const INSPECTION_POSES = {
  reverse: poseLookingAt(new Vector3(0.75, -0.3, 0.95).add(FLOWER_BED), new Vector3(0, 1.4, 0).add(FLOWER_BED)),
} as const satisfies Record<string, Pose>;

type InspectionId = keyof typeof INSPECTION_POSES;
type LightRig = {
  readonly exposure: number;
  readonly sky: { readonly color: number; readonly ground: number; readonly intensity: number };
  readonly sun: {
    readonly color: number;
    readonly intensity: number;
    readonly from: readonly [number, number, number];
    readonly shadowRadius: number;
  };
};
const LIGHTING = {
  afternoon: {
    exposure: 1.1,
    sky: { color: 0xffe4c4, ground: 0x65556f, intensity: 1.18 },
    sun: { color: 0xffbe7a, intensity: 4.5, from: [-5.4, 6.4, 7.8], shadowRadius: 3.2 },
  },
  shade: {
    exposure: 1.06,
    sky: { color: 0xe8eff6, ground: 0x6c6878, intensity: 1.25 },
    sun: { color: 0xfff4e6, intensity: 2.5, from: [5.2, 8.5, 4.8], shadowRadius: 5.5 },
  },
  soft: {
    exposure: 1.08,
    sky: { color: 0xfff9ea, ground: 0x8f8a78, intensity: 1.35 },
    sun: { color: 0xfff4de, intensity: 2.6, from: [5, 9, 5], shadowRadius: 5 },
  },
  directional: {
    exposure: 1,
    sky: { color: 0xf4f8ff, ground: 0x8f8a78, intensity: 0.8 },
    sun: { color: 0xffefd2, intensity: 4, from: [6.5, 6.5, 3.2], shadowRadius: 2 },
  },
} as const satisfies Record<string, LightRig>;
type LightingId = keyof typeof LIGHTING;
const DEFAULT_LIGHTING: LightingId = 'afternoon';
type Trial = { readonly lighting: LightingId; readonly inspection: InspectionId | null };

type CameraState =
  | { kind: 'patio' }
  | { kind: 'approaching'; destination: 'flower' | 'web'; startTime: number; fromPos: Vector3; fromYaw: number; fromPitch: number }
  | { kind: 'flower' }
  | { kind: 'web' }
  | { kind: 'returning'; startTime: number; fromPos: Vector3; fromYaw: number; fromPitch: number }
  | { kind: 'inspection'; id: InspectionId };

const APPROACH_DURATION_MS = 1150;
const RETURN_DURATION_MS = 1050;
const SWAY_DURATION_MS = 1400;
const DRAG_THRESHOLD_PX = 6;
const PITCH_LIMIT = Math.PI * 0.42;
const LOOK_STEP_RAD = Math.PI / 14;

function yawPitchFromLookAt(from: Vector3, target: Vector3): { yaw: number; pitch: number } {
  const dir = target.clone().sub(from).normalize();
  return {
    yaw: Math.atan2(-dir.x, -dir.z),
    pitch: Math.asin(Math.max(-1, Math.min(1, dir.y))),
  };
}

function poseLookingAt(position: Vector3, target: Vector3): Pose {
  return { position, ...yawPitchFromLookAt(position, target) };
}

function parseTrial(search: string): Trial {
  const params = new URLSearchParams(search);
  const light = params.get('light');
  const pose = params.get('pose');
  return {
    lighting: light !== null && Object.hasOwn(LIGHTING, light) ? light as LightingId : DEFAULT_LIGHTING,
    inspection: pose !== null && Object.hasOwn(INSPECTION_POSES, pose) ? pose as InspectionId : null,
  };
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function lerpAngle(from: number, to: number, t: number): number {
  const delta = normalizeAngle(to - from);
  return normalizeAngle(from + delta * t);
}

function easeInOutSmoother(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const PATIO_LOOK = new Vector3(0.18, 1.03, -0.25);
function patioPoseForAspect(aspect: number): Pose {
  const position = aspect < 0.8 ? new Vector3(0.3, 1.08, 13) : new Vector3(0.3, 1.08, 9.2);
  return poseLookingAt(position, PATIO_LOOK);
}
let PATIO_POSE = patioPoseForAspect(window.innerWidth / window.innerHeight);

const FLOWER_POS = FLOWER_BED.clone().add(new Vector3(1.35, 2.55, 1.65));
const FLOWER_POSE: Pose = poseLookingAt(FLOWER_POS, FLOWER_BED.clone().add(new Vector3(0, 1.55, 0)));

const WEB_POSE = poseLookingAt(WEB_CENTER.clone().add(new Vector3(0, 2.85, 1.72)), WEB_CENTER);

const viewport = document.querySelector('#viewport');
const errorMessage = document.querySelector('#webgl-error');
if (!(viewport instanceof HTMLElement) || !(errorMessage instanceof HTMLElement)) {
  throw new Error('Falta el contenedor de la vista 3D.');
}

const approachButton = document.querySelector<HTMLButtonElement>('#approach');
const approachWebButton = document.querySelector<HTMLButtonElement>('#approach-web');
const returnButton = document.querySelector<HTMLButtonElement>('#return-patio');
const travelStatus = document.querySelector<HTMLElement>('#travel-status');
const viewStatus = document.querySelector<HTMLElement>('#view-status');
const lessonDrawer = document.querySelector<HTMLDialogElement>('#lesson-drawer');
const lessonToggle = document.querySelector<HTMLButtonElement>('#lesson-toggle');
const lessonClose = document.querySelector<HTMLButtonElement>('#lesson-close');

lessonToggle?.addEventListener('click', () => lessonDrawer?.showModal());
lessonClose?.addEventListener('click', () => lessonDrawer?.close());
lessonDrawer?.addEventListener('click', (event) => {
  if (event.target === lessonDrawer) lessonDrawer.close();
});

function setLookButtonsDisabled(disabled: boolean): void {
  document.querySelectorAll<HTMLButtonElement>('#look-left, #look-right, #look-up, #look-down').forEach((button) => {
    button.disabled = disabled;
  });
}

function setAllControlsDisabled(disabled: boolean): void {
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('.viewport-footer button, .viewport-footer input').forEach((button) => {
    button.disabled = disabled;
  });
}

function showError(message: string): void {
  setAllControlsDisabled(true);
  if (errorMessage instanceof HTMLElement) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }
}

function assertNever(value: never): never {
  throw new Error(`Estado de cámara no manejado: ${String(value)}`);
}

function publishRenderStats(canvas: HTMLCanvasElement, renderer: WebGLRenderer): void {
  canvas.dataset.drawCalls = String(renderer.info.render.calls);
  canvas.dataset.triangles = String(renderer.info.render.triangles);
  canvas.dataset.geometries = String(renderer.info.memory.geometries);
  canvas.dataset.textures = String(renderer.info.memory.textures);
}

function installLighting(scene: Scene, renderer: WebGLRenderer, rig: LightRig): void {
  renderer.toneMappingExposure = rig.exposure;
  renderer.shadowMap.type = PCFShadowMap;
  scene.add(new HemisphereLight(rig.sky.color, rig.sky.ground, rig.sky.intensity));
  const sunlight = new DirectionalLight(rig.sun.color, rig.sun.intensity);
  sunlight.position.set(...rig.sun.from);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -9;
  sunlight.shadow.camera.right = 9;
  sunlight.shadow.camera.top = 9;
  sunlight.shadow.camera.bottom = -9;
  sunlight.shadow.camera.near = 0.5;
  sunlight.shadow.camera.far = 32;
  sunlight.shadow.normalBias = 0.03;
  sunlight.shadow.bias = -0.0001;
  sunlight.shadow.radius = rig.sun.shadowRadius;
  scene.add(sunlight);
}

function mount(container: HTMLElement): void {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xdfeaee, 0);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = ACESFilmicToneMapping;

  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Jardín de tarde con una flor y una red horizontal esquemáticas');
  container.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(48, 1, 0.1, 60);
  camera.rotation.order = 'YXZ';

  const trial = parseTrial(window.location.search);
  document.body.dataset.lighting = trial.lighting;
  installLighting(scene, renderer, LIGHTING[trial.lighting]);

  const patio = createPatio();
  scene.add(patio.root);
  const flower = createFlower();
  flower.root.position.copy(FLOWER_BED);
  flower.setView('human');
  flower.setBee(0.72);
  scene.add(flower.root);
  const web = createSpiderWeb();
  scene.add(web.root);
  const webControls = document.querySelector<HTMLElement>('#web-controls');
  const webStatus = document.querySelector<HTMLElement>('#web-status');
  const webApproach = document.querySelector<HTMLButtonElement>('#approach-web');
  const beeSelector = document.querySelector<HTMLElement>('#bee-selector');
  WEB_SECTORS.forEach((sector) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = sector.label;
    button.setAttribute('aria-label', sector.label);
    button.addEventListener('click', () => touchSector(sector));
    document.querySelector('#web-sectors')?.append(button);
    return button;
  });

  const inspection = trial.inspection;
  let cameraState: CameraState = inspection ? { kind: 'inspection', id: inspection } : { kind: 'patio' };
  let yaw = PATIO_POSE.yaw;
  let pitch = PATIO_POSE.pitch;
  let contextAvailable = true;
  let rafId = 0;
  let swayStartedAt: number | null = null;

  const raycaster = new Raycaster();
  const pointerNdc = new Vector2();

  function applyPose(pos: Vector3, nextYaw: number, nextPitch: number): void {
    camera.position.copy(pos);
    yaw = normalizeAngle(nextYaw);
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, nextPitch));
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  function syncUiState(): void {
    document.body.dataset.camera = cameraState.kind;
    const atWeb = cameraState.kind === 'web';
    canvas.setAttribute('aria-label', atWeb ? 'Red horizontal con araña de ocho patas y cuatro sectores numerados. Usa los botones de sector para tocar o responder.' : 'Jardín de tarde con una flor y una red horizontal esquemáticas. Usa los botones para acercarte.');
    if (webControls) webControls.hidden = !atWeb;
    if (beeSelector) beeSelector.hidden = atWeb;
    const beeLesson = document.querySelector<HTMLElement>('#bee-lesson');
    const spiderLesson = document.querySelector<HTMLElement>('#spider-lesson');
    if (beeLesson) beeLesson.hidden = atWeb;
    if (spiderLesson) spiderLesson.hidden = !atWeb;
    const specimenHeading = document.querySelector('#specimen-title');
    if (specimenHeading) specimenHeading.textContent = atWeb ? '02 / RED · VIBRACIONES' : cameraState.kind === 'flower' ? '01 / FLOR · CONTRASTE' : '01 / JARDÍN · EXPLORAR';
    const specimenLabel = document.querySelector('#specimen-label');
    if (specimenLabel) specimenLabel.textContent = atWeb ? 'Uloborus diversus' : 'Rudbeckia hirta';
    if (webApproach) webApproach.disabled = cameraState.kind !== 'patio';
    if (approachButton) approachButton.setAttribute('aria-pressed', String(cameraState.kind === 'patio' || cameraState.kind === 'approaching' && cameraState.destination === 'flower' || cameraState.kind === 'flower'));
    if (approachWebButton) approachWebButton.setAttribute('aria-pressed', String(cameraState.kind === 'web' || cameraState.kind === 'approaching' && cameraState.destination === 'web'));
    document.querySelectorAll<HTMLInputElement>('input[name="view"]').forEach(input => input.disabled = false);
    document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('#web-controls button, #web-controls input').forEach(input => input.disabled = !atWeb);
    if (webStatus) webStatus.textContent = web.status;
    document.body.dataset.webPhase = web.phase;
    if (!contextAvailable) {
      setAllControlsDisabled(true);
      return;
    }
    switch (cameraState.kind) {
      case 'patio':
        if (approachButton) approachButton.disabled = false;
        if (returnButton) returnButton.disabled = true;
        setLookButtonsDisabled(false);
        if (travelStatus) {
          travelStatus.innerHTML = 'Arrastra para mirar el jardín <span>·</span> Toca la flor o la red para acercarte';
        }
        break;
      case 'approaching':
        if (approachButton) approachButton.disabled = true;
        if (returnButton) returnButton.disabled = false;
        setLookButtonsDisabled(true);
        if (travelStatus) travelStatus.textContent = cameraState.destination === 'web' ? 'Acercándose a la red…' : 'Acercándose a la flor…';
        break;
      case 'web':
        if (approachButton) approachButton.disabled = true;
        if (returnButton) returnButton.disabled = false;
        setLookButtonsDisabled(true);
        if (travelStatus) travelStatus.textContent = 'Red horizontal · toca un sector o usa los botones numerados';
        break;
      case 'flower':
        if (approachButton) approachButton.disabled = true;
        if (returnButton) returnButton.disabled = false;
        setLookButtonsDisabled(false);
        if (travelStatus) {
          travelStatus.innerHTML = 'Junto a los pétalos superiores <span>·</span> Cambia de referencia o vuelve al patio';
        }
        break;
      case 'returning':
        if (approachButton) approachButton.disabled = true;
        if (returnButton) returnButton.disabled = true;
        setLookButtonsDisabled(true);
        if (travelStatus) travelStatus.textContent = 'Volviendo al jardín…';
        break;
      case 'inspection':
        document.querySelectorAll<HTMLButtonElement>('.camera-controls button').forEach(button => button.disabled = true);
        if (travelStatus) travelStatus.textContent = 'Vista de inspección · reverso de los pétalos';
        break;
      default:
        assertNever(cameraState);
    }
  }

  function render(): void {
    if (contextAvailable) {
      renderer.render(scene, camera);
      publishRenderStats(canvas, renderer);
      canvas.dataset.ready = 'true';
    }
  }

  function stopTravelLoop(): void {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function stepTravel(now: number): void {
    if (!contextAvailable) {
      stopTravelLoop();
      return;
    }
    rafId = 0;
    const reduced = prefersReducedMotion();
    const webActive = web.update(now, reduced);
    let swayActive = false;
    let flutter = 0;
    if (swayStartedAt !== null) {
      const swayElapsed = Math.max(0, now - swayStartedAt);
      if (reduced || swayElapsed >= SWAY_DURATION_MS) {
        patio.setSway(0);
        flower.setBee(1, 0);
        swayStartedAt = null;
      } else {
        const st = swayElapsed / SWAY_DURATION_MS;
        flutter = Math.sin(st * Math.PI * 2.5) * (1 - st) * (1 - st);
        patio.setSway(flutter);
        swayActive = true;
      }
    }
    if (cameraState.kind === 'approaching' && cameraState.destination === 'flower') {
      const flight = Math.min(1, Math.max(0, now - cameraState.startTime) / APPROACH_DURATION_MS);
      flower.setBee(reduced ? 1 : flight, 0);
    } else if (flutter !== 0) {
      flower.setBee(1, Math.abs(flutter));
    }
    if (cameraState.kind !== 'approaching' && cameraState.kind !== 'returning') {
      render();
      if (webActive || swayActive) rafId = requestAnimationFrame(stepTravel);
      return;
    }
    const duration = cameraState.kind === 'approaching' ? APPROACH_DURATION_MS : RETURN_DURATION_MS;
    const targetPose = cameraState.kind === 'approaching' ? (cameraState.destination === 'web' ? WEB_POSE : FLOWER_POSE) : PATIO_POSE;
    const elapsed = Math.max(0, now - cameraState.startTime);
    const rawT = Math.min(1, elapsed / duration);
    const eased = easeInOutSmoother(rawT);

    const nextPos = cameraState.fromPos.clone().lerp(targetPose.position, eased);
    const nextYaw = lerpAngle(cameraState.fromYaw, targetPose.yaw, eased);
    const nextPitch = cameraState.fromPitch + (targetPose.pitch - cameraState.fromPitch) * eased;
    applyPose(nextPos, nextYaw, nextPitch);
    render();

    if (rawT >= 1) {
      cameraState = cameraState.kind === 'approaching' ? { kind: cameraState.destination } : { kind: 'patio' };
      if (!reduced) swayStartedAt = now;
      syncUiState();
      if (swayStartedAt !== null) rafId = requestAnimationFrame(stepTravel);
      return;
    }
    rafId = requestAnimationFrame(stepTravel);
  }

  function startApproach(destination: 'flower' | 'web' = 'flower'): void {
    if (!contextAvailable || cameraState.kind !== 'patio') return;
    stopTravelLoop();
    swayStartedAt = null;
    patio.setSway(0);
    if (prefersReducedMotion()) {
      const target = destination === 'web' ? WEB_POSE : FLOWER_POSE;
      applyPose(target.position, target.yaw, target.pitch);
      if (destination === 'flower') flower.setBee(1);
      cameraState = { kind: destination };
      syncUiState();
      render();
      return;
    }
    cameraState = {
      kind: 'approaching',
      destination,
      startTime: performance.now(),
      fromPos: camera.position.clone(),
      fromYaw: yaw,
      fromPitch: pitch,
    };
    syncUiState();
    rafId = requestAnimationFrame(stepTravel);
  }

  function startReturn(): void {
    if (!contextAvailable) return;
    if (cameraState.kind !== 'flower' && cameraState.kind !== 'web' && cameraState.kind !== 'approaching') return;
    stopTravelLoop();
    swayStartedAt = null;
    patio.setSway(0);
    web.clear();
    if (prefersReducedMotion()) {
      applyPose(PATIO_POSE.position, PATIO_POSE.yaw, PATIO_POSE.pitch);
      cameraState = { kind: 'patio' };
      syncUiState();
      render();
      return;
    }
    cameraState = {
      kind: 'returning',
      startTime: performance.now(),
      fromPos: camera.position.clone(),
      fromYaw: yaw,
      fromPitch: pitch,
    };
    syncUiState();
    rafId = requestAnimationFrame(stepTravel);
  }

  function applyLookDelta(deltaYaw: number, deltaPitch: number): void {
    if (!contextAvailable) return;
    if (cameraState.kind !== 'patio' && cameraState.kind !== 'flower') return;
    applyPose(camera.position, yaw + deltaYaw, pitch + deltaPitch);
    render();
  }

  function sceneHit(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const webHit = raycaster.intersectObject(web.hitArea)[0];
    const flowerHit = raycaster.intersectObject(flower.root, true)[0];
    if (webHit && (!flowerHit || webHit.distance < flowerHit.distance)) return { kind: 'web' as const, point: webHit.point };
    return flowerHit ? { kind: 'flower' as const } : null;
  }

  let activePointerId: number | null = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let dragDistance = 0;

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (activePointerId !== null) return;
    activePointerId = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    dragDistance = 0;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (activePointerId === event.pointerId) {
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      dragDistance += Math.hypot(dx, dy);
      if (dragDistance > 3) {
        applyLookDelta(dx * 0.0045, dy * 0.0045);
      }
      return;
    }
    if (event.pointerType === 'mouse' && cameraState.kind === 'patio') {
      canvas.style.cursor = sceneHit(event.clientX, event.clientY) ? 'pointer' : 'grab';
    } else {
      canvas.style.cursor = 'grab';
    }
  });

  canvas.addEventListener('pointerup', (event) => {
    if (activePointerId !== event.pointerId) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    activePointerId = null;
    if (dragDistance > DRAG_THRESHOLD_PX || !contextAvailable) return;
    const hit = sceneHit(event.clientX, event.clientY);
    if (cameraState.kind === 'patio' && hit) startApproach(hit.kind);
    else if (cameraState.kind === 'web' && hit?.kind === 'web') touchSector(web.sectorAt(hit.point));
  });

  canvas.addEventListener('pointercancel', (event) => {
    if (activePointerId === event.pointerId) {
      activePointerId = null;
    }
  });

  canvas.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        applyLookDelta(LOOK_STEP_RAD, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        applyLookDelta(-LOOK_STEP_RAD, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        applyLookDelta(0, LOOK_STEP_RAD);
        break;
      case 'ArrowDown':
        event.preventDefault();
        applyLookDelta(0, -LOOK_STEP_RAD);
        break;
      case 'Enter':
      case ' ':
        if (cameraState.kind === 'patio') {
          event.preventDefault();
          startApproach();
        }
        break;
    }
  });

  const resize = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 58 : 48;
    camera.updateProjectionMatrix();
    PATIO_POSE = patioPoseForAspect(camera.aspect);
    if (cameraState.kind === 'patio') applyPose(PATIO_POSE.position, PATIO_POSE.yaw, PATIO_POSE.pitch);
    renderer.setSize(width, height);
    render();
  });
  resize.observe(container);

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stopTravelLoop();
    swayStartedAt = null;
    patio.setSway(0);
    web.clear();
    if (cameraState.kind === 'approaching' || cameraState.kind === 'returning') {
      applyPose(PATIO_POSE.position, PATIO_POSE.yaw, PATIO_POSE.pitch);
      cameraState = { kind: 'patio' };
    }
    contextAvailable = false;
    activePointerId = null;
    canvas.hidden = true;
    syncUiState();
    showError('La vista 3D se ha interrumpido. Recarga la página para recuperar el patio. La explicación y las fuentes siguen disponibles.');
  });

  canvas.addEventListener('webglcontextrestored', () => {
    contextAvailable = true;
    canvas.hidden = false;
    if (errorMessage instanceof HTMLElement) errorMessage.hidden = true;
    syncUiState();
    render();
  });

  document.querySelectorAll<HTMLInputElement>('input[name="view"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked || (input.value !== 'human' && input.value !== 'uv')) return;
      const nextView: View = input.value;
      flower.setView(nextView);
      document.body.dataset.view = nextView;
      if (viewStatus) {
        viewStatus.textContent = nextView === 'uv'
          ? 'Colores explicativos: el contraste UV solo se aplica a los pétalos superiores; la red tiene su propia representación.'
          : 'Referencia humana: los pétalos se ven amarillos. Selecciona «Contraste UV» para ver las dos regiones.';
      }
      render();
    });
  });

  function signalChanged(): void {
    web.update(performance.now(), prefersReducedMotion());
    syncUiState();
    render();
    if (rafId === 0) rafId = requestAnimationFrame(stepTravel);
  }
  function touchSector(sector: Sector): void {
    if (!contextAvailable || cameraState.kind !== 'web') return;
    web.touch(sector, performance.now(), prefersReducedMotion());
    signalChanged();
  }
  document.querySelector('#new-round')?.addEventListener('click', () => {
    if (!contextAvailable || cameraState.kind !== 'web') return;
    web.newRound(performance.now(), prefersReducedMotion());
    signalChanged();
  });
  document.querySelector('#repeat-signal')?.addEventListener('click', () => {
    if (!contextAvailable || cameraState.kind !== 'web') return;
    web.repeat(performance.now(), prefersReducedMotion());
    signalChanged();
  });
  document.querySelectorAll<HTMLInputElement>('input[name="web-view"]').forEach(input => input.addEventListener('change', () => {
    if (!contextAvailable || !input.checked || (input.value !== 'human' && input.value !== 'vibrations')) return;
    web.setView(input.value);
    signalChanged();
  }));
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    if (!contextAvailable) return;
    if (prefersReducedMotion()) {
      swayStartedAt = null;
      patio.setSway(0);
    }
    if (prefersReducedMotion() && (cameraState.kind === 'approaching' || cameraState.kind === 'returning')) {
      const target = cameraState.kind === 'returning' ? PATIO_POSE : cameraState.destination === 'web' ? WEB_POSE : FLOWER_POSE;
      const kind = cameraState.kind === 'returning' ? 'patio' : cameraState.destination;
      stopTravelLoop();
      applyPose(target.position, target.yaw, target.pitch);
      cameraState = { kind };
    }
    signalChanged();
  });
  approachButton?.addEventListener('click', () => startApproach());
  webApproach?.addEventListener('click', () => startApproach('web'));
  returnButton?.addEventListener('click', startReturn);
  document.querySelector('#look-left')?.addEventListener('click', () => applyLookDelta(LOOK_STEP_RAD, 0));
  document.querySelector('#look-right')?.addEventListener('click', () => applyLookDelta(-LOOK_STEP_RAD, 0));
  document.querySelector('#look-up')?.addEventListener('click', () => applyLookDelta(0, LOOK_STEP_RAD));
  document.querySelector('#look-down')?.addEventListener('click', () => applyLookDelta(0, -LOOK_STEP_RAD));

  const initialPose = inspection ? INSPECTION_POSES[inspection] : PATIO_POSE;
  applyPose(initialPose.position, initialPose.yaw, initialPose.pitch);
  syncUiState();
  render();
}

try {
  mount(viewport);
} catch {
  viewport.querySelector('canvas')?.remove();
  showError('No se ha podido iniciar la vista 3D. Prueba a recargar la página o a usar un navegador con WebGL. Puedes seguir leyendo la explicación y las fuentes.');
}
