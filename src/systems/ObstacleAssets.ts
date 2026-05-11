const OBSTACLE_ASSET_KEY_PREFIX = 'obstacle:';
const ALLOWED_IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;
const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';

export type ObstacleAssetEntry = {
  imageName: string;
  key: string;
  url: string;
};

export function isObstacleImageNameAllowed(imageName: string): boolean {
  if (imageName.length === 0) {
    return false;
  }

  if (imageName.includes('/') || imageName.includes('\\')) {
    return false;
  }

  return ALLOWED_IMAGE_EXTENSION_PATTERN.test(imageName);
}

export function getObstacleAssetKey(imageName: string): string {
  return `${OBSTACLE_ASSET_KEY_PREFIX}${imageName}`;
}

function normalizeObstacleAssetUrl(url: string): string {
  return url.startsWith('/public/') ? url.slice('/public'.length) : url;
}

export function createObstacleAssetRegistry(assetUrls: Record<string, string>): ObstacleAssetEntry[] {
  return Object.entries(assetUrls)
    .map(([modulePath, url]) => {
      const obstacleRootMarker = '/obstacles/';
      const obstacleRootIndex = modulePath.lastIndexOf(obstacleRootMarker);

      if (obstacleRootIndex === -1) {
        return null;
      }

      const imageName = modulePath.slice(obstacleRootIndex + obstacleRootMarker.length);

      if (!imageName || !isObstacleImageNameAllowed(imageName)) {
        return null;
      }

      return {
        imageName,
        key: getObstacleAssetKey(imageName),
        url: normalizeObstacleAssetUrl(url),
      };
    })
    .filter((entry): entry is ObstacleAssetEntry => entry !== null)
    .sort((left, right) => left.imageName.localeCompare(right.imageName));
}

const OBSTACLE_IMAGE_NAMES = ['car01.png', 'office01.png', 'residental01.png', 'tree01.png'];

const obstacleAssetRegistry = OBSTACLE_IMAGE_NAMES.map((imageName) => ({
  imageName,
  key: getObstacleAssetKey(imageName),
  url: `${PUBLIC_BASE_URL}assets/obstacles/${imageName}`,
})).sort((left, right) => left.imageName.localeCompare(right.imageName));

const obstacleAssetRegistryByName = new Map(obstacleAssetRegistry.map((entry) => [entry.imageName, entry]));

export function getAvailableObstacleAssets(): ObstacleAssetEntry[] {
  return [...obstacleAssetRegistry];
}

export function hasObstacleAsset(imageName: string): boolean {
  return obstacleAssetRegistryByName.has(imageName);
}

export function getObstacleAssetUrl(imageName: string): string | undefined {
  return obstacleAssetRegistryByName.get(imageName)?.url;
}