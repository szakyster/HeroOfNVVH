import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type MockText = {
  text: string;
  handlers: Record<string, (() => void) | undefined>;
  setOrigin: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  setStyle: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

const getEntries = vi.fn();

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

vi.mock('../systems/LeaderboardStorage', () => ({
  LeaderboardStorage: vi.fn().mockImplementation(function MockLeaderboardStorage() {
    return {
    getEntries,
    };
  }),
}));

let LeaderboardScene: typeof import('./LeaderboardScene').LeaderboardScene;

beforeAll(async () => {
  ({ LeaderboardScene } = await import('./LeaderboardScene'));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LeaderboardScene', () => {
  it('shows an empty state and allows returning to the menu', () => {
    const createdTexts: MockText[] = [];
    const keyboardHandlers: Record<string, () => void> = {};
    const rectangle = vi.fn(() => ({ setDepth: vi.fn().mockReturnThis() }));

    getEntries.mockReturnValue([]);

    const scene = new LeaderboardScene() as unknown as Record<string, unknown>;
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      rectangle,
      text: vi.fn((_x: number, _y: number, text: string) => {
        const handlers: Record<string, (() => void) | undefined> = {};
        const item: MockText = {
          text,
          handlers,
          setOrigin: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setStyle: vi.fn().mockReturnThis(),
          on: vi.fn(function (this: MockText, event: string, handler: () => void) {
            this.handlers[event] = handler;
            return this;
          }),
        };
        createdTexts.push(item);
        return item;
      }),
    };
    scene.scene = { start: vi.fn() };
    scene.input = {
      keyboard: {
        once: vi.fn((event: string, handler: () => void) => {
          keyboardHandlers[event] = handler;
        }),
      },
    };

    (scene.create as () => void)();

    expect(rectangle).toHaveBeenCalledWith(512, 384, 1024, 768, 0x15232f, 1);
    expect(createdTexts.some((entry) => entry.text === 'Még nincs mentett eredmény.')).toBe(false);
    expect(createdTexts.some((entry) => entry.text === 'Eredménylista')).toBe(false);

    const backButton = createdTexts.find((entry) => entry.text === 'Vissza a menübe');
    backButton?.handlers.pointerdown?.();
    keyboardHandlers['keydown-ESC']();

    expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
  });

  it('renders saved leaderboard entries', () => {
    const createdTexts: MockText[] = [];
    const rectangle = vi.fn(() => ({ setDepth: vi.fn().mockReturnThis() }));
    const addText = vi.fn((_x: number, _y: number, text: string) => {
      const item: MockText = {
        text,
        handlers: {},
        setOrigin: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setStyle: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
      };
      createdTexts.push(item);
      return item;
    });

    getEntries.mockReturnValue([
      { score: 120, createdAt: '2026-05-09T12:00:00.000Z' },
      { score: 80, createdAt: '2026-05-08T08:30:00.000Z' },
    ]);

    const scene = new LeaderboardScene() as unknown as Record<string, unknown>;
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      rectangle,
      text: addText,
    };
    scene.scene = { start: vi.fn() };
    scene.input = { keyboard: { once: vi.fn() } };

    (scene.create as () => void)();

    expect(createdTexts.some((entry) => entry.text === '1.')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === '2.')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === '120 M Ft')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === '80 M Ft')).toBe(true);
    expect(createdTexts.some((entry) => entry.text === 'Még nincs mentett eredmény.')).toBe(false);
    expect(createdTexts.some((entry) => entry.text === 'Eredménylista')).toBe(false);
    expect(rectangle).toHaveBeenCalledWith(512, 384, 1024, 768, 0x15232f, 1);
    expect(addText).toHaveBeenCalledWith(87, 190, '1.', expect.any(Object));
    expect(addText).toHaveBeenCalledWith(142, 190, '120 M Ft', expect.any(Object));
    expect(addText).toHaveBeenCalledWith(317, 190, expect.any(String), expect.any(Object));
  });
});