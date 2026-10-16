import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

export interface HumanAppearance {
  skin: string;
  shirt: string;
  hair: string;
}

export type HumanBody = "male" | "female";
export type HumanOutfit =
  | "construction"
  | "office"
  | "healthcare"
  | "events"
  | "manufacturing"
  | "energy";

export interface HumanSpec {
  id: string;
  body: HumanBody;
  appearance: HumanAppearance;
  outfit: HumanOutfit;
  hardhat?: boolean;
  height?: number;
}

export interface HumanDiagnostics {
  id: string;
  body: HumanBody;
  outfit: HumanOutfit;
  height: number;
  meshCount: number;
  skinnedMeshCount: number;
  boneCount: number;
  triangleCount: number;
  clips: string[];
  currentAnimation: "Idle" | "Walk";
  mixerTime: number;
  animationTime: number;
  walkWeight: number;
  disposed: boolean;
}

export interface HumanCharacter {
  /** Gameplay owns only this root's position/yaw. The visual child never moves it. */
  group: THREE.Group;
  setAppearance(appearance: HumanAppearance): void;
  update(
    dt: number,
    actualSpeed: number,
    reducedMotion: boolean,
    paused?: boolean,
  ): void;
  getDiagnostics(): HumanDiagnostics;
  dispose(): void;
}

export interface HumanLibrary {
  create(spec: HumanSpec): HumanCharacter;
  /** Stops new instances; shared GPU assets release after the last instance disposes. */
  dispose(): void;
}

export const HUMAN_ASSET_URLS: Readonly<Record<HumanBody, string>> = {
  male: `${import.meta.env.BASE_URL}models/humans/human-male.glb`,
  female: `${import.meta.env.BASE_URL}models/humans/human-female.glb`,
};

const MAX_ASSET_BYTES = 24 * 1024 * 1024;
const REQUIRED_CLIPS = ["Idle", "Walk"] as const;
const INDUSTRIAL_OUTFITS: readonly HumanOutfit[] = [
  "construction",
  "manufacturing",
  "energy",
];
const OUTFIT_COLOURS: Record<HumanOutfit, { trousers: string; shoes: string }> =
  {
    construction: { trousers: "#43515c", shoes: "#3b3027" },
    office: { trousers: "#344355", shoes: "#302c2b" },
    healthcare: { trousers: "#54868a", shoes: "#e1e8e8" },
    events: { trousers: "#303139", shoes: "#292a2c" },
    manufacturing: { trousers: "#53616b", shoes: "#3a332c" },
    energy: { trousers: "#3c5452", shoes: "#36322a" },
  };

interface Resources {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
  textures: Set<THREE.Texture>;
  skeletons: Set<THREE.Skeleton>;
}

function emptyResources(): Resources {
  return {
    geometries: new Set(),
    materials: new Set(),
    textures: new Set(),
    skeletons: new Set(),
  };
}

function collectResources(root: THREE.Object3D, resources: Resources): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    resources.geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      resources.materials.add(material);
      // Normal, ORM, alpha and emissive textures need release just as base colour does.
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) resources.textures.add(value);
    }
    if (object instanceof THREE.SkinnedMesh)
      resources.skeletons.add(object.skeleton);
  });
}

function releaseResources(resources: Resources): void {
  resources.skeletons.forEach((skeleton) => skeleton.dispose());
  resources.geometries.forEach((geometry) => geometry.dispose());
  resources.materials.forEach((material) => material.dispose());
  const images = new Set<unknown>();
  resources.textures.forEach((texture) => {
    texture.dispose();
    images.add(texture.image);
  });
  images.forEach((image) => {
    // ImageBitmap storage survives Texture.dispose; HTML images have no close method.
    if (image && typeof image === "object" && "close" in image)
      (image as { close?: () => void }).close?.();
  });
}

function validateHuman(gltf: GLTF, body: HumanBody): void {
  let skinnedMeshes = 0;
  const bones = new Set<THREE.Bone>();
  gltf.scene.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    skinnedMeshes++;
    object.skeleton.bones.forEach((bone) => bones.add(bone));
    if (
      !object.geometry.getAttribute("skinIndex") ||
      !object.geometry.getAttribute("skinWeight")
    )
      throw new Error(`${body} human has an unweighted skinned mesh.`);
  });
  if (!skinnedMeshes || bones.size < 20)
    throw new Error(
      `${body} human does not contain a complete human skeleton.`,
    );
  for (const name of REQUIRED_CLIPS) {
    const clip = gltf.animations.find((animation) => animation.name === name);
    if (!clip || clip.duration <= 0 || !clip.tracks.length)
      throw new Error(`${body} human is missing its ${name} animation.`);
  }
  const bounds = bodyBounds(gltf.scene);
  const height = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(height) || height < 0.1)
    throw new Error(`${body} human has invalid body bounds.`);
}

