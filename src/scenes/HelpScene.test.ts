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

let HelpScene: typeof import('./HelpScene').HelpScene;

beforeAll(async () => {
  ({ HelpScene } = await import('./HelpScene'));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HelpScene', () => {
  it('renders the help copy and wires back and start navigation', () => {
    const createdTexts: MockText[] = [];
    const keyboardHandlers: Record<string, (() => void) | undefined> = {};
    const scene = new HelpScene() as unknown as Record<string, unknown>;
    const sceneManager = { start: vi.fn() };

    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      graphics: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
      } satisfies MockGraphics)),
      rectangle: vi.fn(() => ({ setDepth: vi.fn().mockReturnThis() })),
      text: vi.fn((_x: number, _y: number, text: string) => {
        const handlers: Record<string, (() => void) | undefined> = {};
        const item: MockText = {
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
        createdTexts.push(item);
        return item;
      }),
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

    const backButton = createdTexts.find((entry) => entry.text === 'Vissza');
    const startButton = createdTexts.find((entry) => entry.text === 'Játék indítás');

    expect(createdTexts.some((entry) => entry.text === 'Segítség')).toBe(false);
    expect(createdTexts.some((entry) => entry.text.includes('Szerezd vissza a Nemzeti Vagyont'))).toBe(true);
    expect(createdTexts.some((entry) => entry.text.includes('SPACE: játék indítás | ESC/M: főmenü'))).toBe(true);

    backButton?.handlers.pointerdown?.();
    startButton?.handlers.pointerdown?.();
    keyboardHandlers['keydown-SPACE']?.();
    keyboardHandlers['keydown-ESC']?.();
    keyboardHandlers['keydown-M']?.();

    expect(sceneManager.start).toHaveBeenCalledWith('MenuScene');
    expect(sceneManager.start).toHaveBeenCalledWith('LevelSelectScene');
    expect(sceneManager.start).toHaveBeenCalledTimes(5);
  });
});