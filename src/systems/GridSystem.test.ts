import { describe, expect, it } from 'vitest';
import { GridSystem } from './GridSystem';

describe('GridSystem', () => {
  const grid = new GridSystem({
    columns: 7,
    rows: 6,
    originX: 120,
    originY: 110,
    cellTopWidth: 44,
    cellBottomWidth: 64,
    cellHeight: 36,
  });

  it('returns all 7x6 cells', () => {
    expect(grid.allCells()).toHaveLength(42);
  });

  it('maps logical cell to screen point in bounds', () => {
    const point = grid.toScreen({ x: 3, y: 2 });

    expect(point.x).toBeGreaterThan(120);
    expect(point.y).toBeGreaterThan(110);
  });

  it('returns trapezoid polygon with four points', () => {
    const polygon = grid.cellPolygon({ x: 1, y: 1 });

    expect(polygon).toHaveLength(4);
    expect(polygon[1].x).toBeGreaterThan(polygon[0].x);
    expect(polygon[2].y).toBeGreaterThan(polygon[1].y);
  });

  it('throws when cell is outside bounds', () => {
    expect(() => grid.toScreen({ x: 99, y: 0 })).toThrow(/out of bounds/i);
  });
});
