const UI_ASSET_KEY_PREFIX = 'ui:';
const ALLOWED_IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;
const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';

export const INVENTORY_SLOT_IMAGE_NAME = 'bag01.png';

export type UiAssetEntry = {
  imageName: string;
  key: string;
  url: string;
};

export function isUiImageNameAllowed(imageName: string): boolean {
  if (imageName.length === 0) {
    return false;
  }

  if (imageName.includes('/') || imageName.includes('\\')) {
    return false;
  }

  return ALLOWED_IMAGE_EXTENSION_PATTERN.test(imageName);
}

export function getUiAssetKey(imageName: string): string {
  return `${UI_ASSET_KEY_PREFIX}${imageName}`;
}

const UI_IMAGE_NAMES = [INVENTORY_SLOT_IMAGE_NAME];

const uiAssetRegistry = UI_IMAGE_NAMES.map((imageName) => ({
  imageName,
  key: getUiAssetKey(imageName),
  url: `${PUBLIC_BASE_URL}assets/sprites/${imageName}`,
})).sort((left, right) => left.imageName.localeCompare(right.imageName));

const uiAssetRegistryByName = new Map(uiAssetRegistry.map((entry) => [entry.imageName, entry]));

export function getAvailableUiAssets(): UiAssetEntry[] {
  return [...uiAssetRegistry];
}

export function hasUiAsset(imageName: string): boolean {
  return uiAssetRegistryByName.has(imageName);
}