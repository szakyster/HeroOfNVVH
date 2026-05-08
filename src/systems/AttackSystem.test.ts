import { describe, expect, it } from 'vitest';
import { createAttackRect, DEFAULT_ATTACK_CONFIG, getKnockbackDelta } from './AttackSystem';

describe('AttackSystem', () => {
  const playerHitbox = {
    x: 100,
    y: 200,
    width: 66,
    height: 36,
  };

  it('creates an oversized upward attack rectangle', () => {
    const attackRect = createAttackRect(playerHitbox, 'up');

    expect(attackRect.width).toBe(playerHitbox.width + DEFAULT_ATTACK_CONFIG.sidePadding * 2);
    expect(attackRect.height).toBe(DEFAULT_ATTACK_CONFIG.reach);
    expect(attackRect.y).toBeLessThan(playerHitbox.y);
  });

  it('creates an oversized side attack rectangle', () => {
    const attackRect = createAttackRect(playerHitbox, 'right');

    expect(attackRect.x).toBeGreaterThan(playerHitbox.x);
    expect(attackRect.height).toBe(playerHitbox.height + DEFAULT_ATTACK_CONFIG.sidePadding * 2);
    expect(attackRect.width).toBe(DEFAULT_ATTACK_CONFIG.reach);
  });

  it('returns directional knockback vectors', () => {
    expect(getKnockbackDelta('up', 30)).toEqual({ x: 0, y: -30 });
    expect(getKnockbackDelta('down', 30)).toEqual({ x: 0, y: 30 });
    expect(getKnockbackDelta('left', 30)).toEqual({ x: -30, y: 0 });
    expect(getKnockbackDelta('right', 30)).toEqual({ x: 30, y: 0 });
  });
});