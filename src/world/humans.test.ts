import { readFileSync } from "node:fs";
import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadHumanLibrary, type HumanCharacter, type HumanSpec } from "./humans";

const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    parseAsync = parse;
  },
}));

function fixture(): GLTF {
  const scene = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-0.2, 0, 0, 0.2, 0, 0, 0, 1.75, 0], 3),
  );
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(new Array(12).fill(0), 4));
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4),
  );
  const skin = new THREE.MeshStandardMaterial({ map: new THREE.Texture() });
  skin.name = "Skin";
  skin.normalMap = new THREE.Texture();
  const shirt = new THREE.MeshStandardMaterial();
  shirt.name = "Shirt";
  const mesh = new THREE.SkinnedMesh(geometry, [skin, shirt]);
  mesh.name = "human-body";
  const bones = Array.from({ length: 30 }, (_, index) => {
    const bone = new THREE.Bone();
    bone.name = index === 1 ? "head" : `bone_${index}`;
    return bone;
  });
  for (let index = 1; index < bones.length; index++) bones[0].add(bones[index]);
  mesh.add(bones[0]);
  mesh.bind(new THREE.Skeleton(bones));
  scene.add(mesh);
  const animations = [
    new THREE.AnimationClip("Idle", 2, [
      new THREE.NumberKeyframeTrack("head.position[y]", [0, 1, 2], [0, 0.015, 0]),
    ]),
    new THREE.AnimationClip("Walk", 1, [
      new THREE.NumberKeyframeTrack("head.position[y]", [0, 0.5, 1], [0, 0.04, 0]),
    ]),
  ];
  return { scene, animations } as GLTF;
}

function skinned(character: HumanCharacter): THREE.SkinnedMesh {
  let result: THREE.SkinnedMesh | undefined;
  character.group.traverse((object) => {
    if (object instanceof THREE.SkinnedMesh) result = object;
  });
  return result!;
}

const spec: HumanSpec = {
  id: "intern",
  body: "male",
  appearance: { skin: "#a9714b", shirt: "#167a79", hair: "#26211e" },
  outfit: "construction",
};

