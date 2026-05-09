export const LEADERBOARD_STORAGE_KEY = 'heroNVVH_highScore';

export const MAX_LEADERBOARD_ENTRIES = 10;

export type LeaderboardEntry = {
  score: number;
  createdAt: string;
};

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export class LeaderboardStorage {
  constructor(
    private readonly storageKey = LEADERBOARD_STORAGE_KEY,
    private readonly storage: StorageLike | null = getDefaultStorage(),
  ) {}

  getEntries(): LeaderboardEntry[] {
    if (!this.storage) {
      return [];
    }

    const rawValue = this.storage.getItem(this.storageKey);
    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isLeaderboardEntry).sort(compareEntries).slice(0, MAX_LEADERBOARD_ENTRIES);
    } catch {
      return [];
    }
  }

  saveEntry(entry: Omit<LeaderboardEntry, 'createdAt'> & Partial<Pick<LeaderboardEntry, 'createdAt'>>): LeaderboardEntry[] {
    const normalizedEntry: LeaderboardEntry = {
      score: entry.score,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    };

    const nextEntries = [...this.getEntries(), normalizedEntry]
      .filter(isLeaderboardEntry)
      .sort(compareEntries)
      .slice(0, MAX_LEADERBOARD_ENTRIES);

    if (this.storage) {
      this.storage.setItem(this.storageKey, JSON.stringify(nextEntries));
    }

    return nextEntries;
  }

  clear(): void {
    this.storage?.removeItem(this.storageKey);
  }
}

function getDefaultStorage(): StorageLike | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage as StorageLike;
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LeaderboardEntry>;
  return typeof candidate.score === 'number' && Number.isFinite(candidate.score) && typeof candidate.createdAt === 'string';
}

function compareEntries(left: LeaderboardEntry, right: LeaderboardEntry): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return right.createdAt.localeCompare(left.createdAt);
}