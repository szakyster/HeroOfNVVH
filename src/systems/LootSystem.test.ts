import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOOT_CONFIG,
  getLootAlpha,
  isInventoryFull,
  isLootExpired,
  shouldLootBlink,
} from './LootSystem';

describe('LootSystem', () => {
  it('detects when inventory is full', () => {
    expect(isInventoryFull(3)).toBe(false);
    expect(isInventoryFull(DEFAULT_LOOT_CONFIG.maxInventory)).toBe(true);
  });

  it('starts blinking only near despawn time', () => {
    expect(shouldLootBlink(1000, 4300)).toBe(false);
    expect(shouldLootBlink(1000, 4600)).toBe(true);
  });

  it('expires loot after its full lifetime', () => {
    expect(isLootExpired(1000, 5900)).toBe(false);
    expect(isLootExpired(1000, 6000)).toBe(true);
  });

  it('alternates alpha while blinking', () => {
    expect(getLootAlpha(1000, 4600)).toBe(1);
    expect(getLootAlpha(1000, 4755)).toBe(0.2);
  });
});