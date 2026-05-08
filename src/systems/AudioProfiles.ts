export const AUDIO_KEYS = {
  ATTACK: 'sfx-attack',
  HIT: 'sfx-hit',
  DEATH_1: 'sfx-death-1',
  DEATH_2: 'sfx-death-2',
  DEATH_3: 'sfx-death-3',
  DEATH_4: 'sfx-death-4',
  PICKUP: 'sfx-pickup',
  DEPOSIT: 'sfx-deposit',
  ERROR: 'sfx-error',
  MENU: 'music-menu',
  AMBIENT: 'music-ambient',
} as const;

export const DEATH_AUDIO_KEYS = [
  AUDIO_KEYS.DEATH_1,
  AUDIO_KEYS.DEATH_2,
  AUDIO_KEYS.DEATH_3,
  AUDIO_KEYS.DEATH_4,
] as const;

export type SfxProfile = {
  frequency: number;
  durationMs: number;
  gain: number;
  type: OscillatorType;
  slideToFrequency?: number;
  loadedAudioSeekMs?: number;
};

export type MusicProfile = {
  frequency: number;
  gain: number;
  type: OscillatorType;
};

export function getSfxProfile(key: string): SfxProfile {
  switch (key) {
    case AUDIO_KEYS.ATTACK:
      return {
        frequency: 240,
        durationMs: 70,
        gain: 0.09,
        type: 'square',
        slideToFrequency: 180,
        loadedAudioSeekMs: 400,
      };
    case AUDIO_KEYS.HIT:
      return { frequency: 130, durationMs: 90, gain: 0.11, type: 'sawtooth', slideToFrequency: 90 };
    case AUDIO_KEYS.DEATH_1:
    case AUDIO_KEYS.DEATH_2:
    case AUDIO_KEYS.DEATH_3:
    case AUDIO_KEYS.DEATH_4:
      return { frequency: 110, durationMs: 180, gain: 0.11, type: 'sawtooth', slideToFrequency: 72 };
    case AUDIO_KEYS.PICKUP:
      return { frequency: 700, durationMs: 130, gain: 0.08, type: 'triangle', slideToFrequency: 920 };
    case AUDIO_KEYS.DEPOSIT:
      return { frequency: 520, durationMs: 170, gain: 0.08, type: 'sine', slideToFrequency: 780 };
    case AUDIO_KEYS.ERROR:
      return { frequency: 180, durationMs: 160, gain: 0.09, type: 'square', slideToFrequency: 120 };
    default:
      return { frequency: 320, durationMs: 100, gain: 0.06, type: 'sine' };
  }
}

export function getMusicProfile(key: string): MusicProfile | null {
  if (key === AUDIO_KEYS.MENU) {
    return { frequency: 146.83, gain: 0.03, type: 'triangle' };
  }

  if (key === AUDIO_KEYS.AMBIENT) {
    return { frequency: 110, gain: 0.035, type: 'triangle' };
  }

  return null;
}