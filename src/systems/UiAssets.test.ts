import { describe, expect, it } from 'vitest';
import {
  EFFECT_ON_IMAGE_NAME,
  getAvailableUiAssets,
  getUiAssetKey,
  hasUiAsset,
  HELP_IMAGE_NAME,
  INVENTORY_SLOT_IMAGE_NAME,
  MUSIC_ON_IMAGE_NAME,
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
    expect(getUiAssetKey(EFFECT_ON_IMAGE_NAME)).toBe('ui:effecton.png');
    expect(hasUiAsset(EFFECT_ON_IMAGE_NAME)).toBe(true);
    expect(getUiAssetKey(HELP_IMAGE_NAME)).toBe('ui:help.png');
    expect(hasUiAsset(HELP_IMAGE_NAME)).toBe(true);
    expect(getUiAssetKey(MUSIC_ON_IMAGE_NAME)).toBe('ui:musicon.png');
    expect(hasUiAsset(MUSIC_ON_IMAGE_NAME)).toBe(true);
    expect(getAvailableUiAssets()).toEqual([
      {
        imageName: INVENTORY_SLOT_IMAGE_NAME,
        key: 'ui:bag01.png',
        url: expect.stringContaining('/assets/sprites/bag01.png'),
      },
      {
        imageName: EFFECT_ON_IMAGE_NAME,
        key: 'ui:effecton.png',
        url: expect.stringContaining('/assets/sprites/effecton.png'),
      },
      {
        imageName: HELP_IMAGE_NAME,
        key: 'ui:help.png',
        url: expect.stringContaining('/assets/sprites/help.png'),
      },
      {
        imageName: MUSIC_ON_IMAGE_NAME,
        key: 'ui:musicon.png',
        url: expect.stringContaining('/assets/sprites/musicon.png'),
      },
    ]);
  });
});