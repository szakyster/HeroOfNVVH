import { describe, expect, it } from 'vitest';
import { AStarPathfinder } from './AStarPathfinder';

function expectPathToUseValidSteps(path: { x: number; y: number }[], blockedCells: { x: number; y: number }[] = []): void {
  const blocked = new Set(blockedCells.map((cell) => `${cell.x},${cell.y}`));

  for (let index = 0; index < path.length; index += 1) {
    const cell = path[index];

    expect(blocked.has(`${cell.x},${cell.y}`)).toBe(false);

    if (index === 0) {
      continue;
    }

    const previous = path[index - 1];
    const stepDistance = Math.abs(cell.x - previous.x) + Math.abs(cell.y - previous.y);
    expect(stepDistance).toBe(1);
  }
}

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
    expectPathToUseValidSteps(path ?? [], [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]);
  });

  it('returns null when start or goal is blocked', () => {
    const path = pathfinder.findPath(7, 6, { x: 0, y: 0 }, { x: 6, y: 5 }, [{ x: 6, y: 5 }]);

    expect(path).toBeNull();
  });

  it('builds a combined path through a waypoint', () => {
    const path = pathfinder.findPathViaWaypoint(
      7,
      6,
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 6, y: 5 },
      [{ x: 3, y: 3 }],
    );

    expect(path).not.toBeNull();
    expect(path?.[0]).toEqual({ x: 0, y: 0 });
    expect(path).toContainEqual({ x: 2, y: 2 });
    expect(path?.[path.length - 1]).toEqual({ x: 6, y: 5 });
    expectPathToUseValidSteps(path ?? [], [{ x: 3, y: 3 }]);
  });

  it('returns null for waypoint paths when a leg is unreachable', () => {
    const path = pathfinder.findPathViaWaypoint(
      3,
      3,
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ],
    );

    expect(path).toBeNull();
  });

  it('returns a single-cell path when start and goal are the same', () => {
    const path = pathfinder.findPath(7, 6, { x: 2, y: 3 }, { x: 2, y: 3 }, []);

    expect(path).toEqual([{ x: 2, y: 3 }]);
  });

  it('returns null when the goal is completely enclosed by blocked cells', () => {
    const blockedCells = [
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ];

    const path = pathfinder.findPath(5, 5, { x: 0, y: 0 }, { x: 2, y: 2 }, blockedCells);

    expect(path).toBeNull();
  });

  it('finds the only valid route through a narrow corridor', () => {
    const blockedCells = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ];

    const path = pathfinder.findPath(5, 5, { x: 0, y: 2 }, { x: 4, y: 2 }, blockedCells);

    expect(path).not.toBeNull();
    expect(path).toContainEqual({ x: 1, y: 2 });
    expect(path).toContainEqual({ x: 2, y: 2 });
    expect(path).toContainEqual({ x: 3, y: 2 });
    expect(path?.[0]).toEqual({ x: 0, y: 2 });
    expect(path?.[path.length - 1]).toEqual({ x: 4, y: 2 });
    expectPathToUseValidSteps(path ?? [], blockedCells);
  });

  it('returns null when the waypoint itself is blocked', () => {
    const blockedCells = [{ x: 2, y: 2 }];

    const path = pathfinder.findPathViaWaypoint(
      5,
      5,
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 4, y: 4 },
      blockedCells,
    );

    expect(path).toBeNull();
  });

  it('returns a continuous combined path without duplicating invalid jumps at the waypoint', () => {
    const blockedCells = [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
    ];

    const path = pathfinder.findPathViaWaypoint(
      5,
      5,
      { x: 0, y: 0 },
      { x: 2, y: 1 },
      { x: 4, y: 4 },
      blockedCells,
    );

    expect(path).not.toBeNull();
    expect(path?.filter((cell) => cell.x === 2 && cell.y === 1)).toHaveLength(1);
    expectPathToUseValidSteps(path ?? [], blockedCells);
  });
});
