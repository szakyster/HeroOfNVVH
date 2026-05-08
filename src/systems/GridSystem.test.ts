import { describe, expect, it } from 'vitest';
import { GridSystem } from './GridSystem';

describe('GridSystem', () => {
  const grid = new GridSystem({
    columns: 7,
    rows: 6,
    centerX: 512,
    centerY: 384,
    topWidth: 540,
    bottomWidth: 716,
    totalHeight: 538,
  });

  it('returns all 7x6 cells', () => {
    expect(grid.allCells()).toHaveLength(42);
  });

  it('maps logical cell to screen point in bounds', () => {
    const point = grid.toScreen({ x: 3, y: 2 });

    expect(point.x).toBeGreaterThan(200);
    expect(point.y).toBeGreaterThan(100);
  });

  it('returns trapezoid polygon with four points', () => {
    const polygon = grid.cellPolygon({ x: 1, y: 1 });
    const lowerPolygon = grid.cellPolygon({ x: 1, y: 4 });

    expect(polygon).toHaveLength(4);
    expect(polygon[1].x).toBeGreaterThan(polygon[0].x);
    expect(polygon[2].y).toBeGreaterThan(polygon[1].y);
    expect(lowerPolygon[1].x - lowerPolygon[0].x).toBeGreaterThan(polygon[1].x - polygon[0].x);
  });

  it('returns a center point inside the cell', () => {
    const center = grid.cellCenter({ x: 1, y: 1 });
    const polygon = grid.cellPolygon({ x: 1, y: 1 });

    expect(center.x).toBeGreaterThan(polygon[0].x);
    expect(center.x).toBeLessThan(polygon[2].x);
    expect(center.y).toBeGreaterThan(polygon[0].y);
    expect(center.y).toBeLessThan(polygon[2].y);
  });

  it('throws when cell is outside bounds', () => {
    expect(() => grid.toScreen({ x: 99, y: 0 })).toThrow(/out of bounds/i);
  });
});
