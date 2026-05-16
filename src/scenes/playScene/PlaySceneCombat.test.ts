import { describe, expect, it, vi } from 'vitest';
import {
  getEnemyHitbox,
  getEnemyKnockbackTarget,
  isRectInsidePlayArea,
  resolveAttackHits,
} from './PlaySceneCombat';
import type { ActiveEnemy } from './PlaySceneEnemies';

function createEnemyFixture(overrides: Partial<ActiveEnemy> = {}): ActiveEnemy {
  return {
    body: {
      x: 144,
      y: 188,
      setPosition: vi.fn(),
    } as unknown as ActiveEnemy['body'],
    shadow: {
      setPosition: vi.fn(),
    } as unknown as ActiveEnemy['shadow'],
    path: [],
    pathIndex: 0,
    speed: 88,
    health: 2,
    lootDropped: false,
    escaped: false,
    defeated: false,
    animationDirection: 'right',
    animationFlipX: false,
    injuryAnimationUntil: null,
    ...overrides,
  };
}

describe('PlaySceneCombat helpers', () => {
  it('creates enemy hitboxes from center coordinates', () => {
    expect(getEnemyHitbox(144, 188, { width: 42, height: 26 }, 20)).toEqual({
      x: 123,
      y: 195,
      width: 42,
      height: 26,
    });
  });

  it('checks whether a rect stays inside the playable area', () => {
    const containsPoint = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    expect(isRectInsidePlayArea({ x: 10, y: 20, width: 30, height: 40 }, containsPoint)).toBe(false);
    expect(containsPoint).toHaveBeenCalledTimes(4);
  });

  it('returns a knockback target only when the destination stays valid', () => {
    const enemy = createEnemyFixture();

    expect(
      getEnemyKnockbackTarget({
        enemy,
        facingDirection: 'right',
        knockbackDistance: 24,
        enemyHitboxSize: { width: 42, height: 26 },
        enemyHitboxOffsetY: 20,
        collisionProvider: { collidesWithAny: vi.fn(() => false) },
        obstacleRects: [],
        containsPoint: () => true,
      }),
    ).toEqual({ x: 168, y: 188 });

    expect(
      getEnemyKnockbackTarget({
        enemy,
        facingDirection: 'right',
        knockbackDistance: 24,
        enemyHitboxSize: { width: 42, height: 26 },
        enemyHitboxOffsetY: 20,
        collisionProvider: { collidesWithAny: vi.fn(() => true) },
        obstacleRects: [{ x: 0, y: 0, width: 10, height: 10 }],
        containsPoint: () => true,
      }),
    ).toBeNull();
  });

  it('resolves a first hit as knockback plus injury and loot drop', () => {
    const enemy = createEnemyFixture();
    const onFirstHit = vi.fn();
    const onEnemyDefeated = vi.fn();
    const onEnemyKnockback = vi.fn();
    const onEnemyLootDrop = vi.fn();
    const onEnemyInjured = vi.fn();

    const hitAny = resolveAttackHits({
      attackRect: { x: 0, y: 0, width: 64, height: 64 },
      activeEnemies: [enemy],
      now: 1000,
      collisionProvider: { intersects: vi.fn(() => true) },
      getEnemyHitbox: () => ({ x: 0, y: 0, width: 42, height: 26 }),
      isEnemyInjuryActive: () => false,
      onFirstHit,
      onEnemyDefeated,
      onEnemyKnockback,
      onEnemyLootDrop,
      onEnemyInjured,
    });

    expect(hitAny).toBe(true);
    expect(onFirstHit).toHaveBeenCalledTimes(1);
    expect(onEnemyDefeated).not.toHaveBeenCalled();
    expect(onEnemyKnockback).toHaveBeenCalledWith(enemy);
    expect(onEnemyLootDrop).toHaveBeenCalledWith(enemy);
    expect(onEnemyInjured).toHaveBeenCalledWith(enemy, 1000);
    expect(enemy.health).toBe(1);
    expect(enemy.lootDropped).toBe(true);
  });

  it('defeats the enemy when its health reaches zero even during injury', () => {
    const enemy = createEnemyFixture({ health: 1, lootDropped: true, injuryAnimationUntil: 1800 });
    const onEnemyDefeated = vi.fn();
    const onEnemyKnockback = vi.fn();
    const onEnemyInjured = vi.fn();

    resolveAttackHits({
      attackRect: { x: 0, y: 0, width: 64, height: 64 },
      activeEnemies: [enemy],
      now: 1200,
      collisionProvider: { intersects: vi.fn(() => true) },
      getEnemyHitbox: () => ({ x: 0, y: 0, width: 42, height: 26 }),
      isEnemyInjuryActive: () => true,
      onFirstHit: vi.fn(),
      onEnemyDefeated,
      onEnemyKnockback,
      onEnemyLootDrop: vi.fn(),
      onEnemyInjured,
    });

    expect(onEnemyDefeated).toHaveBeenCalledWith(enemy);
    expect(enemy.health).toBe(0);
    expect(onEnemyKnockback).not.toHaveBeenCalled();
    expect(onEnemyInjured).not.toHaveBeenCalled();
  });

  it('restarts the injured animation when a surviving enemy is hit mid-injury', () => {
    const enemy = createEnemyFixture({ health: 3, lootDropped: true, injuryAnimationUntil: 1800 });
    const onEnemyKnockback = vi.fn();
    const onEnemyInjured = vi.fn();

    resolveAttackHits({
      attackRect: { x: 0, y: 0, width: 64, height: 64 },
      activeEnemies: [enemy],
      now: 1200,
      collisionProvider: { intersects: vi.fn(() => true) },
      getEnemyHitbox: () => ({ x: 0, y: 0, width: 42, height: 26 }),
      isEnemyInjuryActive: () => true,
      onFirstHit: vi.fn(),
      onEnemyDefeated: vi.fn(),
      onEnemyKnockback,
      onEnemyLootDrop: vi.fn(),
      onEnemyInjured,
    });

    expect(enemy.health).toBe(2);
    expect(enemy.injuryAnimationUntil).toBeNull();
    expect(onEnemyKnockback).toHaveBeenCalledWith(enemy);
    expect(onEnemyInjured).toHaveBeenCalledWith(enemy, 1200);
  });
});