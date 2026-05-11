import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class MockScene {
    constructor(_config?: unknown) {}
  }

  return {
    default: {
      Scene: MockScene,
    },
  };
});

let SceneBackgrounds: typeof import('./SceneBackgrounds');

beforeAll(async () => {
  SceneBackgrounds = await import('./SceneBackgrounds');
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SceneBackgrounds', () => {
  it('preloads every scene background asset', () => {
    const image = vi.fn();
    const scene = {
      load: {
        image,
      },
    };

    SceneBackgrounds.preloadSceneBackgrounds(scene as never);

    expect(image).toHaveBeenCalledTimes(4);
    expect(image).toHaveBeenCalledWith('scene-menu-bg', ['assets/backgrounds/scene-menu-bg-v01.png']);
    expect(image).toHaveBeenCalledWith('scene-play-bg', ['assets/backgrounds/scene-play-bg-v01.png']);
    expect(image).toHaveBeenCalledWith('scene-leaderboard-bg', ['assets/backgrounds/scene-leaderboard-bg-v01.png']);
    expect(image).toHaveBeenCalledWith('scene-game-over-bg', ['assets/backgrounds/scene-game-over-bg-v01.png']);
  });

  it('renders an image when the texture is available', () => {
    const setDisplaySize = vi.fn().mockReturnThis();
    const setDepth = vi.fn().mockReturnThis();
    const image = vi.fn(() => ({ setDisplaySize, setDepth }));
    const rectangle = vi.fn();
    const scene = {
      scale: { width: 1024, height: 768 },
      textures: { exists: vi.fn(() => true) },
      add: {
        image,
        rectangle,
      },
    };

    SceneBackgrounds.addSceneBackground(scene as never, 'menu');

    expect(image).toHaveBeenCalledWith(512, 384, 'scene-menu-bg');
    expect(setDisplaySize).toHaveBeenCalledWith(1024, 768);
    expect(setDepth).toHaveBeenCalledWith(-10);
    expect(rectangle).not.toHaveBeenCalled();
  });

  it('falls back to a flat fill when the texture is unavailable', () => {
    const setDepth = vi.fn().mockReturnThis();
    const rectangle = vi.fn(() => ({ setDepth }));
    const scene = {
      scale: { width: 800, height: 600 },
      textures: { exists: vi.fn(() => false) },
      add: {
        rectangle,
      },
    };

    SceneBackgrounds.addSceneBackground(scene as never, 'gameOver');

    expect(rectangle).toHaveBeenCalledWith(400, 300, 800, 600, 0x3d1120, 1);
    expect(setDepth).toHaveBeenCalledWith(-10);
  });
});