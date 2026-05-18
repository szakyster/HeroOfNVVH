import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type MockText = {
  text: string;
  handlers?: Record<string, (() => void) | undefined>;
  y?: number;
  setOrigin: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  setDepth: ReturnType<typeof vi.fn>;
  setData: ReturnType<typeof vi.fn>;
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

const mockAudioSystem = {
  playMusic: vi.fn(),
};

const saveEntry = vi.fn();

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
    MENU: 'music-menu',
  },
  getAudioSystem: vi.fn(() => mockAudioSystem),
}));

vi.mock('../systems/LeaderboardStorage', () => ({
  LeaderboardStorage: vi.fn().mockImplementation(function MockLeaderboardStorage() {
    return {
    saveEntry,
    };
  }),
}));

let GameOverScene: typeof import('./GameOverScene').GameOverScene;

beforeAll(async () => {
  ({ GameOverScene } = await import('./GameOverScene'));
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-09T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GameOverScene', () => {
  it('saves positive scores and wires replay, leaderboard, and menu actions', () => {
    const createdTexts: MockText[] = [];
    const createdGraphics: MockGraphics[] = [];
    const keyboardHandlers: Record<string, () => void> = {};
    const textEventHandlers = new Map<string, () => void>();

    saveEntry.mockReturnValue([
      { score: 120, createdAt: '2026-05-09T12:00:00.000Z' },
      { score: 90, createdAt: '2026-05-08T12:00:00.000Z' },
    ]);

    const scene = new GameOverScene() as unknown as Record<string, unknown>;
    const sceneManager = {
      start: vi.fn(),
    };
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      graphics: vi.fn(() => {
        const graphics: MockGraphics = {
          setDepth: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
        };
        createdGraphics.push(graphics);
        return graphics;
      }),
      rectangle: vi.fn(() => ({ setOrigin: vi.fn() })),
      text: vi.fn((_x: number, _y: number, text: string) => {
        const item: MockText = {
          text,
          handlers: {},
          y: _y,
          setOrigin: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setData: vi.fn().mockReturnThis(),
          setY: vi.fn(function (this: MockText, value: number) {
            this.y = value;
            return this;
          }),
          on: vi.fn().mockImplementation((event: string, handler: () => void) => {
            textEventHandlers.set(`${text}:${event}`, handler);
            return item;
          }),
        };
        createdTexts.push(item);
        return item;
      }),
    };
    scene.scene = sceneManager;
    scene.input = {
      keyboard: {
        once: vi.fn((event: string, handler: () => void) => {
          keyboardHandlers[event] = handler;
        }),
      },
    };

    (scene.create as (data: { score: number }) => void)({ score: 120 });

    expect(saveEntry).toHaveBeenCalledWith({
      score: 120,
      createdAt: '2026-05-09T12:00:00.000Z',
    });
    expect(createdGraphics).toHaveLength(1);
    expect(createdTexts.some((entry) => entry.text.includes('Aktuális helyezés: 1.'))).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Főmenü')).toBe(true);

    textEventHandlers.get('Főmenü:pointerup')?.();

    keyboardHandlers['keydown-R']();
    keyboardHandlers['keydown-L']();
    keyboardHandlers['keydown-M']();

    expect(sceneManager.start).toHaveBeenCalledWith('PlayScene');
    expect(sceneManager.start).toHaveBeenCalledWith('LeaderboardScene');
    expect(mockAudioSystem.playMusic).toHaveBeenCalledWith('music-menu', true);
    expect(sceneManager.start).toHaveBeenCalledWith('MenuScene');
    expect(sceneManager.start).toHaveBeenCalledTimes(4);
  });

  it('does not save zero-score rounds', () => {
    const createdTexts: MockText[] = [];
    const createdGraphics: MockGraphics[] = [];

    const scene = new GameOverScene() as unknown as Record<string, unknown>;
  const sceneManager = { start: vi.fn() };
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      graphics: vi.fn(() => {
        const graphics: MockGraphics = {
          setDepth: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
        };
        createdGraphics.push(graphics);
        return graphics;
      }),
      rectangle: vi.fn(() => ({ setOrigin: vi.fn() })),
      text: vi.fn((_x: number, _y: number, text: string) => {
        const item: MockText = {
          text,
          handlers: {},
          y: _y,
          setOrigin: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setData: vi.fn().mockReturnThis(),
          setY: vi.fn(function (this: MockText, value: number) {
            this.y = value;
            return this;
          }),
          on: vi.fn().mockReturnThis(),
        };
        createdTexts.push(item);
        return item;
      }),
    };
    scene.scene = sceneManager;
    scene.input = { keyboard: { once: vi.fn() } };

    (scene.create as (data: { score: number }) => void)({ score: 0 });

    expect(saveEntry).not.toHaveBeenCalled();
    expect(createdGraphics).toHaveLength(1);
    expect(createdTexts.some((entry) => entry.text === 'Ez a kör nem került fel az \neredménylistára.')).toBe(true);
  });
});