import type { LevelData, GridCell } from '../../types/level';
import type { ActiveEnemy, EnemySpriteVariant } from './PlaySceneEnemies';

export function getEnemySpriteVariant(spawnedEnemies: number): EnemySpriteVariant {
  if (spawnedEnemies % 2 === 1) {
    return {
      walkPrefix: 'enemy-02',
      injuredPrefix: 'enemy-02',
    };
  }

  return {
    walkPrefix: 'enemy-01',
    injuredPrefix: 'enemy-01',
  };
}

export function getPlayerSpawnCell(level: LevelData): GridCell | null {
  return level.sanctuaryZone[0] ?? level.spawnZones[0]?.cells[0] ?? null;
}

export function getEnemySpawnCells(
  level: LevelData,
  spawnedEnemies: number,
): { spawnCell: GridCell; goalCell: GridCell } | null {
  const spawnCells = level.spawnZones[0]?.cells;
  const spawnCell = spawnCells?.[spawnedEnemies % (spawnCells.length ?? 1)];
  const goalCell = level.goalZones[0]?.cells[0];

  if (!spawnCell || !goalCell) {
    return null;
  }

  return { spawnCell, goalCell };
}

export function getEnemyWaveSpawnDelays(
  count: number,
  waveWindow: number,
  randomExtraMs: () => number,
): number[] {
  if (count <= 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => {
    const baseDelay = (index / count) * (waveWindow - 2500);
    return baseDelay + randomExtraMs();
  });
}

export function getEnemySpriteDisplayWidth(
  textureSize: { width?: number; height?: number } | undefined,
  enemySpriteDisplayHeight: number,
): number {
  const textureWidth = textureSize?.width ? textureSize.width / 4 : enemySpriteDisplayHeight;
  const textureHeight = textureSize?.height ? textureSize.height / 4 : enemySpriteDisplayHeight;

  return textureHeight > 0 ? (enemySpriteDisplayHeight * textureWidth) / textureHeight : 42;
}

type CreateActiveEnemyArgs = {
  body: ActiveEnemy['body'];
  shadow: ActiveEnemy['shadow'];
  path: GridCell[];
  enemySpeed: number;
  speedRoll: number;
  spriteVariant: EnemySpriteVariant;
};

export function createActiveEnemy({ body, shadow, path, enemySpeed, speedRoll, spriteVariant }: CreateActiveEnemyArgs): ActiveEnemy {
  return {
    body,
    shadow,
    path,
    pathIndex: 0,
    speed: enemySpeed * speedRoll,
    spriteVariant,
    health: 2,
    lootDropped: false,
    escaped: false,
    defeated: false,
    animationDirection: 'down',
    animationFlipX: false,
    injuryAnimationUntil: null,
  };
}