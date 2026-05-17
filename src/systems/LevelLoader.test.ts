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
      hrsImages: [
        { id: 'hrs-spawn', zoneType: 'spawn', zoneId: 'spawn-1', image: 'hatvanpuszta01.png', side: 'left' },
        { id: 'hrs-goal', zoneType: 'goal', zoneId: 'goal-1', image: 'repter01.png', side: 'right' },
        { id: 'hrs-sanctuary', zoneType: 'sanctuary', image: 'nvvh01.png', side: 'bottom' },
      ],
      lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, image: 'money01.png', cell: { x: 2, y: 4 } }],
      scoreMilestones: [{ score: 1000, text: 'elso visszaszerzett milliard' }],
    });

    expect(parsed.id).toBe('level-test');
    expect(parsed.grid.width).toBe(7);
    expect(parsed.spawnZones[0].id).toBe('spawn-1');
    expect(parsed.obstacles[0].image).toBe('residental01.png');
    expect(parsed.hrsImages).toHaveLength(3);
    expect(parsed.lootSpawns[0].cell.x).toBe(2);
    expect(parsed.lootSpawns[0].value).toBe(20);
    expect(parsed.lootSpawns[0].image).toBe('money01.png');
    expect(parsed.scoreMilestones).toEqual([{ score: 1000, text: 'elso visszaszerzett milliard' }]);
  });

  it('throws when a score milestone is malformed', () => {
    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        hrsImages: [],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
        scoreMilestones: [{ score: 0, text: '' }],
      }),
    ).toThrow(/scoreMilestones\[0\]\.score must be a positive integer/i);
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
        hrsImages: [],
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
        hrsImages: [],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 30, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/validation error/i);
  });

  it('throws when loot image points outside the loots root or does not exist', () => {
    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        hrsImages: [],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, image: 'nested/money01.png', cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/lootSpawns\[0\]\.image must be a direct filename from the loots folder/i);

    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        hrsImages: [],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, image: 'missing.png', cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/lootSpawns\[0\]\.image must reference an existing file in the loots folder root/i);
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
        hrsImages: [],
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
        hrsImages: [],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/existing file in the obstacles folder root/i);
  });

  it('throws when an HRS image points to a missing zone or duplicates a zone assignment', () => {
    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        hrsImages: [
          { id: 'hrs-a', zoneType: 'spawn', zoneId: 'spawn-1', image: 'hatvanpuszta01.png', side: 'left' },
          { id: 'hrs-b', zoneType: 'spawn', zoneId: 'spawn-1', image: 'repter01.png', side: 'right' },
        ],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/duplicates an existing HRS zone image assignment/i);

    expect(() =>
      loader.parse({
        id: 'bad-level',
        name: 'Bad Level',
        grid: { width: 7, height: 6 },
        obstacles: [],
        spawnZones: [{ id: 'spawn-1', cells: [{ x: 0, y: 0 }] }],
        goalZones: [{ id: 'goal-1', cells: [{ x: 6, y: 5 }] }],
        sanctuaryZone: [{ x: 3, y: 5 }],
        hrsImages: [
          { id: 'hrs-a', zoneType: 'goal', zoneId: 'missing-goal', image: 'repter01.png', side: 'right' },
        ],
        lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, cell: { x: 2, y: 4 } }],
      }),
    ).toThrow(/existing goal zone/i);
  });
});
