import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  findWalkPath,
  isWalkable,
  moveWithCollision,
  WORLD_COLLIDERS,
  type Collider,
  type PathPoint,
} from "./collision";
import { batchStaticGeometry, usesSoftwareRenderer } from "./optimisation";
import "./world.css";

export interface WorldTarget {
  id: string;
  name: string;
  role: string;
  keyLabel: string;
  x: number;
  z: number;
}

export interface WorldPosition {
  x: number;
  z: number;
  yaw: number;
}

interface WorldCanvasProps {
  checkpoint?: number;
  active: boolean;
  blocked: boolean;
  appearance: { skin: string; shirt: string; hair: string };
  initialPosition?: WorldPosition;
  reducedMotion: boolean;
  lowSpec?: boolean;
  onInteract: (id: string) => void;
  onFocus: (target: WorldTarget | null) => void;
  onPosition: (position: WorldPosition) => void;
  onReady?: (ready: boolean) => void;
  outcome?: "pending" | "wait" | "alternate" | "promise" | "unauthorised";
}

export const WORLD_TARGETS: readonly WorldTarget[] = [
  {
    id: "mentor",
    name: "Alex Chen",
    role: "YOUR MENTOR",
    keyLabel: "Speak to Alex",
    x: -4.7,
    z: -2.3,
  },
  {
    id: "board",
    name: "Project board",
    role: "WAR ROOM",
    keyLabel: "Open project tools",
    x: 7.3,
    z: -4.3,
  },
  {
    id: "lead",
    name: "Sam Okafor",
    role: "DELIVERY LEAD",
    keyLabel: "Ask about the crew",
    x: -4.8,
    z: -9.5,
  },
  {
    id: "supplier",
    name: "Morgan Rivera",
    role: "SUPPLIER CONTACT",
    keyLabel: "Check the delivery",
    x: -6.3,
    z: 2.7,
  },
  {
    id: "safety",
    name: "Taylor Ellis",
    role: "SITE SAFETY",
    keyLabel: "Check safety requirements",
    x: 4.7,
    z: -10.0,
  },
  {
    id: "report",
    name: "Coordination meeting",
    role: "MEETING ROOM",
    keyLabel: "Present your recommendation",
    x: 7.0,
    z: 2.2,
  },
];

const DEFAULT_POSITION: WorldPosition = { x: -2.1, z: 4.6, yaw: Math.PI };
const INTERACTION_DISTANCE = 2.05;
const PALETTE = {
  cream: "#edf0e7",
  timber: "#d0b08a",
  dark: "#24454b",
  teal: "#13847e",
  orange: "#f4ac51",
  earth: "#b19b81",
};

interface Character {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  skin: THREE.MeshStandardMaterial;
  shirt: THREE.MeshStandardMaterial;
  hair: THREE.MeshStandardMaterial;
}

function surface(
  color: string,
  options: THREE.MeshStandardMaterialParameters = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...options });
}

function box(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  material: THREE.Material,
  radiusBottom = radius,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radiusBottom, height, 12),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 14, 10),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeCharacter(
  appearance: { skin: string; shirt: string; hair: string },
  hardhat = false,
): Character {
  const group = new THREE.Group();
  const skin = surface(appearance.skin);
  const shirt = surface(appearance.shirt);
  const hair = surface(appearance.hair);
  const trousers = surface("#253944");
  const shoes = surface("#17272b");
  const eyes = surface("#243339");
  box(group, 0, 0.94, 0, 0.46, 0.61, 0.3, shirt);
  cylinder(group, 0, 1.28, 0, 0.08, 0.16, skin);
  sphere(group, 0, 1.49, 0, 0.215, skin);
  const hairCap = sphere(group, 0, 1.6, -0.04, 0.2, hair);
  hairCap.scale.set(1, 0.62, 1);
  sphere(group, -0.075, 1.5, 0.18, 0.023, eyes);
  sphere(group, 0.075, 1.5, 0.18, 0.023, eyes);
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  for (const [leg, side] of [
    [leftLeg, -1],
    [rightLeg, 1],
  ] as const) {
    leg.position.set(side * 0.12, 0.68, 0);
    cylinder(leg, 0, -0.27, 0, 0.09, 0.53, trousers);
    box(leg, 0, -0.57, 0.045, 0.18, 0.13, 0.29, shoes);
    group.add(leg);
  }
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  for (const [arm, side] of [
    [leftArm, -1],
    [rightArm, 1],
  ] as const) {
    arm.position.set(side * 0.3, 1.16, 0);
    cylinder(arm, 0, -0.12, 0, 0.086, 0.28, shirt);
    cylinder(arm, 0, -0.37, 0, 0.061, 0.24, skin);
    sphere(arm, 0, -0.51, 0, 0.065, skin);
    group.add(arm);
  }
  // A readable intern lanyard, rather than a floating player marker alone.
  box(group, 0, 0.97, 0.16, 0.035, 0.29, 0.015, surface("#f2cf73"));
  box(group, 0, 0.84, 0.18, 0.12, 0.14, 0.025, surface("#faf8ee"));
  if (hardhat) {
    const yellow = surface("#f6b945");
    const helmet = sphere(group, 0, 1.67, 0, 0.235, yellow);
    helmet.scale.y = 0.52;
    cylinder(group, 0, 1.65, 0.015, 0.26, 0.025, yellow);
    box(group, 0, 1.72, 0, 0.035, 0.09, 0.36, yellow);
  }
  return { group, leftLeg, rightLeg, leftArm, rightArm, skin, shirt, hair };
}

