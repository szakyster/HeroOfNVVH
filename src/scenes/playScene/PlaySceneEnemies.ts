import Phaser from 'phaser';
import type { LevelData, GridCell } from '../../types/level';
import type { GridSystem } from '../../systems/GridSystem';
import type { AStarPathfinder } from '../../systems/AStarPathfinder';
import { getLevelObstacleCells } from './PlaySceneWorld';

export const ENEMY_ANIMATION_FRAME_RATE = 12;
export const ENEMY_SHEET_FRAME_COUNT = 16;
export const ENEMY_INJURY_ANIMATION_DURATION_MS = (ENEMY_SHEET_FRAME_COUNT / ENEMY_ANIMATION_FRAME_RATE) * 1000;
export const ENEMY_ANIMATION_DIRECTIONS = ['down', 'right', 'up'] as const;
export const DEFAULT_ENEMY_SPRITE_VARIANT = {
  walkPrefix: 'enemy-01',
  injuredPrefix: 'enemy-01',
} as const;

export type EnemyAnimationState = 'walk' | 'injured';
export type EnemyAnimationDirection = (typeof ENEMY_ANIMATION_DIRECTIONS)[number];
export type EnemySpriteVariant = {
  walkPrefix: string;
  injuredPrefix: string;
};

export type ActiveEnemy = {
  body: Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse;
  shadow: Phaser.GameObjects.Ellipse;
  path: GridCell[];
  pathIndex: number;
  speed: number;
  spriteVariant: EnemySpriteVariant;
  health: number;
  lootDropped: boolean;
  escaped: boolean;
  defeated: boolean;
  animationDirection: EnemyAnimationDirection;
  animationFlipX: boolean;
  injuryAnimationUntil: number | null;
};

type MovementVisualState = {
  direction: EnemyAnimationDirection;
  flipX: boolean;
};

type PickEnemyWaypointArgs = {
  level: LevelData;
  spawnCell: GridCell;
  goalCell: GridCell;
  gridSystem?: GridSystem;
  pathfinder: AStarPathfinder;
};

type BuildEnemyPathArgs = PickEnemyWaypointArgs;

type UpdateActiveEnemiesArgs = {
  activeEnemies: ActiveEnemy[];
  delta: number;
  now: number;
  isGameOver: boolean;
  gridSystem?: GridSystem;
  onEnemyEscaped: () => void;
  updateEnemyMovementVisual: (enemy: ActiveEnemy, deltaX: number, deltaY: number) => void;
  updateEnemyRenderDepth: (enemy: ActiveEnemy) => void;
};

export function getEnemySheetKey(
  state: EnemyAnimationState,
  direction: EnemyAnimationDirection,
  spriteVariant: EnemySpriteVariant = DEFAULT_ENEMY_SPRITE_VARIANT,
): string {
  const prefix = state === 'walk' ? spriteVariant.walkPrefix : spriteVariant.injuredPrefix;

  return `${prefix}-${state}-${direction}`;
}

export function getEnemyAnimationKey(
  state: EnemyAnimationState,
  direction: EnemyAnimationDirection,
  spriteVariant: EnemySpriteVariant = DEFAULT_ENEMY_SPRITE_VARIANT,
): string {
  return `${getEnemySheetKey(state, direction, spriteVariant)}-${state === 'walk' ? 'loop' : 'once'}`;
}

export function getEnemyMovementVisualState(deltaX: number, deltaY: number): MovementVisualState {
  let direction: EnemyAnimationDirection = 'down';
  let flipX = false;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    direction = 'right';
    flipX = deltaX < 0;
  } else if (deltaY < 0) {
    direction = 'up';
  }

  return { direction, flipX };
}

export function startEnemyInjuryAnimation(enemy: ActiveEnemy, now: number): void {
  enemy.injuryAnimationUntil = now + ENEMY_INJURY_ANIMATION_DURATION_MS;
}

export function isEnemyInjuryActive(enemy: ActiveEnemy, now: number): boolean {
  if (enemy.injuryAnimationUntil === null) {
    return false;
  }

  if (now < enemy.injuryAnimationUntil) {
    return true;
  }

  enemy.injuryAnimationUntil = null;
  return false;
}

