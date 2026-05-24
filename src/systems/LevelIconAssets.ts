const LEVEL_ICON_ASSET_KEY_PREFIX = 'level-icon:';
const ALLOWED_IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;
const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';

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

const levelIconAssetRegistry: LevelIconAssetEntry[] = [
  {
    imageName: 'enemy01.png',
    key: getLevelIconAssetKey('enemy01.png'),
    url: `${PUBLIC_BASE_URL}assets/sprites/enemy01.png`,
  },
  {
    imageName: 'enemy02.png',
    key: getLevelIconAssetKey('enemy02.png'),
    url: `${PUBLIC_BASE_URL}assets/sprites/enemy02.png`,
  },
  {
    imageName: 'enemy03.png',
    key: getLevelIconAssetKey('enemy03.png'),
    url: `${PUBLIC_BASE_URL}assets/sprites/enemy03.png`,
  },
  {
    imageName: 'enemy04.png',
    key: getLevelIconAssetKey('enemy04.png'),
    url: `${PUBLIC_BASE_URL}assets/sprites/enemy04/walk_down.png`,
  },
  {
    imageName: 'PSZ01Run.png',
    key: getLevelIconAssetKey('PSZ01Run.png'),
    url: `${PUBLIC_BASE_URL}assets/sprites/PSZ01Run.png`,
  },
].sort((left, right) => left.imageName.localeCompare(right.imageName));

const levelIconAssetRegistryByName = new Map(levelIconAssetRegistry.map((entry) => [entry.imageName, entry]));

export function getAvailableLevelIconAssets(): LevelIconAssetEntry[] {
  // BootScene preloads the small preview textures from this registry.
  return [...levelIconAssetRegistry];
}

export function hasLevelIconAsset(imageName: string): boolean {
  // Scene code can fall back to a placeholder when an icon is not preloaded yet.
  return levelIconAssetRegistryByName.has(imageName);
}