import { getAllLevelIds } from './LevelCatalog';

export const LEVEL_PROGRESS_STORAGE_KEY = 'heroNVVH_levelProgress';

const FORCE_UNLOCK_ALL_LEVELS = true;

export type LevelProgressState = {
  unlockedLevelIds: string[];
  completedLevelIds: string[];
  lastPlayedLevelId: string;
};

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export class LevelProgressStorage {
  constructor(
    private readonly firstLevelId: string,
    private readonly storageKey = LEVEL_PROGRESS_STORAGE_KEY,
    private readonly storage: StorageLike | null = getDefaultStorage(),
  ) {}

  getState(): LevelProgressState {
    const defaultState = createDefaultLevelProgressState(this.firstLevelId);

    if (!this.storage) {
      return defaultState;
    }

    const rawValue = this.storage.getItem(this.storageKey);
    if (!rawValue) {
      return defaultState;
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown;
      return normalizeLevelProgressState(parsed, this.firstLevelId);
    } catch {
      return defaultState;
    }
  }

  unlockLevel(levelId: string): LevelProgressState {
    const state = this.getState();
    return this.saveState({
      ...state,
      unlockedLevelIds: appendUnique(state.unlockedLevelIds, levelId),
    });
  }

  markLevelCompleted(levelId: string): LevelProgressState {
    const state = this.getState();

    return this.saveState({
      ...state,
      unlockedLevelIds: appendUnique(state.unlockedLevelIds, levelId),
      completedLevelIds: appendUnique(state.completedLevelIds, levelId),
      lastPlayedLevelId: levelId,
    });
  }

  setLastPlayedLevel(levelId: string): LevelProgressState {
    const state = this.getState();

    return this.saveState({
      ...state,
      unlockedLevelIds: appendUnique(state.unlockedLevelIds, levelId),
      lastPlayedLevelId: levelId,
    });
  }

  reset(): LevelProgressState {
    const defaultState = createDefaultLevelProgressState(this.firstLevelId);
    this.storage?.removeItem(this.storageKey);
    return defaultState;
  }

  private saveState(state: LevelProgressState): LevelProgressState {
    const normalizedState = normalizeLevelProgressState(state, this.firstLevelId);

    if (this.storage) {
      this.storage.setItem(this.storageKey, JSON.stringify(normalizedState));
    }

    return normalizedState;
  }
}

function createDefaultLevelProgressState(firstLevelId: string): LevelProgressState {
  const unlockedLevelIds = FORCE_UNLOCK_ALL_LEVELS ? getAllLevelIds() : [firstLevelId];

  return {
    unlockedLevelIds,
    completedLevelIds: [],
    lastPlayedLevelId: firstLevelId,
  };
}

function getDefaultStorage(): StorageLike | null {
  if (!('localStorage' in globalThis)) {
    return null;
  }

  try {
    return globalThis.localStorage as StorageLike;
  } catch {
    return null;
  }
}

function normalizeLevelProgressState(value: unknown, firstLevelId: string): LevelProgressState {
  const defaultState = createDefaultLevelProgressState(firstLevelId);

  if (!value || typeof value !== 'object') {
    return defaultState;
  }

  const candidate = value as Partial<LevelProgressState>;
  const unlockedLevelIds = FORCE_UNLOCK_ALL_LEVELS
    ? getAllLevelIds()
    : sanitizeLevelIdList(candidate.unlockedLevelIds, firstLevelId);
  const completedLevelIds = sanitizeLevelIdList(candidate.completedLevelIds).filter((levelId) => unlockedLevelIds.includes(levelId));
  const lastPlayedLevelId =
    typeof candidate.lastPlayedLevelId === 'string' && unlockedLevelIds.includes(candidate.lastPlayedLevelId)
      ? candidate.lastPlayedLevelId
      : unlockedLevelIds[0] ?? firstLevelId;

  return {
    unlockedLevelIds,
    completedLevelIds,
    lastPlayedLevelId,
  };
}

function sanitizeLevelIdList(value: unknown, firstLevelId?: string): string[] {
  const ids = Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0) : [];
  const uniqueIds = [...new Set(ids)];

  if (!firstLevelId) {
    return uniqueIds;
  }

  return uniqueIds.includes(firstLevelId) ? uniqueIds : [firstLevelId, ...uniqueIds];
}

function appendUnique(ids: string[], levelId: string): string[] {
  return ids.includes(levelId) ? ids : [...ids, levelId];
}