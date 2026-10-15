/** Simple ground-plane collision. Scene and tests use the same obstacle rectangles. */
export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const WORLD_BOUNDS: Collider = {
  minX: -10.7,
  maxX: 10.7,
  minZ: -14.5,
  maxZ: 6.4,
};
export const PLAYER_RADIUS = 0.3;

export function isWalkable(
  x: number,
  z: number,
  obstacles: readonly Collider[],
  radius = PLAYER_RADIUS,
): boolean {
  if (
    x - radius < WORLD_BOUNDS.minX ||
    x + radius > WORLD_BOUNDS.maxX ||
    z - radius < WORLD_BOUNDS.minZ ||
    z + radius > WORLD_BOUNDS.maxZ
  )
    return false;
  return !obstacles.some((obstacle) => {
    const closestX = Math.max(obstacle.minX, Math.min(x, obstacle.maxX));
    const closestZ = Math.max(obstacle.minZ, Math.min(z, obstacle.maxZ));
    return (x - closestX) ** 2 + (z - closestZ) ** 2 < radius ** 2;
  });
}

/** Axis sliding and small substeps prevent tunnelling through walls at a low frame rate. */
export function moveWithCollision(
  x: number,
  z: number,
  dx: number,
  dz: number,
  obstacles: readonly Collider[],
): { x: number; z: number } {
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.1),
  );
  for (let step = 0; step < steps; step++) {
    if (isWalkable(x + dx / steps, z, obstacles)) x += dx / steps;
    if (isWalkable(x, z + dz / steps, obstacles)) z += dz / steps;
  }
  return { x, z };
}

export const WORLD_COLLIDERS: readonly Collider[] = [
  // Office perimeter: the open site doorway is deliberately 3.4 metres wide.
  { minX: -11, maxX: -10.8, minZ: -6.6, maxZ: 6.6 },
  { minX: 10.8, maxX: 11, minZ: -6.6, maxZ: 6.6 },
  { minX: -11, maxX: -1.7, minZ: -6.7, maxZ: -6.4 },
  { minX: 1.7, maxX: 11, minZ: -6.7, maxZ: -6.4 },
  // East-wing partition and meeting room, with generous accessible openings.
  { minX: 2.7, maxX: 2.95, minZ: -6.4, maxZ: -2.6 },
  { minX: 2.7, maxX: 2.95, minZ: 0.5, maxZ: 6.4 },
  { minX: 2.95, maxX: 5.2, minZ: -0.15, maxZ: 0.15 },
  { minX: 8.1, maxX: 10.8, minZ: -0.15, maxZ: 0.15 },
  // Furniture: desktop workstation, supply desk, planning table, meeting table.
  { minX: -8.9, maxX: -6.0, minZ: -4.8, maxZ: -3.5 },
  { minX: -9.2, maxX: -7.4, minZ: 1.1, maxZ: 3.0 },
  { minX: -4.6, maxX: -1.8, minZ: 0.7, maxZ: 2.0 },
  { minX: 4.5, maxX: 9.2, minZ: 3.5, maxZ: 5.1 },
  { minX: 5.9, maxX: 8.8, minZ: -5.8, maxZ: -4.9 },
  // Foundation pit and stored material cannot be walked through.
  { minX: -8.5, maxX: -2.4, minZ: -14.4, maxZ: -11.0 },
  { minX: 7.1, maxX: 10.6, minZ: -13.8, maxZ: -11.5 },
  { minX: -10.2, maxX: -8.7, minZ: -10.8, maxZ: -8.7 },
];

export interface PathPoint {
  x: number;
  z: number;
}

function pointRectangleDistanceSquared(
  point: PathPoint,
  rectangle: Collider,
): number {
  const dx = Math.max(rectangle.minX - point.x, 0, point.x - rectangle.maxX);
  const dz = Math.max(rectangle.minZ - point.z, 0, point.z - rectangle.maxZ);
  return dx * dx + dz * dz;
}

function pointSegmentDistanceSquared(
  point: PathPoint,
  a: PathPoint,
  b: PathPoint,
): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  const fraction =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSquared,
          ),
        );
  return (
    (point.x - a.x - fraction * dx) ** 2 + (point.z - a.z - fraction * dz) ** 2
  );
}

