import { describe, expect, it } from 'vitest';
import { AUDIO_KEYS, DEATH_AUDIO_KEYS, getMusicProfile, getSfxProfile } from './AudioProfiles';

describe('AudioSystem', () => {
  it('defines fallback profiles for all MVP sound effects', () => {
    expect(getSfxProfile(AUDIO_KEYS.ATTACK).durationMs).toBeGreaterThan(0);
    expect(getSfxProfile(AUDIO_KEYS.ATTACK).loadedAudioSeekMs).toBeGreaterThan(0);
    expect(getSfxProfile(AUDIO_KEYS.HIT).frequency).toBeGreaterThan(0);
    expect(DEATH_AUDIO_KEYS).toHaveLength(4);
    expect(getSfxProfile(DEATH_AUDIO_KEYS[0]).durationMs).toBeGreaterThan(0);
    expect(getSfxProfile(AUDIO_KEYS.PICKUP).slideToFrequency).toBeGreaterThan(
      getSfxProfile(AUDIO_KEYS.PICKUP).frequency,
    );
    expect(getSfxProfile(AUDIO_KEYS.DEPOSIT).durationMs).toBeGreaterThan(getSfxProfile(AUDIO_KEYS.ATTACK).durationMs);
    expect(getSfxProfile(AUDIO_KEYS.ERROR).type).toBe('square');
  });

  it('defines an ambient fallback music profile', () => {
    const profile = getMusicProfile(AUDIO_KEYS.AMBIENT);

    expect(profile).not.toBeNull();
    expect(profile?.frequency).toBeGreaterThan(0);
    expect(profile?.gain).toBeGreaterThan(0);
  });
});