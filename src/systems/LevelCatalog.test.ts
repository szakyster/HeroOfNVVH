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
      {
        id: 'level-03',
        path: expect.stringContaining('/levels/level-03.json'),
      },
      {
        id: 'level-04',
        path: expect.stringContaining('/levels/level-04.json'),
      },
      {
        id: 'level-05',
        path: expect.stringContaining('/levels/level-05.json'),
      },
      {
        id: 'level-06',
        path: expect.stringContaining('/levels/level-06.json'),
      },
    ]);
  });

  it('resolves level ids to JSON paths', () => {
    expect(getLevelPath('level-01')).toEqual(expect.stringContaining('/levels/level-01.json'));
    expect(getLevelPath('level-02')).toEqual(expect.stringContaining('/levels/level-02.json'));
    expect(getLevelPath('level-03')).toEqual(expect.stringContaining('/levels/level-03.json'));
    expect(getLevelPath('level-04')).toEqual(expect.stringContaining('/levels/level-04.json'));
    expect(getLevelPath('level-05')).toEqual(expect.stringContaining('/levels/level-05.json'));
    expect(getLevelPath('level-06')).toEqual(expect.stringContaining('/levels/level-06.json'));
    expect(getLevelPath('missing-level')).toBeUndefined();
  });

  it('resolves only the immediate next level in the authored order', () => {
    expect(getNextLevelId('level-01')).toBe('level-02');
    expect(getNextLevelId('level-02')).toBe('level-03');
    expect(getNextLevelId('level-03')).toBe('level-04');
    expect(getNextLevelId('level-04')).toBe('level-05');
    expect(getNextLevelId('level-05')).toBe('level-06');
    expect(getNextLevelId('level-06')).toBeUndefined();
    expect(getNextLevelId('missing-level')).toBeUndefined();
  });
});