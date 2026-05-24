import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type MockText = {
  text: string;
  setOrigin: ReturnType<typeof vi.fn>;
  setText: ReturnType<typeof vi.fn>;
};

type MockRectangle = {
  setDepth: ReturnType<typeof vi.fn>;
  setOrigin: ReturnType<typeof vi.fn>;
  setScale: ReturnType<typeof vi.fn>;
};

const loadAudioSettingsIntoRegistry = vi.fn();
const applyAudioSettingsFromRegistry = vi.fn();
const getAudioSystem = vi.fn();
const preloadSceneBackgrounds = vi.fn();
const getOrderedLevelCatalog = vi.fn();
const getAvailableObstacleAssets = vi.fn();
const getAvailableHrsAssets = vi.fn();
const getAvailableLootAssets = vi.fn();
const getAvailableUiAssets = vi.fn();
const getAvailableLevelIconAssets = vi.fn();

const mockAudioSystem = {
  setMasterVolume: vi.fn(),
  setMuted: vi.fn(),
};

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

vi.mock('../systems/AudioSystem', () => ({
  AUDIO_KEYS: {
    ATTACK: 'sfx-attack',
    ALARM: 'sfx-alarm',
    DEATH_1: 'sfx-death-1',
    DEATH_2: 'sfx-death-2',
    DEATH_3: 'sfx-death-3',
    DEATH_4: 'sfx-death-4',
    MENU: 'music-menu',
    AMBIENT: 'music-ambient',
  },
  applyAudioSettingsFromRegistry,
  getAudioSystem,
  loadAudioSettingsIntoRegistry,
}));

vi.mock('../systems/LevelCatalog', () => ({
  getOrderedLevelCatalog,
}));

vi.mock('../systems/SceneBackgrounds', () => ({
  preloadSceneBackgrounds,
}));

vi.mock('../systems/ObstacleAssets', () => ({
  getAvailableObstacleAssets,
}));

vi.mock('../systems/HrsAssets', () => ({
  getAvailableHrsAssets,
}));

vi.mock('../systems/LootAssets', () => ({
  getAvailableLootAssets,
}));

vi.mock('../systems/UiAssets', () => ({
  getAvailableUiAssets,
}));

vi.mock('../systems/LevelIconAssets', () => ({
  getAvailableLevelIconAssets,
}));

let BootScene: typeof import('./BootScene').BootScene;

beforeAll(async () => {
  ({ BootScene } = await import('./BootScene'));
});

beforeEach(() => {
  vi.clearAllMocks();
  getAudioSystem.mockReturnValue(mockAudioSystem);
  getOrderedLevelCatalog.mockReturnValue([
    { id: 'level-01', path: '/levels/level-01.json' },
    { id: 'level-02', path: '/levels/level-02.json' },
  ]);
  getAvailableObstacleAssets.mockReturnValue([{ key: 'obstacle:car', url: 'assets/obstacles/car.png' }]);
  getAvailableHrsAssets.mockReturnValue([{ key: 'hrs:spawn', url: 'assets/hrs/spawn.png' }]);
  getAvailableLootAssets.mockReturnValue([{ key: 'loot:money', url: 'assets/loots/money.png' }]);
  getAvailableUiAssets.mockReturnValue([{ key: 'ui:music', url: 'assets/ui/music.png' }]);
  getAvailableLevelIconAssets.mockReturnValue([{ key: 'level-icon:enemy01.png', url: 'assets/sprites/enemy01/icon.png' }]);
});

