import { describe, expect, it } from 'vitest';
import { getFirstLevelId, getLevelPath, getNextLevelId, getOrderedLevelCatalog } from './LevelCatalog';

describe('LevelCatalog', () => {
  it('exposes the ordered level progression list', () => {
    expect(getFirstLevelId()).toBe('level-01');
    expect(getOrderedLevelCatalog()).toEqual([
      {
        id: 'level-01',
        path: expect.stringContaining('/levels/level-01.json'),
      },
      {
        id: 'level-02',
        path: expect.stringContaining('/levels/level-02.json'),
      },
    ]);
  });

  it('resolves level ids to JSON paths', () => {
    expect(getLevelPath('level-01')).toEqual(expect.stringContaining('/levels/level-01.json'));
    expect(getLevelPath('level-02')).toEqual(expect.stringContaining('/levels/level-02.json'));
    expect(getLevelPath('missing-level')).toBeUndefined();
  });

  it('resolves only the immediate next level in the authored order', () => {
    expect(getNextLevelId('level-01')).toBe('level-02');
    expect(getNextLevelId('level-02')).toBeUndefined();
    expect(getNextLevelId('missing-level')).toBeUndefined();
  });
});