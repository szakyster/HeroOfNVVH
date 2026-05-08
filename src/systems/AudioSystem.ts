import Phaser from 'phaser';
import { AUDIO_KEYS, getMusicProfile, getSfxProfile } from './AudioProfiles';

export { AUDIO_KEYS } from './AudioProfiles';

export interface IAudioService {
  playSfx(key: string): void;
  playMusic(key: string, loop?: boolean): void;
  fadeOutMusic(durationMs?: number, onComplete?: () => void): void;
  stopMusic(): void;
  setMasterVolume(value: number): void;
  setMuted(muted: boolean): void;
}

type SynthMusicNodes = {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  baseGain: number;
};

export class PhaserAudioService implements IAudioService {
  private currentMusicKey: string | null = null;

  private currentMusicSound?: Phaser.Sound.BaseSound;

  private synthMusicNodes?: SynthMusicNodes;

  private musicFadeInterval?: ReturnType<typeof setInterval>;

  private masterVolume = 0.35;

  private muted = false;

  constructor(private readonly soundManager: Phaser.Sound.BaseSoundManager) {}

  playSfx(key: string): void {
    if (this.hasLoadedAudio(key)) {
      const profile = getSfxProfile(key);
      this.soundManager.play(key, {
        volume: this.getEffectiveVolume(0.4),
        seek: (profile.loadedAudioSeekMs ?? 0) / 1000,
      });
      return;
    }

    this.playSynthSfx(key);
  }

  playMusic(key: string, loop = true): void {
    const alreadyPlayingLoaded = this.currentMusicSound?.isPlaying && this.currentMusicKey === key;
    const alreadyPlayingSynth = !!this.synthMusicNodes && this.currentMusicKey === key;

    if (alreadyPlayingLoaded || alreadyPlayingSynth) {
      return;
    }

    this.stopMusic();
    this.currentMusicKey = key;

    if (this.hasLoadedAudio(key)) {
      this.currentMusicSound = this.soundManager.add(key, {
        loop,
        volume: this.getEffectiveVolume(0.35),
      });
      this.currentMusicSound.play();
      return;
    }

    this.playSynthMusic(key, loop);
  }

  fadeOutMusic(durationMs = 800, onComplete?: () => void): void {
    this.clearMusicFade();

    if (!this.currentMusicSound && !this.synthMusicNodes) {
      onComplete?.();
      return;
    }

    const steps = 10;
    const stepDurationMs = Math.max(16, Math.floor(durationMs / steps));
    let currentStep = 0;

    this.musicFadeInterval = globalThis.setInterval(() => {
      currentStep += 1;
      const progress = Math.max(0, 1 - currentStep / steps);
      this.setCurrentMusicVolume(progress);

      if (currentStep < steps) {
        return;
      }

      this.clearMusicFade();
      this.stopMusic();
      onComplete?.();
    }, stepDurationMs);
  }

  stopMusic(): void {
    this.clearMusicFade();
    this.currentMusicSound?.stop();
    this.currentMusicSound?.destroy();
    this.currentMusicSound = undefined;
    this.currentMusicKey = null;

    if (this.synthMusicNodes) {
      this.synthMusicNodes.oscillator.stop();
      this.synthMusicNodes.lfo.stop();
      this.synthMusicNodes.oscillator.disconnect();
      this.synthMusicNodes.gainNode.disconnect();
      this.synthMusicNodes.lfo.disconnect();
      this.synthMusicNodes.lfoGain.disconnect();
      this.synthMusicNodes = undefined;
    }
  }

  setMasterVolume(value: number): void {
    this.masterVolume = Phaser.Math.Clamp(value, 0, 1);
    this.soundManager.setVolume(this.masterVolume);
    this.updateSynthMusicVolume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.soundManager.setMute(muted);
    this.updateSynthMusicVolume();
  }

  private hasLoadedAudio(key: string): boolean {
    const cache = this.soundManager.game.cache.audio as { exists?: (audioKey: string) => boolean } | undefined;
    return Boolean(cache?.exists?.(key));
  }

  private getContext(): AudioContext | null {
    const manager = this.soundManager as Phaser.Sound.WebAudioSoundManager;
    return 'context' in manager ? manager.context : null;
  }

  private getEffectiveVolume(baseGain: number): number {
    return this.muted ? 0 : baseGain * this.masterVolume;
  }

  private playSynthSfx(key: string): void {
    const context = this.getContext();
    if (!context) {
      return;
    }

    const profile = getSfxProfile(key);
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;
    const durationSeconds = profile.durationMs / 1000;

    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(profile.frequency, now);
    if (profile.slideToFrequency) {
      oscillator.frequency.linearRampToValueAtTime(profile.slideToFrequency, now + durationSeconds);
    }

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(this.getEffectiveVolume(profile.gain), now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  private playSynthMusic(key: string, loop: boolean): void {
    const context = this.getContext();
    const profile = getMusicProfile(key);

    if (!context || !profile || !loop) {
      return;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const now = context.currentTime;

    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(profile.frequency, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, now);
    lfoGain.gain.setValueAtTime(6, now);

    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);

    gainNode.gain.setValueAtTime(this.getEffectiveVolume(profile.gain), now);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(now);
    lfo.start(now);

    this.synthMusicNodes = {
      oscillator,
      gainNode,
      lfo,
      lfoGain,
      baseGain: profile.gain,
    };
  }

  private updateSynthMusicVolume(): void {
    if (!this.synthMusicNodes) {
      return;
    }

    const context = this.getContext();
    if (!context) {
      return;
    }

    this.synthMusicNodes.gainNode.gain.setTargetAtTime(
      this.getEffectiveVolume(this.synthMusicNodes.baseGain),
      context.currentTime,
      0.04,
    );
  }

  private setCurrentMusicVolume(multiplier: number): void {
    const normalizedMultiplier = Phaser.Math.Clamp(multiplier, 0, 1);

    if (this.currentMusicSound) {
      this.currentMusicSound.setVolume(this.getEffectiveVolume(0.35 * normalizedMultiplier));
    }

    if (!this.synthMusicNodes) {
      return;
    }

    const context = this.getContext();
    if (!context) {
      return;
    }

    this.synthMusicNodes.gainNode.gain.setTargetAtTime(
      this.getEffectiveVolume(this.synthMusicNodes.baseGain * normalizedMultiplier),
      context.currentTime,
      0.04,
    );
  }

  private clearMusicFade(): void {
    if (!this.musicFadeInterval) {
      return;
    }

    globalThis.clearInterval(this.musicFadeInterval);
    this.musicFadeInterval = undefined;
  }
}

export class AudioSystem {
  constructor(private readonly service: IAudioService) {}

  playSfx(key: string): void {
    this.service.playSfx(key);
  }

  playMusic(key: string, loop = true): void {
    this.service.playMusic(key, loop);
  }

  fadeOutMusic(durationMs = 800, onComplete?: () => void): void {
    this.service.fadeOutMusic(durationMs, onComplete);
  }

  stopMusic(): void {
    this.service.stopMusic();
  }

  setMasterVolume(value: number): void {
    this.service.setMasterVolume(value);
  }

  setMuted(muted: boolean): void {
    this.service.setMuted(muted);
  }
}

let sharedAudioSystem: AudioSystem | null = null;

export function getAudioSystem(scene: Phaser.Scene): AudioSystem {
  if (!sharedAudioSystem) {
    sharedAudioSystem = new AudioSystem(new PhaserAudioService(scene.sound));
  }

  return sharedAudioSystem;
}