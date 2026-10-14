import { describe, expect, it } from 'vitest';
import { isWalkable, moveWithCollision, WORLD_BOUNDS, WORLD_COLLIDERS } from './collision';

describe('workplace collision', () => {
  it('keeps the entire player inside the traversable perimeter', () => {
    expect(isWalkable(0, 0, WORLD_COLLIDERS)).toBe(true);
    expect(isWalkable(WORLD_BOUNDS.maxX, 0, WORLD_COLLIDERS)).toBe(false);
    expect(isWalkable(0, WORLD_BOUNDS.minZ, WORLD_COLLIDERS)).toBe(false);
  });
  it('blocks furniture and the foundation excavation', () => {
    expect(isWalkable(-7, -4, WORLD_COLLIDERS)).toBe(false);
    expect(isWalkable(-5, -12, WORLD_COLLIDERS)).toBe(false);
  });
  it('allows the office-to-site doorway', () => {
    const moved = moveWithCollision(0, -5, 0, -3, WORLD_COLLIDERS);
    expect(moved.z).toBeCloseTo(-8);
  });
  it('prevents tunnelling through thin walls on a slow frame', () => {
    const wall = [{ minX: 1, maxX: 1.1, minZ: -10, maxZ: 6 }];
    const moved = moveWithCollision(0, 0, 5, 0, wall);
    expect(moved.x).toBeLessThanOrEqual(0.7);
  });
  it('slides along a wall rather than stopping both movement axes', () => {
    const wall = [{ minX: 1, maxX: 1.1, minZ: -10, maxZ: 6 }];
    const moved = moveWithCollision(0, 0, 3, 2, wall);
    expect(moved.x).toBeLessThanOrEqual(0.7);
    expect(moved.z).toBeCloseTo(2);
  });
});
