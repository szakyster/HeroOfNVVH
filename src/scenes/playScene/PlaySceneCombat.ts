import { getKnockbackDelta, type FacingDirection } from '../../systems/AttackSystem';
import type { CollisionRect } from '../../systems/ICollisionProvider';
import type { ActiveEnemy } from './PlaySceneEnemies';

type PointLike = {
  x: number;
  y: number;
};

type AttackCollisionProviderLike = {
  intersects: (first: CollisionRect, second: CollisionRect) => boolean;
};

type KnockbackCollisionProviderLike = {
  collidesWithAny: (rect: CollisionRect, obstacles: CollisionRect[]) => boolean;
};

type ResolveAttackHitsArgs = {
  attackRect: CollisionRect;
  activeEnemies: ActiveEnemy[];
  now: number;
  collisionProvider: AttackCollisionProviderLike;
  getEnemyHitbox: (centerX: number, centerY: number) => CollisionRect;
  isEnemyInjuryActive: (enemy: ActiveEnemy, now: number) => boolean;
  onFirstHit: () => void;
  onEnemyDefeated: (enemy: ActiveEnemy) => void;
  onEnemyKnockback: (enemy: ActiveEnemy) => void;
  onEnemyLootDrop: (enemy: ActiveEnemy) => void;
  onEnemyInjured: (enemy: ActiveEnemy, now: number) => void;
};

type GetEnemyKnockbackTargetArgs = {
  enemy: ActiveEnemy;
  facingDirection: FacingDirection;
  knockbackDistance: number;
  enemyHitboxSize: { width: number; height: number };
  enemyHitboxOffsetY: number;
  collisionProvider: KnockbackCollisionProviderLike;
  obstacleRects: CollisionRect[];
  containsPoint?: (point: PointLike) => boolean;
};

export function getEnemyHitbox(
  centerX: number,
  centerY: number,
  enemyHitboxSize: { width: number; height: number },
  enemyHitboxOffsetY: number,
): CollisionRect {
  return {
    x: centerX - enemyHitboxSize.width / 2,
    y: centerY - enemyHitboxSize.height / 2 + enemyHitboxOffsetY,
    width: enemyHitboxSize.width,
    height: enemyHitboxSize.height,
  };
}

export function isRectInsidePlayArea(rect: CollisionRect, containsPoint?: (point: PointLike) => boolean): boolean {
  if (!containsPoint) {
    return false;
  }

  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ].every((corner) => containsPoint(corner));
}

export function getEnemyKnockbackTarget({
  enemy,
  facingDirection,
  knockbackDistance,
  enemyHitboxSize,
  enemyHitboxOffsetY,
  collisionProvider,
  obstacleRects,
  containsPoint,
}: GetEnemyKnockbackTargetArgs): { x: number; y: number } | null {
  const knockback = getKnockbackDelta(facingDirection, knockbackDistance);
  const nextX = enemy.body.x + knockback.x;
  const nextY = enemy.body.y + knockback.y;
  const nextHitbox = getEnemyHitbox(nextX, nextY, enemyHitboxSize, enemyHitboxOffsetY);

  if (!isRectInsidePlayArea(nextHitbox, containsPoint)) {
    return null;
  }

  if (collisionProvider.collidesWithAny(nextHitbox, obstacleRects)) {
    return null;
  }

  return { x: nextX, y: nextY };
}

export function resolveAttackHits({
  attackRect,
  activeEnemies,
  now,
  collisionProvider,
  getEnemyHitbox,
  isEnemyInjuryActive,
  onFirstHit,
  onEnemyDefeated,
  onEnemyKnockback,
  onEnemyLootDrop,
  onEnemyInjured,
}: ResolveAttackHitsArgs): boolean {
  let hitAny = false;

  for (const enemy of activeEnemies) {
    if (enemy.escaped || enemy.defeated) {
      continue;
    }

    const enemyHitbox = getEnemyHitbox(enemy.body.x, enemy.body.y);
    if (!collisionProvider.intersects(attackRect, enemyHitbox)) {
      continue;
    }

    if (!hitAny) {
      onFirstHit();
      hitAny = true;
    }

    enemy.health -= 1;

    if (enemy.health <= 0) {
      onEnemyDefeated(enemy);
      continue;
    }

    onEnemyKnockback(enemy);

    if (!enemy.lootDropped) {
      onEnemyLootDrop(enemy);
      enemy.lootDropped = true;
    }

    if (isEnemyInjuryActive(enemy, now)) {
      enemy.injuryAnimationUntil = null;
    }

    onEnemyInjured(enemy, now);
  }

  return hitAny;
}