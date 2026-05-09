import { describe, expect, it } from 'vitest';
import {
  LEADERBOARD_STORAGE_KEY,
  LeaderboardStorage,
  MAX_LEADERBOARD_ENTRIES,
} from './LeaderboardStorage';

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

describe('LeaderboardStorage', () => {
  it('returns an empty list when storage is unavailable or empty', () => {
    expect(new LeaderboardStorage(LEADERBOARD_STORAGE_KEY, null).getEntries()).toEqual([]);
    expect(new LeaderboardStorage(LEADERBOARD_STORAGE_KEY, createStorageMock()).getEntries()).toEqual([]);
  });

  it('ignores malformed persisted data', () => {
    const storage = createStorageMock({
      [LEADERBOARD_STORAGE_KEY]: '{not-valid-json}',
    });

    expect(new LeaderboardStorage(LEADERBOARD_STORAGE_KEY, storage).getEntries()).toEqual([]);
  });

  it('saves scores in descending order and trims to the top entries', () => {
    const storage = createStorageMock();
    const leaderboard = new LeaderboardStorage(LEADERBOARD_STORAGE_KEY, storage);

    for (let index = 0; index < MAX_LEADERBOARD_ENTRIES + 2; index += 1) {
      leaderboard.saveEntry({
        score: 100 + index,
        createdAt: `2026-05-09T10:00:${String(index).padStart(2, '0')}Z`,
      });
    }

    const entries = leaderboard.getEntries();

    expect(entries).toHaveLength(MAX_LEADERBOARD_ENTRIES);
    expect(entries[0]?.score).toBe(111);
    expect(entries.at(-1)?.score).toBe(102);
  });

  it('uses the most recent timestamp as tie breaker for equal scores', () => {
    const storage = createStorageMock();
    const leaderboard = new LeaderboardStorage(LEADERBOARD_STORAGE_KEY, storage);

    leaderboard.saveEntry({ score: 250, createdAt: '2026-05-09T10:00:00.000Z' });
    leaderboard.saveEntry({ score: 250, createdAt: '2026-05-09T11:00:00.000Z' });

    const entries = leaderboard.getEntries();

    expect(entries[0]?.createdAt).toBe('2026-05-09T11:00:00.000Z');
    expect(entries[1]?.createdAt).toBe('2026-05-09T10:00:00.000Z');
  });

  it('clears persisted scores', () => {
    const storage = createStorageMock({
      [LEADERBOARD_STORAGE_KEY]: JSON.stringify([{ score: 123, createdAt: '2026-05-09T10:00:00.000Z' }]),
    });
    const leaderboard = new LeaderboardStorage(LEADERBOARD_STORAGE_KEY, storage);

    leaderboard.clear();

    expect(leaderboard.getEntries()).toEqual([]);
  });
});