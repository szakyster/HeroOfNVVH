import { describe, expect, it } from 'vitest';
import {
  getAvailableLevelIconAssets,
  getLevelIconAssetKey,
  hasLevelIconAsset,
  isLevelIconImageNameAllowed,
} from './LevelIconAssets';

describe('LevelIconAssets', () => {
  it('validates supported level icon filenames', () => {
    expect(isLevelIconImageNameAllowed('enemy01.png')).toBe(true);
    expect(isLevelIconImageNameAllowed('nested/enemy01.png')).toBe(false);
    expect(isLevelIconImageNameAllowed('enemy01.txt')).toBe(false);
  });

  it('exposes the preloaded level icon registry', () => {
    expect(getLevelIconAssetKey('enemy01.png')).toBe('level-icon:enemy01.png');
    expect(hasLevelIconAsset('enemy01.png')).toBe(true);
    expect(getAvailableLevelIconAssets()).toEqual([
      {
        imageName: 'enemy01.png',
        key: 'level-icon:enemy01.png',
        url: expect.stringContaining('/assets/sprites/enemy01.png'),
      },
      {
        imageName: 'enemy02.png',
        key: 'level-icon:enemy02.png',
        url: expect.stringContaining('/assets/sprites/enemy02.png'),
      },
    ]);
  });
});