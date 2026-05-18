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
  on: ReturnType<typeof vi.fn>;
};

type MockImage = {
  texture: string;
  handlers: Record<string, (() => void) | undefined>;
  setDisplaySize: ReturnType<typeof vi.fn>;
  setOrigin: ReturnType<typeof vi.fn>;
  setDepth: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  setData: ReturnType<typeof vi.fn>;
  setTint: ReturnType<typeof vi.fn>;
  clearTint: ReturnType<typeof vi.fn>;
  setAlpha: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

const mockAudioSystem = {
  playMusic: vi.fn(),
  setMusicMuted: vi.fn(),
  setSfxMuted: vi.fn(),
};

const applyAudioSettingsFromRegistry = vi.fn();
const updateAudioSetting = vi.fn((scene: { registry: { set: (key: string, value: boolean) => void } }, key: string, value: boolean) => {
  scene.registry.set(key, value);
});

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
  AUDIO_SETTINGS_KEYS: {
    MUSIC_MUTED: 'musicMuted',
    SFX_MUTED: 'sfxMuted',
  },
  applyAudioSettingsFromRegistry,
  getAudioSystem: vi.fn(() => mockAudioSystem),
  updateAudioSetting,
}));

let MenuScene: typeof import('./MenuScene').MenuScene;

beforeAll(async () => {
  ({ MenuScene } = await import('./MenuScene'));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MenuScene', () => {
  it('renders menu actions, plays music, and wires navigation and audio toggles', () => {
    const createdTexts: MockText[] = [];
    const createdImages: MockImage[] = [];
    const keyboardHandlers: Record<string, () => void> = {};
    const registryState = {
      musicMuted: false,
      sfxMuted: false,
    };

    const scene = new MenuScene() as unknown as Record<string, unknown>;
    scene.scale = { width: 1024, height: 768 };
    scene.add = {
      rectangle: vi.fn(() => ({ setOrigin: vi.fn() })),
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
          on: vi.fn(function (this: MockText, event: string, handler: () => void) {
            this.handlers[event] = handler;
            return this;
          }),
        };

        createdTexts.push(button);
        return button;
      }),
      image: vi.fn((_x: number, _y: number, texture: string) => {
        const handlers: Record<string, (() => void) | undefined> = {};
        const image: MockImage = {
          texture,
          handlers,
          setDisplaySize: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setData: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          clearTint: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          on: vi.fn(function (this: MockImage, event: string, handler: () => void) {
            this.handlers[event] = handler;
            return this;
          }),
        };

        createdImages.push(image);
        return image;
      }),
    };
    scene.scene = {
      start: vi.fn(),
    };
    scene.registry = {
      get: vi.fn((key: string) => registryState[key as keyof typeof registryState]),
      set: vi.fn((key: string, value: boolean) => {
        registryState[key as keyof typeof registryState] = value;
      }),
    };
    scene.sound = { locked: false };
    scene.input = {
      keyboard: {
        once: vi.fn((event: string, handler: () => void) => {
          keyboardHandlers[event] = handler;
        }),
      },
    };

    (scene.create as () => void)();

    expect(applyAudioSettingsFromRegistry).toHaveBeenCalledWith(scene);
    expect(mockAudioSystem.playMusic).toHaveBeenCalledWith('music-menu', true);

    const startButton = createdTexts.find((entry) => entry.text === 'Játék indítása');
    const leaderboardButton = createdTexts.find((entry) => entry.text === 'Eredménylista');
    const titleTexts = createdTexts.filter((entry) => entry.text === 'Heroes of NVVH');
    const [musicToggle, sfxToggle] = createdImages;

    expect(startButton).toBeDefined();
    expect(leaderboardButton).toBeDefined();
    expect(titleTexts).toHaveLength(0);
    expect(createdImages).toHaveLength(2);
    expect(musicToggle?.texture).toBe('ui:musicoff.png');
    expect(sfxToggle?.texture).toBe('ui:effectoff.png');
    expect(musicToggle?.setTint).toHaveBeenCalledWith(0x8f8f8f);
    expect(sfxToggle?.setTint).toHaveBeenCalledWith(0x8f8f8f);

    leaderboardButton?.handlers.pointerdown?.();
    keyboardHandlers['keydown-SPACE']();
    musicToggle?.handlers.pointerdown?.();
    sfxToggle?.handlers.pointerdown?.();

    expect(scene.scene.start).toHaveBeenCalledWith('LeaderboardScene');
    expect(scene.scene.start).toHaveBeenCalledWith('PlayScene');
    expect(updateAudioSetting).toHaveBeenCalledWith(scene, 'musicMuted', true);
    expect(updateAudioSetting).toHaveBeenCalledWith(scene, 'sfxMuted', true);
    expect(mockAudioSystem.setMusicMuted).toHaveBeenCalledWith(true);
    expect(mockAudioSystem.setSfxMuted).toHaveBeenCalledWith(true);
    expect(musicToggle?.clearTint).toHaveBeenCalled();
    expect(sfxToggle?.clearTint).toHaveBeenCalled();
  });
});