import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Bake static opaque geometry into material batches; moving characters and labelled sources remain independent. */
export function batchStaticGeometry(scene: THREE.Object3D): number {
  scene.updateMatrixWorld(true);
  const batches = new Map<string, THREE.Mesh[]>();
  for (const object of scene.children) {
    if (
      !(object instanceof THREE.Mesh) ||
      object.userData.targetId ||
      Array.isArray(object.material)
    )
      continue;
    const material = object.material;
    if (
      !(material instanceof THREE.MeshStandardMaterial) ||
      material.transparent ||
      material.map
    )
      continue;
    const key = [
      material.color.getHex(),
      material.emissive.getHex(),
      material.emissiveIntensity,
      material.roughness,
      material.metalness,
      material.opacity,
      material.side,
      object.castShadow,
      object.receiveShadow,
    ].join(":");
    const batch = batches.get(key) ?? [];
    batch.push(object);
    batches.set(key, batch);
  }
  let savedCalls = 0;
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const transformed = objects.map((object) =>
      object.geometry.clone().applyMatrix4(object.matrixWorld),
    );
    const geometry = mergeGeometries(transformed);
    transformed.forEach((item) => item.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, objects[0].material);
    mesh.castShadow = objects[0].castShadow;
    mesh.receiveShadow = objects[0].receiveShadow;
    mesh.name = "static-environment-batch";
    scene.add(mesh);
    for (const object of objects) {
      scene.remove(object);
      object.geometry.dispose();
    }
    savedCalls += objects.length - 1;
  }
  return savedCalls;
}

export function usesSoftwareRenderer(renderer: THREE.WebGLRenderer): boolean {
  const context = renderer.getContext();
  const info = context.getExtension("WEBGL_debug_renderer_info");
  if (!info) return false;
  const name = String(context.getParameter(info.UNMASKED_RENDERER_WEBGL));
  return /swiftshader|llvmpipe|software|softpipe/i.test(name);
}
