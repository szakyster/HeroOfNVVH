import { describe, expect, it } from 'vitest';
import type { LevelData } from '../../types/level';
import {
  createActiveEnemy,
  getEnemySpawnCells,
  getEnemySpriteDisplayWidth,
  getEnemySpriteVariant,
  getEnemyWaveSpawnDelays,
  getPlayerSpawnCell,
} from './PlaySceneSpawning';

const levelFixture: LevelData = {
  id: 'level-test',
  name: 'Teszt pálya',
  grid: { width: 7, height: 6 },
  obstacles: [],
  spawnZones: [{ id: 'spawn-a', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }],
  goalZones: [{ id: 'goal-a', cells: [{ x: 6, y: 5 }] }],
  sanctuaryZone: [{ x: 2, y: 4 }],
  hrsImages: [],
  lootSpawns: [],
};

describe('PlaySceneSpawning helpers', () => {
  it('selects the sanctuary cell first for player spawn', () => {
    expect(getPlayerSpawnCell(levelFixture)).toEqual({ x: 2, y: 4 });
  });

  it('rotates enemy spawn cells and returns the goal cell', () => {
    expect(getEnemySpawnCells(levelFixture, 0)).toEqual({
      spawnCell: { x: 0, y: 0 },
      goalCell: { x: 6, y: 5 },
    });

    expect(getEnemySpawnCells(levelFixture, 1)).toEqual({
      spawnCell: { x: 1, y: 0 },
      goalCell: { x: 6, y: 5 },
    });
  });

  it('builds wave spawn delays across the wave window', () => {
    const values = [250, 500, 750];
    let index = 0;

    expect(getEnemyWaveSpawnDelays(3, 12000, () => values[index++])).toEqual([250, 3666.6666666666665, 7083.333333333333]);
  });

  it('computes the enemy sprite display width from the source texture ratio', () => {
    expect(getEnemySpriteDisplayWidth({ width: 512, height: 1024 }, 98)).toBeCloseTo(49);
    expect(getEnemySpriteDisplayWidth(undefined, 98)).toBe(98);
  });

  it('cycles enemy sprite variants across all available enemy sheets', () => {
    expect(getEnemySpriteVariant(0)).toEqual({ walkPrefix: 'enemy-01', injuredPrefix: 'enemy-01' });
    expect(getEnemySpriteVariant(1)).toEqual({ walkPrefix: 'enemy-02', injuredPrefix: 'enemy-02' });
    expect(getEnemySpriteVariant(2)).toEqual({ walkPrefix: 'enemy-03', injuredPrefix: 'enemy-03' });
    expect(getEnemySpriteVariant(3)).toEqual({ walkPrefix: 'enemy-01', injuredPrefix: 'enemy-01' });
  });

  it('creates a fresh active enemy state with default flags', () => {
    const body = { x: 100, y: 120 } as never;
    const shadow = { x: 100, y: 136 } as never;
    const spriteVariant = { walkPrefix: 'enemy-02', injuredPrefix: 'enemy-02' };

    expect(
      createActiveEnemy({
        body,
        shadow,
        path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
        enemySpeed: 88,
        speedRoll: 1.25,
        spriteVariant,
      }),
    ).toMatchObject({
      body,
      shadow,
      pathIndex: 0,
      speed: 110,
      spriteVariant,
      health: 2,
      lootDropped: false,
      escaped: false,
      defeated: false,
      animationDirection: 'down',
      animationFlipX: false,
      injuryAnimationUntil: null,
    });
  });
});