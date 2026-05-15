import type { LevelData, GridCell, HrsImageSide } from '../types/level';
import { GridSystem, type ScreenRect } from '../systems/GridSystem';
import { getHrsAssetKey } from '../systems/HrsAssets';
import { getObstacleAssetKey, hasObstacleAsset } from '../systems/ObstacleAssets';

type TextureSourceLike = {
  width?: number;
  height?: number;
};

type TextureLike = {
  getSourceImage: () => TextureSourceLike | TextureSourceLike[];
};

type TextureManagerLike = {
  exists: (key: string) => boolean;
  get: (key: string) => TextureLike;
};

type GraphicsLike = {
  setDepth: (value: number) => GraphicsLike;
  fillStyle: (color: number, alpha?: number) => GraphicsLike;
  lineStyle: (lineWidth: number, color: number, alpha?: number) => GraphicsLike;
  beginPath: () => GraphicsLike;
  moveTo: (x: number, y: number) => GraphicsLike;
  lineTo: (x: number, y: number) => GraphicsLike;
  closePath: () => GraphicsLike;
  fillPath: () => GraphicsLike;
  strokePath: () => GraphicsLike;
};

type ImageLike = {
  setOrigin: (x?: number, y?: number) => ImageLike;
  setDisplaySize: (width: number, height: number) => ImageLike;
  setDepth: (depth: number) => ImageLike;
};

type AddLike = {
  graphics: () => GraphicsLike;
  image: (x: number, y: number, texture: string) => ImageLike;
};

type WorldSceneLike = {
  add: AddLike;
  textures: TextureManagerLike;
};

type GameplayDepthResolver = (worldY: number) => number;

type RenderObstacleCellsArgs = {
  scene: WorldSceneLike;
  gridSystem: GridSystem;
  level: LevelData;
  obstacleSpriteMaxWidthScale: number;
  obstacleSpriteMaxHeightScale: number;
  getGameplayDepth: GameplayDepthResolver;
};

type RenderHrsImagesArgs = {
  scene: WorldSceneLike;
  gridSystem: GridSystem;
  level: LevelData;
  hrsSpriteMaxWidthScale: number;
  hrsSpriteMaxHeightScale: number;
  getGameplayDepth: GameplayDepthResolver;
};

type HrsPlacement = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  depthY: number;
};

function getTextureSize(textures: TextureManagerLike, textureKey: string): { width: number; height: number } {
  const sourceImage = textures.get(textureKey).getSourceImage();
  const textureSource = Array.isArray(sourceImage) ? sourceImage[0] : sourceImage;

  return {
    width: textureSource?.width ?? 1,
    height: textureSource?.height ?? 1,
  };
}

function drawFallbackObstacleCell(graphics: GraphicsLike, gridSystem: GridSystem, cell: GridCell): void {
  const polygon = gridSystem.cellPolygon(cell);
  graphics.fillStyle(0xe76f51, 0.35);
  graphics.lineStyle(2, 0xffb4a2, 0.95);
  graphics.beginPath();
  graphics.moveTo(polygon[0].x, polygon[0].y);
  graphics.lineTo(polygon[1].x, polygon[1].y);
  graphics.lineTo(polygon[2].x, polygon[2].y);
  graphics.lineTo(polygon[3].x, polygon[3].y);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
}

export function getLevelObstacleCells(level: LevelData): GridCell[] {
  return level.obstacles.map((obstacle) => ({ x: obstacle.x, y: obstacle.y }));
}