function textTexture(
  text: string,
  width = 1024,
  height = 256,
  background = "#24454b",
  foreground = "#f7f7ec",
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = foreground;
    context.font = `700 ${Math.round(height * 0.36)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, width / 2, height / 2, width * 0.9);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function sign(
  parent: THREE.Object3D,
  text: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  background = PALETTE.dark,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: textTexture(text, 1024, 256, background),
      side: THREE.DoubleSide,
    }),
  );
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function plant(
  parent: THREE.Object3D,
  x: number,
  z: number,
  large = false,
): void {
  const terracotta = surface("#b57c5d");
  const leaves = surface("#458276");
  const scale = large ? 1.45 : 1;
  cylinder(
    parent,
    x,
    0.18 * scale,
    z,
    0.2 * scale,
    0.35 * scale,
    terracotta,
    0.16 * scale,
  );
  for (let branch = 0; branch < 5; branch++) {
    const angle = branch * Math.PI * 0.4;
    const leaf = sphere(
      parent,
      x + Math.cos(angle) * 0.12 * scale,
      (0.53 + (branch % 2) * 0.16) * scale,
      z + Math.sin(angle) * 0.12 * scale,
      0.24 * scale,
      leaves,
    );
    leaf.scale.set(0.6, 1.6, 0.6);
    leaf.rotation.z = Math.sin(angle) * 0.4;
  }
}

function desk(
  parent: THREE.Object3D,
  x: number,
  z: number,
  width: number,
  depth = 1.3,
): void {
  const wood = surface(PALETTE.timber);
  const leg = surface("#657b7b");
  box(parent, x, 0.81, z, width, 0.12, depth, wood);
  for (const direction of [-1, 1])
    for (const front of [-1, 1])
      box(
        parent,
        x + direction * (width / 2 - 0.18),
        0.4,
        z + front * (depth / 2 - 0.15),
        0.09,
        0.8,
        0.09,
        leg,
      );
}

function monitor(parent: THREE.Object3D, x: number, z: number): void {
  const dark = surface("#283f48");
  box(parent, x, 1.27, z, 0.77, 0.48, 0.065, dark);
  box(
    parent,
    x,
    1.28,
    z + 0.04,
    0.66,
    0.36,
    0.01,
    surface("#a9d4cf", { emissive: "#317b7e", emissiveIntensity: 0.25 }),
  );
  box(parent, x, 0.97, z, 0.05, 0.27, 0.04, dark);
  box(parent, x, 0.88, z + 0.06, 0.3, 0.035, 0.19, dark);
  box(parent, x, 0.89, z + 0.38, 0.57, 0.03, 0.19, dark);
  // Abstract schedule rows on the screens are drawn from geometry, never unreadable paragraphs.
  for (let row = 0; row < 3; row++)
    box(
      parent,
      x - 0.1 + row * 0.05,
      1.4 - row * 0.1,
      z + 0.051,
      0.3 + row * 0.08,
      0.025,
      0.008,
      surface("#e3f7e6"),
    );
}

function chair(
  parent: THREE.Object3D,
  x: number,
  z: number,
  rotation = 0,
): void {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  const upholstery = surface("#74968e");
  const metal = surface("#52666b");
  box(group, 0, 0.46, 0, 0.54, 0.12, 0.5, upholstery);
  box(group, 0, 0.85, -0.22, 0.54, 0.7, 0.09, upholstery);
  cylinder(group, 0, 0.24, 0, 0.07, 0.45, metal);
  box(group, 0, 0.055, 0, 0.6, 0.045, 0.06, metal);
  box(group, 0, 0.055, 0, 0.06, 0.045, 0.6, metal);
  parent.add(group);
}

function createWorld(scene: THREE.Scene): {
  people: Character[];
  delivery: THREE.Group;
  cutaway: THREE.Group;
} {
  const cream = surface(PALETTE.cream);
  const wall = surface("#dce3da");
  const dark = surface(PALETTE.dark);
  const teal = surface(PALETTE.teal);
  const wood = surface(PALETTE.timber);
  const glass = surface("#9dc9cd", {
    transparent: true,
    opacity: 0.28,
    roughness: 0.1,
    metalness: 0.15,
  });
  const ground = box(scene, 0, -0.19, -4, 55, 0.3, 54, surface("#b7bcaa"));
  ground.castShadow = false;
  box(scene, 0, -0.035, 0, 22, 0.12, 13.2, surface("#e2d6be"));
  // Long floorboards lend scale and direction to the cutaway office.
  for (let x = -10.5; x <= 10.5; x += 1.2)
    box(scene, x, 0.029, 0, 0.018, 0.008, 13, surface("#c5b797"));
  box(scene, -4, 0.036, -1, 9.5, 0.015, 6.5, surface("#e9e6d7"));
  box(scene, 6.7, 0.036, -3.35, 7.4, 0.015, 5.7, surface("#cbdcd1"));
  box(scene, 6.7, 0.036, 3.3, 7.4, 0.015, 6.2, surface("#d4d9cf"));
  // Cutaway front lets the third-person camera see the entire workplace.
  box(scene, -10.92, 0.6, 0, 0.2, 1.2, 13.2, wall);
  box(scene, 10.92, 0.6, 0, 0.2, 1.2, 13.2, wall);
  box(scene, -6.35, 0.65, -6.55, 9.3, 1.3, 0.2, wall);
  box(scene, 6.35, 0.65, -6.55, 9.3, 1.3, 0.2, wall);
  // The rear facade cuts away when outside so it cannot obscure the avatar or site sources.
  const cutaway = new THREE.Group();
  scene.add(cutaway);
  // Window framing remains legible without opaque roofs occluding gameplay.
  for (const x of [-9.5, -6.8, -3.7, 3.7, 6.8, 9.5]) {
    box(cutaway, x, 1.85, -6.54, 2.4, 1.14, 0.035, glass).castShadow = false;
    box(cutaway, x - 1.22, 1.87, -6.5, 0.07, 1.25, 0.09, cream);
    box(cutaway, x + 1.22, 1.87, -6.5, 0.07, 1.25, 0.09, cream);
    box(cutaway, x, 2.48, -6.5, 2.52, 0.07, 0.09, cream);
  }
  box(cutaway, -6.35, 2.76, -6.55, 9.3, 0.45, 0.22, cream);
  box(cutaway, 6.35, 2.76, -6.55, 9.3, 0.45, 0.22, cream);
  for (const [z, depth] of [
    [-4.5, 3.8],
    [3.45, 5.9],
  ])
    box(scene, 2.83, 0.58, z, 0.2, 1.16, depth, wall);
  for (const [x, width] of [
    [4.05, 2.3],
    [9.46, 2.72],
  ])
    box(scene, x, 0.6, 0, width, 1.2, 0.2, wall);
  box(scene, 2.83, 1.78, -4.5, 0.04, 1.25, 3.8, glass).castShadow = false;
  box(scene, 2.83, 1.78, 3.45, 0.04, 1.25, 5.9, glass).castShadow = false;
  sign(cutaway, "FIELD OFFICE  /  PROJECTQUEST", -6.3, 2.78, -6.41, 6.6, 0.3);
  sign(cutaway, "WAR ROOM", 6.5, 2.78, -6.41, 3.4, 0.3);
  const meetingTitle = sign(
    scene,
    "COORDINATION",
    6.6,
    0.055,
    5.8,
    3.2,
    0.38,
    "#b3c6ba",
  );
  meetingTitle.rotation.x = -Math.PI / 2;
  // Workstations and the supplier contact desk.
  desk(scene, -7.45, -4.15, 2.9);
  monitor(scene, -7.55, -4.3);
  chair(scene, -7.5, -2.9);
  box(scene, -8.4, 0.9, -3.95, 0.43, 0.045, 0.58, cream);
  desk(scene, -8.3, 2.05, 1.8, 1.9);
  monitor(scene, -8.4, 1.95);
  cylinder(scene, -7.85, 0.99, 2.55, 0.08, 0.22, teal);
  // Shared working table, drawings, mugs, and a site model.
  desk(scene, -3.2, 1.35, 2.8);
  box(scene, -3.5, 0.9, 1.4, 1.55, 0.015, 0.82, surface("#d4e2da"));
  for (let line = 0; line < 4; line++)
    box(
      scene,
      -3.5 + line * 0.3,
      0.918,
      1.4,
      0.015,
      0.008,
      0.64,
      surface("#55918a"),
    );
  box(scene, -2.45, 1, 1.17, 0.42, 0.2, 0.38, wood);
  chair(scene, -4, 2.65);
  // The board is a true gameplay target; its large colour blocks are readable in 3D.
  box(scene, 7.3, 1.62, -5.42, 3.5, 2.0, 0.14, dark);
  box(scene, 7.3, 1.62, -5.33, 3.27, 1.77, 0.025, cream);
  sign(scene, "THE MISSING MATERIALS", 7.3, 2.2, -5.3, 3.05, 0.26);
  for (let column = 0; column < 3; column++) {
    const x = 6.28 + column * 1.02;
    box(
      scene,
      x,
      1.89,
      -5.3,
      0.86,
      0.12,
      0.015,
      [teal, surface("#d99b56"), surface("#778c8c")][column],
    );
    for (let row = 0; row < 2; row++)
      box(
        scene,
        x,
        1.47 - row * 0.42,
        -5.29,
        0.74,
        0.31,
        0.025,
        surface(row === 0 && column === 1 ? "#efb965" : "#d7e4d8"),
      );
  }
  box(scene, 9.8, 0.85, -4.65, 0.5, 1.7, 0.5, cream);
  // Meeting room includes a report terminal, not a second generic dashboard.
  desk(scene, 6.85, 4.3, 4.7, 1.6);
  for (const x of [5.0, 6.85, 8.7]) chair(scene, x, 5.65, 0);
  chair(scene, 5.0, 2.9, Math.PI);
  chair(scene, 8.7, 2.9, Math.PI);
  monitor(scene, 7.0, 4.4);
  for (const x of [5.15, 8.5]) {
    box(scene, x, 0.9, 4.2, 0.62, 0.035, 0.43, cream);
    cylinder(scene, x + 0.22, 1.0, 4.65, 0.07, 0.2, teal);
  }
  plant(scene, -10, -5.65, true);
  plant(scene, -9.9, 5.4, true);
  plant(scene, 9.95, 5.45, true);
  plant(scene, 3.6, -5.65);
  plant(scene, 1.95, 5.5);
  // Welcoming entry mat and subtle floor arrows point to the open site door.
  box(scene, 0, 0.04, -5.7, 2.8, 0.02, 1.3, dark);
  const siteEntry = sign(scene, "TO SITE  ↑", 0, 0.056, -5.7, 2.2, 0.4);
  siteEntry.rotation.x = -Math.PI / 2;
  // Outdoor workspace, construction sequence and clear pedestrian path.
  box(scene, 0, -0.01, -10.7, 22, 0.08, 8.1, surface(PALETTE.earth));
  box(scene, 0.5, 0.045, -10.5, 3.4, 0.03, 7.8, surface("#d6ceba"));
  for (const x of [-1.2, 2.2])
    for (let z = -13.7; z < -7; z += 1.35)
      box(scene, x, 0.07, z, 0.045, 0.025, 0.65, surface("#f5f0d5"));
  const excavation = surface("#746d61");
  box(scene, -5.45, -0.05, -12.6, 6.1, 0.15, 3.4, excavation);
  for (const x of [-8.5, -2.4])
    box(scene, x, 0.18, -12.6, 0.25, 0.5, 3.55, surface("#c9c3ae"));
  for (const z of [-14.3, -11])
    box(scene, -5.45, 0.18, z, 6.3, 0.5, 0.25, surface("#c9c3ae"));
  // Rebar and foundation forms clearly remain unfinished until a decision resolves delivery.
  for (const x of [-7.3, -5.5, -3.7])
    for (const z of [-13.55, -11.75]) {
      cylinder(scene, x, 0.38, z, 0.025, 0.8, dark);
      box(scene, x, 0.03, z, 1.1, 0.09, 0.75, surface("#98734e"));
    }
  for (let index = 0; index < 5; index++) {
    const x = -8.7 + index * 1.55;
    cylinder(scene, x, 0.57, -10.9, 0.033, 1.0, surface("#efb644"));
  }
  box(scene, -5.6, 0.87, -10.9, 6.2, 0.08, 0.08, surface("#efb644"));
  sign(
    scene,
    "FOUNDATIONS  ·  DELIVERY PENDING",
    -5.5,
    0.88,
    -10.82,
    3.8,
    0.38,
  );
  // Material storage and pallet stacks.
  for (let layer = 0; layer < 3; layer++) {
    box(scene, 8.8, 0.17 + layer * 0.43, -12.65, 3.25, 0.12, 1.5, wood);
    for (let sack = 0; sack < 5; sack++)
      box(
        scene,
        7.65 + sack * 0.55,
        0.38 + layer * 0.43,
        -12.65,
        0.46,
        0.27,
        0.83,
        surface("#d9d0b4"),
      );
  }
  for (const z of [-9.4, -10.2])
    box(scene, -9.45, 0.5, z, 1.3, 0.9, 0.7, surface("#a08059"));
  for (const [x, z] of [
    [-2.05, -8.1],
    [3.0, -8.1],
    [6.5, -10.7],
  ]) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.45, 12),
      surface("#ed8a43"),
    );
    cone.position.set(x, 0.24, z);
    scene.add(cone);
    box(scene, x, 0.035, z, 0.33, 0.05, 0.33, dark);
  }
  // Tower crane and city skyline provide site context outside the playable bounds.
  const craneYellow = surface("#e6ad4d");
  box(scene, -11.9, 5.0, -15.7, 0.62, 10, 0.62, craneYellow);
  box(scene, -7, 10.0, -15.7, 14, 0.55, 0.5, craneYellow);
  for (let level = 0; level < 9; level++)
    box(scene, -11.9, level + 0.5, -15.7, 0.76, 0.08, 0.76, dark);
  box(scene, -12, 9.3, -15.7, 1.4, 1.2, 1.2, cream);
  cylinder(scene, -3.5, 7.2, -15.7, 0.025, 5.6, dark);
  box(scene, -3.5, 4.3, -15.7, 0.14, 0.25, 0.16, dark);
  box(scene, 0, -0.02, -18.25, 45, 0.08, 3.2, surface("#778789"));
  for (let x = -21; x < 24; x += 4.5)
    box(scene, x, 0.03, -18.25, 2, 0.01, 0.055, cream);
  for (let index = 0; index < 12; index++) {
    const height = 2.5 + ((index * 7) % 5) * 0.7;
    const x = -24 + index * 4.25;
    box(
      scene,
      x,
      height / 2,
      -25 - (index % 3),
      3.5,
      height,
      3,
      surface(index % 2 ? "#9aaeb1" : "#b8c4bf"),
    );
    for (let floor = 0; floor < 3; floor++)
      box(
        scene,
        x,
        floor * 0.75 + 0.7,
        -23.47 - (index % 3),
        2.7,
        0.28,
        0.025,
        surface("#6c9297"),
      );
  }
  const delivery = new THREE.Group();
  delivery.visible = false;
  delivery.position.set(4.4, 0, -13.1);
  box(delivery, 0, 0.62, 0, 1.35, 0.48, 3.1, dark);
  box(delivery, 0, 1.14, 0.98, 1.35, 0.78, 1.05, surface("#eff0db"));
  box(delivery, 0, 1.18, 1.52, 1.12, 0.47, 0.03, glass);
  const mixer = cylinder(delivery, 0, 1.15, -0.57, 0.57, 1.7, cream);
  mixer.rotation.x = Math.PI / 2;
  for (const x of [-0.7, 0.7])
    for (const z of [-1, 1]) {
      const wheel = cylinder(delivery, x, 0.38, z, 0.3, 0.16, dark);
      wheel.rotation.z = Math.PI / 2;
    }
  scene.add(delivery);
  const people: Character[] = [];
  for (const target of WORLD_TARGETS) {
    if (target.id === "board" || target.id === "report") continue;
    const appearance =
      target.id === "mentor"
        ? { skin: "#bd8c69", shirt: "#3c706e", hair: "#243331" }
        : target.id === "lead"
          ? { skin: "#855438", shirt: "#ddab5f", hair: "#2a2521" }
          : target.id === "supplier"
            ? { skin: "#d7a17e", shirt: "#728795", hair: "#583e2b" }
            : { skin: "#bd9579", shirt: "#e79850", hair: "#5c433c" };
    const person = makeCharacter(
      appearance,
      target.id === "lead" || target.id === "safety",
    );
    person.group.position.set(target.x, 0.06, target.z);
    person.group.rotation.y = target.id === "supplier" ? 0.4 : -0.25;
    person.group.userData.targetId = target.id;
    scene.add(person.group);
    people.push(person);
  }
  // These pads are affordances and report canonical outcomes through scene props.
  for (const target of WORLD_TARGETS) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.43, 0.49, 32),
      new THREE.MeshBasicMaterial({
        color: "#d5ae58",
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(target.x, 0.064, target.z);
    ring.userData.targetId = target.id;
    scene.add(ring);
  }
  batchStaticGeometry(cutaway);
  return { people, delivery, cutaway };
}

function editableEvent(event: KeyboardEvent): boolean {
  const element = event.target;
  return (
    element instanceof HTMLElement &&
    !!element.closest(
      'input, textarea, select, button, [contenteditable="true"], [role="dialog"]',
    )
  );
}

function shortestAngle(
  current: number,
  target: number,
  amount: number,
): number {
  return (
    current +
    Math.atan2(Math.sin(target - current), Math.cos(target - current)) * amount
  );
}

/** Browser-native third-person world. Canonical project state lives outside the renderer. */
export default function WorldCanvas(props: WorldCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef(new Map<string, HTMLButtonElement>());
  const propsRef = useRef(props);
  propsRef.current = props;
  const routeRef = useRef<((target: WorldTarget) => void) | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setFailure(
        "Your browser could not start the 3D renderer. You can still explore every source and complete this mission using the accessible workplace route.",
      );
      propsRef.current.onReady?.(false);
      return;
    }
    const softwareRenderer = usesSoftwareRenderer(renderer);
    let lowSpec = !!propsRef.current.lowSpec || softwareRenderer;
    renderer.setPixelRatio(
      lowSpec ? 1 : Math.min(window.devicePixelRatio, 1.6),
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = lowSpec
      ? THREE.BasicShadowMap
      : THREE.PCFShadowMap;
    // The building, NPCs and sun are static. Bake once instead of redrawing their
    // shadow geometry every frame; the moving player receives a contact shadow.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute(
      "aria-label",
      "ProjectQuest 3D construction workplace. Move with WASD or arrow keys, drag to orbit the camera, and press E near a person or project tool.",
    );
    renderer.domElement.setAttribute("data-testid", "world-canvas");
    renderer.domElement.setAttribute("tabindex", "0");
    renderer.domElement.dataset.renderQuality = lowSpec ? "low" : "balanced";
    renderer.domElement.dataset.shadowQuality = lowSpec
      ? "basic-512"
      : "pcf-1024";
    renderer.domElement.dataset.softwareRenderer = String(softwareRenderer);
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#dce8e4");
    scene.fog = new THREE.Fog("#dce8e4", 28, 70);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    const hemisphere = new THREE.HemisphereLight("#f0f9f2", "#738775", 2.2);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight("#fff1d6", 3.3);
    sun.position.set(-10, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(lowSpec ? 512 : 1024, lowSpec ? 512 : 1024);
    sun.shadow.camera.left = -23;
    sun.shadow.camera.right = 23;
    sun.shadow.camera.top = 23;
    sun.shadow.camera.bottom = -23;
    sun.shadow.normalBias = 0.03;
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#bedfe3", 0.6);
    fill.position.set(14, 9, -10);
    scene.add(fill);
    const world = createWorld(scene);
    const savedDrawCalls = batchStaticGeometry(scene);
    renderer.domElement.dataset.staticDrawCallsSaved = String(savedDrawCalls);
    const player = makeCharacter(propsRef.current.appearance);
    player.group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
    scene.add(player.group);
    const contactCanvas = document.createElement("canvas");
    contactCanvas.width = 64;
    contactCanvas.height = 64;
    const contactContext = contactCanvas.getContext("2d");
    if (contactContext) {
      const gradient = contactContext.createRadialGradient(
        32,
        32,
        4,
        32,
        32,
        30,
      );
      gradient.addColorStop(0, "#162d335c");
      gradient.addColorStop(1, "#162d3300");
      contactContext.fillStyle = gradient;
      contactContext.fillRect(0, 0, 64, 64);
    }
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(contactCanvas),
        transparent: true,
        depthWrite: false,
      }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    scene.add(contactShadow);
    const position = {
      ...(propsRef.current.initialPosition ?? DEFAULT_POSITION),
    };
    if (!isWalkable(position.x, position.z, WORLD_COLLIDERS))
      Object.assign(position, DEFAULT_POSITION);
    player.group.position.set(position.x, 0.06, position.z);
    player.group.rotation.y = position.yaw;
    propsRef.current.onPosition({ ...position });
    const obstacles: Collider[] = [...WORLD_COLLIDERS];
    for (const target of WORLD_TARGETS)
      if (!["board", "report"].includes(target.id))
        obstacles.push({
          minX: target.x - 0.2,
          maxX: target.x + 0.2,
          minZ: target.z - 0.2,
          maxZ: target.z + 0.2,
        });
    const focusRing = new THREE.Mesh(
      new THREE.RingGeometry(0.58, 0.66, 40),
      new THREE.MeshBasicMaterial({
        color: "#ffe6a0",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    focusRing.rotation.x = -Math.PI / 2;
    focusRing.visible = false;
    scene.add(focusRing);
    const moveMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.17, 0.22, 24),
      new THREE.MeshBasicMaterial({ color: "#185b5b", side: THREE.DoubleSide }),
    );
    moveMarker.rotation.x = -Math.PI / 2;
    moveMarker.visible = false;
    scene.add(moveMarker);
    const keys = new Set<string>();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);
    const rayHit = new THREE.Vector3();
    let destination: PathPoint | null = null;
    let waypoints: PathPoint[] = [];
    let nearby: WorldTarget | null = null;
    let focusedId: string | null = null;
    let orbitYaw = 0;
    let orbitPitch = 0.66;
    let dragging = false;
    let pointerStart = { x: 0, y: 0 };
    let previousPointer = { x: 0, y: 0 };
    let pointerTravel = 0;
    let wasActive = propsRef.current.active;
    let checkpoint = propsRef.current.checkpoint;
    let lastVisualKey = "";
    let renderDirty = true;
    let previous = performance.now();
    let elapsed = 0;
    let saveElapsed = 0;
    let walked = 0;
    let frame = 0;
    let lastPosition = { x: position.x, z: position.z, yaw: position.yaw };
    let appearanceKey = "";
    let previousOutcome = propsRef.current.outcome;
    let statsStarted = performance.now();
    let statsFrames = 0;
    let healthy = true;
    let stopped = false;
    const lookAt = new THREE.Vector3();
    const cameraDesired = new THREE.Vector3();
    const labelPoint = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    const toLabel = new THREE.Vector3();

    const resize = () => {
      renderDirty = true;
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const interact = (target: WorldTarget) => {
      if (!propsRef.current.active || propsRef.current.blocked) return;
      if (
        Math.hypot(target.x - position.x, target.z - position.z) <=
        INTERACTION_DISTANCE
      ) {
        keys.clear();
        destination = null;
        waypoints = [];
        propsRef.current.onInteract(target.id);
      }
    };
    routeRef.current = (target) => {
      if (!propsRef.current.active || propsRef.current.blocked) return;
      if (
        Math.hypot(target.x - position.x, target.z - position.z) <=
        INTERACTION_DISTANCE
      )
        interact(target);
      else {
        // Navigate through real doorways instead of sliding into a wall or desk.
        const options = [
          { x: target.x, z: target.z + 1 },
          { x: target.x - 1, z: target.z },
          { x: target.x + 1, z: target.z },
          { x: target.x, z: target.z - 1 },
        ];
        const route =
          options
            .map((point) => findWalkPath(position, point, obstacles))
            .find((path) => path.length > 0) ?? [];
        destination = route.shift() ?? null;
        waypoints = route;
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        !propsRef.current.active ||
        propsRef.current.blocked ||
        editableEvent(event)
      )
        return;
      const key = event.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "shift",
        ].includes(key)
      ) {
        event.preventDefault();
        keys.add(key);
        destination = null;
        waypoints = [];
      } else if (key === "e" && !event.repeat && nearby) {
        event.preventDefault();
        interact(nearby);
      }
    };
    const keyup = (event: KeyboardEvent) =>
      keys.delete(event.key.toLowerCase());
    const clearKeys = () => {
      keys.clear();
      dragging = false;
    };
    const pointerDown = (event: PointerEvent) => {
      if (
        event.button !== 0 ||
        propsRef.current.blocked ||
        !propsRef.current.active
      )
        return;
      dragging = true;
      pointerStart = { x: event.clientX, y: event.clientY };
      previousPointer = pointerStart;
      pointerTravel = 0;
      renderer.domElement.focus({ preventScroll: true });
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging || propsRef.current.blocked) return;
      const dx = event.clientX - previousPointer.x;
      const dy = event.clientY - previousPointer.y;
      pointerTravel += Math.hypot(dx, dy);
      if (pointerTravel > 5) {
        orbitYaw -= dx * 0.005;
        orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.003, 0.38, 1.05);
      }
      previousPointer = { x: event.clientX, y: event.clientY };
    };
    const pointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId))
        renderer.domElement.releasePointerCapture(event.pointerId);
      if (pointerTravel > 5 || propsRef.current.blocked) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object;
        while (object && !object.userData.targetId) object = object.parent;
        if (object?.userData.targetId) {
          const target = WORLD_TARGETS.find(
            (item) => item.id === object?.userData.targetId,
          );
          if (target) routeRef.current?.(target);
          return;
        }
      }
      if (raycaster.ray.intersectPlane(floor, rayHit)) {
        const route = findWalkPath(
          position,
          { x: rayHit.x, z: rayHit.z },
          obstacles,
        );
        destination = route.shift() ?? null;
        waypoints = route;
      }
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      healthy = false;
      setReady(false);
      setFailure(
        "The 3D graphics context was interrupted. Continue through the accessible workplace route, or reload to restore the world.",
      );
      propsRef.current.onReady?.(false);
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clearKeys);
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", clearKeys);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);

    const render = (timestamp: number) => {
      if (stopped || !healthy) return;
      // Collision uses small substeps, so slow foreground frames can retain real movement pace.
      const dt = Math.min((timestamp - previous) / 1000, 0.25);
      previous = timestamp;
      elapsed += dt;
      saveElapsed += dt;
      const current = propsRef.current;
      const visualKey = `${current.active}/${current.blocked}/${current.checkpoint}/${current.lowSpec}/${current.outcome}/${current.appearance.skin}/${current.appearance.shirt}/${current.appearance.hair}`;
      // A paused tool/dialog needs one backdrop frame, not continuous expensive GPU work.
      if (current.blocked && visualKey === lastVisualKey && !renderDirty) {
        keys.clear();
        statsStarted = timestamp;
        statsFrames = 0;
        frame = requestAnimationFrame(render);
        return;
      }
      const nextLowSpec = !!current.lowSpec || softwareRenderer;
      if (nextLowSpec !== lowSpec) {
        lowSpec = nextLowSpec;
        renderer.setPixelRatio(
          lowSpec ? 1 : Math.min(window.devicePixelRatio, 1.6),
        );
        renderer.domElement.dataset.renderQuality = lowSpec
          ? "low"
          : "balanced";
        renderer.domElement.dataset.shadowQuality = lowSpec
          ? "basic-512"
          : "pcf-1024";
        renderer.shadowMap.type = lowSpec
          ? THREE.BasicShadowMap
          : THREE.PCFShadowMap;
        sun.shadow.mapSize.set(lowSpec ? 512 : 1024, lowSpec ? 512 : 1024);
        sun.shadow.map?.dispose();
        sun.shadow.map = null;
        renderer.shadowMap.needsUpdate = true;
      }
      if (current.active && (!wasActive || checkpoint !== current.checkpoint)) {
        const loaded = current.initialPosition ?? DEFAULT_POSITION;
        if (isWalkable(loaded.x, loaded.z, obstacles))
          Object.assign(position, loaded);
        else Object.assign(position, DEFAULT_POSITION);
        orbitYaw = 0;
        player.group.position.set(position.x, 0.06, position.z);
        destination = null;
        waypoints = [];
        keys.clear();
        renderer.domElement.focus({ preventScroll: true });
        current.onPosition({ ...position });
      }
      wasActive = current.active;
      checkpoint = current.checkpoint;
      world.cutaway.visible = !current.active || position.z >= -6.2;
      const updatedAppearanceKey = `${current.appearance.skin}${current.appearance.shirt}${current.appearance.hair}`;
      if (appearanceKey !== updatedAppearanceKey) {
        player.skin.color.set(current.appearance.skin);
        player.shirt.color.set(current.appearance.shirt);
        player.hair.color.set(current.appearance.hair);
        appearanceKey = updatedAppearanceKey;
      }
      let speed = 0;
      if (current.active && !current.blocked) {
        const forward =
          Number(keys.has("w") || keys.has("arrowup")) -
          Number(keys.has("s") || keys.has("arrowdown"));
        const right =
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft"));
        let dx = right * Math.cos(orbitYaw) - forward * Math.sin(orbitYaw);
        let dz = -right * Math.sin(orbitYaw) - forward * Math.cos(orbitYaw);
        if (destination && !forward && !right) {
          if (
            Math.hypot(destination.x - position.x, destination.z - position.z) <
            0.06
          ) {
            position.x = destination.x;
            position.z = destination.z;
            destination = waypoints.shift() ?? null;
          }
        }
        if (destination && !forward && !right) {
          dx = destination.x - position.x;
          dz = destination.z - position.z;
        }
        const length = Math.hypot(dx, dz);
        if (length > 0.001) {
          speed = keys.has("shift") ? 4.2 : 2.7;
          const step = destination ? Math.min(speed * dt, length) : speed * dt;
          const updated = moveWithCollision(
            position.x,
            position.z,
            (dx / length) * step,
            (dz / length) * step,
            obstacles,
          );
          const movement = Math.hypot(
            updated.x - position.x,
            updated.z - position.z,
          );
          walked += movement;
          if (destination && movement < 0.001) {
            destination = null;
            waypoints = [];
          }
          position.x = updated.x;
          position.z = updated.z;
          position.yaw = shortestAngle(
            position.yaw,
            Math.atan2(dx, dz),
            1 - Math.exp(-dt * 14),
          );
          player.group.rotation.y = position.yaw;
        }
      } else {
        keys.clear();
        destination = null;
        waypoints = [];
      }
      player.group.visible = current.active;
      contactShadow.visible = current.active;
      contactShadow.position.set(position.x, 0.068, position.z);
      player.group.position.set(
        position.x,
        0.06 +
          (speed && !current.reducedMotion
            ? Math.abs(Math.sin(walked * 5)) * 0.025
            : 0),
        position.z,
      );
      const stride = speed ? Math.sin(walked * 5.8) * 0.44 : 0;
      player.leftLeg.rotation.x = stride;
      player.rightLeg.rotation.x = -stride;
      player.leftArm.rotation.x = -stride * 0.7;
      player.rightArm.rotation.x = stride * 0.7;
      if (!current.reducedMotion && !lowSpec)
        for (let index = 0; index < world.people.length; index++) {
          const person = world.people[index];
          person.leftArm.rotation.z =
            -0.035 + Math.sin(elapsed * 1.3 + index) * 0.025;
          person.rightArm.rotation.z =
            0.035 + Math.sin(elapsed * 1.3 + index + 1) * 0.025;
        }
      world.delivery.visible = current.outcome === "alternate";
      if (previousOutcome !== current.outcome) {
        previousOutcome = current.outcome;
        renderer.shadowMap.needsUpdate = true;
      }
      nearby = null;
      if (current.active && !current.blocked) {
        let distance = INTERACTION_DISTANCE;
        for (const target of WORLD_TARGETS) {
          const next = Math.hypot(target.x - position.x, target.z - position.z);
          if (next < distance) {
            distance = next;
            nearby = target;
          }
        }
      }
      if ((nearby?.id ?? null) !== focusedId) {
        focusedId = nearby?.id ?? null;
        current.onFocus(nearby);
      }
      renderer.domElement.dataset.nearbyId = focusedId ?? "";
      renderer.domElement.dataset.playerX = position.x.toFixed(2);
      renderer.domElement.dataset.playerZ = position.z.toFixed(2);
      renderer.domElement.dataset.playerYaw = position.yaw.toFixed(2);
      renderer.domElement.dataset.routeWaypoints = String(
        waypoints.length + Number(!!destination),
      );
      focusRing.visible = !!nearby;
      if (nearby) focusRing.position.set(nearby.x, 0.07, nearby.z);
      moveMarker.visible = !!destination;
      if (destination) {
        const goal = waypoints.at(-1) ?? destination;
        moveMarker.position.set(goal.x, 0.08, goal.z);
      }
      if (current.active) {
        const radius = 9.1;
        lookAt.set(position.x, 0.9, position.z);
        cameraDesired.set(
          position.x + Math.sin(orbitYaw) * radius * Math.cos(orbitPitch),
          0.9 + Math.sin(orbitPitch) * radius,
          position.z + Math.cos(orbitYaw) * radius * Math.cos(orbitPitch),
        );
      } else {
        const menuOrbit = current.reducedMotion
          ? 0.38
          : 0.38 + Math.sin(elapsed * 0.045) * 0.08;
        lookAt.set(0, 0.6, -3);
        cameraDesired.set(
          24 * Math.sin(menuOrbit),
          17.5,
          24 * Math.cos(menuOrbit) - 3,
        );
      }
      camera.position.lerp(
        cameraDesired,
        current.reducedMotion ? 1 : 1 - Math.exp(-dt * 7),
      );
      camera.lookAt(lookAt);
      camera.getWorldDirection(cameraDirection);
      for (const target of WORLD_TARGETS) {
        const label = labelsRef.current.get(target.id);
        if (!label) continue;
        labelPoint.set(target.x, target.id === "board" ? 2.7 : 2.45, target.z);
        toLabel.copy(labelPoint).sub(camera.position);
        const inFront = toLabel.dot(cameraDirection) > 0;
        labelPoint.project(camera);
        const visible =
          current.active &&
          !current.blocked &&
          inFront &&
          Math.abs(labelPoint.x) < 1.06 &&
          Math.abs(labelPoint.y) < 1.06 &&
          labelPoint.z < 1;
        label.style.visibility = visible ? "visible" : "hidden";
        label.style.transform = `translate(-50%, -100%) translate(${(labelPoint.x * 0.5 + 0.5) * host.clientWidth}px, ${(-labelPoint.y * 0.5 + 0.5) * host.clientHeight}px)`;
        label.dataset.nearby = String(target.id === focusedId);
        label.setAttribute(
          "aria-label",
          Math.hypot(target.x - position.x, target.z - position.z) <
            INTERACTION_DISTANCE
            ? target.keyLabel
            : `Walk toward ${target.name}`,
        );
      }
      if (saveElapsed > 0.5 && current.active) {
        if (
          Math.hypot(lastPosition.x - position.x, lastPosition.z - position.z) >
            0.025 ||
          Math.abs(lastPosition.yaw - position.yaw) > 0.025
        ) {
          lastPosition = { ...position };
          current.onPosition({ ...position });
        }
        saveElapsed = 0;
      }
      renderer.render(scene, camera);
      lastVisualKey = visualKey;
      renderDirty = false;
      statsFrames++;
      if (timestamp - statsStarted >= 2000) {
        renderer.domElement.dataset.fpsEstimate = (
          (statsFrames * 1000) /
          (timestamp - statsStarted)
        ).toFixed(1);
        renderer.domElement.dataset.renderCalls = String(
          renderer.info.render.calls,
        );
        statsFrames = 0;
        statsStarted = timestamp;
      }
      frame = requestAnimationFrame(render);
    };
    camera.position.set(10, 17.5, 22);
    setReady(true);
    propsRef.current.onReady?.(true);
    frame = requestAnimationFrame(render);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      routeRef.current = null;
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clearKeys);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", clearKeys);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          materials.add(material);
          const mapped = material as THREE.MeshBasicMaterial;
          if (mapped.map) textures.add(mapped.map);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="pq-world" ref={hostRef} data-world-ready={ready}>
      {!ready && !failure && (
        <div className="pq-world-loading" role="status">
          <span />
          Preparing your workplace…
        </div>
      )}
      {WORLD_TARGETS.map((target) => (
        <button
          className="pq-world-label"
          key={target.id}
          type="button"
          data-world-target={target.id}
          ref={(element) => {
            if (element) labelsRef.current.set(target.id, element);
            else labelsRef.current.delete(target.id);
          }}
          onClick={() => routeRef.current?.(target)}
          tabIndex={props.active && !props.blocked ? 0 : -1}
        >
          <span className="pq-world-label-dot" />
          <span>
            <small>{target.role}</small>
            <strong>{target.name}</strong>
          </span>
          <kbd>E</kbd>
        </button>
      ))}
      {failure && (
        <div
          className="pq-world-fallback"
          role="region"
          aria-label="Accessible workplace"
        >
          <span className="pq-world-fallback-symbol" aria-hidden="true">
            ⌂
          </span>
          <h2>Your workplace, within reach</h2>
          <p>{failure}</p>
          {props.active && (
            <div className="pq-world-fallback-routes">
              {WORLD_TARGETS.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  disabled={props.blocked}
                  onClick={() => props.onInteract(target.id)}
                >
                  <span>{target.role}</span>
                  <strong>{target.name}</strong>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
