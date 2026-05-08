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

  it('returns a bounding box for a cell', () => {
    const bounds = grid.cellBounds({ x: 2, y: 2 }, 4);

    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  it('knows whether a point is inside the global play area', () => {
    expect(grid.containsPoint({ x: 512, y: 384 })).toBe(true);
    expect(grid.containsPoint({ x: 20, y: 20 })).toBe(false);
  });

  it('converts between screen and surface coordinates', () => {
    const screenPoint = grid.surfaceToScreen({ u: 0.25, v: 0.6 });
    const surfacePoint = grid.screenToSurface(screenPoint);

    expect(surfacePoint).not.toBeNull();
    expect(surfacePoint?.u).toBeCloseTo(0.25, 5);
    expect(surfacePoint?.v).toBeCloseTo(0.6, 5);
  });

  it('moves upward along the trapezoid surface instead of pure screen vertical', () => {
    const startPoint = grid.surfaceToScreen({ u: 0.15, v: 0.7 });
    const nextPoint = grid.moveAlongSurface(startPoint, 0, -30);

    expect(nextPoint).not.toBeNull();
    expect(nextPoint!.y).toBeLessThan(startPoint.y);
    expect(nextPoint!.x).toBeGreaterThan(startPoint.x);
  });

  it('throws when cell is outside bounds', () => {
    expect(() => grid.toScreen({ x: 99, y: 0 })).toThrow(/out of bounds/i);
  });
});
