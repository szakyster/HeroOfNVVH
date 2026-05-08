import type { GridCell } from '../types/level';

type PathNode = GridCell & {
  g: number;
  h: number;
  f: number;
};

function keyOf(cell: GridCell): string {
  return `${cell.x},${cell.y}`;
}

export class AStarPathfinder {
  findPath(
    columns: number,
    rows: number,
    start: GridCell,
    goal: GridCell,
    blockedCells: GridCell[],
  ): GridCell[] | null {
    const blocked = new Set(blockedCells.map((cell) => keyOf(cell)));
    const startKey = keyOf(start);
    const goalKey = keyOf(goal);

    if (blocked.has(startKey) || blocked.has(goalKey)) {
      return null;
    }

    const open = new Map<string, PathNode>();
    const closed = new Set<string>();
    const cameFrom = new Map<string, string>();

    const startHeuristic = this.heuristic(start, goal);
    open.set(startKey, {
      ...start,
      g: 0,
      h: startHeuristic,
      f: startHeuristic,
    });

    while (open.size > 0) {
      const current = [...open.values()].reduce((best, candidate) =>
        candidate.f < best.f || (candidate.f === best.f && candidate.h < best.h) ? candidate : best,
      );
      const currentKey = keyOf(current);

      if (currentKey === goalKey) {
        return this.reconstructPath(goalKey, cameFrom);
      }

      open.delete(currentKey);
      closed.add(currentKey);

      for (const neighbor of this.neighbors(current, columns, rows)) {
        const neighborKey = keyOf(neighbor);

        if (blocked.has(neighborKey) || closed.has(neighborKey)) {
          continue;
        }

        const tentativeG = current.g + 1;
        const existing = open.get(neighborKey);

        if (!existing || tentativeG < existing.g) {
          const h = this.heuristic(neighbor, goal);
          open.set(neighborKey, {
            ...neighbor,
            g: tentativeG,
            h,
            f: tentativeG + h,
          });
          cameFrom.set(neighborKey, currentKey);
        }
      }
    }

    return null;
  }

  findPathViaWaypoint(
    columns: number,
    rows: number,
    start: GridCell,
    waypoint: GridCell,
    goal: GridCell,
    blockedCells: GridCell[],
  ): GridCell[] | null {
    const firstLeg = this.findPath(columns, rows, start, waypoint, blockedCells);
    if (!firstLeg || firstLeg.length === 0) {
      return null;
    }

    const secondLeg = this.findPath(columns, rows, waypoint, goal, blockedCells);
    if (!secondLeg || secondLeg.length === 0) {
      return null;
    }

    return [...firstLeg, ...secondLeg.slice(1)];
  }

  private reconstructPath(goalKey: string, cameFrom: Map<string, string>): GridCell[] {
    const path: GridCell[] = [];
    let currentKey: string | undefined = goalKey;

    while (currentKey) {
      const [x, y] = currentKey.split(',').map(Number);
      path.unshift({ x, y });
      currentKey = cameFrom.get(currentKey);
    }

    return path;
  }

  private neighbors(cell: GridCell, columns: number, rows: number): GridCell[] {
    return [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    ].filter((candidate) => candidate.x >= 0 && candidate.x < columns && candidate.y >= 0 && candidate.y < rows);
  }

  private heuristic(a: GridCell, b: GridCell): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}
