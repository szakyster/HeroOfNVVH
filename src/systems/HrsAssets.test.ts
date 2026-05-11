import { describe, expect, it } from 'vitest';
import { getAvailableHrsAssets, getHrsAssetKey, hasHrsAsset, isHrsImageNameAllowed } from './HrsAssets';

const PUBLIC_BASE_URL = import.meta.env.BASE_URL ?? '/';

describe('HrsAssets', () => {
  it('accepts only direct HRS image names with supported extensions', () => {
    expect(isHrsImageNameAllowed('hatvanpuszta01.png')).toBe(true);
    expect(isHrsImageNameAllowed('repter01.webp')).toBe(true);
    expect(isHrsImageNameAllowed('nested/hatvanpuszta01.png')).toBe(false);
    expect(isHrsImageNameAllowed('nested\\hatvanpuszta01.png')).toBe(false);
    expect(isHrsImageNameAllowed('hatvanpuszta01')).toBe(false);
  });

  it('exposes deterministic asset keys through the registry', () => {
    expect(getAvailableHrsAssets()).toEqual([
      {
        imageName: 'hatvanpuszta01.png',
        key: getHrsAssetKey('hatvanpuszta01.png'),
        url: `${PUBLIC_BASE_URL}assets/hrs/hatvanpuszta01.png`,
      },
      {
        imageName: 'nvvh01.png',
        key: getHrsAssetKey('nvvh01.png'),
        url: `${PUBLIC_BASE_URL}assets/hrs/nvvh01.png`,
      },
      {
        imageName: 'repter01.png',
        key: getHrsAssetKey('repter01.png'),
        url: `${PUBLIC_BASE_URL}assets/hrs/repter01.png`,
      },
    ]);

    expect(hasHrsAsset('repter01.png')).toBe(true);
    expect(hasHrsAsset('missing.png')).toBe(false);
  });
});