describe('BootScene', () => {
  it('renders loading feedback and preloads the shared asset catalog', () => {
    const createdTexts: MockText[] = [];
    const createdRectangles: MockRectangle[] = [];
    const loadHandlers: Record<string, (value?: unknown) => void> = {};

    const scene = new BootScene() as unknown as Record<string, unknown>;
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      text: vi.fn((_x: number, _y: number, text: string) => {
        const item: MockText = {
          text,
          setOrigin: vi.fn().mockReturnThis(),
          setText: vi.fn(function (this: MockText, value: string) {
            this.text = value;
            return this;
          }),
        };
        createdTexts.push(item);
        return item;
      }),
      rectangle: vi.fn(() => {
        const item: MockRectangle = {
          setDepth: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
        };
        createdRectangles.push(item);
        return item;
      }),
    };
    scene.load = {
      on: vi.fn((event: string, handler: (value?: unknown) => void) => {
        loadHandlers[event] = handler;
      }),
      spritesheet: vi.fn(),
      image: vi.fn(),
      audio: vi.fn(),
      json: vi.fn(),
    };

    (scene.preload as () => void)();
    loadHandlers.progress?.(0.5);
    loadHandlers.fileprogress?.({ key: 'hero-psz01-idle-down' });
    loadHandlers.complete?.();

    expect(preloadSceneBackgrounds).toHaveBeenCalledWith(scene);
    expect(scene.load.json).toHaveBeenCalledWith('level-data:level-01', '/levels/level-01.json');
    expect(scene.load.json).toHaveBeenCalledWith('level-data:level-02', '/levels/level-02.json');
    expect(scene.load.spritesheet).toHaveBeenCalledWith(
      'hero-psz01-idle-down',
      'assets/sprites/PSZ01/idle_down.png',
      expect.objectContaining({ frameWidth: 256, frameHeight: 256 }),
    );
    expect(scene.load.image).toHaveBeenCalledWith('obstacle:car', ['assets/obstacles/car.png']);
    expect(scene.load.image).toHaveBeenCalledWith('hrs:spawn', ['assets/hrs/spawn.png']);
    expect(scene.load.image).toHaveBeenCalledWith('loot:money', ['assets/loots/money.png']);
    expect(scene.load.image).toHaveBeenCalledWith('ui:music', ['assets/ui/music.png']);
    expect(scene.load.image).toHaveBeenCalledWith('level-icon:enemy01.png', ['assets/sprites/enemy01/icon.png']);
    expect(scene.load.audio).toHaveBeenCalledWith('music-menu', ['assets/audio/Preparation of hunting.mp3']);
    expect(createdTexts.some((entry) => entry.text === 'Heroes of NVVH')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Betöltés 100%')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Betöltés kész.')).toBe(true);
    expect(createdRectangles).toHaveLength(3);
    expect(createdRectangles[2]?.setScale).toHaveBeenNthCalledWith(1, 0, 1);
    expect(createdRectangles[2]?.setScale).toHaveBeenNthCalledWith(2, 0.5, 1);
    expect(createdRectangles[2]?.setScale).toHaveBeenNthCalledWith(3, 1, 1);
  });

  it('seeds shared defaults, restores audio settings, and hands off to the menu', () => {
    const registrySet = vi.fn();
    const delayedCall = vi.fn((_delay: number, callback: () => void) => {
      callback();
    });
    const start = vi.fn();

    const scene = new BootScene() as unknown as Record<string, unknown>;
    scene.registry = { set: registrySet };
    scene.scene = { start };
    scene.time = { delayedCall };

    (scene.create as () => void)();

    expect(registrySet).toHaveBeenCalledWith('score', 0);
    expect(registrySet).toHaveBeenCalledWith('escapedEnemies', 0);
    expect(registrySet).toHaveBeenCalledWith('currentWave', 1);
    expect(loadAudioSettingsIntoRegistry).toHaveBeenCalledWith(scene);
    expect(mockAudioSystem.setMasterVolume).toHaveBeenCalledWith(0.35);
    expect(mockAudioSystem.setMuted).toHaveBeenCalledWith(false);
    expect(applyAudioSettingsFromRegistry).toHaveBeenCalledWith(scene);
    expect(delayedCall).toHaveBeenCalledWith(120, expect.any(Function));
    expect(start).toHaveBeenCalledWith('MenuScene');
  });
});