function safeColour(value: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function materialKind(name: string): string {
  return name.toLowerCase().replace(/[._\s]\d+$/, "");
}

/** Measure the body without removable PPE, so a hat never shrinks the person. */
function bodyBounds(root: THREE.Object3D): THREE.Box3 {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.name.startsWith("PPE_"))
      return;
    if (object instanceof THREE.SkinnedMesh) {
      object.computeBoundingBox();
      if (object.boundingBox)
        bounds.union(
          object.boundingBox.clone().applyMatrix4(object.matrixWorld),
        );
    } else {
      object.geometry.computeBoundingBox();
      if (object.geometry.boundingBox)
        bounds.union(
          object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld),
        );
    }
  });
  return bounds;
}

function instanceHuman(
  source: GLTF,
  spec: HumanSpec,
  releaseInstance: () => void,
): HumanCharacter {
  const group = new THREE.Group();
  group.name = `human-${spec.id}`;
  group.userData.humanId = spec.id;
  const model = cloneSkeleton(source.scene);
  const materials = new Map<THREE.Material, THREE.Material>();
  const skeletons = new Set<THREE.Skeleton>();
  const bones = new Set<THREE.Bone>();
  let meshCount = 0;
  let skinnedMeshCount = 0;
  let triangleCount = 0;
  model.traverse((object) => {
    if (object.name.startsWith("Wardrobe_Scrub"))
      object.visible = spec.outfit === "healthcare";
    if (object.name === "Shirt" || object.name === "Trousers")
      object.visible = spec.outfit !== "healthcare";
    if (object.name.startsWith("PPE_Hardhat"))
      object.visible = Boolean(spec.hardhat);
    if (object.name.startsWith("PPE_Vest"))
      object.visible = INDUSTRIAL_OUTFITS.includes(spec.outfit);
    if (!(object instanceof THREE.Mesh)) return;
    meshCount++;
    triangleCount +=
      (object.geometry.index?.count ??
        object.geometry.getAttribute("position").count) / 3;
    // The environment's shadows are baked. A dynamic contact shadow is owned by the world.
    object.castShadow = false;
    object.receiveShadow = true;
    if (object instanceof THREE.SkinnedMesh) {
      skinnedMeshCount++;
      skeletons.add(object.skeleton);
      object.skeleton.bones.forEach((bone) => bones.add(bone));
      // Avoid invalid bind-pose bounds while extremities move with the walk cycle.
      object.frustumCulled = false;
    }
    const cloneMaterial = (original: THREE.Material) => {
      let material = materials.get(original);
      if (!material) {
        material = original.clone();
        materials.set(original, material);
      }
      return material;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(cloneMaterial)
      : cloneMaterial(object.material);
  });
  const bounds = bodyBounds(model);
  const sourceHeight = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(sourceHeight) || sourceHeight < 0.1)
    throw new Error("The human asset has invalid body bounds.");
  const height = THREE.MathUtils.clamp(
    Number.isFinite(spec.height) ? spec.height! : 1.75,
    1.5,
    2.05,
  );
  const visual = new THREE.Group();
  visual.name = "human-metres-feet-origin";
  const scale = height / sourceHeight;
  visual.scale.setScalar(scale);
  visual.position.y = -bounds.min.y * scale;
  visual.add(model);
  group.add(visual);

  const mixer = new THREE.AnimationMixer(model);
  const idle = mixer.clipAction(
    source.animations.find((clip) => clip.name === "Idle")!,
  );
  const walk = mixer.clipAction(
    source.animations.find((clip) => clip.name === "Walk")!,
  );
  // Start both clips once; continuous weights blend naturally without repeated restart.
  idle.play().setEffectiveWeight(1);
  walk.play().setEffectiveWeight(0);
  const phase = [...spec.id].reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  );
  idle.time = ((phase % 97) / 97) * idle.getClip().duration;
  mixer.update(0);
  let walkWeight = 0;
  let currentAnimation: "Idle" | "Walk" = "Idle";
  let disposed = false;

  const setAppearance = (appearance: HumanAppearance) => {
    if (disposed) return;
    const palette = OUTFIT_COLOURS[spec.outfit];
    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      const kind = materialKind(material.name);
      if (kind === "skin")
        material.color.set(safeColour(appearance.skin, "#bd8c69"));
      else if (kind === "hair" || kind === "eyebrows")
        material.color.set(safeColour(appearance.hair, "#302922"));
      else if (kind === "shirt")
        material.color.set(safeColour(appearance.shirt, "#467b82"));
      else if (kind === "trousers") material.color.set(palette.trousers);
      else if (kind === "shoes") material.color.set(palette.shoes);
      else if (kind === "vest")
        material.color.set(spec.outfit === "energy" ? "#d7b931" : "#e68c20");
      else if (
        kind === "scrubtop" ||
        kind === "scrubtrousers" ||
        kind === "scrubpocket"
      )
        material.color.set("#67969a");
    });
  };
  setAppearance(spec.appearance);

  return {
    group,
    setAppearance,
    update(dt, actualSpeed, reducedMotion, paused = false) {
      if (disposed || paused || !Number.isFinite(dt) || dt <= 0) return;
      const delta = Math.min(dt, 0.25);
      const speed = Number.isFinite(actualSpeed) ? Math.max(0, actualSpeed) : 0;
      const moving = speed > 0.04 && !reducedMotion;
      currentAnimation = moving ? "Walk" : "Idle";
      walkWeight = reducedMotion
        ? 0
        : THREE.MathUtils.lerp(
            walkWeight,
            Number(moving),
            1 - Math.exp(-delta * 14),
          );
      walk.setEffectiveWeight(walkWeight);
      idle.setEffectiveWeight(1 - walkWeight);
      walk.setEffectiveTimeScale(THREE.MathUtils.clamp(speed / 1.4, 0.3, 2.5));
      // Reduced motion holds the authored natural idle pose rather than the bind pose.
      mixer.update(reducedMotion ? 0 : delta);
    },
    getDiagnostics() {
      return {
        id: spec.id,
        body: spec.body,
        outfit: spec.outfit,
        height,
        meshCount,
        skinnedMeshCount,
        boneCount: bones.size,
        triangleCount: Math.round(triangleCount),
        clips: [...REQUIRED_CLIPS],
        currentAnimation,
        mixerTime: mixer.time,
        animationTime: currentAnimation === "Walk" ? walk.time : idle.time,
        walkWeight,
        disposed,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      skeletons.forEach((skeleton) => skeleton.dispose());
      materials.forEach((material) => material.dispose());
      group.removeFromParent();
      group.clear();
      releaseInstance();
    },
  };
}

