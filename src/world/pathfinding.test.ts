import { describe, expect, it } from "vitest";
import {
  isWalkable,
  WORLD_BOUNDS,
  WORLD_COLLIDERS,
  type Collider,
} from "./collision";
import { findWalkPath, hasWalkableSegment, type PathPoint } from "./collision";

const spawn = { x: -2.1, z: 4.6 };
const sceneObstacles: readonly Collider[] = [
  ...WORLD_COLLIDERS,
  ...[
    { x: -4.7, z: -2.3 },
    { x: -4.8, z: -9.5 },
    { x: -6.3, z: 2.7 },
    { x: 4.7, z: -10 },
  ].map(({ x, z }) => ({
    minX: x - 0.2,
    maxX: x + 0.2,
    minZ: z - 0.2,
    maxZ: z + 0.2,
  })),
];

function verifyRoute(
  start: PathPoint,
  goal: PathPoint,
  obstacles: readonly Collider[],
): PathPoint[] {
  const path = findWalkPath(start, goal, obstacles);
  expect(path.length).toBeGreaterThan(0);
  expect(path[path.length - 1]).toEqual(goal);
  let previous = start;
  let length = 0;
  for (const point of path) {
    expect(isWalkable(point.x, point.z, obstacles)).toBe(true);
    expect(hasWalkableSegment(previous, point, obstacles)).toBe(true);
    // Independent dense checks guard against a geometry bug shared by planner and simplifier.
    const segmentLength = Math.hypot(
      point.x - previous.x,
      point.z - previous.z,
    );
    const steps = Math.ceil(segmentLength / 0.025);
    for (let step = 0; step <= steps; step++) {
      const fraction = steps === 0 ? 0 : step / steps;
      expect(
        isWalkable(
          previous.x + (point.x - previous.x) * fraction,
          previous.z + (point.z - previous.z) * fraction,
          obstacles,
        ),
      ).toBe(true);
    }
    length += segmentLength;
    previous = point;
  }
  expect(length).toBeLessThan(
    Math.hypot(goal.x - start.x, goal.z - start.z) * 4 + 4,
  );
  return path;
}

describe("click movement pathfinding", () => {
  it("uses one exact waypoint when the direct route is clear", () => {
    const goal = { x: 0.6, z: 4.1 };
    expect(findWalkPath(spawn, goal, sceneObstacles)).toEqual([goal]);
  });

  it.each([
    ["mentor around the planning table", { x: -4.7, z: -1.3 }],
    ["war-room board through the east partition doorway", { x: 7.3, z: -3.3 }],
    ["report meeting through the meeting-room doorway", { x: 7, z: 1.2 }],
    ["site lead through the office-to-yard opening", { x: -4.8, z: -8.5 }],
  ] as const)(
    "routes from spawn to %s without crossing walls, furniture, or NPCs",
    (_, goal) => {
      verifyRoute(spawn, goal, sceneObstacles);
    },
  );

  it("routes between the yard and war room through the office instead of the perimeter wall", () => {
    verifyRoute({ x: -4.8, z: -8.5 }, { x: 7.3, z: -3.3 }, sceneObstacles);
  });

  it("rejects swept-disc collisions with thin walls and rounded obstacle corners", () => {
    const thinWall = [{ minX: 0.005, maxX: 0.006, minZ: -1, maxZ: 1 }];
    expect(hasWalkableSegment({ x: -1, z: 0 }, { x: 1, z: 0 }, thinWall)).toBe(
      false,
    );
    const square = [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1 }];
    expect(
      hasWalkableSegment({ x: -0.5, z: 0.1 }, { x: 0.1, z: -0.5 }, square),
    ).toBe(false);
    expect(
      hasWalkableSegment({ x: -0.5, z: -0.5 }, { x: 0.2, z: -0.5 }, square),
    ).toBe(true);
  });

  it("routes around a corner without diagonal clipping", () => {
    const obstacle = [{ minX: -0.2, maxX: 0.2, minZ: -0.2, maxZ: 0.2 }];
    const path = verifyRoute({ x: -1, z: -0.4 }, { x: 1, z: 0.4 }, obstacle);
    expect(path.length).toBeGreaterThan(1);
  });

  it("returns no route for blocked, out-of-bounds, non-finite, or separated endpoints", () => {
    expect(findWalkPath(spawn, { x: -4.7, z: -2.3 }, sceneObstacles)).toEqual(
      [],
    );
    expect(
      findWalkPath(spawn, { x: WORLD_BOUNDS.maxX, z: 0 }, sceneObstacles),
    ).toEqual([]);
    expect(findWalkPath({ x: NaN, z: 0 }, { x: 0, z: 0 }, [])).toEqual([]);
    const barrier = [
      {
        minX: -0.1,
        maxX: 0.1,
        minZ: WORLD_BOUNDS.minZ,
        maxZ: WORLD_BOUNDS.maxZ,
      },
    ];
    expect(findWalkPath({ x: -1, z: 0 }, { x: 1, z: 0 }, barrier)).toEqual([]);
  });

  it("does not retain a route after an obstacle changes", () => {
    const start = { x: -1, z: 0 };
    const goal = { x: 1, z: 0 };
    expect(findWalkPath(start, goal, [])).toEqual([goal]);
    const barrier = [
      {
        minX: -0.1,
        maxX: 0.1,
        minZ: WORLD_BOUNDS.minZ,
        maxZ: WORLD_BOUNDS.maxZ,
      },
    ];
    expect(findWalkPath(start, goal, barrier)).toEqual([]);
  });
});
