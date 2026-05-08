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
};

export type LevelData = {
  id: string;
  name: string;
  grid: {
    width: number;
    height: number;
  };
  obstacles: GridCell[];
  spawnZones: SpawnZone[];
  goalZones: GoalZone[];
  sanctuaryZone: GridCell[];
  lootSpawns: LootSpawn[];
};
