const LOOT_ASSET_KEY_PREFIX = 'loot:';
const ALLOWED_IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;
const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';

export const DEFAULT_LOOT_IMAGE_NAME = 'money01.png';
export const SHARED_LOOT_ASSET_KEY = `${LOOT_ASSET_KEY_PREFIX}${DEFAULT_LOOT_IMAGE_NAME}`;

export type LootAssetEntry = {
  imageName: string;
  key: string;
  url: string;
};

export function isLootImageNameAllowed(imageName: string): boolean {
  if (imageName.length === 0) {
    return false;
  }

  if (imageName.includes('/') || imageName.includes('\\')) {
    return false;
  }

  return ALLOWED_IMAGE_EXTENSION_PATTERN.test(imageName);
}

export function getLootAssetKey(imageName: string): string {
  return `${LOOT_ASSET_KEY_PREFIX}${imageName}`;
}

const LOOT_IMAGE_NAMES = [DEFAULT_LOOT_IMAGE_NAME, 'ferrari01.png', 'helicopter01.png'];

const lootAssetRegistry = LOOT_IMAGE_NAMES.map((imageName) => ({
  imageName,
  key: getLootAssetKey(imageName),
  url: `${PUBLIC_BASE_URL}assets/loots/${imageName}`,
})).sort((left, right) => left.imageName.localeCompare(right.imageName));

const lootAssetRegistryByName = new Map(lootAssetRegistry.map((entry) => [entry.imageName, entry]));

export function getAvailableLootAssets(): LootAssetEntry[] {
  return [...lootAssetRegistry];
}

export function hasLootAsset(imageName: string): boolean {
  return lootAssetRegistryByName.has(imageName);
}