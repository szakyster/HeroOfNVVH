const HRS_ASSET_KEY_PREFIX = 'hrs:';
const ALLOWED_IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;
const HRS_IMAGE_NAMES = ['hatvanpuszta01.png', 'repter01.png', 'sanctuary01.png'];
const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';

export type HrsAssetEntry = {
  imageName: string;
  key: string;
  url: string;
};

export function isHrsImageNameAllowed(imageName: string): boolean {
  if (imageName.length === 0) {
    return false;
  }

  if (imageName.includes('/') || imageName.includes('\\')) {
    return false;
  }

  return ALLOWED_IMAGE_EXTENSION_PATTERN.test(imageName);
}

export function getHrsAssetKey(imageName: string): string {
  return `${HRS_ASSET_KEY_PREFIX}${imageName}`;
}

const hrsAssetRegistry = HRS_IMAGE_NAMES.map((imageName) => ({
  imageName,
  key: getHrsAssetKey(imageName),
  url: `${PUBLIC_BASE_URL}assets/hrs/${imageName}`,
})).sort((left, right) => left.imageName.localeCompare(right.imageName));

const hrsAssetRegistryByName = new Map(hrsAssetRegistry.map((entry) => [entry.imageName, entry]));

export function getAvailableHrsAssets(): HrsAssetEntry[] {
  return [...hrsAssetRegistry];
}

export function hasHrsAsset(imageName: string): boolean {
  return hrsAssetRegistryByName.has(imageName);
}