function cellKey(cell: GridCell): string {
  return `${cell.x},${cell.y}`;
}

function manhattanDistance(a: GridCell, b: GridCell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function pickEnemyWaypoint({ level, spawnCell, goalCell, gridSystem, pathfinder }: PickEnemyWaypointArgs): GridCell | null {
  const obstacleCells = getLevelObstacleCells(level);
  const blockedKeys = new Set(obstacleCells.map((cell) => cellKey(cell)));
  const candidates = gridSystem?.allCells().filter((cell) => {
    const candidateKey = cellKey(cell);

    if (blockedKeys.has(candidateKey)) {
      return false;
    }

    if (candidateKey === cellKey(spawnCell) || candidateKey === cellKey(goalCell)) {
      return false;
    }

    return manhattanDistance(cell, spawnCell) >= 2 && manhattanDistance(cell, goalCell) >= 2;
  });

  if (!candidates || candidates.length === 0) {
    return null;
  }

  const shuffledCandidates = Phaser.Utils.Array.Shuffle([...candidates]);

  for (const candidate of shuffledCandidates) {
    const waypointPath = pathfinder.findPathViaWaypoint(
      level.grid.width,
      level.grid.height,
      spawnCell,
      candidate,
      goalCell,
      obstacleCells,
    );

    if (waypointPath && waypointPath.length > 0) {
      return candidate;
    }
  }

  return null;
}

export function buildEnemyPath({ level, spawnCell, goalCell, gridSystem, pathfinder }: BuildEnemyPathArgs): GridCell[] | null {
  const waypoint = pickEnemyWaypoint({ level, spawnCell, goalCell, gridSystem, pathfinder });

  if (waypoint) {
    const obstacleCells = getLevelObstacleCells(level);
    const waypointPath = pathfinder.findPathViaWaypoint(
      level.grid.width,
      level.grid.height,
      spawnCell,
      waypoint,
      goalCell,
      obstacleCells,
    );

    if (waypointPath && waypointPath.length > 0) {
      return waypointPath;
    }
  }

  return pathfinder.findPath(level.grid.width, level.grid.height, spawnCell, goalCell, getLevelObstacleCells(level));
}

export function updateActiveEnemies({
  activeEnemies,
  delta,
  now,
  isGameOver,
  gridSystem,
  onEnemyEscaped,
  updateEnemyMovementVisual,
  updateEnemyRenderDepth,
}: UpdateActiveEnemiesArgs): ActiveEnemy[] {
  if (!gridSystem || activeEnemies.length === 0 || isGameOver) {
    return activeEnemies;
  }

  for (const enemy of activeEnemies) {
    if (enemy.escaped || enemy.defeated) {
      continue;
    }

    if (isEnemyInjuryActive(enemy, now)) {
      continue;
    }

    const deltaDistance = (delta / 1000) * enemy.speed;
    const nextGridCell = enemy.path[enemy.pathIndex + 1];

    if (!nextGridCell) {
      enemy.escaped = true;
      enemy.body.destroy();
      enemy.shadow.destroy();
      onEnemyEscaped();
      continue;
    }

    const target = gridSystem.cellCenter(nextGridCell);
    const targetX = target.x;
    const targetY = target.y - 2;
    const vector = new Phaser.Math.Vector2(targetX - enemy.body.x, targetY - enemy.body.y);

    updateEnemyMovementVisual(enemy, vector.x, vector.y);

    if (vector.length() <= deltaDistance) {
      enemy.body.setPosition(targetX, targetY);
      enemy.shadow.setPosition(target.x, target.y + 16);
      enemy.pathIndex += 1;
    } else {
      vector.normalize().scale(deltaDistance);
      enemy.body.setPosition(enemy.body.x + vector.x, enemy.body.y + vector.y);
      enemy.shadow.setPosition(enemy.body.x, enemy.body.y + 18);
    }

    updateEnemyRenderDepth(enemy);
  }

  return activeEnemies.filter((enemy) => !enemy.escaped && !enemy.defeated);
}