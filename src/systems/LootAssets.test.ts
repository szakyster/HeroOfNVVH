import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOOT_IMAGE_NAME,
  getAvailableLootAssets,
  getLootAssetKey,
  hasLootAsset,
  isLootImageNameAllowed,
  SHARED_LOOT_ASSET_KEY,
} from './LootAssets';

describe('LootAssets', () => {
  it('exposes the shared loot asset for preload', () => {
    expect(getAvailableLootAssets()).toEqual([
      {
        imageName: 'ferrari01.png',
        key: 'loot:ferrari01.png',
        url: '/assets/loots/ferrari01.png',
      },
      {
        imageName: 'helicopter01.png',
        key: 'loot:helicopter01.png',
        url: '/assets/loots/helicopter01.png',
      },
      {
        imageName: DEFAULT_LOOT_IMAGE_NAME,
        key: SHARED_LOOT_ASSET_KEY,
        url: '/assets/loots/money01.png',
      },
    ]);
  });

  it('validates and resolves loot image names', () => {
    expect(isLootImageNameAllowed('money01.png')).toBe(true);
    expect(isLootImageNameAllowed('nested/money01.png')).toBe(false);
    expect(hasLootAsset('ferrari01.png')).toBe(true);
    expect(hasLootAsset('helicopter01.png')).toBe(true);
    expect(hasLootAsset('money01.png')).toBe(true);
    expect(hasLootAsset('missing.png')).toBe(false);
    expect(getLootAssetKey('money01.png')).toBe('loot:money01.png');
  });
});