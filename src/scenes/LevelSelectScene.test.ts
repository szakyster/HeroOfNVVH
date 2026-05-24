import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type MockText = {
  text: string;
  handlers: Record<string, (() => void) | undefined>;
  setOrigin: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  setDepth: ReturnType<typeof vi.fn>;
  setStyle: ReturnType<typeof vi.fn>;
  setData: ReturnType<typeof vi.fn>;
  setText: ReturnType<typeof vi.fn>;
  setY: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

type MockGraphics = {
  setDepth: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  fillStyle: ReturnType<typeof vi.fn>;
  fillRoundedRect: ReturnType<typeof vi.fn>;
  lineStyle: ReturnType<typeof vi.fn>;
  strokeRoundedRect: ReturnType<typeof vi.fn>;
  fillCircle: ReturnType<typeof vi.fn>;
  strokeCircle: ReturnType<typeof vi.fn>;
};

type MockRectangle = {
  handlers: Record<string, (() => void) | undefined>;
  setOrigin: ReturnType<typeof vi.fn>;
  setFillStyle: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

const loadLevel = vi.fn();
const getState = vi.fn();
const setLastPlayedLevel = vi.fn();

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

vi.mock('../systems/LevelLoader', () => ({
  LevelLoader: vi.fn().mockImplementation(function MockLevelLoader() {
    return {
      load: loadLevel,
    };
  }),
}));

vi.mock('../systems/LevelProgressStorage', () => ({
  LevelProgressStorage: vi.fn().mockImplementation(function MockLevelProgressStorage() {
    return {
      getState,
      setLastPlayedLevel,
    };
  }),
}));

let LevelSelectScene: typeof import('./LevelSelectScene').LevelSelectScene;

beforeAll(async () => {
  ({ LevelSelectScene } = await import('./LevelSelectScene'));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LevelSelectScene', () => {
  it('renders unlocked and locked levels, starts unlocked levels, and returns to the menu', async () => {
    const createdTexts: MockText[] = [];
    const createdRectangles: MockRectangle[] = [];
    const keyboardHandlers: Record<string, () => void> = {};

    getState.mockReturnValue({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });
    loadLevel
      .mockResolvedValueOnce({ id: 'level-01', name: 'Bemelegítés', targetScore: 900, icon: 'enemy01.png' })
      .mockResolvedValueOnce({ id: 'level-02', name: 'Az első kihívás', targetScore: 1500, icon: 'enemy01.png' });

    const scene = new LevelSelectScene() as unknown as Record<string, unknown>;
    const sceneManager = { start: vi.fn() };

    scene.scale = { width: 1024, height: 768 };
    scene.textures = { exists: vi.fn(() => true) };
    scene.add = {
      graphics: vi.fn(() => {
        const graphics: MockGraphics = {
          setDepth: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
        };

        return graphics;
      }),
      text: vi.fn((_x: number, _y: number, text: string) => {
        const handlers: Record<string, (() => void) | undefined> = {};
        const button: MockText = {
          text,
          handlers,
          setOrigin: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setStyle: vi.fn().mockReturnThis(),
          setData: vi.fn().mockReturnThis(),
          setText: vi.fn(function (this: MockText, value: string) {
            this.text = value;
            return this;
          }),
          setY: vi.fn().mockReturnThis(),
          on: vi.fn(function (this: MockText, event: string, handler: () => void) {
            this.handlers[event] = handler;
            return this;
          }),
        };

        createdTexts.push(button);
        return button;
      }),
      rectangle: vi.fn(() => {
        const handlers: Record<string, (() => void) | undefined> = {};
        const rectangle: MockRectangle = {
          handlers,
          setOrigin: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn(function (this: MockRectangle, event: string, handler: () => void) {
            this.handlers[event] = handler;
            return this;
          }),
        };

        createdRectangles.push(rectangle);
        return rectangle;
      }),
      image: vi.fn(() => ({
        setDisplaySize: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
      })),
    };
    scene.input = {
      keyboard: {
        once: vi.fn((event: string, handler: () => void) => {
          keyboardHandlers[event] = handler;
        }),
      },
    };
    scene.scene = sceneManager;

    (scene.create as () => void)();
    await Promise.resolve();
    await Promise.resolve();

    const backButton = createdTexts.find((entry) => entry.text === 'Vissza');

    expect(createdTexts.some((entry) => entry.text === 'Bemelegítés')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Az első kihívás')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Zárolva')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Indítás')).toBe(false);
    expect(createdRectangles).toHaveLength(1);

    createdRectangles[0]?.handlers.pointerover?.();
    createdRectangles[0]?.handlers.pointerout?.();
    createdRectangles[0]?.handlers.pointerup?.();
    backButton?.handlers.pointerup?.();
    keyboardHandlers['keydown-M']();

    expect(createdRectangles[0]?.setFillStyle).toHaveBeenNthCalledWith(1, 0xf6d878, 0.12);
    expect(createdRectangles[0]?.setFillStyle).toHaveBeenNthCalledWith(2, 0x000000, 0.001);
    expect(setLastPlayedLevel).toHaveBeenCalledWith('level-01');
    expect(sceneManager.start).toHaveBeenCalledWith('PlayScene', { levelId: 'level-01' });
    expect(sceneManager.start).toHaveBeenCalledWith('MenuScene');
    expect(sceneManager.start).toHaveBeenCalledTimes(3);
  });
});