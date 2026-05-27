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
const getState = vi.fn();
const markLevelCompleted = vi.fn();
const unlockLevel = vi.fn();

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

vi.mock('../systems/LevelProgressStorage', () => ({
  LevelProgressStorage: vi.fn().mockImplementation(function MockLevelProgressStorage() {
    return {
      getState,
      markLevelCompleted,
      unlockLevel,
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
  it('saves positive scores, unlocks the next level, and wires retry, new game, leaderboard, and menu actions', () => {
    const createdTexts: MockText[] = [];
    const createdGraphics: MockGraphics[] = [];
    const keyboardHandlers: Record<string, () => void> = {};
    const textEventHandlers = new Map<string, () => void>();

    getState.mockReturnValue({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });

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

    (scene.create as (data: { score: number; levelId: string; targetScore: number }) => void)({
      score: 120,
      levelId: 'level-01',
      targetScore: 100,
    });

    expect(saveEntry).toHaveBeenCalledTimes(1);
    expect(saveEntry.mock.calls[0]?.at(-1)).toEqual({
      score: 120,
      createdAt: '2026-05-09T12:00:00.000Z',
    });
    expect(markLevelCompleted).toHaveBeenCalledWith('level-01');
    expect(unlockLevel).toHaveBeenCalledWith('level-02');
    expect(createdGraphics.length).toBeGreaterThan(0);
    expect(createdTexts.some((entry) => entry.text.includes('Aktuális helyezés: 1.'))).toBe(true);
    expect(createdTexts.some((entry) => entry.text.includes('a következő pálya megnyílt.'))).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Újra')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Új játék')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Főmenü')).toBe(true);

    textEventHandlers.get('Főmenü:pointerup')?.();
    textEventHandlers.get('Újra:pointerup')?.();
    textEventHandlers.get('Új játék:pointerup')?.();

    keyboardHandlers['keydown-R']();
    keyboardHandlers['keydown-N']();
    keyboardHandlers['keydown-L']();
    keyboardHandlers['keydown-M']();

    expect(sceneManager.start).toHaveBeenCalledWith('PlayScene', { levelId: 'level-01' });
    expect(sceneManager.start).toHaveBeenCalledWith('LevelSelectScene');
    expect(sceneManager.start).toHaveBeenCalledWith('LeaderboardScene');
    expect(mockAudioSystem.playMusic).toHaveBeenCalledWith('music-menu', true);
    expect(sceneManager.start).toHaveBeenCalledWith('MenuScene');
    expect(sceneManager.start).toHaveBeenCalledTimes(7);
  });

  it('does not unlock progression when the target score is not reached', () => {
    const createdTexts: MockText[] = [];
    const createdGraphics: MockGraphics[] = [];

    getState.mockReturnValue({
      unlockedLevelIds: ['level-01'],
      completedLevelIds: [],
      lastPlayedLevelId: 'level-01',
    });

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

    (scene.create as (data: { score: number; levelId: string; targetScore: number }) => void)({
      score: 0,
      levelId: 'level-01',
      targetScore: 100,
    });

    expect(saveEntry).not.toHaveBeenCalled();
    expect(markLevelCompleted).not.toHaveBeenCalled();
    expect(unlockLevel).not.toHaveBeenCalled();
    expect(createdGraphics.length).toBeGreaterThan(0);
    expect(createdTexts.some((entry) => entry.text === 'Ez a kör nem került fel az \neredménylistára.')).toBe(true);
    expect(createdTexts.some((entry) => entry.text.includes('a következő pálya megnyílt.'))).toBe(false);
  });
});