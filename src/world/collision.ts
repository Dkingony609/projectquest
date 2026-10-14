/** Simple ground-plane collision. Scene and tests use the same obstacle rectangles. */
export interface Collider {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export const WORLD_BOUNDS: Collider = { minX: -10.7, maxX: 10.7, minZ: -14.5, maxZ: 6.4 }
export const PLAYER_RADIUS = 0.3

export function isWalkable(x: number, z: number, obstacles: readonly Collider[], radius = PLAYER_RADIUS): boolean {
  if (x - radius < WORLD_BOUNDS.minX || x + radius > WORLD_BOUNDS.maxX || z - radius < WORLD_BOUNDS.minZ || z + radius > WORLD_BOUNDS.maxZ) return false
  return !obstacles.some(obstacle => {
    const closestX = Math.max(obstacle.minX, Math.min(x, obstacle.maxX))
    const closestZ = Math.max(obstacle.minZ, Math.min(z, obstacle.maxZ))
    return (x - closestX) ** 2 + (z - closestZ) ** 2 < radius ** 2
  })
}

/** Axis sliding and small substeps prevent tunnelling through walls at a low frame rate. */
export function moveWithCollision(x: number, z: number, dx: number, dz: number, obstacles: readonly Collider[]): { x: number; z: number } {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.1))
  for (let step = 0; step < steps; step++) {
    if (isWalkable(x + dx / steps, z, obstacles)) x += dx / steps
    if (isWalkable(x, z + dz / steps, obstacles)) z += dz / steps
  }
  return { x, z }
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
]
