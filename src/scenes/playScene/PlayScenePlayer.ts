import type { FacingDirection } from '../../systems/AttackSystem';

export type HeroPunchAnimationDirection = 'down' | 'right' | 'up';
export type HeroLoopAnimationDirection = 'down' | 'northeast' | 'right' | 'southeast' | 'up';

export type HeroPunchAnimationState = {
  direction: HeroPunchAnimationDirection;
  flipX: boolean;
  heroAnimationDirection: HeroLoopAnimationDirection;
  heroAnimationFlipX: boolean;
};

export type AttackState = {
  lastAttackAt: number;
  isAttackAnimating: boolean;
  attackAnimationReleaseAt: number;
  attackAnimationEndAt: number;
  attackVisualUntil: number;
  attackRect: null;
};

type CreateAttackStateArgs = {
  now: number;
  lastAttackAt: number;
  attackCooldownMs: number;
  attackMinDurationMs: number;
  attackAnimationDurationMs: number;
  attackHitDelayMs: number;
  attackDurationMs: number;
};

export function getHeroPunchAnimationState(facingDirection: FacingDirection): HeroPunchAnimationState {
  if (facingDirection === 'left') {
    return {
      direction: 'right',
      flipX: true,
      heroAnimationDirection: 'right',
      heroAnimationFlipX: true,
    };
  }

  if (facingDirection === 'right') {
    return {
      direction: 'right',
      flipX: false,
      heroAnimationDirection: 'right',
      heroAnimationFlipX: false,
    };
  }

  if (facingDirection === 'up') {
    return {
      direction: 'up',
      flipX: false,
      heroAnimationDirection: 'up',
      heroAnimationFlipX: false,
    };
  }

  return {
    direction: 'down',
    flipX: false,
    heroAnimationDirection: 'down',
    heroAnimationFlipX: false,
  };
}

export function canInterruptAttackAnimation(isAttackAnimating: boolean, now: number, attackAnimationReleaseAt: number): boolean {
  return !isAttackAnimating || now >= attackAnimationReleaseAt;
}

export function shouldClearAttackEffect(now: number, attackVisualUntil: number): boolean {
  return now > attackVisualUntil;
}

export function shouldFinishAttackAnimation(now: number, attackAnimationEndAt: number): boolean {
  return now >= attackAnimationEndAt;
}

export function createAttackState({
  now,
  lastAttackAt,
  attackCooldownMs,
  attackMinDurationMs,
  attackAnimationDurationMs,
  attackHitDelayMs,
  attackDurationMs,
}: CreateAttackStateArgs): AttackState | null {
  if (now - lastAttackAt < attackCooldownMs) {
    return null;
  }

  return {
    lastAttackAt: now,
    isAttackAnimating: true,
    attackAnimationReleaseAt: now + attackMinDurationMs,
    attackAnimationEndAt: now + attackAnimationDurationMs,
    attackVisualUntil: now + attackHitDelayMs + attackDurationMs,
    attackRect: null,
  };
}