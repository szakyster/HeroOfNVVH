export const LEADERBOARD_STORAGE_KEY = 'heroNVVH_highScore';

export const MAX_LEADERBOARD_ENTRIES = 10;

export type LeaderboardEntry = {
  score: number;
  createdAt: string;
};

type LeaderboardCollection = Record<string, LeaderboardEntry[]>;

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

  getEntries(levelId: string): LeaderboardEntry[] {
    return this.getCollections()[levelId] ?? [];
  }

  saveEntry(levelId: string, entry: Omit<LeaderboardEntry, 'createdAt'> & Partial<Pick<LeaderboardEntry, 'createdAt'>>): LeaderboardEntry[] {
    const normalizedEntry: LeaderboardEntry = {
      score: entry.score,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    };

    const collections = this.getCollections();
    const nextEntries = [...(collections[levelId] ?? []), normalizedEntry]
      .filter(isLeaderboardEntry)
      .sort(compareEntries)
      .slice(0, MAX_LEADERBOARD_ENTRIES);

    collections[levelId] = nextEntries;

    if (this.storage) {
      this.storage.setItem(this.storageKey, JSON.stringify(collections));
    }

    return nextEntries;
  }

  clear(levelId?: string): void {
    if (!this.storage) {
      return;
    }

    if (!levelId) {
      this.storage.removeItem(this.storageKey);
      return;
    }

    const collections = this.getCollections();
    delete collections[levelId];

    if (Object.keys(collections).length === 0) {
      this.storage.removeItem(this.storageKey);
      return;
    }

    this.storage.setItem(this.storageKey, JSON.stringify(collections));
  }

  // Keep each level's leaderboard isolated while sharing one persisted storage blob.
  private getCollections(): LeaderboardCollection {
    if (!this.storage) {
      return {};
    }

    const rawValue = this.storage.getItem(this.storageKey);
    if (!rawValue) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown;
      return normalizeLeaderboardCollection(parsed);
    } catch {
      return {};
    }
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

function normalizeLeaderboardCollection(value: unknown): LeaderboardCollection {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const collection = value as Record<string, unknown>;

  return Object.fromEntries(
    Object.entries(collection)
      .filter(([, entries]) => Array.isArray(entries))
      .map(([levelId, entries]) => [
        levelId,
        (entries as unknown[]).filter(isLeaderboardEntry).sort(compareEntries).slice(0, MAX_LEADERBOARD_ENTRIES),
      ]),
  );
}

function compareEntries(left: LeaderboardEntry, right: LeaderboardEntry): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return right.createdAt.localeCompare(left.createdAt);
}