export function getFittedSpriteDisplaySize(
  bounds: ScreenRect,
  textureSize: { width: number; height: number },
  maxWidthScale: number,
  maxHeightScale: number,
): { width: number; height: number } {
  const maxWidth = bounds.width * maxWidthScale;
  const maxHeight = bounds.height * maxHeightScale;

  if (textureSize.width <= 0 || textureSize.height <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(maxWidth / textureSize.width, maxHeight / textureSize.height);

  return {
    width: textureSize.width * scale,
    height: textureSize.height * scale,
  };
}

export function getObstacleDisplaySize(
  bounds: ScreenRect,
  textureSize: { width: number; height: number },
  obstacleSpriteMaxWidthScale: number,
  obstacleSpriteMaxHeightScale: number,
): { width: number; height: number } {
  return getFittedSpriteDisplaySize(
    bounds,
    textureSize,
    obstacleSpriteMaxWidthScale,
    obstacleSpriteMaxHeightScale,
  );
}

export function getHrsDisplaySize(
  bounds: ScreenRect,
  textureSize: { width: number; height: number },
  hrsSpriteMaxWidthScale: number,
  hrsSpriteMaxHeightScale: number,
  scale = 1,
): { width: number; height: number } {
  return getFittedSpriteDisplaySize(
    bounds,
    textureSize,
    hrsSpriteMaxWidthScale * scale,
    hrsSpriteMaxHeightScale * scale,
  );
}

export function getHrsZoneCells(level: LevelData, hrsImage: LevelData['hrsImages'][number]): GridCell[] {
  if (hrsImage.zoneType === 'sanctuary') {
    return [...level.sanctuaryZone];
  }

  if (hrsImage.zoneType === 'spawn') {
    return level.spawnZones.find((zone) => zone.id === hrsImage.zoneId)?.cells ?? [];
  }

  return level.goalZones.find((zone) => zone.id === hrsImage.zoneId)?.cells ?? [];
}

export function getGridCellsBounds(gridSystem: GridSystem, cells: GridCell[]): ScreenRect {
  const cellBounds = cells.map((cell) => gridSystem.cellBounds(cell, 0));
  const minX = Math.min(...cellBounds.map((bounds) => bounds.x));
  const minY = Math.min(...cellBounds.map((bounds) => bounds.y));
  const maxX = Math.max(...cellBounds.map((bounds) => bounds.x + bounds.width));
  const maxY = Math.max(...cellBounds.map((bounds) => bounds.y + bounds.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getHrsPlacement(
  zoneBounds: ScreenRect,
  side: HrsImageSide,
  offsetX = 0,
  offsetY = 0,
): HrsPlacement {
  const centerX = zoneBounds.x + zoneBounds.width / 2;
  const horizontalMargin = Math.max(26, zoneBounds.width * 0.36);
  const verticalMargin = Math.max(18, zoneBounds.height * 0.34);
  const baseBottomY = zoneBounds.y + zoneBounds.height;

  if (side === 'left') {
    return {
      x: zoneBounds.x - horizontalMargin + offsetX,
      y: baseBottomY + offsetY,
      originX: 1,
      originY: 1,
      depthY: baseBottomY,
    };
  }

  if (side === 'right') {
    return {
      x: zoneBounds.x + zoneBounds.width + horizontalMargin + offsetX,
      y: baseBottomY + offsetY,
      originX: 0,
      originY: 1,
      depthY: baseBottomY,
    };
  }

  if (side === 'top') {
    return {
      x: centerX + offsetX,
      y: zoneBounds.y - verticalMargin + offsetY,
      originX: 0.5,
      originY: 1,
      depthY: zoneBounds.y,
    };
  }

  return {
    x: centerX + offsetX,
    y: baseBottomY + verticalMargin + offsetY,
    originX: 0.5,
    originY: 0,
    depthY: baseBottomY,
  };
}

export function drawObstacleCells({
  scene,
  gridSystem,
  level,
  obstacleSpriteMaxWidthScale,
  obstacleSpriteMaxHeightScale,
  getGameplayDepth,
}: RenderObstacleCellsArgs): void {
  let fallbackGraphics: GraphicsLike | undefined;
  const obstacleTextureSizes = new Map<string, { width: number; height: number }>();

  for (const obstacle of level.obstacles) {
    const textureKey = getObstacleAssetKey(obstacle.image);

    if (!hasObstacleAsset(obstacle.image) || !scene.textures.exists(textureKey)) {
      fallbackGraphics ??= scene.add.graphics().setDepth(1.5);
      drawFallbackObstacleCell(fallbackGraphics, gridSystem, obstacle);
      continue;
    }

    let textureSize = obstacleTextureSizes.get(textureKey);

    if (!textureSize) {
      textureSize = getTextureSize(scene.textures, textureKey);
      obstacleTextureSizes.set(textureKey, textureSize);
    }

    const center = gridSystem.cellCenter(obstacle);
    const bounds = gridSystem.cellBounds(obstacle, 8);
    const displaySize = getObstacleDisplaySize(
      bounds,
      textureSize,
      obstacleSpriteMaxWidthScale,
      obstacleSpriteMaxHeightScale,
    );
    const anchorY = bounds.y + bounds.height * 1.08;

    scene.add
      .image(center.x, anchorY, textureKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(displaySize.width, displaySize.height)
      .setDepth(getGameplayDepth(anchorY));
  }
}

export function drawHrsImages({
  scene,
  gridSystem,
  level,
  hrsSpriteMaxWidthScale,
  hrsSpriteMaxHeightScale,
  getGameplayDepth,
}: RenderHrsImagesArgs): void {
  if (level.hrsImages.length === 0) {
    return;
  }

  const textureSizes = new Map<string, { width: number; height: number }>();

  for (const hrsImage of level.hrsImages) {
    const textureKey = getHrsAssetKey(hrsImage.image);

    if (!scene.textures.exists(textureKey)) {
      continue;
    }

    const zoneCells = getHrsZoneCells(level, hrsImage);

    if (zoneCells.length === 0) {
      continue;
    }

    let textureSize = textureSizes.get(textureKey);

    if (!textureSize) {
      textureSize = getTextureSize(scene.textures, textureKey);
      textureSizes.set(textureKey, textureSize);
    }

    const zoneBounds = getGridCellsBounds(gridSystem, zoneCells);
    const placement = getHrsPlacement(zoneBounds, hrsImage.side, hrsImage.offsetX, hrsImage.offsetY);
    const displaySize = getHrsDisplaySize(
      zoneBounds,
      textureSize,
      hrsSpriteMaxWidthScale,
      hrsSpriteMaxHeightScale,
      hrsImage.scale,
    );

    scene.add
      .image(placement.x, placement.y, textureKey)
      .setOrigin(placement.originX, placement.originY)
      .setDisplaySize(displaySize.width, displaySize.height)
      .setDepth(getGameplayDepth(placement.depthY) - 0.08);
  }
}

export function drawSanctuaryZone(scene: Pick<WorldSceneLike, 'add'>, gridSystem: GridSystem, sanctuaryZone: GridCell[]): void {
  const graphics = scene.add.graphics();
  graphics.setDepth(1.4);

  for (const cell of sanctuaryZone) {
    const polygon = gridSystem.cellPolygon(cell);
    graphics.fillStyle(0x2a9d8f, 0.22);
    graphics.lineStyle(2, 0x95d5b2, 0.9);
    graphics.beginPath();
    graphics.moveTo(polygon[0].x, polygon[0].y);
    graphics.lineTo(polygon[1].x, polygon[1].y);
    graphics.lineTo(polygon[2].x, polygon[2].y);
    graphics.lineTo(polygon[3].x, polygon[3].y);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }
}