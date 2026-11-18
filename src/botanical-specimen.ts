import "./botanical-specimen.css";
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
  type Texture,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type SpecimenId = "syngonium" | "sunflower";
type LightId = "neutral" | "afternoon";
type ViewId = "overview" | "close" | "oblique";

const SPECIMENS = {
  syngonium: {
    url: "/assets/potted-plant-02/potted_plant_02_2k.gltf",
    label: "Syngonium, Poly Haven, CC0. Hojas anchas y terracota. No es la flor de la lección.",
  },
  sunflower: {
    url: "/assets/sunflower-grab3d/sunflower.glb",
    label: "Girasol, Grab3D, CC0. Pétalos y hojas con volumen. No es la flor de la lección.",
  },
} as const satisfies Record<SpecimenId, { url: string; label: string }>;

const LIGHTS = {
  neutral: { clear: 0xb7aea4, sky: 0xf4f1ec, ground: 0x8d8680, fill: 1.15, sun: 0xfff6ee, intensity: 2.8, exposure: 1 },
  afternoon: { clear: 0xc48962, sky: 0xffe4c4, ground: 0x65556f, fill: 1.18, sun: 0xffbe7a, intensity: 4.5, exposure: 1.1 },
} as const satisfies Record<LightId, {
  clear: number; sky: number; ground: number; fill: number; sun: number; intensity: number; exposure: number;
}>;

function requiredElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Falta ${selector}.`);
  return element;
}

const viewport = requiredElement("#viewport");
const status = requiredElement("#status");

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.domElement.setAttribute("aria-label", "Muestra botánica aislada, fuera del jardín");
viewport.append(renderer.domElement);

const scene = new Scene();
const camera = new PerspectiveCamera(42, 1, 0.02, 40);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
const fill = new HemisphereLight(0xffffff, 0x888888, 1);
const sun = new DirectionalLight(0xffffff, 1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.02;
scene.add(fill, sun, sun.target);
const ground = new Mesh(
  new PlaneGeometry(1, 1),
  new MeshStandardMaterial({ color: 0xa56b45, roughness: 0.92, metalness: 0 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const loader = new GLTFLoader();
let specimen: Object3D | null = null;
let specimenId: SpecimenId = "syngonium";
let lightId: LightId = "afternoon";
let viewId: ViewId = "overview";
let request = 0;
let pendingFrames = 0;
let interacting = false;
let loopStarted = false;

function assertNever(value: never): never {
  throw new Error(`Valor no manejado: ${String(value)}`);
}

function disposeObject(root: Object3D): void {
  const textures = new Set<Texture>();
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.geometry.dispose();
    const materials: Material[] = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value && typeof value === "object" && "isTexture" in value) textures.add(value as Texture);
      }
      material.dispose();
    }
  });
  for (const texture of textures) texture.dispose();
}

function applyLight(id: LightId): void {
  const rig = LIGHTS[id];
  renderer.toneMappingExposure = rig.exposure;
  renderer.setClearColor(new Color(rig.clear));
  fill.color.setHex(rig.sky);
  fill.groundColor.setHex(rig.ground);
  fill.intensity = rig.fill;
  sun.color.setHex(rig.sun);
  sun.intensity = rig.intensity;
}

function frame(id: ViewId): void {
  if (!specimen) return;
  specimen.updateWorldMatrix(true, true);
  const box = new Box3().setFromObject(specimen);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const span = Math.max(size.x, size.y, size.z, 0.2);
  let target = center.clone();
  let distance = span * 1.85;
  let direction = new Vector3(0.45, 0.32, 1);
  if (id === "close") {
    target = new Vector3(center.x, box.max.y - size.y * 0.18, center.z);
    distance = span * 0.62;
  } else if (id === "oblique") {
    target = new Vector3(center.x, box.min.y + size.y * 0.62, center.z);
    distance = span * 1.05;
    direction = new Vector3(1.15, -0.08, 0.2);
  } else if (id !== "overview") {
    assertNever(id);
  }
  camera.position.copy(target).addScaledVector(direction.normalize(), distance);
  camera.near = Math.max(0.01, distance / 80);
  camera.far = distance * 30;
  camera.updateProjectionMatrix();
  controls.target.copy(target);
  controls.minDistance = distance * 0.2;
  controls.maxDistance = distance * 5;
  controls.update();
  const shadowSpan = span * 1.4;
  sun.position.copy(center).add(new Vector3(-shadowSpan, shadowSpan * 1.3, shadowSpan * 0.8));
  sun.target.position.copy(center);
  sun.shadow.camera.left = -shadowSpan;
  sun.shadow.camera.right = shadowSpan;
  sun.shadow.camera.top = shadowSpan;
  sun.shadow.camera.bottom = -shadowSpan;
  sun.shadow.camera.near = shadowSpan * 0.2;
  sun.shadow.camera.far = shadowSpan * 6;
  sun.shadow.camera.updateProjectionMatrix();
  ground.position.set(center.x, box.min.y - 0.004, center.z);
  ground.scale.set(span * 6, span * 6, 1);
}

function renderSoon(): void {
  pendingFrames = 2;
  if (loopStarted) return;
  loopStarted = true;
  const loop = (): void => {
    if (!interacting && pendingFrames <= 0) {
      loopStarted = false;
      return;
    }
    renderer.render(scene, camera);
    if (!interacting) pendingFrames -= 1;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

async function showSpecimen(id: SpecimenId): Promise<void> {
  const current = ++request;
  status.textContent = "Cargando modelo…";
  let gltf;
  try {
    gltf = await loader.loadAsync(SPECIMENS[id].url);
  } catch (error) {
    if (current !== request) return;
    status.textContent = `No se pudo cargar el modelo: ${error instanceof Error ? error.message : "error desconocido"}`;
    return;
  }
  if (current !== request) return;
  if (specimen) {
    scene.remove(specimen);
    disposeObject(specimen);
  }
  specimen = gltf.scene;
  specimen.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  scene.add(specimen);
  frame(viewId);
  status.textContent = SPECIMENS[id].label;
  renderSoon();
}

function selectButton(selector: string, value: string): void {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.specimen === value || button.dataset.light === value || button.dataset.view === value));
  });
}

document.querySelectorAll<HTMLButtonElement>("[data-specimen]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.specimen;
    if (id !== "syngonium" && id !== "sunflower") return;
    specimenId = id;
    selectButton("[data-specimen]", id);
    void showSpecimen(id);
  });
});
document.querySelectorAll<HTMLButtonElement>("[data-light]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.light;
    if (id !== "neutral" && id !== "afternoon") return;
    lightId = id;
    selectButton("[data-light]", id);
    applyLight(id);
    renderSoon();
  });
});
document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.view;
    if (id !== "overview" && id !== "close" && id !== "oblique") return;
    viewId = id;
    selectButton("[data-view]", id);
    frame(id);
    renderSoon();
  });
});
controls.addEventListener("start", () => {
  interacting = true;
  renderSoon();
});
controls.addEventListener("change", () => renderSoon());
controls.addEventListener("end", () => {
  interacting = false;
  pendingFrames = 1;
  renderSoon();
});

function resize(): void {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
  renderSoon();
}
resize();
window.addEventListener("resize", resize);
applyLight(lightId);
void showSpecimen(specimenId);
