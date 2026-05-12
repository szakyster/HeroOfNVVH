export type GridCell = {
  x: number;
  y: number;
};

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
};