function segmentIntersectsRectangle(
  a: PathPoint,
  b: PathPoint,
  rectangle: Collider,
): boolean {
  let entry = 0;
  let exit = 1;
  for (const [origin, delta, minimum, maximum] of [
    [a.x, b.x - a.x, rectangle.minX, rectangle.maxX],
    [a.z, b.z - a.z, rectangle.minZ, rectangle.maxZ],
  ]) {
    if (delta === 0) {
      if (origin < minimum || origin > maximum) return false;
    } else {
      const first = (minimum - origin) / delta;
      const second = (maximum - origin) / delta;
      entry = Math.max(entry, Math.min(first, second));
      exit = Math.min(exit, Math.max(first, second));
      if (entry > exit) return false;
    }
  }
  return true;
}

/** Checks the entire swept player disc, including rounded obstacle corners and thin walls. */
export function hasWalkableSegment(
  a: PathPoint,
  b: PathPoint,
  obstacles: readonly Collider[],
): boolean {
  if (![a.x, a.z, b.x, b.z].every(Number.isFinite)) return false;
  if (!isWalkable(a.x, a.z, obstacles) || !isWalkable(b.x, b.z, obstacles))
    return false;
  return !obstacles.some((obstacle) => {
    if (segmentIntersectsRectangle(a, b, obstacle)) return true;
    const distanceSquared = Math.min(
      pointRectangleDistanceSquared(a, obstacle),
      pointRectangleDistanceSquared(b, obstacle),
      pointSegmentDistanceSquared({ x: obstacle.minX, z: obstacle.minZ }, a, b),
      pointSegmentDistanceSquared({ x: obstacle.minX, z: obstacle.maxZ }, a, b),
      pointSegmentDistanceSquared({ x: obstacle.maxX, z: obstacle.minZ }, a, b),
      pointSegmentDistanceSquared({ x: obstacle.maxX, z: obstacle.maxZ }, a, b),
    );
    return distanceSquared < PLAYER_RADIUS ** 2;
  });
}

interface PathQueueEntry {
  node: number;
  priority: number;
}

class PathQueue {
  private entries: PathQueueEntry[] = [];

  get length(): number {
    return this.entries.length;
  }

  push(entry: PathQueueEntry): void {
    let index = this.entries.length;
    this.entries.push(entry);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.entries[parent].priority <= entry.priority) break;
      this.entries[index] = this.entries[parent];
      index = parent;
    }
    this.entries[index] = entry;
  }

  pop(): PathQueueEntry | undefined {
    const first = this.entries[0];
    const last = this.entries.pop();
    if (this.entries.length && last) {
      let index = 0;
      while (index * 2 + 1 < this.entries.length) {
        let child = index * 2 + 1;
        if (
          child + 1 < this.entries.length &&
          this.entries[child + 1].priority < this.entries[child].priority
        )
          child++;
        if (last.priority <= this.entries[child].priority) break;
        this.entries[index] = this.entries[child];
        index = child;
      }
      this.entries[index] = last;
    }
    return first;
  }
}

/** A short A* route of collision-safe waypoints, excluding start and ending at the exact goal.
 * An invalid or unreachable endpoint returns []. The grid is rebuilt for each click so NPC
 * colliders and future scene changes are respected, with no stale navigation cache.
 */
