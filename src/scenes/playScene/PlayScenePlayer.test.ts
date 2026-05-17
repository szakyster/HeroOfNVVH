import { describe, expect, it } from 'vitest';
import {
  canInterruptAttackAnimation,
  createAttackState,
  getHeroPunchAnimationState,
  shouldClearAttackEffect,
  shouldFinishAttackAnimation,
} from './PlayScenePlayer';

describe('PlayScenePlayer helpers', () => {
  it('maps left attacks to mirrored right punch frames', () => {
    expect(getHeroPunchAnimationState('left')).toEqual({
      direction: 'right',
      flipX: true,
      heroAnimationDirection: 'right',
      heroAnimationFlipX: true,
    });
  });

  it('allows attack interruption only after the release moment', () => {
    expect(canInterruptAttackAnimation(true, 1200, 1300)).toBe(false);
    expect(canInterruptAttackAnimation(true, 1400, 1300)).toBe(true);
    expect(canInterruptAttackAnimation(false, 1200, 1300)).toBe(true);
  });

  it('builds the next attack state only when cooldown elapsed', () => {
    expect(
      createAttackState({
        now: 1000,
        lastAttackAt: 700,
        attackCooldownMs: 420,
        attackMinDurationMs: 500,
        attackAnimationDurationMs: 1166.667,
        attackHitDelayMs: 83.333,
        attackDurationMs: 120,
      }),
    ).toBeNull();

    expect(
      createAttackState({
        now: 1000,
        lastAttackAt: 500,
        attackCooldownMs: 420,
        attackMinDurationMs: 500,
        attackAnimationDurationMs: 1166.667,
        attackHitDelayMs: 83.333,
        attackDurationMs: 120,
      }),
    ).toEqual({
      lastAttackAt: 1000,
      isAttackAnimating: true,
      attackAnimationReleaseAt: 1500,
      attackAnimationEndAt: 2166.667,
      attackVisualUntil: 1203.333,
      attackRect: null,
    });
  });

  it('decides when to clear attack effects', () => {
    expect(shouldClearAttackEffect(1200, 1203.333)).toBe(false);
    expect(shouldClearAttackEffect(1300, 1203.333)).toBe(true);
  });

  it('decides when the attack animation has fully finished', () => {
    expect(shouldFinishAttackAnimation(1900, 2000)).toBe(false);
    expect(shouldFinishAttackAnimation(2000, 2000)).toBe(true);
  });
});