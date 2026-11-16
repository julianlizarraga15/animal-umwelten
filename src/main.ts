import './style.css';
import {
  ACESFilmicToneMapping, AmbientLight, DirectionalLight, HemisphereLight,
  PCFSoftShadowMap, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3,
  WebGLRenderer,
} from 'three';
import { createFlower, type View } from './flower';
import { createPatio } from './patio';

type Pose = { position: Vector3; yaw: number; pitch: number };

type CameraState =
  | { kind: 'patio' }
  | { kind: 'approaching'; startTime: number; fromPos: Vector3; fromYaw: number; fromPitch: number }
  | { kind: 'flower' }
  | { kind: 'returning'; startTime: number; fromPos: Vector3; fromYaw: number; fromPitch: number };

const APPROACH_DURATION_MS = 1050;
const RETURN_DURATION_MS = 950;
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

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function lerpAngle(from: number, to: number, t: number): number {
  const delta = normalizeAngle(to - from);
  return normalizeAngle(from + delta * t);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const PATIO_POS = new Vector3(4.2, 1.5, 5.0);
const PATIO_POSE: Pose = {
  position: PATIO_POS,
  ...yawPitchFromLookAt(PATIO_POS, new Vector3(0, 1.1, 0)),
};

const FLOWER_POS = new Vector3(1.55, 3.35, 1.95);
const FLOWER_POSE: Pose = {
  position: FLOWER_POS,
  ...yawPitchFromLookAt(FLOWER_POS, new Vector3(0, 1.5, 0)),
};

const viewport = document.querySelector('#viewport');
const errorMessage = document.querySelector('#webgl-error');
if (!(viewport instanceof HTMLElement) || !(errorMessage instanceof HTMLElement)) {
  throw new Error('Falta el contenedor de la vista 3D.');
}

const approachButton = document.querySelector<HTMLButtonElement>('#approach');
const returnButton = document.querySelector<HTMLButtonElement>('#return-patio');
const travelStatus = document.querySelector<HTMLElement>('#travel-status');
const viewStatus = document.querySelector<HTMLElement>('#view-status');

function setLookButtonsDisabled(disabled: boolean): void {
  document.querySelectorAll<HTMLButtonElement>('#look-left, #look-right, #look-up, #look-down').forEach((button) => {
    button.disabled = disabled;
  });
}

function setAllControlsDisabled(disabled: boolean): void {
  document.querySelectorAll<HTMLButtonElement>('.camera-controls button').forEach((button) => {
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

function mount(container: HTMLElement): void {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xdfeaee, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Patio con maceta y flor esquemática de Rudbeckia hirta');
  container.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(48, 1, 0.1, 60);
  camera.rotation.order = 'YXZ';

  scene.add(new HemisphereLight(0xfff9ea, 0x7a7b6c, 2.4));
  scene.add(new AmbientLight(0xffffff, 0.35));
  const sunlight = new DirectionalLight(0xfff7e6, 3.1);
  sunlight.position.set(5, 9, 5);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -7;
  sunlight.shadow.camera.right = 7;
  sunlight.shadow.camera.top = 7;
  sunlight.shadow.camera.bottom = -7;
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 26;
  sunlight.shadow.normalBias = 0.03;
  sunlight.shadow.bias = -0.0001;
  scene.add(sunlight);

  scene.add(createPatio());
  const flower = createFlower();
  flower.setView('uv');
  scene.add(flower.root);

  let cameraState: CameraState = { kind: 'patio' };
  let yaw = PATIO_POSE.yaw;
  let pitch = PATIO_POSE.pitch;
  let contextAvailable = true;
  let rafId = 0;

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
          travelStatus.innerHTML = 'Arrastra para mirar alrededor <span>·</span> Toca la flor para acercarte';
        }
        break;
      case 'approaching':
        if (approachButton) approachButton.disabled = true;
        if (returnButton) returnButton.disabled = false;
        setLookButtonsDisabled(true);
        if (travelStatus) travelStatus.textContent = 'Acercándose a la flor…';
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
        if (travelStatus) travelStatus.textContent = 'Volviendo al patio…';
        break;
      default:
        assertNever(cameraState);
    }
  }

  function render(): void {
    if (contextAvailable) {
      renderer.render(scene, camera);
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
    if (cameraState.kind !== 'approaching' && cameraState.kind !== 'returning') {
      rafId = 0;
      return;
    }
    const duration = cameraState.kind === 'approaching' ? APPROACH_DURATION_MS : RETURN_DURATION_MS;
    const targetPose = cameraState.kind === 'approaching' ? FLOWER_POSE : PATIO_POSE;
    const elapsed = Math.max(0, now - cameraState.startTime);
    const rawT = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(rawT);

    const nextPos = cameraState.fromPos.clone().lerp(targetPose.position, eased);
    const nextYaw = lerpAngle(cameraState.fromYaw, targetPose.yaw, eased);
    const nextPitch = cameraState.fromPitch + (targetPose.pitch - cameraState.fromPitch) * eased;
    applyPose(nextPos, nextYaw, nextPitch);
    render();

    if (rawT >= 1) {
      rafId = 0;
      cameraState = cameraState.kind === 'approaching' ? { kind: 'flower' } : { kind: 'patio' };
      syncUiState();
      return;
    }
    rafId = requestAnimationFrame(stepTravel);
  }

  function startApproach(): void {
    if (!contextAvailable || cameraState.kind !== 'patio') return;
    stopTravelLoop();
    if (prefersReducedMotion()) {
      applyPose(FLOWER_POSE.position, FLOWER_POSE.yaw, FLOWER_POSE.pitch);
      cameraState = { kind: 'flower' };
      syncUiState();
      render();
      return;
    }
    cameraState = {
      kind: 'approaching',
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
    if (cameraState.kind !== 'flower' && cameraState.kind !== 'approaching') return;
    stopTravelLoop();
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

  function hitsFlower(clientX: number, clientY: number): boolean {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    return raycaster.intersectObject(flower.root, true).length > 0;
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
      canvas.style.cursor = hitsFlower(event.clientX, event.clientY) ? 'pointer' : 'grab';
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
    if (dragDistance <= DRAG_THRESHOLD_PX && cameraState.kind === 'patio' && hitsFlower(event.clientX, event.clientY)) {
      startApproach();
    }
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
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    render();
  });
  resize.observe(container);

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stopTravelLoop();
    if (cameraState.kind === 'approaching' || cameraState.kind === 'returning') {
      applyPose(PATIO_POSE.position, PATIO_POSE.yaw, PATIO_POSE.pitch);
      cameraState = { kind: 'patio' };
    }
    contextAvailable = false;
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
          ? 'Colores explicativos: el contraste UV está en la cara superior de los pétalos. El resto del patio es solo contexto espacial.'
          : 'Referencia humana: los pétalos se ven amarillos. Selecciona «Contraste UV» para ver las dos regiones.';
      }
      render();
    });
  });

  approachButton?.addEventListener('click', startApproach);
  returnButton?.addEventListener('click', startReturn);
  document.querySelector('#look-left')?.addEventListener('click', () => applyLookDelta(LOOK_STEP_RAD, 0));
  document.querySelector('#look-right')?.addEventListener('click', () => applyLookDelta(-LOOK_STEP_RAD, 0));
  document.querySelector('#look-up')?.addEventListener('click', () => applyLookDelta(0, LOOK_STEP_RAD));
  document.querySelector('#look-down')?.addEventListener('click', () => applyLookDelta(0, -LOOK_STEP_RAD));

  applyPose(PATIO_POSE.position, PATIO_POSE.yaw, PATIO_POSE.pitch);
  syncUiState();
  render();
}

try {
  mount(viewport);
} catch {
  viewport.querySelector('canvas')?.remove();
  showError('No se ha podido iniciar la vista 3D. Prueba a recargar la página o a usar un navegador con WebGL. Puedes seguir leyendo la explicación y las fuentes.');
}