beforeEach(() => {
  parse.mockReset();
  parse.mockImplementation(async () => fixture());
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(new Uint8Array([0]), { status: 200 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("rigged human runtime", () => {
  it("uses independent skeletons and tint materials while sharing geometry and textures", async () => {
    const library = await loadHumanLibrary();
    const player = library.create(spec);
    const npc = library.create({ ...spec, id: "mentor" });
    const playerMesh = skinned(player);
    const npcMesh = skinned(npc);
    expect(playerMesh.skeleton).not.toBe(npcMesh.skeleton);
    expect(playerMesh.skeleton.bones[1]).not.toBe(npcMesh.skeleton.bones[1]);
    expect(playerMesh.geometry).toBe(npcMesh.geometry);
    const playerMaterial = (playerMesh.material as THREE.MeshStandardMaterial[])[0];
    const npcMaterial = (npcMesh.material as THREE.MeshStandardMaterial[])[0];
    expect(playerMaterial).not.toBe(npcMaterial);
    expect(playerMaterial.map).toBe(npcMaterial.map);
    npc.setAppearance({ skin: "#804b31", shirt: "#bbccee", hair: "#000000" });
    expect(playerMaterial.color.getHexString()).toBe("a9714b");
    expect(npcMaterial.color.getHexString()).toBe("804b31");
    expect(player.getDiagnostics()).toMatchObject({
      height: 1.75, skinnedMeshCount: 1, boneCount: 30, clips: ["Idle", "Walk"],
    });
    const bounds = new THREE.Box3().setFromObject(player.group);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(bounds.max.y).toBeCloseTo(1.75);
    player.dispose();
    npc.dispose();
    library.dispose();
  });

  it("blends walk and idle from actual movement without translating the gameplay root", async () => {
    const library = await loadHumanLibrary();
    const player = library.create(spec);
    player.group.position.set(3, 0.06, -4);
    const rootPosition = player.group.position.clone();
    const initialBonePosition = skinned(player).skeleton.bones[1].position.y;
    for (let index = 0; index < 8; index++) player.update(0.04, 2.7, false);
    expect(player.getDiagnostics().currentAnimation).toBe("Walk");
    expect(player.getDiagnostics().walkWeight).toBeGreaterThan(0.95);
    expect(skinned(player).skeleton.bones[1].position.y).not.toBe(initialBonePosition);
    expect(player.group.position.equals(rootPosition)).toBe(true);
    for (let index = 0; index < 8; index++) player.update(0.04, 0, false);
    expect(player.getDiagnostics().currentAnimation).toBe("Idle");
    expect(player.getDiagnostics().walkWeight).toBeLessThan(0.05);
    player.dispose();
    library.dispose();
  });

  it("holds an authored idle pose for reduced motion and freezes a paused world", async () => {
    const library = await loadHumanLibrary();
    const player = library.create(spec);
    player.update(0.1, 2.7, false);
    const time = player.getDiagnostics().mixerTime;
    player.update(0.1, 2.7, true);
    expect(player.getDiagnostics()).toMatchObject({
      mixerTime: time, currentAnimation: "Idle", walkWeight: 0,
    });
    player.update(0.1, 2.7, false, true);
    expect(player.getDiagnostics().mixerTime).toBe(time);
    player.dispose();
    library.dispose();
  });

  it("releases every shared GPU resource only after the last actor is gone", async () => {
    const male = fixture();
    const female = fixture();
    parse.mockResolvedValueOnce(male).mockResolvedValueOnce(female);
    const library = await loadHumanLibrary();
    const first = library.create(spec);
    const second = library.create({ ...spec, id: "sam" });
    const source = male.scene.children[0] as THREE.SkinnedMesh;
    const sourceMaterial = (source.material as THREE.MeshStandardMaterial[])[0];
    const geometryDisposal = vi.spyOn(source.geometry, "dispose");
    const colourTextureDisposal = vi.spyOn(sourceMaterial.map!, "dispose");
    const normalTextureDisposal = vi.spyOn(sourceMaterial.normalMap!, "dispose");
    const privateMaterial = (skinned(first).material as THREE.Material[])[0];
    const materialDisposal = vi.spyOn(privateMaterial, "dispose");
    const boneDisposal = vi.spyOn(skinned(first).skeleton, "dispose");
    library.dispose();
    expect(() => library.create(spec)).toThrow("closed");
    expect(geometryDisposal).not.toHaveBeenCalled();
    first.dispose();
    first.dispose();
    expect(materialDisposal).toHaveBeenCalledTimes(1);
    expect(boneDisposal).toHaveBeenCalledTimes(1);
    expect(geometryDisposal).not.toHaveBeenCalled();
    second.dispose();
    library.dispose();
    expect(geometryDisposal).toHaveBeenCalledTimes(1);
    expect(colourTextureDisposal).toHaveBeenCalledTimes(1);
    expect(normalTextureDisposal).toHaveBeenCalledTimes(1);
    expect(first.getDiagnostics().disposed).toBe(true);
  });

  it("rejects incomplete assets and frees assets already parsed by the other request", async () => {
    const invalid = fixture();
    invalid.animations = invalid.animations.filter((clip) => clip.name !== "Walk");
    const valid = fixture();
    const releaseInvalid = vi.spyOn((invalid.scene.children[0] as THREE.Mesh).geometry, "dispose");
    const releaseValid = vi.spyOn((valid.scene.children[0] as THREE.Mesh).geometry, "dispose");
    parse.mockResolvedValueOnce(invalid).mockResolvedValueOnce(valid);
    await expect(loadHumanLibrary()).rejects.toThrow("could not be prepared");
    expect(releaseInvalid).toHaveBeenCalledTimes(1);
    expect(releaseValid).toHaveBeenCalledTimes(1);
  });

  it("reports HTTP failure and rejects cancellation without creating actors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    await expect(loadHumanLibrary()).rejects.toThrow("could not be prepared");
    expect(parse).not.toHaveBeenCalled();
    const controller = new AbortController();
    controller.abort();
    await expect(loadHumanLibrary({ signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

describe("shipped human asset contract", () => {
  for (const body of ["male", "female"] as const)
    it(`${body} is a self-contained textured skin with separate fingers and both animated clips`, () => {
      const file = readFileSync(
        new URL(`../../public/models/humans/human-${body}.glb`, import.meta.url),
      );
      expect(file.readUInt32LE(0)).toBe(0x46546c67);
      expect(file.readUInt32LE(4)).toBe(2);
      expect(file.readUInt32LE(8)).toBe(file.byteLength);
      expect(file.byteLength).toBeLessThan(24 * 1024 * 1024);
      const jsonLength = file.readUInt32LE(12);
      const document = JSON.parse(file.subarray(20, 20 + jsonLength).toString("utf8")) as {
        buffers: { uri?: string }[];
        images: { bufferView?: number; uri?: string }[];
        skins: { joints: number[] }[];
        nodes: { name?: string }[];
        animations: { name: string; channels: unknown[] }[];
        meshes: { primitives: { attributes: Record<string, number> }[] }[];
        materials: { name: string }[];
      };
      expect(document.buffers.every((buffer) => !buffer.uri)).toBe(true);
      expect(document.images.length).toBeGreaterThan(0);
      expect(document.images.every((image) => image.bufferView !== undefined && !image.uri)).toBe(true);
      expect(document.skins.some((skin) => skin.joints.length >= 50)).toBe(true);
      for (const clip of ["Idle", "Walk"])
        expect(document.animations.find((animation) => animation.name === clip)?.channels.length).toBeGreaterThan(5);
      expect(document.nodes.filter((node) => /finger|thumb|index|middle|ring|pinky/i.test(node.name ?? "")).length).toBeGreaterThanOrEqual(20);
      expect(document.meshes.some((mesh) => mesh.primitives.some((primitive) => "JOINTS_0" in primitive.attributes && "WEIGHTS_0" in primitive.attributes && "TEXCOORD_0" in primitive.attributes))).toBe(true);
      for (const material of ["Skin", "Hair", "Shirt", "Trousers", "Shoes"])
        expect(document.materials.some((entry) => entry.name === material)).toBe(true);
    });
});
