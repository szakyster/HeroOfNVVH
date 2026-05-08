import type { CollisionRect } from './ICollisionProvider';

export type FacingDirection = 'up' | 'down' | 'left' | 'right';

export type AttackConfig = {
  reach: number;
  sidePadding: number;
  forwardOverlap: number;
  knockbackDistance: number;
};

export const DEFAULT_ATTACK_CONFIG: AttackConfig = {
  reach: 78,
  sidePadding: 24,
  forwardOverlap: 10,
  knockbackDistance: 34,
};

export function createAttackRect(
  playerHitbox: CollisionRect,
  facingDirection: FacingDirection,
  config: AttackConfig = DEFAULT_ATTACK_CONFIG,
): CollisionRect {
  if (facingDirection === 'up') {
    return {
      x: playerHitbox.x - config.sidePadding,
      y: playerHitbox.y - config.reach + config.forwardOverlap,
      width: playerHitbox.width + config.sidePadding * 2,
      height: config.reach,
    };
  }

  if (facingDirection === 'down') {
    return {
      x: playerHitbox.x - config.sidePadding,
      y: playerHitbox.y + playerHitbox.height - config.forwardOverlap,
      width: playerHitbox.width + config.sidePadding * 2,
      height: config.reach,
    };
  }

  if (facingDirection === 'left') {
    return {
      x: playerHitbox.x - config.reach + config.forwardOverlap,
      y: playerHitbox.y - config.sidePadding,
      width: config.reach,
      height: playerHitbox.height + config.sidePadding * 2,
    };
  }

  return {
    x: playerHitbox.x + playerHitbox.width - config.forwardOverlap,
    y: playerHitbox.y - config.sidePadding,
    width: config.reach,
    height: playerHitbox.height + config.sidePadding * 2,
  };
}

export function getKnockbackDelta(
  facingDirection: FacingDirection,
  distance: number,
): { x: number; y: number } {
  if (facingDirection === 'up') {
    return { x: 0, y: -distance };
  }

  if (facingDirection === 'down') {
    return { x: 0, y: distance };
  }

  if (facingDirection === 'left') {
    return { x: -distance, y: 0 };
  }

  return { x: distance, y: 0 };
}