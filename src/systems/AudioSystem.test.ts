import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
    },
  },
}));

type AudioContextMock = ReturnType<typeof createAudioContextMock>;

function createAudioContextMock() {
  return {
    currentTime: 12,
    destination: {},
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: undefined as (() => void) | undefined,
    })),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
  };
}

function createSoundManagerMock(options?: {
  loadedKeys?: string[];
  context?: AudioContextMock | null;
}) {
  const loadedKeys = new Set(options?.loadedKeys ?? []);
  const musicSound = {
    isPlaying: false,
    volume: 0,
    play: vi.fn(function play(this: { isPlaying: boolean }) {
      this.isPlaying = true;
    }),
    stop: vi.fn(function stop(this: { isPlaying: boolean }) {
      this.isPlaying = false;
    }),
    destroy: vi.fn(),
  };

  return {
    game: {
      cache: {
        audio: {
          exists: vi.fn((key: string) => loadedKeys.has(key)),
        },
      },
    },
    play: vi.fn(),
    add: vi.fn(() => musicSound),
    volume: 1,
    mute: false,
    context: options?.context ?? null,
    musicSound,
  };
}

async function loadAudioModule() {
  vi.resetModules();
  return import('./AudioSystem');
}

describe('AudioSystem', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('defines fallback profiles for all MVP sound effects', async () => {
    const { AUDIO_KEYS, DEATH_AUDIO_KEYS } = await loadAudioModule();
    const { getSfxProfile } = await import('./AudioProfiles');

    expect(getSfxProfile(AUDIO_KEYS.ATTACK).durationMs).toBeGreaterThan(0);
    expect(getSfxProfile(AUDIO_KEYS.ATTACK).loadedAudioSeekMs).toBeGreaterThan(0);
    expect(getSfxProfile(AUDIO_KEYS.ALARM).durationMs).toBeGreaterThan(0);
    expect(getSfxProfile(AUDIO_KEYS.HIT).frequency).toBeGreaterThan(0);
    expect(DEATH_AUDIO_KEYS).toHaveLength(4);
    expect(getSfxProfile(DEATH_AUDIO_KEYS[0]).durationMs).toBeGreaterThan(0);
    expect(getSfxProfile(AUDIO_KEYS.PICKUP).slideToFrequency).toBeGreaterThan(
      getSfxProfile(AUDIO_KEYS.PICKUP).frequency,
    );
    expect(getSfxProfile(AUDIO_KEYS.DEPOSIT).durationMs).toBeGreaterThan(getSfxProfile(AUDIO_KEYS.ATTACK).durationMs);
    expect(getSfxProfile(AUDIO_KEYS.ERROR).type).toBe('square');
  });

  it('defines an ambient fallback music profile', async () => {
    const { AUDIO_KEYS } = await loadAudioModule();
    const { getMusicProfile } = await import('./AudioProfiles');
    const profile = getMusicProfile(AUDIO_KEYS.AMBIENT);

    expect(profile).not.toBeNull();
    expect(profile?.frequency).toBeGreaterThan(0);
    expect(profile?.gain).toBeGreaterThan(0);
  });

  it('plays loaded sound effects with profile-driven seek and volume', async () => {
    const { AUDIO_KEYS, PhaserAudioService } = await loadAudioModule();
    const soundManager = createSoundManagerMock({ loadedKeys: [AUDIO_KEYS.ATTACK] });
    const service = new PhaserAudioService(soundManager as never);

    service.playSfx(AUDIO_KEYS.ATTACK);

    expect(soundManager.play).toHaveBeenCalledTimes(1);
    const [, playOptions] = soundManager.play.mock.calls[0] ?? [];
    expect(playOptions.seek).toBe(0.4);
    expect(playOptions.volume).toBeCloseTo(0.14, 5);
  });

  it('does not play sound effects when muted', async () => {
    const { AUDIO_KEYS, PhaserAudioService } = await loadAudioModule();
    const soundManager = createSoundManagerMock({ loadedKeys: [AUDIO_KEYS.ATTACK] });
    const service = new PhaserAudioService(soundManager as never);

    service.setSfxMuted(true);
    service.playSfx(AUDIO_KEYS.ATTACK);
    service.setSfxMuted(false);
    service.setMuted(true);
    service.playSfx(AUDIO_KEYS.ATTACK);

    expect(soundManager.play).not.toHaveBeenCalled();
  });

  it('falls back to synth sfx when no loaded audio exists', async () => {
    const { AUDIO_KEYS, PhaserAudioService } = await loadAudioModule();
    const context = createAudioContextMock();
    const soundManager = createSoundManagerMock({ context });
    const service = new PhaserAudioService(soundManager as never);

    service.playSfx(AUDIO_KEYS.HIT);

    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(context.createGain).toHaveBeenCalledTimes(1);
    const oscillator = context.createOscillator.mock.results[0]?.value;
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
  });

  it('plays loaded music once and ignores duplicate requests for the same track', async () => {
    const { AUDIO_KEYS, PhaserAudioService } = await loadAudioModule();
    const soundManager = createSoundManagerMock({ loadedKeys: [AUDIO_KEYS.MENU] });
    const service = new PhaserAudioService(soundManager as never);

    service.playMusic(AUDIO_KEYS.MENU, true);
    service.playMusic(AUDIO_KEYS.MENU, true);

    expect(soundManager.add).toHaveBeenCalledTimes(1);
    expect(soundManager.musicSound.play).toHaveBeenCalledTimes(1);
  });

  it('supports synth music fallback and updates synth volume when settings change', async () => {
    const { AUDIO_KEYS, PhaserAudioService } = await loadAudioModule();
    const context = createAudioContextMock();
    const soundManager = createSoundManagerMock({ context });
    const service = new PhaserAudioService(soundManager as never);

    service.playMusic(AUDIO_KEYS.AMBIENT, true);
    service.setMusicMuted(true);
    service.setMasterVolume(0.5);
    service.setMusicMuted(false);
    service.stopMusic();

    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    const gainNode = context.createGain.mock.results[0]?.value;
    expect(gainNode.gain.setTargetAtTime).toHaveBeenCalled();
    const musicOscillator = context.createOscillator.mock.results[0]?.value;
    const lfoOscillator = context.createOscillator.mock.results[1]?.value;
    expect(musicOscillator.stop).toHaveBeenCalled();
    expect(lfoOscillator.stop).toHaveBeenCalled();
  });

  it('fades out current music and invokes the completion callback', async () => {
    vi.useFakeTimers();

    const { AUDIO_KEYS, PhaserAudioService } = await loadAudioModule();
    const soundManager = createSoundManagerMock({ loadedKeys: [AUDIO_KEYS.MENU] });
    const service = new PhaserAudioService(soundManager as never);
    const onComplete = vi.fn();

    service.playMusic(AUDIO_KEYS.MENU, true);
    service.fadeOutMusic(100, onComplete);
    vi.advanceTimersByTime(200);

    expect(soundManager.musicSound.stop).toHaveBeenCalled();
    expect(soundManager.musicSound.destroy).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('invokes fade-out completion immediately when nothing is playing', async () => {
    const { PhaserAudioService } = await loadAudioModule();
    const soundManager = createSoundManagerMock();
    const service = new PhaserAudioService(soundManager as never);
    const onComplete = vi.fn();

    service.fadeOutMusic(100, onComplete);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('clamps master volume and reflects mute state on the sound manager', async () => {
    const { PhaserAudioService } = await loadAudioModule();
    const soundManager = createSoundManagerMock();
    const service = new PhaserAudioService(soundManager as never);

    service.setMasterVolume(2);
    service.setMuted(true);

    expect(soundManager.volume).toBe(1);
    expect(soundManager.mute).toBe(true);
  });

  it('delegates through the AudioSystem wrapper', async () => {
    const { AudioSystem } = await loadAudioModule();
    const service = {
      playSfx: vi.fn(),
      playMusic: vi.fn(),
      fadeOutMusic: vi.fn(),
      stopMusic: vi.fn(),
      setMasterVolume: vi.fn(),
      setMuted: vi.fn(),
      setMusicMuted: vi.fn(),
      setSfxMuted: vi.fn(),
    };
    const audioSystem = new AudioSystem(service);
    const onComplete = vi.fn();

    audioSystem.playSfx('sfx');
    audioSystem.playMusic('music', false);
    audioSystem.fadeOutMusic(123, onComplete);
    audioSystem.stopMusic();
    audioSystem.setMasterVolume(0.7);
    audioSystem.setMuted(true);
    audioSystem.setMusicMuted(true);
    audioSystem.setSfxMuted(true);

    expect(service.playSfx).toHaveBeenCalledWith('sfx');
    expect(service.playMusic).toHaveBeenCalledWith('music', false);
    expect(service.fadeOutMusic).toHaveBeenCalledWith(123, onComplete);
    expect(service.stopMusic).toHaveBeenCalled();
    expect(service.setMasterVolume).toHaveBeenCalledWith(0.7);
    expect(service.setMuted).toHaveBeenCalledWith(true);
    expect(service.setMusicMuted).toHaveBeenCalledWith(true);
    expect(service.setSfxMuted).toHaveBeenCalledWith(true);
  });

  it('reuses a shared audio system and applies registry-backed mute settings', async () => {
    const { AUDIO_SETTINGS_KEYS, applyAudioSettingsFromRegistry, getAudioSystem } = await loadAudioModule();
    const scene = {
      sound: createSoundManagerMock(),
      registry: {
        get: vi.fn((key: string) => key === AUDIO_SETTINGS_KEYS.MUSIC_MUTED),
      },
    };

    const sharedA = getAudioSystem(scene as never);
    const sharedB = getAudioSystem(scene as never);
    const setMusicMutedSpy = vi.spyOn(sharedA, 'setMusicMuted');
    const setSfxMutedSpy = vi.spyOn(sharedA, 'setSfxMuted');

    applyAudioSettingsFromRegistry(scene as never);

    expect(sharedA).toBe(sharedB);
    expect(setMusicMutedSpy).toHaveBeenCalledWith(true);
    expect(setSfxMutedSpy).toHaveBeenCalledWith(false);
  });

  it('loads persisted audio settings into the registry', async () => {
    const localStorageMock = {
      getItem: vi.fn(() => JSON.stringify({ musicMuted: true, sfxMuted: false })),
      setItem: vi.fn(),
    };

    vi.stubGlobal('localStorage', localStorageMock);

    const { AUDIO_SETTINGS_KEYS, loadAudioSettingsIntoRegistry } = await loadAudioModule();
    const scene = {
      registry: {
        set: vi.fn(),
      },
    };

    loadAudioSettingsIntoRegistry(scene as never);

    expect(scene.registry.set).toHaveBeenCalledWith(AUDIO_SETTINGS_KEYS.MUSIC_MUTED, true);
    expect(scene.registry.set).toHaveBeenCalledWith(AUDIO_SETTINGS_KEYS.SFX_MUTED, false);
  });

  it('persists registry-backed audio settings after updates', async () => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    vi.stubGlobal('localStorage', localStorageMock);

    const { AUDIO_SETTINGS_KEYS, updateAudioSetting } = await loadAudioModule();
    const registryState = {
      musicMuted: false,
      sfxMuted: false,
    };
    const scene = {
      registry: {
        get: vi.fn((key: string) => registryState[key as keyof typeof registryState]),
        set: vi.fn((key: string, value: boolean) => {
          registryState[key as keyof typeof registryState] = value;
        }),
      },
    };

    updateAudioSetting(scene as never, AUDIO_SETTINGS_KEYS.MUSIC_MUTED, true);
    updateAudioSetting(scene as never, AUDIO_SETTINGS_KEYS.SFX_MUTED, true);

    expect(scene.registry.set).toHaveBeenCalledWith(AUDIO_SETTINGS_KEYS.MUSIC_MUTED, true);
    expect(scene.registry.set).toHaveBeenCalledWith(AUDIO_SETTINGS_KEYS.SFX_MUTED, true);
    expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
      'heroes-of-nvvh.audio-settings',
      JSON.stringify({ musicMuted: true, sfxMuted: true }),
    );
  });
});