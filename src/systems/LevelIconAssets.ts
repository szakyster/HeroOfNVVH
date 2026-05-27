const LEVEL_ICON_ASSET_KEY_PREFIX = 'level-icon:';
const ALLOWED_IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;
const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';
const LEVEL_ICON_IMAGE_NAMES = ['level-01.png', 'level-02.png', 'level-03.png', 'level-04.png', 'level-05.png', 'level-06.png'];

export type LevelIconAssetEntry = {
  imageName: string;
  key: string;
  url: string;
};

export function isLevelIconImageNameAllowed(imageName: string): boolean {
  // Reject nested or unsupported filenames before they reach Phaser's loader.
  if (imageName.length === 0) {
    return false;
  }

  if (imageName.includes('/') || imageName.includes('\\')) {
    return false;
  }

  return ALLOWED_IMAGE_EXTENSION_PATTERN.test(imageName);
}

export function getLevelIconAssetKey(imageName: string): string {
  // Namespacing level icon textures avoids collisions with sprite sheet keys.
  return `${LEVEL_ICON_ASSET_KEY_PREFIX}${imageName}`;
}

const levelIconAssetRegistry: LevelIconAssetEntry[] = LEVEL_ICON_IMAGE_NAMES.map((imageName) => ({
  imageName,
  key: getLevelIconAssetKey(imageName),
  url: `${PUBLIC_BASE_URL}levels/${imageName}`,
})).sort((left, right) => left.imageName.localeCompare(right.imageName));

const levelIconAssetRegistryByName = new Map(levelIconAssetRegistry.map((entry) => [entry.imageName, entry]));

export function getAvailableLevelIconAssets(): LevelIconAssetEntry[] {
  // BootScene preloads the small preview textures from this registry.
  return [...levelIconAssetRegistry];
}

export function hasLevelIconAsset(imageName: string): boolean {
  // Scene code can fall back to a placeholder when an icon is not preloaded yet.
  return levelIconAssetRegistryByName.has(imageName);
}