export type GridCell = {
  x: number;
  y: number;
};

export const ENEMY_TYPE_IDS = ['enemy01', 'enemy02', 'enemy03', 'enemy04'] as const;

export type EnemyTypeId = (typeof ENEMY_TYPE_IDS)[number];

export type SpawnZone = {
  id: string;
  cells: GridCell[];
};

export type GoalZone = {
  id: string;
  cells: GridCell[];
};

export type LootSpawn = {
  id: string;
  type: string;
  value: 10 | 20 | 50;
  cell: GridCell;
  image?: string;
};

export type ScoreMilestone = {
  score: number;
  text: string;
};

export type HrsZoneType = 'spawn' | 'goal' | 'sanctuary';

export type HrsImageSide = 'left' | 'right' | 'top' | 'bottom';

export type HrsImageDefinition = {
  id: string;
  zoneType: HrsZoneType;
  zoneId?: string;
  image: string;
  side: HrsImageSide;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
};

export type ObstacleDefinition = GridCell & {
  image: string;
};

export type LevelData = {
  id: string;
  name: string;
  targetScore: number;
  icon: string;
  enemyTypes: EnemyTypeId[];
  grid: {
    width: number;
    height: number;
  };
  obstacles: ObstacleDefinition[];
  spawnZones: SpawnZone[];
  goalZones: GoalZone[];
  sanctuaryZone: GridCell[];
  hrsImages: HrsImageDefinition[];
  lootSpawns: LootSpawn[];
  scoreMilestones?: ScoreMilestone[];
};
