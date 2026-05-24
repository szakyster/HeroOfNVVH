import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type MockText = {
  text: string;
  handlers: Record<string, (() => void) | undefined>;
  setOrigin: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  setAlpha: ReturnType<typeof vi.fn>;
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

const levelByPath = {
  '/levels/level-01.json': { id: 'level-01', name: 'Bemelegítés', targetScore: 900, icon: 'enemy01.png' },
  '/levels/level-02.json': { id: 'level-02', name: 'Az első kihívás', targetScore: 1500, icon: 'enemy02.png' },
  '/levels/level-03.json': { id: 'level-03', name: 'Fokozódó nyomás', targetScore: 2200, icon: 'enemy01.png' },
  '/levels/level-04.json': { id: 'level-04', name: 'Szűk keresztmetszet', targetScore: 3600, icon: 'enemy02.png' },
  '/levels/level-05.json': { id: 'level-05', name: 'Légihíd blokád', targetScore: 5400, icon: 'enemy01.png' },
  '/levels/level-06.json': { id: 'level-06', name: 'Végső visszaszerzés', targetScore: 7800, icon: 'enemy02.png' },
} as const;

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
  loadLevel.mockImplementation(async (path: string) => levelByPath[path as keyof typeof levelByPath]);
});

describe('LevelSelectScene', () => {
  it('renders unlocked and locked levels, starts unlocked levels, and returns to the menu', async () => {
    const createdTexts: MockText[] = [];
    const createdRectangles: MockRectangle[] = [];
    const keyboardHandlers: Record<string, () => void> = {};
    const delayedCallbacks: Array<() => void> = [];

    getState.mockReturnValue({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });
    const scene = new LevelSelectScene() as unknown as Record<string, unknown>;
    const sceneManager = { start: vi.fn() };

    scene.scale = { width: 1024, height: 768 };
    scene.textures = { exists: vi.fn(() => true) };
    const add = {
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
          setAlpha: vi.fn().mockReturnThis(),
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
    scene.add = add;
    scene.input = {
      keyboard: {
        once: vi.fn((event: string, handler: () => void) => {
          keyboardHandlers[event] = handler;
        }),
      },
    };
    scene.time = {
      delayedCall: vi.fn((_delay: number, callback: () => void) => {
        delayedCallbacks.push(callback);
      }),
    };
    scene.scene = sceneManager;

    (scene.create as () => void)();
    await Promise.resolve();
    await Promise.resolve();

    const backButton = createdTexts.find((entry) => entry.text === 'Vissza');

    expect(createdTexts.some((entry) => entry.text === 'Bemelegítés')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Az első kihívás')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Fokozódó nyomás')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Zárolva')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Indítás')).toBe(false);
    expect(createdRectangles).toHaveLength(1);
    expect(add.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'level-icon:enemy01.png');
    expect(add.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'level-icon:enemy02.png');
    expect(createdTexts.find((entry) => entry.text === 'Vissza')?.setAlpha).toHaveBeenNthCalledWith(1, 0.65);

    createdRectangles[0]?.handlers.pointerover?.();
    createdRectangles[0]?.handlers.pointerout?.();
    createdRectangles[0]?.handlers.pointerup?.();
    backButton?.handlers.pointerup?.();
    expect(sceneManager.start).toHaveBeenCalledTimes(1);

    delayedCallbacks[0]?.();
    backButton?.handlers.pointerup?.();
    keyboardHandlers['keydown-M']();

    expect(createdRectangles[0]?.setFillStyle).toHaveBeenNthCalledWith(1, 0xf6d878, 0.12);
    expect(createdRectangles[0]?.setFillStyle).toHaveBeenNthCalledWith(2, 0x000000, 0.001);
    expect(setLastPlayedLevel).toHaveBeenCalledWith('level-01');
    expect(sceneManager.start).toHaveBeenCalledWith('PlayScene', { levelId: 'level-01' });
    expect(sceneManager.start).toHaveBeenCalledWith('MenuScene');
    expect(backButton?.setAlpha).toHaveBeenNthCalledWith(2, 1);
    expect(sceneManager.start).toHaveBeenCalledTimes(3);

    (scene.create as () => void)();
    await Promise.resolve();
    await Promise.resolve();

    const backButtons = createdTexts.filter((entry) => entry.text === 'Vissza');
    const secondBackButton = backButtons[backButtons.length - 1];

    secondBackButton?.handlers.pointerup?.();

    expect(secondBackButton?.setAlpha).toHaveBeenNthCalledWith(1, 0.65);
    expect(sceneManager.start).toHaveBeenCalledTimes(3);

    delayedCallbacks[1]?.();
    secondBackButton?.handlers.pointerup?.();

    expect(secondBackButton?.setAlpha).toHaveBeenNthCalledWith(2, 1);
    expect(sceneManager.start).toHaveBeenCalledTimes(4);
  });
});