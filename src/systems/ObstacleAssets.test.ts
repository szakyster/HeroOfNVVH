import { describe, expect, it } from 'vitest';
import {
  createObstacleAssetRegistry,
  getObstacleAssetKey,
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
      '../../public/assets/obstacles/residental02.png': '/assets/obstacles/residental02.png',
      '../../public/assets/obstacles/residental01.png': '/assets/obstacles/residental01.png',
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
});