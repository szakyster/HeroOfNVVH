import { describe, expect, it } from 'vitest';
import { AStarPathfinder } from './AStarPathfinder';

describe('AStarPathfinder', () => {
  const pathfinder = new AStarPathfinder();

  it('finds a path around blocked cells', () => {
    const path = pathfinder.findPath(
      7,
      6,
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
    );

    expect(path).not.toBeNull();
    expect(path?.[0]).toEqual({ x: 0, y: 0 });
    expect(path?.[path.length - 1]).toEqual({ x: 3, y: 0 });
  });

  it('returns null when start or goal is blocked', () => {
    const path = pathfinder.findPath(7, 6, { x: 0, y: 0 }, { x: 6, y: 5 }, [{ x: 6, y: 5 }]);

    expect(path).toBeNull();
  });
});