/** One effect-local asset library: five actors share GPU geometry/textures, never bones. */
export async function loadHumanLibrary(
  options: { signal?: AbortSignal } = {},
): Promise<HumanLibrary> {
  const loader = new GLTFLoader();
  const resources = emptyResources();
  const bodies = Object.keys(HUMAN_ASSET_URLS) as HumanBody[];
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 30_000);
  const results = await Promise.allSettled(
    bodies.map(async (body) => {
      const url = HUMAN_ASSET_URLS[body];
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok)
        throw new Error(
          `${body} character asset returned HTTP ${response.status}.`,
        );
      const declaredLength = Number(response.headers.get("content-length"));
      if (declaredLength > MAX_ASSET_BYTES)
        throw new Error(
          `${body} character exceeds the game-ready asset budget.`,
        );
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_ASSET_BYTES)
        throw new Error(
          `${body} character exceeds the game-ready asset budget.`,
        );
      if (controller.signal.aborted)
        throw new DOMException(
          "Character loading was cancelled.",
          "AbortError",
        );
      const gltf = await loader.parseAsync(
        buffer,
        url.substring(0, url.lastIndexOf("/") + 1),
      );
      collectResources(gltf.scene, resources);
      validateHuman(gltf, body);
      return gltf;
    }),
  );
  clearTimeout(timeout);
  options.signal?.removeEventListener("abort", cancel);
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected" || controller.signal.aborted) {
    releaseResources(resources);
    if (options.signal?.aborted)
      throw new DOMException("Character loading was cancelled.", "AbortError");
    if (timedOut)
      throw new Error(
        "The human character download timed out. Please try again.",
      );
    throw new Error("The human character assets could not be prepared.", {
      cause: failure?.reason,
    });
  }
  const sources = Object.fromEntries(
    bodies.map((body, index) => [
      body,
      (results[index] as PromiseFulfilledResult<GLTF>).value,
    ]),
  ) as Record<HumanBody, GLTF>;
  let instanceCount = 0;
  let closed = false;
  let released = false;
  const releaseWhenUnused = () => {
    if (closed && instanceCount === 0 && !released) {
      released = true;
      releaseResources(resources);
    }
  };
  return {
    create(spec) {
      if (closed) throw new Error("The human character library is closed.");
      const instance = instanceHuman(sources[spec.body], spec, () => {
        instanceCount--;
        releaseWhenUnused();
      });
      instanceCount++;
      return instance;
    },
    dispose() {
      closed = true;
      releaseWhenUnused();
    },
  };
}
