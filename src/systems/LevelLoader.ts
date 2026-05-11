import type { HrsImageDefinition, HrsImageSide, HrsZoneType, LevelData } from '../types/level';
import { hasHrsAsset, isHrsImageNameAllowed } from './HrsAssets';
import { hasObstacleAsset, isObstacleImageNameAllowed } from './ObstacleAssets';

const HRS_IMAGE_SIDES: HrsImageSide[] = ['left', 'right', 'top', 'bottom'];
const HRS_ZONE_TYPES: HrsZoneType[] = ['spawn', 'goal', 'sanctuary'];

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

    const data: Record<string, unknown> = rawData as Record<string, unknown>;

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
    assert(data.hrsImages === undefined || Array.isArray(data.hrsImages), 'hrsImages must be an array when provided');
    assert(Array.isArray(data.lootSpawns), 'lootSpawns must be an array');

    const width = grid.width as number;
    const height = grid.height as number;

    const validateCellInBounds = (cell: unknown, context: string): { x: number; y: number } => {
      assert(isValidCell(cell), `${context} must contain valid x/y integers`);
      const validCell = cell as { x: number; y: number };
      assert(validCell.x >= 0 && validCell.x < width, `${context} x must be in range [0..${width - 1}]`);
      assert(validCell.y >= 0 && validCell.y < height, `${context} y must be in range [0..${height - 1}]`);
      return validCell;
    };

    const obstacleData = data.obstacles as unknown[];
    const sanctuaryData = data.sanctuaryZone as unknown[];
    const hrsImagesData = (data.hrsImages as unknown[] | undefined) ?? [];
    const spawnZoneData = data.spawnZones as unknown[];
    const goalZoneData = data.goalZones as unknown[];
    const lootSpawnData = data.lootSpawns as unknown[];

    const obstacles = obstacleData.map((obstacle: unknown, index: number) => {
      assert(!!obstacle && typeof obstacle === 'object', `obstacles[${index}] must be object`);
      const candidate = obstacle as { x?: unknown; y?: unknown; image?: unknown };
      const validCell = validateCellInBounds(candidate, `obstacles[${index}]`);
      assert(typeof candidate.image === 'string' && candidate.image.length > 0, `obstacles[${index}].image is required`);
      assert(
        isObstacleImageNameAllowed(candidate.image),
        `obstacles[${index}].image must be a direct filename from the obstacles folder`,
      );
      assert(
        hasObstacleAsset(candidate.image),
        `obstacles[${index}].image must reference an existing file in the obstacles folder root`,
      );

      return { x: validCell.x, y: validCell.y, image: candidate.image };
    });

    const sanctuaryZone = sanctuaryData.map((cell: unknown, index: number) => {
      const validCell = validateCellInBounds(cell, `sanctuaryZone[${index}]`);
      return { x: validCell.x, y: validCell.y };
    });

    const spawnZones = spawnZoneData.map((zone: unknown, zoneIndex: number) => {
      assert(!!zone && typeof zone === 'object', `spawnZones[${zoneIndex}] must be object`);
      const candidate = zone as { id?: unknown; cells?: unknown };
      assert(typeof candidate.id === 'string' && candidate.id.length > 0, `spawnZones[${zoneIndex}].id is required`);
      assert(Array.isArray(candidate.cells), `spawnZones[${zoneIndex}].cells must be array`);

      const cells = (candidate.cells as unknown[]).map((cell: unknown, cellIndex: number) => {
        const validCell = validateCellInBounds(cell, `spawnZones[${zoneIndex}].cells[${cellIndex}]`);
        return { x: validCell.x, y: validCell.y };
      });

      return { id: candidate.id as string, cells };
    });

    const goalZones = goalZoneData.map((zone: unknown, zoneIndex: number) => {
      assert(!!zone && typeof zone === 'object', `goalZones[${zoneIndex}] must be object`);
      const candidate = zone as { id?: unknown; cells?: unknown };
      assert(typeof candidate.id === 'string' && candidate.id.length > 0, `goalZones[${zoneIndex}].id is required`);
      assert(Array.isArray(candidate.cells), `goalZones[${zoneIndex}].cells must be array`);

      const cells = (candidate.cells as unknown[]).map((cell: unknown, cellIndex: number) => {
        const validCell = validateCellInBounds(cell, `goalZones[${zoneIndex}].cells[${cellIndex}]`);
        return { x: validCell.x, y: validCell.y };
      });

      return { id: candidate.id as string, cells };
    });

    const spawnZoneIds = new Set(spawnZones.map((zone) => zone.id));
    const goalZoneIds = new Set(goalZones.map((zone) => zone.id));
    const hrsZoneKeys = new Set<string>();

    const hrsImages = hrsImagesData.map((hrsImage: unknown, index: number): HrsImageDefinition => {
      assert(!!hrsImage && typeof hrsImage === 'object', `hrsImages[${index}] must be object`);
      const candidate = hrsImage as {
        id?: unknown;
        zoneType?: unknown;
        zoneId?: unknown;
        image?: unknown;
        side?: unknown;
        offsetX?: unknown;
        offsetY?: unknown;
        scale?: unknown;
      };

      assert(typeof candidate.id === 'string' && candidate.id.length > 0, `hrsImages[${index}].id is required`);
      assert(
        typeof candidate.zoneType === 'string' && HRS_ZONE_TYPES.includes(candidate.zoneType as HrsZoneType),
        `hrsImages[${index}].zoneType must be one of ${HRS_ZONE_TYPES.join(', ')}`,
      );
      assert(typeof candidate.image === 'string' && candidate.image.length > 0, `hrsImages[${index}].image is required`);
      assert(
        isHrsImageNameAllowed(candidate.image),
        `hrsImages[${index}].image must be a direct filename from the hrs folder`,
      );
      assert(
        hasHrsAsset(candidate.image),
        `hrsImages[${index}].image must reference an existing file in the hrs folder root`,
      );
      assert(
        typeof candidate.side === 'string' && HRS_IMAGE_SIDES.includes(candidate.side as HrsImageSide),
        `hrsImages[${index}].side must be one of ${HRS_IMAGE_SIDES.join(', ')}`,
      );

      const zoneType = candidate.zoneType as HrsZoneType;
      const zoneId = typeof candidate.zoneId === 'string' && candidate.zoneId.length > 0 ? candidate.zoneId : undefined;

      if (zoneType === 'spawn') {
        assert(zoneId !== undefined, `hrsImages[${index}].zoneId is required for spawn zones`);
        assert(spawnZoneIds.has(zoneId), `hrsImages[${index}].zoneId must reference an existing spawn zone`);
      }

      if (zoneType === 'goal') {
        assert(zoneId !== undefined, `hrsImages[${index}].zoneId is required for goal zones`);
        assert(goalZoneIds.has(zoneId), `hrsImages[${index}].zoneId must reference an existing goal zone`);
      }

      if (zoneType === 'sanctuary') {
        assert(zoneId === undefined || zoneId === 'sanctuary', `hrsImages[${index}].zoneId must be omitted or 'sanctuary'`);
      }

      assert(
        candidate.offsetX === undefined || typeof candidate.offsetX === 'number',
        `hrsImages[${index}].offsetX must be a number when provided`,
      );
      assert(
        candidate.offsetY === undefined || typeof candidate.offsetY === 'number',
        `hrsImages[${index}].offsetY must be a number when provided`,
      );
      assert(
        candidate.scale === undefined || (typeof candidate.scale === 'number' && candidate.scale > 0),
        `hrsImages[${index}].scale must be a positive number when provided`,
      );

      const zoneKey = `${zoneType}:${zoneType === 'sanctuary' ? 'sanctuary' : zoneId}`;
      assert(!hrsZoneKeys.has(zoneKey), `hrsImages[${index}] duplicates an existing HRS zone image assignment`);
      hrsZoneKeys.add(zoneKey);

      return {
        id: candidate.id as string,
        zoneType,
        zoneId,
        image: candidate.image as string,
        side: candidate.side as HrsImageSide,
        offsetX: candidate.offsetX as number | undefined,
        offsetY: candidate.offsetY as number | undefined,
        scale: candidate.scale as number | undefined,
      };
    });

    const lootSpawns = lootSpawnData.map((loot: unknown, lootIndex: number) => {
      assert(!!loot && typeof loot === 'object', `lootSpawns[${lootIndex}] must be object`);
      const candidate = loot as { id?: unknown; type?: unknown; value?: unknown; cell?: unknown };
      assert(typeof candidate.id === 'string' && candidate.id.length > 0, `lootSpawns[${lootIndex}].id is required`);
      assert(typeof candidate.type === 'string' && candidate.type.length > 0, `lootSpawns[${lootIndex}].type is required`);
      assert(candidate.value === 10 || candidate.value === 20 || candidate.value === 50, `lootSpawns[${lootIndex}].value must be one of 10, 20, 50`);
      const validCell = validateCellInBounds(candidate.cell, `lootSpawns[${lootIndex}].cell`);

      return {
        id: candidate.id as string,
        type: candidate.type as string,
        value: candidate.value as 10 | 20 | 50,
        cell: {
          x: validCell.x,
          y: validCell.y,
        },
      };
    });

    return {
      id: data.id as string,
      name: data.name as string,
      grid: {
        width,
        height,
      },
      obstacles,
      spawnZones,
      goalZones,
      sanctuaryZone,
      hrsImages,
      lootSpawns,
    };
  }
}
