import { describe, expect, it } from 'vitest';
import type { CollisionRect } from './ICollisionProvider';
import { SimpleCollisionProvider } from './SimpleCollisionProvider';

describe('SimpleCollisionProvider', () => {
  const provider = new SimpleCollisionProvider();
  const player: CollisionRect = { x: 10, y: 10, width: 20, height: 20 };

  it('detects intersecting rectangles', () => {
    const obstacle = { x: 25, y: 15, width: 20, height: 20 };

    expect(provider.intersects(player, obstacle)).toBe(true);
  });

  it('does not report non-overlapping rectangles', () => {
    const obstacle = { x: 80, y: 80, width: 10, height: 10 };

    expect(provider.intersects(player, obstacle)).toBe(false);
  });

  it('reports collision against obstacle list', () => {
    const obstacles = [
      { x: 80, y: 80, width: 10, height: 10 },
      { x: 15, y: 15, width: 12, height: 12 },
    ];

    expect(provider.collidesWithAny(player, obstacles)).toBe(true);
  });
});
