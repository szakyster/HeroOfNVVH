import { describe, expect, it } from 'vitest';
import {
  LEVEL_PROGRESS_STORAGE_KEY,
  LevelProgressStorage,
} from './LevelProgressStorage';

function createStorageMock(initialState: Record<string, string> = {}) {
  const state = new Map(Object.entries(initialState));

  return {
    getItem(key: string) {
      return state.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      state.set(key, value);
    },
    removeItem(key: string) {
      state.delete(key);
    },
  };
}

describe('LevelProgressStorage', () => {
  it('returns a first-level fallback when storage is unavailable or empty', () => {
    expect(new LevelProgressStorage('level-01', LEVEL_PROGRESS_STORAGE_KEY, null).getState()).toEqual({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });

    expect(new LevelProgressStorage('level-01', LEVEL_PROGRESS_STORAGE_KEY, createStorageMock()).getState()).toEqual({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });
  });

  it('ignores malformed persisted JSON', () => {
    const storage = createStorageMock({
      [LEVEL_PROGRESS_STORAGE_KEY]: '{not-valid-json}',
    });

    expect(new LevelProgressStorage('level-01', LEVEL_PROGRESS_STORAGE_KEY, storage).getState()).toEqual({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });
  });

  it('normalizes malformed persisted state to a safe first-level fallback', () => {
    const storage = createStorageMock({
      [LEVEL_PROGRESS_STORAGE_KEY]: JSON.stringify({
        unlockedLevelIds: [42, 'level-02', 'level-02'],
        completedLevelIds: ['level-03', 'level-02'],
        lastPlayedLevelId: 'missing-level',
      }),
    });

    expect(new LevelProgressStorage('level-01', LEVEL_PROGRESS_STORAGE_KEY, storage).getState()).toEqual({
      unlockedLevelIds: ['level-01', 'level-02'],
      completedLevelIds: ['level-02'],
      lastPlayedLevelId: 'level-01',
    });
  });

  it('unlocks levels and stores the last played level', () => {
    const storage = createStorageMock();
    const progress = new LevelProgressStorage('level-01', LEVEL_PROGRESS_STORAGE_KEY, storage);

    expect(progress.unlockLevel('level-02')).toEqual({
      unlockedLevelIds: ['level-01', 'level-02'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });

    expect(progress.setLastPlayedLevel('level-02')).toEqual({
      unlockedLevelIds: ['level-01', 'level-02'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-02',
    });
  });

  it('marks a level completed and keeps completed ids inside the unlocked set', () => {
    const storage = createStorageMock();
    const progress = new LevelProgressStorage('level-01', LEVEL_PROGRESS_STORAGE_KEY, storage);

    expect(progress.markLevelCompleted('level-02')).toEqual({
      unlockedLevelIds: ['level-01', 'level-02'],
      completedLevelIds: ['level-02'],
      lastPlayedLevelId: 'level-02',
    });

    expect(progress.getState()).toEqual({
      unlockedLevelIds: ['level-01', 'level-02'],
      completedLevelIds: ['level-02'],
      lastPlayedLevelId: 'level-02',
    });
  });

  it('resets back to the first level and clears persisted state', () => {
    const storage = createStorageMock({
      [LEVEL_PROGRESS_STORAGE_KEY]: JSON.stringify({
        unlockedLevelIds: ['level-01', 'level-02'],
        completedLevelIds: ['level-02'],
        lastPlayedLevelId: 'level-02',
      }),
    });
    const progress = new LevelProgressStorage('level-01', LEVEL_PROGRESS_STORAGE_KEY, storage);

    expect(progress.reset()).toEqual({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });
    expect(progress.getState()).toEqual({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });
  });
});