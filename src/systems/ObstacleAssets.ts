const OBSTACLE_ASSET_KEY_PREFIX = 'obstacle:';
const ALLOWED_IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;

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
        url,
      };
    })
    .filter((entry): entry is ObstacleAssetEntry => entry !== null)
    .sort((left, right) => left.imageName.localeCompare(right.imageName));
}

const obstacleAssetModules = import.meta.glob('../../public/assets/obstacles/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const obstacleAssetRegistry = createObstacleAssetRegistry(obstacleAssetModules);
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