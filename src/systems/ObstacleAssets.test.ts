import { describe, expect, it } from 'vitest';
import {
  createObstacleAssetRegistry,
  getAvailableObstacleAssets,
  getObstacleAssetKey,
  hasObstacleAsset,
  isObstacleImageNameAllowed,
} from './ObstacleAssets';

describe('ObstacleAssets', () => {
  it('accepts only direct obstacle image names with supported extensions', () => {
    expect(isObstacleImageNameAllowed('residental01.png')).toBe(true);
    expect(isObstacleImageNameAllowed('office.webp')).toBe(true);
    expect(isObstacleImageNameAllowed('nested/residental01.png')).toBe(false);
    expect(isObstacleImageNameAllowed('nested\\residental01.png')).toBe(false);
    expect(isObstacleImageNameAllowed('residental01')).toBe(false);
  });

  it('builds deterministic keys and ignores invalid paths when creating a registry', () => {
    const registry = createObstacleAssetRegistry({
      '../../public/assets/obstacles/residental02.png': '/public/assets/obstacles/residental02.png',
      '../../public/assets/obstacles/residental01.png': '/public/assets/obstacles/residental01.png',
      '../../public/assets/obstacles/nested/residental03.png': '/assets/obstacles/nested/residental03.png',
    });

    expect(registry).toEqual([
      {
        imageName: 'residental01.png',
        key: getObstacleAssetKey('residental01.png'),
        url: '/assets/obstacles/residental01.png',
      },
      {
        imageName: 'residental02.png',
        key: getObstacleAssetKey('residental02.png'),
        url: '/assets/obstacles/residental02.png',
      },
    ]);
  });

  it('exposes the authored obstacle asset registry including the extra tree variants', () => {
    expect(hasObstacleAsset('residental02.png')).toBe(true);
    expect(hasObstacleAsset('residental03.png')).toBe(true);
    expect(hasObstacleAsset('tree02.png')).toBe(true);
    expect(hasObstacleAsset('tree03.png')).toBe(true);
    expect(getAvailableObstacleAssets()).toEqual(
      expect.arrayContaining([
        {
          imageName: 'residental02.png',
          key: getObstacleAssetKey('residental02.png'),
          url: expect.stringContaining('/assets/obstacles/residental02.png'),
        },
        {
          imageName: 'residental03.png',
          key: getObstacleAssetKey('residental03.png'),
          url: expect.stringContaining('/assets/obstacles/residental03.png'),
        },
        {
          imageName: 'tree02.png',
          key: getObstacleAssetKey('tree02.png'),
          url: expect.stringContaining('/assets/obstacles/tree02.png'),
        },
        {
          imageName: 'tree03.png',
          key: getObstacleAssetKey('tree03.png'),
          url: expect.stringContaining('/assets/obstacles/tree03.png'),
        },
      ]),
    );
  });
});