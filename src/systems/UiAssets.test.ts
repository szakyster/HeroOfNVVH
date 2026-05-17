import { describe, expect, it } from 'vitest';
import {
  getAvailableUiAssets,
  getUiAssetKey,
  hasUiAsset,
  INVENTORY_SLOT_IMAGE_NAME,
  isUiImageNameAllowed,
} from './UiAssets';

describe('UiAssets', () => {
  it('validates allowed UI image names', () => {
    expect(isUiImageNameAllowed('bag01.png')).toBe(true);
    expect(isUiImageNameAllowed('nested/bag01.png')).toBe(false);
    expect(isUiImageNameAllowed('')).toBe(false);
    expect(isUiImageNameAllowed('bag01.txt')).toBe(false);
  });

  it('exposes the inventory bag asset registry', () => {
    expect(getUiAssetKey(INVENTORY_SLOT_IMAGE_NAME)).toBe('ui:bag01.png');
    expect(hasUiAsset(INVENTORY_SLOT_IMAGE_NAME)).toBe(true);
    expect(getAvailableUiAssets()).toEqual([
      {
        imageName: INVENTORY_SLOT_IMAGE_NAME,
        key: 'ui:bag01.png',
        url: expect.stringContaining('/assets/sprites/bag01.png'),
      },
    ]);
  });
});