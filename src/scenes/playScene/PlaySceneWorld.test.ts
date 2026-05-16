import { describe, expect, it } from 'vitest';
import { GridSystem } from '../../systems/GridSystem';
import type { LevelData } from '../../types/level';
import {
  getFittedSpriteDisplaySize,
  getGridCellsBounds,
  getHrsPlacement,
  getHrsZoneCells,
  getLevelObstacleCells,
  getObstacleDisplaySize,
} from './PlaySceneWorld';

const levelFixture: LevelData = {
  id: 'level-test',
  name: 'Teszt pálya',
  grid: { width: 7, height: 6 },
  obstacles: [
    { x: 1, y: 2, image: 'crate.png' },
    { x: 3, y: 4, image: 'barrel.png' },
  ],
  spawnZones: [{ id: 'spawn-a', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }],
  goalZones: [{ id: 'goal-a', cells: [{ x: 6, y: 5 }] }],
  sanctuaryZone: [{ x: 2, y: 5 }, { x: 3, y: 5 }],
  hrsImages: [
    { id: 'hrs-1', zoneType: 'spawn', zoneId: 'spawn-a', image: 'hrs-a.png', side: 'left' },
    { id: 'hrs-2', zoneType: 'sanctuary', image: 'hrs-b.png', side: 'bottom' },
  ],
  lootSpawns: [],
};

describe('PlaySceneWorld helpers', () => {
  it('maps obstacle cells from the level definition', () => {
    expect(getLevelObstacleCells(levelFixture)).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });

  it('fits sprite sizes into the available bounds', () => {
    expect(
      getFittedSpriteDisplaySize({ x: 0, y: 0, width: 100, height: 60 }, { width: 200, height: 100 }, 1.2, 1.6),
    ).toEqual({ width: 120, height: 60 });

    expect(
      getObstacleDisplaySize({ x: 0, y: 0, width: 100, height: 60 }, { width: 0, height: 0 }, 1.2, 1.6),
    ).toEqual({ width: 120, height: 96 });
  });

  it('selects HRS cells from sanctuary and zone definitions', () => {
    expect(getHrsZoneCells(levelFixture, levelFixture.hrsImages[0])).toEqual(levelFixture.spawnZones[0].cells);
    expect(getHrsZoneCells(levelFixture, levelFixture.hrsImages[1])).toEqual(levelFixture.sanctuaryZone);
  });

  it('computes grid bounds across multiple cells', () => {
    const gridSystem = new GridSystem({
      columns: 7,
      rows: 6,
      centerX: 400,
      centerY: 300,
      topWidth: 300,
      bottomWidth: 500,
      totalHeight: 360,
    });

    const bounds = getGridCellsBounds(gridSystem, [
      { x: 2, y: 4 },
      { x: 3, y: 5 },
    ]);

    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.x).toBeLessThan(bounds.x + bounds.width);
    expect(bounds.y).toBeLessThan(bounds.y + bounds.height);
  });

  it('places HRS sprites relative to the zone side', () => {
    const zoneBounds = { x: 120, y: 180, width: 80, height: 60 };

    expect(getHrsPlacement(zoneBounds, 'left')).toEqual({
      x: 91.2,
      y: 240,
      originX: 1,
      originY: 1,
      depthY: 240,
    });

    expect(getHrsPlacement(zoneBounds, 'top', 10, -5)).toEqual({
      x: 170,
      y: 154.6,
      originX: 0.5,
      originY: 1,
      depthY: 180,
    });
  });
});