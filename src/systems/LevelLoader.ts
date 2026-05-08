import type { LevelData } from '../types/level';

function isValidCell(value: unknown): value is { x: number; y: number } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { x?: unknown; y?: unknown };
  return Number.isInteger(candidate.x) && Number.isInteger(candidate.y);
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`LevelLoader validation error: ${message}`);
  }
}

export class LevelLoader {
  async load(levelPath: string): Promise<LevelData> {
    const response = await fetch(levelPath);

    if (!response.ok) {
      throw new Error(`Failed to load level file: ${levelPath}`);
    }

    const rawData = (await response.json()) as unknown;
    return this.parse(rawData);
  }

  parse(rawData: unknown): LevelData {
    assert(!!rawData && typeof rawData === 'object', 'Root value must be an object');

    const data = rawData as Record<string, unknown>;

    assert(typeof data.id === 'string' && data.id.length > 0, 'id is required');
    assert(typeof data.name === 'string' && data.name.length > 0, 'name is required');

    assert(!!data.grid && typeof data.grid === 'object', 'grid is required');
    const grid = data.grid as { width?: unknown; height?: unknown };
    assert(Number.isInteger(grid.width) && (grid.width as number) > 0, 'grid.width must be a positive integer');
    assert(Number.isInteger(grid.height) && (grid.height as number) > 0, 'grid.height must be a positive integer');

    assert(Array.isArray(data.obstacles), 'obstacles must be an array');
    assert(Array.isArray(data.spawnZones), 'spawnZones must be an array');
    assert(Array.isArray(data.goalZones), 'goalZones must be an array');
    assert(Array.isArray(data.sanctuaryZone), 'sanctuaryZone must be an array');
    assert(Array.isArray(data.lootSpawns), 'lootSpawns must be an array');

    const width = grid.width as number;
    const height = grid.height as number;

    const validateCellInBounds = (cell: unknown, context: string): asserts cell is { x: number; y: number } => {
      assert(isValidCell(cell), `${context} must contain valid x/y integers`);
      assert(cell.x >= 0 && cell.x < width, `${context} x must be in range [0..${width - 1}]`);
      assert(cell.y >= 0 && cell.y < height, `${context} y must be in range [0..${height - 1}]`);
    };

    const obstacles = data.obstacles.map((cell, index) => {
      validateCellInBounds(cell, `obstacles[${index}]`);
      return { x: cell.x, y: cell.y };
    });

    const sanctuaryZone = data.sanctuaryZone.map((cell, index) => {
      validateCellInBounds(cell, `sanctuaryZone[${index}]`);
      return { x: cell.x, y: cell.y };
    });

    const spawnZones = data.spawnZones.map((zone, zoneIndex) => {
      assert(!!zone && typeof zone === 'object', `spawnZones[${zoneIndex}] must be object`);
      const candidate = zone as { id?: unknown; cells?: unknown };
      assert(typeof candidate.id === 'string' && candidate.id.length > 0, `spawnZones[${zoneIndex}].id is required`);
      assert(Array.isArray(candidate.cells), `spawnZones[${zoneIndex}].cells must be array`);

      const cells = candidate.cells.map((cell, cellIndex) => {
        validateCellInBounds(cell, `spawnZones[${zoneIndex}].cells[${cellIndex}]`);
        return { x: cell.x, y: cell.y };
      });

      return { id: candidate.id, cells };
    });

    const goalZones = data.goalZones.map((zone, zoneIndex) => {
      assert(!!zone && typeof zone === 'object', `goalZones[${zoneIndex}] must be object`);
      const candidate = zone as { id?: unknown; cells?: unknown };
      assert(typeof candidate.id === 'string' && candidate.id.length > 0, `goalZones[${zoneIndex}].id is required`);
      assert(Array.isArray(candidate.cells), `goalZones[${zoneIndex}].cells must be array`);

      const cells = candidate.cells.map((cell, cellIndex) => {
        validateCellInBounds(cell, `goalZones[${zoneIndex}].cells[${cellIndex}]`);
        return { x: cell.x, y: cell.y };
      });

      return { id: candidate.id, cells };
    });

    const lootSpawns = data.lootSpawns.map((loot, lootIndex) => {
      assert(!!loot && typeof loot === 'object', `lootSpawns[${lootIndex}] must be object`);
      const candidate = loot as { id?: unknown; type?: unknown; cell?: unknown };
      assert(typeof candidate.id === 'string' && candidate.id.length > 0, `lootSpawns[${lootIndex}].id is required`);
      assert(typeof candidate.type === 'string' && candidate.type.length > 0, `lootSpawns[${lootIndex}].type is required`);
      validateCellInBounds(candidate.cell, `lootSpawns[${lootIndex}].cell`);

      return {
        id: candidate.id,
        type: candidate.type,
        cell: {
          x: candidate.cell.x,
          y: candidate.cell.y,
        },
      };
    });

    return {
      id: data.id,
      name: data.name,
      grid: {
        width,
        height,
      },
      obstacles,
      spawnZones,
      goalZones,
      sanctuaryZone,
      lootSpawns,
    };
  }
}
