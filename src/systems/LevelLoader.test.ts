import { describe, expect, it } from 'vitest';
import { LevelLoader } from './LevelLoader';

describe('LevelLoader', () => {
  const loader = new LevelLoader();

  it('parses valid level JSON shape', () => {
    const parsed = loader.parse({
      id: 'level-test',
      name: 'Test Level',
      grid: { width: 7, height: 6 },
      obstacles: [{ x: 1, y: 1, image: 'residental01.png' }],
      spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
      goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
      sanctuaryZone: [{ x: 3, y: 5 }],
      lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
    });

    expect(parsed.id).toBe('level-test');
    expect(parsed.grid.width).toBe(7);
    expect(parsed.spawnZones[0].id).toBe('spawn-1');
    expect(parsed.obstacles[0].image).toBe('residental01.png');
    expect(parsed.lootSpawns[0].cell.x).toBe(2);
    expect(parsed.lootSpawns[0].value).toBe(20);
  });

  it('throws when a cell is outside grid bounds', () => {
    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [{ x: 9, y: 1, image: 'residental01.png' }],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/validation error/i);
  });

  it('throws when loot value is not one of the allowed denominations', () => {
    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 30, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/validation error/i);
  });

  it('throws when obstacle image points outside the obstacles root', () => {
    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [{ x: 1, y: 1, image: 'nested/residental01.png' }],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/obstacles\[0\]\.image/i);
  });

  it('throws when obstacle image does not exist in the obstacles root', () => {
    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [{ x: 1, y: 1, image: 'missing.png' }],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/existing file in the obstacles folder root/i);
  });
});