export function findWalkPath(
  start: PathPoint,
  goal: PathPoint,
  obstacles: readonly Collider[],
): PathPoint[] {
  if (![start.x, start.z, goal.x, goal.z].every(Number.isFinite)) return [];
  if (
    !isWalkable(start.x, start.z, obstacles) ||
    !isWalkable(goal.x, goal.z, obstacles)
  )
    return [];
  if (hasWalkableSegment(start, goal, obstacles)) return [{ ...goal }];

  const gridSize = 0.45;
  const boundaryMargin = PLAYER_RADIUS + 0.001;
  const minimumX = WORLD_BOUNDS.minX + boundaryMargin;
  const minimumZ = WORLD_BOUNDS.minZ + boundaryMargin;
  const width = WORLD_BOUNDS.maxX - boundaryMargin - minimumX;
  const depth = WORLD_BOUNDS.maxZ - boundaryMargin - minimumZ;
  const columns = Math.ceil(width / gridSize) + 1;
  const rows = Math.ceil(depth / gridSize) + 1;
  const stepX = width / (columns - 1);
  const stepZ = depth / (rows - 1);
  const terminal = columns * rows;
  const parents = new Int32Array(terminal + 1).fill(-1);
  const distances = new Float64Array(terminal + 1).fill(Infinity);
  const closed = new Uint8Array(terminal + 1);
  const walkability = new Int8Array(terminal).fill(-1);
  const queue = new PathQueue();

  const pointAt = (node: number): PathPoint =>
    node === terminal
      ? goal
      : {
          x: minimumX + (node % columns) * stepX,
          z: minimumZ + Math.floor(node / columns) * stepZ,
        };
  const walkableAt = (node: number): boolean => {
    if (walkability[node] === -1) {
      const point = pointAt(node);
      walkability[node] = isWalkable(point.x, point.z, obstacles) ? 1 : 0;
    }
    return walkability[node] === 1;
  };
  const connectors = (point: PathPoint): number[] => {
    const centerX = Math.round((point.x - minimumX) / stepX);
    const centerZ = Math.round((point.z - minimumZ) / stepZ);
    const found: number[] = [];
    for (
      let z = Math.max(0, centerZ - 2);
      z <= Math.min(rows - 1, centerZ + 2);
      z++
    ) {
      for (
        let x = Math.max(0, centerX - 2);
        x <= Math.min(columns - 1, centerX + 2);
        x++
      ) {
        const node = z * columns + x;
        if (
          walkableAt(node) &&
          hasWalkableSegment(point, pointAt(node), obstacles)
        )
          found.push(node);
      }
    }
    // A valid point in an awkward corner may have no local grid connection. Try the
    // visible grid rather than snapping the player through an intervening obstacle.
    if (found.length === 0) {
      for (let node = 0; node < terminal; node++) {
        if (
          walkableAt(node) &&
          hasWalkableSegment(point, pointAt(node), obstacles)
        )
          found.push(node);
      }
    }
    return found;
  };
  const goalConnectors = new Set(connectors(goal));
  if (goalConnectors.size === 0) return [];
  for (const node of connectors(start)) {
    const point = pointAt(node);
    distances[node] = Math.hypot(point.x - start.x, point.z - start.z);
    queue.push({
      node,
      priority:
        distances[node] + Math.hypot(goal.x - point.x, goal.z - point.z),
    });
  }
  const relax = (from: number, to: number): void => {
    if (closed[to]) return;
    const a = pointAt(from);
    const b = pointAt(to);
    const candidate = distances[from] + Math.hypot(b.x - a.x, b.z - a.z);
    if (candidate >= distances[to]) return;
    distances[to] = candidate;
    parents[to] = from;
    queue.push({
      node: to,
      priority: candidate + Math.hypot(goal.x - b.x, goal.z - b.z),
    });
  };
  while (queue.length) {
    const entry = queue.pop()!;
    const node = entry.node;
    if (closed[node]) continue;
    if (node === terminal) break;
    closed[node] = 1;
    if (goalConnectors.has(node)) relax(node, terminal);
    const x = node % columns;
    const z = Math.floor(node / columns);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dz === 0) continue;
        const nextX = x + dx;
        const nextZ = z + dz;
        if (nextX < 0 || nextX >= columns || nextZ < 0 || nextZ >= rows)
          continue;
        const neighbor = nextZ * columns + nextX;
        if (closed[neighbor] || !walkableAt(neighbor)) continue;
        if (
          dx &&
          dz &&
          (!walkableAt(z * columns + nextX) || !walkableAt(nextZ * columns + x))
        )
          continue;
        if (hasWalkableSegment(pointAt(node), pointAt(neighbor), obstacles))
          relax(node, neighbor);
      }
    }
  }
  if (!Number.isFinite(distances[terminal])) return [];
  const route: PathPoint[] = [];
  for (let node = terminal; node !== -1; node = parents[node])
    route.push(pointAt(node));
  route.reverse();

  // Greedy visibility smoothing keeps the exact goal and replaces grid zigzags with
  // the longest safe straight legs. Collision uses the same swept-disc check as A*.
  const simplified: PathPoint[] = [];
  let previous = start;
  let index = 0;
  while (index < route.length) {
    let next = route.length - 1;
    while (
      next > index &&
      !hasWalkableSegment(previous, route[next], obstacles)
    )
      next--;
    simplified.push({ ...route[next] });
    previous = route[next];
    index = next + 1;
  }
  return simplified;
}
