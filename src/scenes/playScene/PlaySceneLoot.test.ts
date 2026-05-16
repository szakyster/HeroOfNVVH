import { describe, expect, it, vi } from 'vitest';
import {
  getDepositPopupColor,
  getLootHitbox,
  isPlayerInsideSanctuary,
  processInventoryDeposit,
  shouldPlayInventoryError,
  type InventoryItem,
} from './PlaySceneLoot';

describe('PlaySceneLoot helpers', () => {
  it('maps deposit values to the correct popup colors', () => {
    expect(getDepositPopupColor(10)).toBe('#8ecae6');
    expect(getDepositPopupColor(20)).toBe('#80ed99');
    expect(getDepositPopupColor(50)).toBe('#ffd166');
  });

  it('builds loot hitboxes from center coordinates and loot size', () => {
    expect(getLootHitbox(100, 120, { width: 60, height: 40 })).toEqual({
      x: 70,
      y: 100,
      width: 60,
      height: 40,
    });
  });

  it('checks whether the player overlaps sanctuary rectangles', () => {
    const intersects = vi
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    expect(
      isPlayerInsideSanctuary(
        { x: 24, y: 24, width: 8, height: 8 },
        [
          { x: 0, y: 0, width: 10, height: 10 },
          { x: 20, y: 20, width: 10, height: 10 },
        ],
        { intersects },
      ),
    ).toBe(true);

    expect(intersects).toHaveBeenCalledTimes(2);
  });

  it('rate-limits inventory error playback by cooldown', () => {
    expect(shouldPlayInventoryError(1100, 1000, 250)).toBe(false);
    expect(shouldPlayInventoryError(1300, 1000, 250)).toBe(true);
  });

  it('processes timed inventory deposits and score updates', () => {
    const inventory: InventoryItem[] = [
      { type: 'wallet', value: 10 },
      { type: 'bag', value: 50 },
    ];

    expect(
      processInventoryDeposit({
        inventory,
        now: 1000,
        nextLootDepositAt: null,
        lootDepositIntervalMs: 400,
        score: 40,
      }),
    ).toEqual({
      inventory,
      nextLootDepositAt: 1400,
      score: 40,
      depositedValue: null,
    });

    expect(
      processInventoryDeposit({
        inventory,
        now: 1200,
        nextLootDepositAt: 1400,
        lootDepositIntervalMs: 400,
        score: 40,
      }),
    ).toEqual({
      inventory,
      nextLootDepositAt: 1400,
      score: 40,
      depositedValue: null,
    });

    expect(
      processInventoryDeposit({
        inventory,
        now: 1400,
        nextLootDepositAt: 1400,
        lootDepositIntervalMs: 400,
        score: 40,
      }),
    ).toEqual({
      inventory: [{ type: 'bag', value: 50 }],
      nextLootDepositAt: 1800,
      score: 50,
      depositedValue: 10,
    });

    expect(
      processInventoryDeposit({
        inventory: [{ type: 'bag', value: 50 }],
        now: 1800,
        nextLootDepositAt: 1800,
        lootDepositIntervalMs: 400,
        score: 50,
      }),
    ).toEqual({
      inventory: [],
      nextLootDepositAt: null,
      score: 100,
      depositedValue: 50,
    });
  });
});