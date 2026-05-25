import { describe, expect, it } from 'vitest';
import {
  getAvailableLevelIconAssets,
  getLevelIconAssetKey,
  hasLevelIconAsset,
  isLevelIconImageNameAllowed,
} from './LevelIconAssets';

describe('LevelIconAssets', () => {
  it('validates supported level icon filenames', () => {
    expect(isLevelIconImageNameAllowed('level-01.png')).toBe(true);
    expect(isLevelIconImageNameAllowed('nested/level-01.png')).toBe(false);
    expect(isLevelIconImageNameAllowed('level-01.txt')).toBe(false);
  });

  it('exposes the preloaded level icon registry', () => {
    expect(getLevelIconAssetKey('level-01.png')).toBe('level-icon:level-01.png');
    expect(hasLevelIconAsset('level-01.png')).toBe(true);
    expect(hasLevelIconAsset('level-03.png')).toBe(true);
    expect(hasLevelIconAsset('level-05.png')).toBe(true);
    expect(hasLevelIconAsset('level-06.png')).toBe(true);
    expect(getAvailableLevelIconAssets()).toEqual([
      {
        imageName: 'level-01.png',
        key: 'level-icon:level-01.png',
        url: expect.stringContaining('/levels/level-01.png'),
      },
      {
        imageName: 'level-02.png',
        key: 'level-icon:level-02.png',
        url: expect.stringContaining('/levels/level-02.png'),
      },
      {
        imageName: 'level-03.png',
        key: 'level-icon:level-03.png',
        url: expect.stringContaining('/levels/level-03.png'),
      },
      {
        imageName: 'level-04.png',
        key: 'level-icon:level-04.png',
        url: expect.stringContaining('/levels/level-04.png'),
      },
      {
        imageName: 'level-05.png',
        key: 'level-icon:level-05.png',
        url: expect.stringContaining('/levels/level-05.png'),
      },
      {
        imageName: 'level-06.png',
        key: 'level-icon:level-06.png',
        url: expect.stringContaining('/levels/level-06.png'),
      },
    ]);
  });
});