import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type MockText = {
  text: string;
  setOrigin: ReturnType<typeof vi.fn>;
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
    const keyboardHandlers: Record<string, () => void> = {};

    saveEntry.mockReturnValue([
      { score: 120, createdAt: '2026-05-09T12:00:00.000Z' },
      { score: 90, createdAt: '2026-05-08T12:00:00.000Z' },
    ]);

    const scene = new GameOverScene() as unknown as Record<string, unknown>;
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      rectangle: vi.fn(() => ({ setOrigin: vi.fn() })),
      text: vi.fn((_x: number, _y: number, text: string) => {
        const item: MockText = {
          text,
          setOrigin: vi.fn().mockReturnThis(),
        };
        createdTexts.push(item);
        return item;
      }),
    };
    scene.scene = {
      start: vi.fn(),
    };
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
    expect(createdTexts.some((entry) => entry.text.includes('Aktuális helyezés: 1.'))).toBe(true);

    keyboardHandlers['keydown-R']();
    keyboardHandlers['keydown-L']();
    keyboardHandlers['keydown-M']();

    expect(scene.scene.start).toHaveBeenCalledWith('PlayScene');
    expect(scene.scene.start).toHaveBeenCalledWith('LeaderboardScene');
    expect(mockAudioSystem.playMusic).toHaveBeenCalledWith('music-menu', true);
    expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
  });

  it('does not save zero-score rounds', () => {
    const createdTexts: MockText[] = [];

    const scene = new GameOverScene() as unknown as Record<string, unknown>;
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      rectangle: vi.fn(() => ({ setOrigin: vi.fn() })),
      text: vi.fn((_x: number, _y: number, text: string) => {
        const item: MockText = {
          text,
          setOrigin: vi.fn().mockReturnThis(),
        };
        createdTexts.push(item);
        return item;
      }),
    };
    scene.scene = { start: vi.fn() };
    scene.input = { keyboard: { once: vi.fn() } };

    (scene.create as (data: { score: number }) => void)({ score: 0 });

    expect(saveEntry).not.toHaveBeenCalled();
    expect(createdTexts.some((entry) => entry.text === 'Ez a kör nem került fel az \neredménylistára.')).toBe(true);
  });
});