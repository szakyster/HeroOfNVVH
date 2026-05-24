const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';

export type LevelCatalogEntry = {
  id: string;
  path: string;
};

const ORDERED_LEVELS: LevelCatalogEntry[] = [
  { id: 'level-01', path: `${PUBLIC_BASE_URL}levels/level-01.json` },
  { id: 'level-02', path: `${PUBLIC_BASE_URL}levels/level-02.json` },
];

const levelCatalogById = new Map(ORDERED_LEVELS.map((entry) => [entry.id, entry]));

export function getOrderedLevelCatalog(): LevelCatalogEntry[] {
  // Keep progression and selection flows on the same ordered level source.
  return [...ORDERED_LEVELS];
}

export function getFirstLevelId(): string {
  // The first level acts as the safe fallback for fresh or invalid progress state.
  return ORDERED_LEVELS[0]?.id ?? 'level-01';
}

export function getLevelPath(levelId: string): string | undefined {
  // Resolve the selected level to its JSON file without duplicating path logic in scenes.
  return levelCatalogById.get(levelId)?.path;
}